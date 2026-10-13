export const ID = "quedaco-tabelas";
export const VERSION = 1;
export const escape = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const normalize = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export const tags = (v) =>
  Array.isArray(v)
    ? v.map(String).map(normalize).filter(Boolean)
    : String(v ?? "")
        .split(",")
        .map((s) => normalize(s.trim()))
        .filter(Boolean);
export function int(n, min, max, label = "Número") {
  n = Number(n);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    throw Error(`${label}: use um inteiro entre ${min} e ${max}.`);
  return n;
}
export function dice(formula) {
  const m = String(formula)
    .replace(/\s/g, "")
    .match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) throw Error("Use um dado como 1d20, 1d100 ou 2d6+1.");
  const n = int(m[1] || 1, 1, 20, "Quantidade de dados"),
    s = int(m[2], 2, 1000, "Faces"),
    bonus = int(m[3] || 0, -10000, 10000, "Bônus");
  if (n * (s - 1) + 1 > 4000)
    throw Error(
      "A fórmula tem resultados demais; limite de 4.000 totais possíveis.",
    );
  let dist = new Map([[0, 1]]);
  for (let i = 0; i < n; i++) {
    const next = new Map();
    for (const [sum, p] of dist)
      for (let face = 1; face <= s; face++)
        next.set(sum + face, (next.get(sum + face) || 0) + p / s);
    dist = next;
  }
  return {
    formula: `${n}d${s}${bonus > 0 ? "+" : ""}${bonus || ""}`,
    min: n + bonus,
    max: n * s + bonus,
    probabilities: new Map([...dist].map(([sum, p]) => [sum + bonus, p])),
  };
}
export function allocate(rows, formula, mode = "equal") {
  if (!rows.length) throw Error("A tabela precisa de resultados.");
  const d = dice(formula),
    slots = d.max - d.min + 1;
  if (rows.length > slots)
    throw Error(
      `${d.formula} tem ${slots} totais possíveis para ${rows.length} linhas. Aumente o dado ou reduza as linhas.`,
    );
  const weights = rows.map((r) =>
    mode === "equal" ? 1 : int(r.weight ?? 1, 1, 10000, "Peso"),
  );
  if (mode === "weighted" && slots === rows.length && new Set(weights).size > 1)
    throw Error(
      "Não há faces livres para diferenciar os pesos. Aumente o dado ou use faixas iguais.",
    );
  let widths;
  if (mode === "ranges") {
    const sorted = rows.map((r) => r.range);
    let next = d.min;
    for (const range of sorted) {
      if (
        !Array.isArray(range) ||
        range.length !== 2 ||
        range[0] !== next ||
        !Number.isSafeInteger(range[1]) ||
        range[1] < range[0]
      )
        throw Error(
          "As faixas devem estar em ordem, sem buracos nem sobreposição.",
        );
      next = range[1] + 1;
    }
    if (next !== d.max + 1)
      throw Error(`As faixas precisam cobrir ${d.min} até ${d.max}.`);
    widths = sorted.map((r) => r[1] - r[0] + 1);
  } else {
    const sum = weights.reduce((a, b) => a + b, 0),
      remaining = slots - rows.length,
      exact = weights.map((w) => (remaining * w) / sum);
    widths = exact.map((x) => 1 + Math.floor(x));
    const extra = slots - widths.reduce((a, b) => a + b, 0),
      order = exact
        .map((x, i) => ({ i, f: x - Math.floor(x) }))
        .sort((a, b) => b.f - a.f || a.i - b.i);
    for (let i = 0; i < extra; i++) widths[order[i].i]++;
  }
  let cursor = d.min;
  return rows.map((r, i) => {
    const range = [cursor, cursor + widths[i] - 1];
    cursor = range[1] + 1;
    let probability = 0;
    for (let n = range[0]; n <= range[1]; n++)
      probability += d.probabilities.get(n) || 0;
    return { ...r, weight: weights[i], range, probability };
  });
}
export function validateRow(r) {
  if (!String(r.name ?? "").trim())
    throw Error("Cada resultado precisa de um nome ou texto.");
  const uuid = String(r.uuid ?? "");
  if (
    uuid &&
    !/^(?:Item|Actor|Scene|JournalEntry|RollTable|Compendium)\.[A-Za-z0-9_.-]+$/.test(
      uuid,
    )
  )
    throw Error("Vínculo de documento inválido.");
  const action = r.action ?? "none";
  if (!["none", "image", "audio", "open", "macro"].includes(action))
    throw Error("Ação inválida.");
  if (r.media && /^(?:javascript|data|file):|^\/\//i.test(r.media))
    throw Error("Endereço de mídia inválido.");
  if (r.macro && !/^Macro\.[A-Za-z0-9]+$/.test(r.macro))
    throw Error("Use o UUID de uma macro do mundo.");
  if (r.quantity) dice(r.quantity);
  return {
    ...r,
    name: String(r.name).trim(),
    description: String(r.description ?? ""),
    tags: tags(r.tags),
    uuid,
    action,
  };
}
export function source(config, rows) {
  if (
    config.distribution &&
    !["equal", "weighted", "ranges"].includes(config.distribution)
  )
    throw Error("Distribuição inválida.");
  if (
    config.repeat &&
    !["normal", "cycle", "recent", "session"].includes(config.repeat)
  )
    throw Error("Controle de repetição inválido.");
  if (config.repeat === "recent")
    int(config.recent ?? 3, 1, 100, "Janela de repetição");
  const name = String(config.name ?? "").trim();
  if (!name) throw Error("Dê um nome à tabela.");
  if (rows.length > 1000) throw Error("Limite de 1.000 linhas.");
  const results = allocate(
    rows.map(validateRow),
    config.formula,
    config.distribution,
  );
  const warnings = config.warnings ?? [];
  return {
    name,
    img: "icons/svg/d20-grey.svg",
    formula: dice(config.formula).formula,
    replacement: config.repeat !== "cycle",
    displayRoll: true,
    folder: config.folder || null,
    ownership: { default: config.shared ? 2 : 0 },
    description: `<p>${escape(config.description ?? "")}</p>${warnings.length ? `<p><strong>Fontes:</strong> ${warnings.map(escape).join(" ")}</p>` : ""}`,
    flags: {
      [ID]: {
        schema: VERSION,
        config: { ...config, tags: tags(config.tags) },
        history: [],
        favorite: false,
      },
    },
    results: results.map((r) => ({
      type: r.uuid ? "document" : "text",
      name: r.name,
      description: `<p>${escape(r.description)}</p>${r.generic ? "<p><em>Resultado genérico narrativo: nenhum documento foi criado.</em></p>" : ""}`,
      documentUuid: r.uuid || null,
      img: r.img || "icons/svg/d20-grey.svg",
      range: r.range,
      weight: r.weight,
      drawn: false,
      flags: {
        [ID]: {
          tags: r.tags,
          level: r.level ?? null,
          biome: r.biome ?? "",
          time: r.time ?? "",
          quantity: r.quantity ?? "",
          action: r.action,
          media: r.media ?? "",
          macro: r.macro ?? "",
          generic: Boolean(r.generic),
          origin: r.origin ?? "manual",
        },
      },
    })),
  };
}
export function eligible(
  row,
  context = {},
  history = [],
  repeat = "normal",
  recent = 3,
) {
  const meta = row.flags?.[ID] ?? row;
  if (row.drawn && repeat === "cycle") return false;
  const required = tags(context.tags);
  if (required.length && !required.every((t) => tags(meta.tags).includes(t)))
    return false;
  if (
    context.level &&
    meta.level != null &&
    Number(meta.level) > Number(context.level)
  )
    return false;
  if (
    context.biome &&
    meta.biome &&
    normalize(meta.biome) !== normalize(context.biome)
  )
    return false;
  if (
    context.time &&
    meta.time &&
    normalize(meta.time) !== normalize(context.time)
  )
    return false;
  const same = history
    .filter((h) => !context.session || h.session === context.session)
    .flatMap((h) => h.ids ?? []);
  if (repeat === "recent" && same.slice(-recent).includes(row.id)) return false;
  if (repeat === "session" && same.includes(row.id)) return false;
  return true;
}
export function pick(rows, formula, random = Math.random) {
  const d = dice(formula);
  let total = 0;
  const chances = rows.map((r) => {
    let p = 0;
    for (let n = r.range[0]; n <= r.range[1]; n++)
      p += d.probabilities.get(n) || 0;
    total += p;
    return p;
  });
  if (!total) return null;
  let needle = random() * total;
  for (let i = 0; i < rows.length; i++) {
    needle -= chances[i];
    if (needle < 0) return rows[i];
  }
  return rows.at(-1);
}
export function importJSON(text) {
  const data = JSON.parse(text);
  if (
    data?.format !== "quedaco-tabelas" ||
    data.schema !== VERSION ||
    !Array.isArray(data.rows)
  )
    throw Error("Use um arquivo exportado pelo Quedaço - Tabelas (schema 1).");
  source(data.config, data.rows);
  return data;
}
export function exportJSON(config, rows) {
  source(config, rows);
  return JSON.stringify(
    { format: "quedaco-tabelas", schema: VERSION, config, rows },
    null,
    2,
  );
}
export function parseCSV(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("CSV com aspas não fechadas.");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  if (!rows.length) return [];
  const header = rows.shift().map(normalize);
  return rows
    .map((values) =>
      Object.fromEntries(header.map((h, i) => [h, values[i] ?? ""])),
    )
    .map((r) =>
      validateRow({
        name: r.name ?? r.nome,
        description: r.description ?? r.descricao,
        weight: Number(r.weight ?? r.peso ?? 1),
        tags: r.tags,
        uuid: r.uuid,
      }),
    );
}
export function toCSV(rows) {
  const quote = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
  return [
    ["name", "description", "weight", "tags", "uuid"],
    ...rows.map((r) => [
      r.name,
      r.description,
      r.weight ?? 1,
      tags(r.tags).join(", "),
      r.uuid ?? "",
    ]),
  ]
    .map((r) => r.map(quote).join(","))
    .join("\r\n");
}
