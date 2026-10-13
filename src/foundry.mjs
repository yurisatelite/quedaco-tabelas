import {
  ID,
  source,
  escape,
  tags,
  int,
  eligible,
  pick,
  exportJSON,
} from "./core.mjs";
const queues = new Map();
export async function save(config, rows, { table = null } = {}) {
  if (!game.user.isGM)
    throw Error("A criação de tabelas é uma ferramenta da Mestra.");
  for (const row of rows)
    if (row.uuid && !(await fromUuid(row.uuid)))
      throw Error(
        `Documento não encontrado: ${row.name}. Atualize as fontes ou remova o vínculo.`,
      );
  source(config, rows); // Valida a prévia antes de criar uma pasta.
  let folder = config.folder || null;
  if (folder && game.folders.get(folder)?.type !== "RollTable")
    throw Error("Escolha uma pasta de Tabelas válida.");
  if (config.newFolder) {
    let existing = game.folders.find(
      (f) => f.type === "RollTable" && f.name === config.newFolder && !f.folder,
    );
    folder =
      existing?.id ??
      (
        await Folder.create({
          name: config.newFolder,
          type: "RollTable",
          color: "#b8874d",
        })
      ).id;
  }
  const data = source({ ...config, folder }, rows);
  if (!table) return RollTable.create(data);
  data.img = table.img;
  if (!table.isOwner) throw Error("Sem acesso de edição à tabela.");
  // Reaproveita ids de linhas por posição para atualização em uma só operação.
  const before = table.toObject(),
    ids = [...table.results].map((r) => r.id),
    next = data.results.map((r, i) => ({
      ...r,
      _id: ids[i] ?? foundry.utils.randomID(),
    }));
  try {
    await table.update({
      ...data,
      results: next,
      flags: {
        [ID]: {
          ...data.flags[ID],
          history: table.flags?.[ID]?.history ?? [],
          favorite: table.flags?.[ID]?.favorite ?? false,
        },
      },
    });
    const removed = ids.slice(next.length);
    if (removed.length)
      await table.deleteEmbeddedDocuments("TableResult", removed);
  } catch (e) {
    try {
      await table.update(before, { recursive: false });
    } catch (restore) {
      console.error(ID, "Falha na restauração", restore);
      throw Error(
        "Erro ao salvar e restaurar. Confira a tabela no editor nativo.",
      );
    }
    throw e;
  }
  return table;
}
export function read(table) {
  const strip = (html) => {
    const d = document.createElement("div");
    d.innerHTML = html ?? "";
    return d.textContent;
  };
  const meta = table.flags?.[ID] ?? {},
    config = {
      name: table.name,
      formula: table.formula || `1d${table.results.size}`,
      count: table.results.size,
      theme: "manual",
      mode: "manual",
      distribution: "ranges",
      repeat: table.replacement ? "normal" : "cycle",
      shared: table.ownership?.default >= 2,
      description: strip(table.description),
      ...meta.config,
      folder: table.folder?.id ?? "",
      newFolder: "",
    };
  // A fórmula e as faixas nativas prevalecem sobre configurações antigas.
  config.name = table.name;
  config.formula = table.formula;
  config.distribution = "ranges";
  config.count = table.results.size;
  return {
    config,
    rows: [...table.results]
      .sort((a, b) => a.range[0] - b.range[0])
      .map((r) => ({
        name: r.name,
        description: strip(r.description),
        uuid: r.documentUuid ?? "",
        img: r.img,
        weight: r.weight,
        range: [...r.range],
        ...r.flags?.[ID],
      })),
  };
}
export function draw(table, options = {}) {
  const previous = queues.get(table.uuid) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(() => performDraw(table, options));
  queues.set(table.uuid, next);
  next
    .finally(() => {
      if (queues.get(table.uuid) === next) queues.delete(table.uuid);
    })
    .catch(() => {});
  return next;
}
async function performDraw(
  table,
  {
    count = 1,
    context = {},
    rollMode = "gmroll",
    preview = false,
    actions = false,
    path = [],
    plans = new Map(),
  } = {},
) {
  if (!table.testUserPermission(game.user, "OBSERVER"))
    throw Error("Você não tem acesso a esta tabela.");
  if (path.includes(table.uuid) || path.length >= 6)
    throw Error("Encadeamento circular ou com mais de seis níveis.");
  const config = table.flags?.[ID]?.config ?? {},
    repeat = config.repeat ?? (table.replacement ? "normal" : "cycle");
  if (!preview && repeat !== "normal" && !table.isOwner)
    throw Error(
      "O sorteio com controle de repetição precisa ser feito pela Mestra ou pelo dono da tabela.",
    );
  const plan = plans.get(table.uuid) ?? {
    table,
    history: structuredClone(table.flags?.[ID]?.history ?? []),
    drawn: [],
    beforeHistory: structuredClone(table.flags?.[ID]?.history ?? []),
    beforeDrawn: [...table.results].map((r) => ({ _id: r.id, drawn: r.drawn })),
    repeat,
  };
  plans.set(table.uuid, plan);
  const { history, drawn } = plan,
    all = [],
    trace = [];
  for (let n = 0; n < int(count, 1, 100, "Sorteios"); n++) {
    const candidates = [...table.results].filter(
      (r) =>
        eligible(r, context, history, repeat, Number(config.recent ?? 3)) &&
        !(repeat === "cycle" && drawn.includes(r.id)),
    );
    if (!candidates.length)
      throw Error(
        "Nenhum resultado disponível com esses filtros. Limpe o contexto ou resete a tabela.",
      );
    const selected = pick(
      candidates,
      table.formula,
      () => foundry.dice?.MersenneTwister?.random?.() ?? Math.random(),
    );
    if (!selected)
      throw Error("As faixas disponíveis não são alcançáveis pelo dado.");
    const meta = selected.flags?.[ID] ?? {},
      document = selected.documentUuid
        ? await fromUuid(selected.documentUuid)
        : null;
    if (selected.documentUuid && !document)
      throw Error(
        `O documento de ${selected.name} não existe mais. Edite a tabela.`,
      );
    if (document && !document.testUserPermission(game.user, "LIMITED"))
      throw Error(`Sem acesso ao documento de ${selected.name}.`);
    trace.push(`${table.name}: ${selected.name}`);
    drawn.push(selected.id);
    history.push({
      date: new Date().toISOString(),
      user: game.user.id,
      session: context.session ?? "",
      ids: [selected.id],
      names: [selected.name],
    });
    if (document?.documentName === "RollTable") {
      const nested = await performDraw(document, {
        context,
        rollMode,
        preview,
        actions: false,
        path: [...path, table.uuid],
        plans,
      });
      all.push(...nested.results);
      trace.push(...nested.trace);
    } else {
      const quantity = meta.quantity
        ? (await new Roll(meta.quantity).evaluate()).total
        : null;
      all.push({ result: selected, quantity, document });
    }
  }
  if (!preview && !path.length) {
    const committed = [];
    try {
      for (const p of plans.values()) {
        if (!p.table.isOwner) continue;
        committed.push(p);
        if (p.repeat === "cycle")
          await p.table.updateEmbeddedDocuments(
            "TableResult",
            [...new Set(p.drawn)].map((id) => ({ _id: id, drawn: true })),
          );
        await p.table.setFlag(ID, "history", p.history.slice(-500));
      }
    } catch (error) {
      for (const p of committed.reverse())
        try {
          await p.table.updateEmbeddedDocuments("TableResult", p.beforeDrawn);
          await p.table.setFlag(ID, "history", p.beforeHistory);
        } catch (restore) {
          console.error(ID, "Falha ao recuperar sorteio", restore);
        }
      throw error;
    }
    // Só a raiz envia o resultado consolidado para o chat.
    if (!path.length) {
      const parts = await Promise.all(
        all.map(async ({ result, quantity }) => {
          const body = await result.getHTML();
          return `<li>${body}${quantity !== null ? `<p>Quantidade: ${quantity}</p>` : ""}</li>`;
        }),
      );
      await ChatMessage.create(
        {
          content: `<section class="qt-chat"><h3>${escape(table.name)}</h3><p>${escape(table.formula)} · sorteio pelas chances das faixas${Object.values(context).some(Boolean) ? " · contexto aplicado" : ""}</p><ul>${parts.join("")}</ul></section>`,
          flags: { [ID]: { table: table.uuid, trace } },
        },
        { rollMode },
      );
      if (actions && game.user.isGM)
        for (const item of all) await runAction(item);
    }
  }
  return { results: all, trace };
}
async function runAction({ result, document }) {
  const meta = result.flags?.[ID] ?? {};
  if (meta.action === "none" || !meta.action) return;
  if (meta.action === "open") return document?.sheet?.render({ force: true });
  if (meta.action === "image" && meta.media)
    return new foundry.applications.apps.ImagePopout({
      src: meta.media,
      window: { title: result.name },
    }).render({ force: true });
  if (meta.action === "audio" && meta.media)
    return foundry.audio.AudioHelper.play(
      { src: meta.media, volume: 0.6, loop: false },
      false,
    );
  if (meta.action === "macro" && meta.macro) {
    const macro = await fromUuid(meta.macro);
    if (!macro?.isOwner) throw Error("Macro indisponível ou sem permissão.");
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Executar ação da tabela" },
      content: `<p>Executar a macro ${escape(macro.name)} para ${escape(result.name)}?</p>`,
    });
    if (ok) await macro.execute();
  }
}
export async function reset(table) {
  if (!table.isOwner) throw Error("Sem acesso de edição.");
  await table.resetResults();
  await table.setFlag(ID, "history", []);
}
export function download(name, type, text) {
  foundry.utils.saveDataToFile(text, type, name);
}
export function exportTable(table) {
  const { config, rows } = read(table);
  download(`${table.name}.json`, "application/json", exportJSON(config, rows));
}
