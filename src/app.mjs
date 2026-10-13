import {
  ID,
  escape as e,
  dice,
  allocate,
  source,
  int,
  tags,
  importJSON,
  exportJSON,
  parseCSV,
  toCSV,
} from "./core.mjs";
import { THEMES, DIFFICULTIES, generate } from "./generators.mjs";
import { parseClimateText, expandClimate } from "./pdf-climate.mjs";
import { npcRows, quedacoIntegration } from "./quedaco-integration.mjs";
import { scan } from "./catalog.mjs";
import { save, read, draw, reset, download, exportTable } from "./foundry.mjs";
const blank = () => ({
  name: "",
  theme: "names",
  mode: "local",
  formula: "1d20",
  count: 20,
  distribution: "equal",
  difficulty: "moderate",
  culture: "common",
  gender: "male",
  purpose: "person",
  surname: true,
  fallback: true,
  repeat: "normal",
  recent: 3,
  shared: false,
  tags: "",
  description: "",
  list: "",
  documentType: "Item",
  folder: "",
  newFolder: "",
  packs: [],
  warnings: [],
  documentText: "",
  documentLocation: "",
  documentCount: 100,
  quedacoRegion: "",
});
const option = (value, label, current) =>
  `<option value="${e(value)}" ${String(value) === String(current) ? "selected" : ""}>${e(label)}</option>`;
const check = (value) => (value ? "checked" : "");
const error = (err) => ui.notifications.error(err.message ?? String(err));
function mini(title, content, callback, bind) {
  const d = new foundry.applications.api.DialogV2({
    form: { closeOnSubmit: false },
    window: { title },
    position: { width: 600 },
    content: `<div class="qt-mini">${content}</div>`,
    buttons: [
      {
        action: "save",
        label: "Aplicar",
        default: true,
        callback: async (_e, _b, app) => {
          try {
            await callback(app.element);
            await app.close();
          } catch (err) {
            error(err);
            return false;
          }
        },
      },
      {
        action: "cancel",
        label: "Fechar",
        callback: (_event, _button, app) => app.close(),
      },
    ],
  });
  if (bind) d.addEventListener("render", () => bind(d.element));
  d.render({ force: true });
  return d;
}
export class TablesApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "quedaco-tabelas-builder",
    classes: ["qt-app"],
    window: { title: "Quedaço - Tabelas", resizable: true },
    position: { width: 1120, height: 790 },
  };
  constructor(options = {}) {
    super(options);
    this.config = blank();
    this.rows = [];
    this.page = "create";
    this.offset = 0;
    this.table = null;
    this.busy = false;
    this.catalog = [];
    this.query = "";
  }
  async _renderHTML() {
    return this.html();
  }
  _replaceHTML(html, content) {
    content.innerHTML = html;
  }
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.bind();
  }
  html() {
    return `<div class="qt-shell"><header class="qt-top"><div><span class="qt-kicker">QUEDAÇO</span><h1>Tabelas</h1><p>Da ideia à tabela da sua campanha.</p></div><nav><button type="button" data-op="new"><i class="fa-solid fa-plus"></i> Nova tabela</button><button type="button" data-op="library"><i class="fa-solid fa-book"></i> Biblioteca</button><button type="button" data-op="import"><i class="fa-solid fa-file-import"></i> Importar</button></nav></header>${this.page === "library" ? this.library() : this.editor()}<footer class="qt-footer"><span>Geração local · Sem API · Tabelas nativas do Foundry</span><button type="button" data-op="help">Como funciona</button></footer></div>`;
  }
  library() {
    const tables = game.tables.filter(
      (t) =>
        t.visible &&
        (!this.query ||
          `${t.name} ${tags(t.flags?.[ID]?.config?.tags).join(" ")}`
            .toLowerCase()
            .includes(this.query.toLowerCase())),
    );
    return `<section class="qt-library"><label>Buscar tabelas por nome ou tag<input data-library-search value="${e(this.query)}" placeholder="Clima, nomes, armadilhas…"></label><div class="qt-card-grid">${
      tables
        .sort(
          (a, b) =>
            Number(b.flags?.[ID]?.favorite ?? false) -
              Number(a.flags?.[ID]?.favorite ?? false) ||
            a.name.localeCompare(b.name),
        )
        .map(
          (t) =>
            `<article class="qt-library-card"><small>${e(t.folder?.name ?? "Sem pasta")} · ${e(t.formula)}</small><h3>${e(t.name)}</h3><p>${t.results.size} resultados · ${t.flags?.[ID] ? "Quedaço" : "Tabela nativa"}</p><div class="qt-card-actions"><button type="button" data-op="draw" data-id="${t.id}">Sortear</button><button type="button" data-op="edit" data-id="${t.id}">Editar</button><button type="button" data-op="native" data-id="${t.id}" title="Abrir editor nativo"><i class="fa-solid fa-up-right-from-square"></i></button><button type="button" data-op="favorite" data-id="${t.id}" title="Favoritar"><i class="${t.flags?.[ID]?.favorite ? "fa-solid" : "fa-regular"} fa-star"></i></button><button type="button" data-op="duplicate" data-id="${t.id}" title="Duplicar"><i class="fa-solid fa-copy"></i></button></div></article>`,
        )
        .join("") || "<p>Nenhuma tabela encontrada. Crie a primeira.</p>"
    }</div></section>`;
  }
  editor() {
    const c = this.config,
      theme = THEMES.find((t) => t.id === c.theme) ?? THEMES.at(-1);
    let calculated = [],
      issue = "";
    try {
      calculated = allocate(this.rows, c.formula, c.distribution);
    } catch (err) {
      if (this.rows.length) issue = err.message;
    }
    const folders = game.folders.filter((f) => f.type === "RollTable");
    const sourceFolders = game.folders.filter((f) => f.type === c.documentType);
    const integration = quedacoIntegration(game);
    return `<div class="qt-workbench"><aside class="qt-themes"><span class="qt-label">O que você quer criar?</span>${THEMES.map((t) => `<button type="button" data-op="theme" data-id="${t.id}" class="${t.id === c.theme ? "active" : ""}"><i class="fa-solid ${t.icon}"></i>${e(t.label)}</button>`).join("")}</aside><main class="qt-editor"><form id="qt-config"><section class="qt-panel"><div class="qt-section-title"><i class="fa-solid ${theme.icon}"></i><div><h2>${e(theme.label)}</h2><p>${e(theme.hint)}</p></div><span class="qt-badge">${this.table ? "Editando" : "Criando"}</span></div>
      <label>Nome da tabela<input name="name" value="${e(c.name)}" placeholder="Ex.: 100 nomes masculinos dracônicos"></label>
      <div class="qt-fields"><label>Dado<select name="preset">${["1d4", "1d6", "1d8", "1d10", "1d12", "1d20", "1d100", "2d6", "custom"].map((v) => option(v, v === "custom" ? "Personalizado" : v.toUpperCase(), ["1d4", "1d6", "1d8", "1d10", "1d12", "1d20", "1d100", "2d6"].includes(c.formula) ? c.formula : "custom")).join("")}</select></label><label>Fórmula<input name="formula" value="${e(c.formula)}" placeholder="1d100"></label><label>Linhas<input name="count" type="number" min="1" max="1000" value="${e(c.count)}"></label></div>
      <div class="qt-fields"><label>Distribuição<select name="distribution">${[
        ["equal", "Faixas iguais"],
        ["weighted", "Pesos relativos"],
        ["ranges", "Faixas manuais"],
      ]
        .map(([v, l]) => option(v, l, c.distribution))
        .join(
          "",
        )}</select></label><label>Dificuldade narrativa<select name="difficulty">${Object.entries(
        DIFFICULTIES,
      )
        .map(([v, x]) => option(v, x.label, c.difficulty))
        .join(
          "",
        )}</select></label><label>CD opcional<input name="dc" type="number" min="0" max="1000" value="${e(c.dc ?? "")}" placeholder="Definida por você"></label></div>
      <p class="qt-hint">Dificuldade orienta as consequências geradas. CD é uma escolha sua, sem aplicação automática de regras.</p>
      <label>Tema / orientação<input name="subject" value="${e(c.subject)}" placeholder="Ex.: testemunhas do porto, itens amaldiçoados"></label>
      <p class="qt-hint">O modo local combina modelos do tema escolhido. Este campo registra a orientação; não interpreta pedidos como uma IA.</p>
    </section><section class="qt-panel"><h3>De onde vêm os resultados?</h3><div class="qt-segments">${[
      ["local", "Gerar localmente"],
      ["world", "Conteúdo existente"],
      ["manual", "Colar uma lista"],
      ["document", "Ler documento"],
    ]
      .map(
        ([v, l]) =>
          `<label class="${c.mode === v ? "active" : ""}"><input type="radio" name="mode" value="${v}" ${c.mode === v ? "checked" : ""}>${l}</label>`,
      )
      .join("")}</div>
    ${c.mode === "document" ? `<label>Documento de clima<input name="documentFile" type="file" accept=".pdf,.txt,text/plain,application/pdf"></label><label>Texto extraído (fallback)<textarea name="documentText" rows="4" placeholder="Você também pode colar aqui o texto extraído do PDF.">${e(c.documentText)}</textarea></label><div class="qt-fields"><label>Localidade<select name="documentLocation"><option value="">Todas as localidades</option>${(this.documentLocations ?? []).map((x) => option(x.location, x.location, c.documentLocation)).join("")}</select></label><label>Expansão<select name="documentCount">${[20, 50, 100].map((v) => option(v, `D${v}`, c.documentCount)).join("")}</select></label></div><p class="qt-hint">O módulo usa apenas os blocos de clima. As faixas do documento são preservadas; os detalhes adicionais são expansões narrativas genéricas.</p>` : ""}
    ${
      c.mode === "local" && c.theme === "names"
        ? `<div class="qt-fields"><label>Estilo<select name="culture">${[
            ["common", "Humano / fantasia"],
            ["draconic", "Dracônico"],
            ["elven", "Élfico"],
            ["dwarven", "Anão"],
          ]
            .map(([v, l]) => option(v, l, c.culture))
            .join("")}</select></label><label>Variação<select name="gender">${[
            ["male", "Masculinos"],
            ["female", "Femininos"],
            ["neutral", "Neutros"],
          ]
            .map(([v, l]) => option(v, l, c.gender))
            .join("")}</select></label><label>Uso<select name="purpose">${[
            ["person", "Pessoa"],
            ["witness", "Testemunha"],
          ]
            .map(([v, l]) => option(v, l, c.purpose))
            .join(
              "",
            )}</select></label></div><label class="qt-toggle"><input type="checkbox" name="surname" ${check(c.surname)}> Incluir sobrenome</label><p class="qt-hint">Nomes fictícios por combinações de sílabas; não precisam de fichas ou armazenamento.</p>`
        : ""
    }
    ${
      c.mode === "world"
        ? `<div class="qt-fields"><label>Tipo de documento<select name="documentType">${[
            ["Item", "Itens"],
            ["Actor", "Atores / NPCs"],
            ["Scene", "Cenas"],
            ["JournalEntry", "Diários"],
            ["RollTable", "Tabelas"],
          ]
            .map(([v, l]) => option(v, l, c.documentType))
            .join(
              "",
            )}</select></label><label>Pasta de origem<select name="sourceFolder">${option("", "Todas", c.sourceFolder)}${sourceFolders.map((f) => option(f.id, f.name, c.sourceFolder)).join("")}</select></label><label>Nome contém<input name="search" value="${e(c.search)}" placeholder="Ex.: maldição"></label></div><div class="qt-fields"><label>Tags obrigatórias<input name="requiredTags" value="${e(tags(c.requiredTags).join(", "))}" placeholder="amaldicoado, weapon"></label><label>Nível máximo<input name="level" type="number" min="1" value="${e(c.level ?? "")}" placeholder="Sem limite"></label></div><details><summary>Adicionar compêndios às fontes</summary><div class="qt-pack-list">${game.packs
            .filter(
              (p) =>
                p.visible &&
                [
                  "Item",
                  "Actor",
                  "RollTable",
                  "Scene",
                  "JournalEntry",
                ].includes(p.documentName),
            )
            .map(
              (p) =>
                `<label class="qt-toggle"><input type="checkbox" name="packs" value="${e(p.collection)}" ${check(c.packs?.includes(p.collection))}>${e(p.title)} · ${e(p.documentName)}</label>`,
            )
            .join(
              "",
            )}</div></details><label class="qt-toggle"><input name="fallback" type="checkbox" ${check(c.fallback)}> Completar faltantes com resultados genéricos narrativos</label><p class="qt-hint">Nenhum Item ou Actor será criado. A tag “amaldicoado” pode vir do nome ou de uma classificação manual; isso não confirma uma mecânica de maldição.</p>`
        : ""
    }
    ${c.mode === "world" && c.theme === "npcs" ? `<div class="qt-integration"><h4>Integração com o QUEDAÇO</h4>${integration ? `<label>Região registrada<select name="quedacoRegion"><option value="">Todas as regiões</option>${integration.regions.map((region) => option(region.id, `${region.name} · ${integration.npcs.filter((npc) => npc.regionId === region.id).length} NPC(s)`, c.quedacoRegion)).join("")}<option value="__unplaced" ${c.quedacoRegion === "__unplaced" ? "selected" : ""}>Sem região · ${integration.npcs.filter((npc) => !npc.regionId).length} NPC(s)</option></select></label><p class="qt-hint">Cada resultado será vinculado à ficha real do NPC. Nenhum Actor será duplicado.</p>` : `<div class="qt-warning">Ative o módulo QUEDAÇO para ler seus NPCs e regiões registrados.</div>`}</div>` : ""}
    ${c.mode === "manual" ? `<label>Uma entrada por linha<textarea name="list" rows="6" placeholder="Primeiro resultado\nSegundo resultado">${e(c.list)}</textarea></label>` : ""}
    <button type="button" data-op="generate" class="qt-primary" ${this.busy ? "disabled" : ""}><i class="fa-solid fa-wand-magic-sparkles"></i> ${this.busy ? "Consultando fontes…" : "Gerar prévia"}</button></section>
    <section class="qt-panel"><h3>Organização e comportamento</h3><div class="qt-fields"><label>Pasta de destino<select name="folder">${option("", "Sem pasta", c.folder)}${folders.map((f) => option(f.id, f.name, c.folder)).join("")}</select></label><label>Ou criar nova pasta<input name="newFolder" value="${e(c.newFolder)}" placeholder="Ex.: Quedaço - Tabelas"></label></div><div class="qt-fields"><label>Repetição<select name="repeat">${[
      ["normal", "Pode repetir"],
      ["cycle", "Sem repetir até resetar"],
      ["recent", "Evitar últimos resultados"],
      ["session", "Não repetir nesta sessão"],
    ]
      .map(([v, l]) => option(v, l, c.repeat))
      .join(
        "",
      )}</select></label><label>Janela de repetição<input name="recent" type="number" min="1" max="100" value="${e(c.recent)}"></label></div><label>Tags da tabela<input name="tags" value="${e(tags(c.tags).join(", "))}" placeholder="viagem, floresta"></label><label>Descrição<textarea name="description" rows="2">${e(c.description)}</textarea></label><label class="qt-toggle"><input type="checkbox" name="shared" ${check(c.shared)}> Jogadores podem ver a tabela e seus resultados</label></section></form>
    </main><section class="qt-preview"><div class="qt-preview-heading"><div><span class="qt-label">PRÉVIA EDITÁVEL</span><h2>${this.rows.length} resultados</h2></div><span class="qt-badge">${e(c.formula.toUpperCase())}</span></div><div class="qt-summary"><span>${e(c.name || "Tabela sem nome")}</span><small>Confira o conteúdo antes de salvar.</small></div>${c.warnings?.length ? `<div class="qt-warning">${c.warnings.map((w) => `<p>${e(w)}</p>`).join("")}</div>` : ""}${issue ? `<div class="qt-warning">${e(issue)}</div>` : ""}<div class="qt-preview-tools"><button type="button" data-op="add">+ Linha</button><button type="button" data-op="test">Testar</button><button type="button" data-op="export">Exportar</button></div><div class="qt-results" data-drop-zone>${
      this.rows
        .slice(this.offset, this.offset + 50)
        .map((r, j) => {
          const i = j + this.offset,
            a = calculated[i];
          return `<article class="qt-result" data-index="${i}"><div class="qt-result-meta"><span>${a ? `${a.range[0]}${a.range[1] !== a.range[0] ? "–" + a.range[1] : ""}` : i + 1}</span><span>${a ? (a.probability * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%" : "—"}</span><button type="button" data-op="details" data-index="${i}" title="Detalhes, ações e filtros"><i class="fa-solid fa-sliders"></i></button><button type="button" data-op="remove" data-index="${i}" title="Remover"><i class="fa-solid fa-xmark"></i></button></div><input data-row="name" data-index="${i}" value="${e(r.name)}" aria-label="Resultado ${i + 1}"><textarea data-row="description" data-index="${i}" rows="2" aria-label="Descrição ${i + 1}">${e(r.description)}</textarea><div class="qt-result-bottom"><small>${r.uuid ? "Documento vinculado" : r.generic ? "Genérico narrativo" : "Texto / nome"}</small><label>Peso<input data-row="weight" data-index="${i}" type="number" min="1" max="10000" value="${e(r.weight ?? 1)}"></label></div>${c.distribution === "ranges" ? `<div class="qt-fields"><label>De<input data-row="rangeMin" data-index="${i}" type="number" value="${e(r.range?.[0] ?? i + 1)}"></label><label>Até<input data-row="rangeMax" data-index="${i}" type="number" value="${e(r.range?.[1] ?? i + 1)}"></label></div>` : ""}</article>`;
        })
        .join("") ||
      '<div class="qt-empty"><i class="fa-solid fa-dice-d20"></i><h3>Uma ideia, um dado, uma tabela.</h3><p>Escolha o tema e gere uma prévia. Você também pode arrastar documentos para cá.</p></div>'
    }</div>${this.rows.length > 50 ? `<div class="qt-pagination"><button type="button" data-op="prev" ${this.offset === 0 ? "disabled" : ""}>Anterior</button><span>${this.offset + 1}–${Math.min(this.offset + 50, this.rows.length)}</span><button type="button" data-op="next" ${this.offset + 50 >= this.rows.length ? "disabled" : ""}>Próxima</button></div>` : ""}<button type="button" data-op="save" class="qt-primary qt-save" ${this.busy || !this.rows.length || issue ? "disabled" : ""}>${this.table ? "Salvar alterações" : "Criar tabela no Foundry"}</button><small class="qt-hint">Salvar cria ou atualiza a tabela na pasta escolhida.</small></section></div>`;
  }
  collect() {
    const form = this.element.querySelector("#qt-config");
    if (!form) return;
    const fd = new FormData(form);
    for (const [k, v] of fd)
      if (k !== "packs" && k !== "preset") this.config[k] = v;
    for (const k of ["surname", "fallback", "shared"]) {
      const el = form.querySelector(`[name="${k}"]`);
      if (el) this.config[k] = el.checked;
    }
    this.config.packs = fd.getAll("packs");
  }
  bind() {
    this.element.querySelectorAll("[data-op]").forEach((b) =>
      b.addEventListener("click", () => {
        void this.action(b.dataset.op, b.dataset).catch(error);
      }),
    );
    const form = this.element.querySelector("#qt-config");
    form?.addEventListener("input", () => this.collect());
    form?.addEventListener("submit", (event) => event.preventDefault());
    form?.addEventListener("change", (event) => {
      this.collect();
      const name = event.target.name;
      if (name === "documentFile" && event.target.files?.[0]) void this.readClimateFile(event.target.files[0]);
      if (name === "preset" && event.target.value !== "custom") {
        this.config.formula = event.target.value;
        const d = dice(this.config.formula);
        this.config.count = d.max - d.min + 1;
      }
      if (
        [
          "mode",
          "preset",
          "formula",
          "count",
          "documentType",
          "distribution",
          "repeat",
        ].includes(name)
      )
        this.render({ force: true });
    });
    this.element.querySelectorAll("[data-row]").forEach((el) =>
      el.addEventListener("input", () => {
        const row = this.rows[Number(el.dataset.index)];
        const key = el.dataset.row;
        if (key === "rangeMin" || key === "rangeMax") {
          row.range ??= [1, 1];
          row.range[key === "rangeMin" ? 0 : 1] = Number(el.value);
        } else row[key] = key === "weight" ? Number(el.value) : el.value;
      }),
    );
    this.element
      .querySelectorAll(
        '[data-row="weight"], [data-row="rangeMin"], [data-row="rangeMax"]',
      )
      .forEach((el) =>
        el.addEventListener("change", () => this.render({ force: true })),
      );
    const zone = this.element.querySelector("[data-drop-zone]");
    zone?.addEventListener("dragover", (event) => event.preventDefault());
    zone?.addEventListener("drop", async (event) => {
      event.preventDefault();
      try {
        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
        const doc = data.uuid ? await fromUuid(data.uuid) : null;
        if (
          !doc ||
          !["Item", "Actor", "Scene", "JournalEntry", "RollTable"].includes(
            doc.documentName,
          )
        )
          throw Error("Arraste um item, ator, cena, diário ou tabela.");
        this.rows.push({
          name: doc.name,
          uuid: doc.uuid,
          img: doc.img,
          description: "",
          weight: 1,
          tags: [],
          origin: "world",
        });
        this.config.count = this.rows.length;
        this.render({ force: true });
      } catch (err) {
        error(err);
      }
    });
    this.element
      .querySelector("[data-library-search]")
      ?.addEventListener("change", (event) => {
        this.query = event.target.value;
        this.render({ force: true });
      });
  }
  async readClimateFile(file) {
    try {
      let text;
      if (file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain") text = await file.text();
      else {
        const pdfjs = globalThis.pdfjsLib ?? globalThis.PDFJS ?? globalThis.pdfjs;
        if (!pdfjs?.getDocument) throw Error("O leitor PDF não está disponível nesta tela. Cole o texto extraído no campo abaixo ou carregue um arquivo .txt.");
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) pages.push((await pdf.getPage(i)).getTextContent().then((x) => x.items.map((item) => item.str).join("\n")));
        text = (await Promise.all(pages)).join("\n");
      }
      this.config.documentText = text;
      this.documentLocations = parseClimateText(text);
      if (!this.config.name) this.config.name = "Clima · Localidades Skyfall";
      this.render({ force: true });
      ui.notifications.info(`${this.documentLocations.length} localidade(s) de clima identificada(s).`);
    } catch (err) { error(err); }
  }
  async action(op, data = {}) {
    this.collect();
    const table = data.id && op !== "theme" ? game.tables.get(data.id) : null;
    if (op === "new") {
      this.config = blank();
      this.rows = [];
      this.table = null;
      this.offset = 0;
      this.page = "create";
    }
    if (op === "library") this.page = "library";
    if (op === "theme") {
      this.config.theme = data.id;
      const theme = THEMES.find((t) => t.id === data.id);
      if (!this.table)
        this.config.name = `${theme.label} · ${this.config.formula.toUpperCase()}`;
      if (data.id === "manual") this.config.mode = "manual";
      else if (data.id === "tables") {
        this.config.mode = "world";
        this.config.documentType = "RollTable";
        this.config.fallback = false;
      } else if (["items", "npcs", "places"].includes(data.id)) {
        this.config.mode = "world";
        this.config.documentType =
          data.id === "items" ? "Item" : data.id === "npcs" ? "Actor" : "Scene";
      } else this.config.mode = "local";
    }
    if (op === "generate") {
      if (this.config.mode === "world" && this.config.theme === "npcs") {
        const integration = quedacoIntegration(game);
        if (!integration) throw Error("Ative o módulo QUEDAÇO para gerar tabelas regionais de NPCs.");
        const requested = this.config.quedacoRegion;
        const filtered = requested === "__unplaced" ? { ...integration, npcs: integration.npcs.filter((npc) => !npc.regionId) } : integration;
        this.rows = npcRows(filtered, requested === "__unplaced" ? "" : requested);
        if (!this.rows.length) throw Error("Nenhum NPC registrado nessa região.");
        const region = integration.regions.find((entry) => entry.id === requested);
        this.config.name = `NPCs · ${region?.name ?? (requested === "__unplaced" ? "Sem região" : "Todas as regiões")}`;
        this.config.formula = `1d${Math.max(2, this.rows.length)}`;
        this.config.count = this.rows.length;
        this.config.distribution = "equal";
        this.config.tags = ["npc", "quedaco", requested].filter(Boolean).join(", ");
        this.config.description = "NPCs registrados no módulo QUEDAÇO. Cada resultado aponta para a ficha original do Actor.";
        this.config.warnings = [`${this.rows.length} NPC(s) reconhecido(s). Nenhuma ficha foi duplicada.`];
        this.offset = 0;
        await this.render({ force: true });
        return;
      }
      const count = int(this.config.count, 1, 1000, "Linhas"),
        d = dice(this.config.formula);
      if (count > d.max - d.min + 1)
        throw Error(
          "A quantidade de linhas não cabe no dado escolhido. Ajuste o dado primeiro.",
        );
      this.busy = true;
      await this.render({ force: true });
      try {
        if (this.config.mode === "document") {
          this.documentLocations = parseClimateText(this.config.documentText);
          if (!this.documentLocations.length) throw Error("Nenhum bloco de clima foi encontrado. Carregue o PDF ou cole o texto extraído.");
          const selected = this.documentLocations.find((x) => x.location === this.config.documentLocation);
          const locations = selected ? [selected] : this.documentLocations;
          this.rows = locations.flatMap((location) => expandClimate(location, Number(this.config.documentCount ?? 100)));
          this.config.formula = `1d${this.rows.length}`;
          this.config.count = this.rows.length;
          this.config.description = "Clima extraído de Localidades Skyfall.pdf. Faixas originais preservadas; detalhes adicionais são expansões narrativas do Quedaço.";
          this.config.warnings = [`Fonte: Localidades Skyfall.pdf · ${locations.length} localidade(s).`, "As condições detalhadas são expansões genéricas do módulo; não representam novas informações canônicas do documento."];
          this.offset = 0;
          return;
        }
        const catalog =
          this.config.mode === "world"
            ? await scan(game, { packs: this.config.packs })
            : { documents: [], warnings: [] };
        this.catalog = catalog.documents;
        const result = generate(this.config, catalog.documents);
        this.rows = result.rows;
        this.config.warnings = [...catalog.warnings, ...result.warnings];
        this.offset = 0;
      } finally {
        this.busy = false;
        this.render({ force: true });
      }
      return;
    }
    if (op === "add") {
      this.rows.push({
        name: "Novo resultado",
        description: "",
        weight: 1,
        tags: [],
      });
      this.config.count = this.rows.length;
    }
    if (op === "remove") {
      this.rows.splice(Number(data.index), 1);
      this.offset = Math.max(
        0,
        Math.min(this.offset, Math.floor((this.rows.length - 1) / 50) * 50),
      );
    }
    if (op === "next") this.offset += 50;
    if (op === "prev") this.offset = Math.max(0, this.offset - 50);
    if (op === "details") {
      this.details(Number(data.index));
      return;
    }
    if (op === "save") {
      this.busy = true;
      await this.render({ force: true });
      try {
        this.table = await save(this.config, this.rows, { table: this.table });
        this.config.folder = this.table.folder?.id ?? "";
        this.config.newFolder = "";
        ui.notifications.info(`Tabela salva: ${this.table.name}`);
      } finally {
        this.busy = false;
        this.render({ force: true });
      }
      return;
    }
    if (op === "native") {
      table.sheet.render({ force: true });
      return;
    }
    if (op === "edit") {
      const existing = read(table);
      this.config = { ...blank(), ...existing.config };
      this.rows = existing.rows;
      this.table = table;
      this.offset = 0;
      this.page = "create";
    }
    if (op === "duplicate") {
      const existing = read(table);
      existing.config.name += " · cópia";
      await save(existing.config, existing.rows);
    }
    if (op === "favorite") {
      await table.setFlag(ID, "favorite", !table.flags?.[ID]?.favorite);
    }
    if (op === "draw") {
      this.drawDialog(table);
      return;
    }
    if (op === "history") {
      this.historyDialog(table);
      return;
    }
    if (op === "export") {
      this.exportDialog();
      return;
    }
    if (op === "import") {
      this.importDialog();
      return;
    }
    if (op === "test") {
      const data = source(this.config, this.rows),
        roll = await new Roll(data.formula).evaluate(),
        r = data.results.find(
          (r) => roll.total >= r.range[0] && roll.total <= r.range[1],
        );
      mini(
        "Teste da prévia",
        `<p>${e(data.formula)} → ${roll.total}</p><h3>${e(r.name)}</h3><p>${e(this.rows[data.results.indexOf(r)].description)}</p><small>Teste local: não salva, não altera histórico e não executa ações.</small>`,
        () => {},
      );
      return;
    }
    if (op === "help") {
      mini(
        "Criar tabelas com o Quedaço",
        `<p>1. Escolha um tema, dado e número de linhas.</p><p>2. Gere conteúdo local, consulte documentos existentes ou cole sua lista.</p><p>3. Revise a prévia; configure pesos, faixas, vínculos e detalhes por linha.</p><p>4. Escolha a pasta e salve. A tabela fica disponível na aba Tabelas do Foundry.</p><p>D100 com 100 linhas dá uma linha por face. Pesos precisam de faces suficientes para representar diferenças. As chances exibidas consideram a distribuição real de 2d6 e outras fórmulas.</p><p>Genéricos são texto: não entregam itens, não criam fichas e não aplicam condições. Arraste documentos existentes para substituir um genérico por um vínculo.</p><p>O botão Sortear do Quedaço usa filtros, histórico e ações opcionais. O botão nativo do Foundry usa somente as regras nativas da tabela.</p>`,
        () => {},
      );
      return;
    }
    this.render({ force: true });
  }
  details(index) {
    const r = this.rows[index];
    mini(
      `Resultado ${index + 1} · Detalhes`,
      `<label>UUID do documento<input name="uuid" value="${e(r.uuid)}" placeholder="Item.id ou RollTable.id"></label><label>Tags<input name="tags" value="${e(tags(r.tags).join(", "))}"></label><div class="qt-fields"><label>Nível / intensidade máxima<input name="level" type="number" value="${e(r.level ?? "")}"></label><label>Bioma<input name="biome" value="${e(r.biome)}" placeholder="floresta"></label><label>Hora<input name="time" value="${e(r.time)}" placeholder="noite"></label></div><label>Quantidade ou duração sorteada<input name="quantity" value="${e(r.quantity)}" placeholder="1d4 (somente informa o número)"></label><label>Imagem da linha<input name="img" value="${e(r.img)}"></label><label>Ação opcional<select name="action">${[
        ["none", "Nenhuma"],
        ["open", "Abrir documento"],
        ["image", "Exibir imagem"],
        ["audio", "Tocar som local"],
        ["macro", "Executar macro com confirmação"],
      ]
        .map(([v, l]) => option(v, l, r.action ?? "none"))
        .join(
          "",
        )}</select></label><label>Arquivo de imagem ou som<input name="media" value="${e(r.media)}"></label><label>UUID da macro<input name="macro" value="${e(r.macro)}" placeholder="Macro.id"></label><p>As ações só são executadas se a Mestra habilitar no sorteio. Macros pedem confirmação.</p>`,
      (root) => {
        const candidate = { ...r };
        for (const key of [
          "uuid",
          "tags",
          "biome",
          "time",
          "quantity",
          "img",
          "action",
          "media",
          "macro",
        ])
          candidate[key] = root.querySelector(`[name="${key}"]`).value;
        candidate.level = root.querySelector("[name=level]").value || null;
        if (candidate.uuid) candidate.generic = false;
        source(
          this.config,
          this.rows.map((row, i) => (i === index ? candidate : row)),
        );
        this.rows[index] = candidate;
        this.render({ force: true });
      },
    );
  }
  drawDialog(table) {
    mini(
      `Sortear · ${table.name}`,
      `<div class="qt-fields"><label>Quantidade<input name="count" type="number" min="1" max="100" value="1"></label><label>Visibilidade<select name="visibility">${[
        ["gmroll", "Mestra e quem rolou"],
        ["publicroll", "Público"],
        ["selfroll", "Só eu"],
        ["blindroll", "Somente Mestra"],
      ]
        .map(([v, l]) => option(v, l, "gmroll"))
        .join(
          "",
        )}</select></label></div><label>Tags obrigatórias<input name="tags" placeholder="floresta, viagem"></label><div class="qt-fields"><label>Nível máximo<input name="level" type="number"></label><label>Bioma<input name="biome"></label><label>Hora<input name="time"></label></div><label>Identificador da sessão<input name="session" value="${new Date().toLocaleDateString("pt-BR")}" placeholder="Ex.: sessão-12"></label><label class="qt-toggle"><input name="preview" type="checkbox"> Testar sem chat nem histórico</label><label class="qt-toggle"><input name="actions" type="checkbox"> Executar ações opcionais dos resultados</label><p>${(table.flags?.[ID]?.history ?? []).length} sorteios no histórico recente.</p><button type="button" data-reset>Resetar repetição e histórico</button>`,
      async (root) => {
        const value = (k) => root.querySelector(`[name="${k}"]`).value;
        const result = await draw(table, {
          count: value("count"),
          context: {
            tags: value("tags"),
            level: value("level"),
            biome: value("biome"),
            time: value("time"),
            session: value("session"),
          },
          rollMode: value("visibility"),
          preview: root.querySelector("[name=preview]").checked,
          actions: root.querySelector("[name=actions]").checked,
        });
        ui.notifications.info(
          result.results.map((r) => r.result.name).join(" · "),
        );
      },
      (root) => {
        root.querySelector("[data-reset]")?.addEventListener("click", () =>
          reset(table)
            .then(() =>
              ui.notifications.info("Repetição e histórico resetados."),
            )
            .catch(error),
        );
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Ver histórico";
        button.addEventListener("click", () => this.historyDialog(table));
        root.append(button);
      },
    );
  }
  historyDialog(table) {
    const history = table.flags?.[ID]?.history ?? [];
    const content = history
      .slice(-100)
      .reverse()
      .map(
        (h) =>
          `<li><small>${e(new Date(h.date).toLocaleString("pt-BR"))} · ${e(h.session || "Sem sessão")}</small><p>${(h.names ?? []).map(e).join(" · ")}</p></li>`,
      )
      .join("");
    mini(
      `Histórico · ${table.name}`,
      `<p>${history.length} sorteios guardados. Exibindo os últimos 100.</p><ul>${content || "<li>Nenhum sorteio registrado.</li>"}</ul><label>Ao aplicar<select name="destination"><option value="download">Baixar histórico em JSON</option><option value="journal">Criar página de diário privada</option></select></label>`,
      async (root) => {
        if (root.querySelector("[name=destination]").value === "journal") {
          if (!game.user.isGM)
            throw Error("Apenas a Mestra pode criar o diário.");
          await JournalEntry.create({
            name: `Histórico · ${table.name}`,
            ownership: { default: 0 },
            pages: [
              {
                name: "Sorteios",
                type: "text",
                text: {
                  format: 1,
                  content: `<h2>${e(table.name)}</h2><ul>${content}</ul>`,
                },
              },
            ],
          });
          ui.notifications.info("Diário criado.");
        } else
          download(
            `${table.name}-historico.json`,
            "application/json",
            JSON.stringify(history, null, 2),
          );
      },
    );
  }
  exportDialog() {
    mini(
      "Exportar tabela",
      `<label>Formato<select name="format"><option value="json">JSON completo</option><option value="csv">CSV de resultados</option></select></label>`,
      (root) => {
        const format = root.querySelector("[name=format]").value;
        download(
          `${this.config.name || "tabela"}.${format}`,
          format === "json" ? "application/json" : "text/csv",
          format === "json"
            ? exportJSON(this.config, this.rows)
            : toCSV(this.rows),
        );
      },
    );
  }
  importDialog() {
    mini(
      "Importar lista ou tabela",
      `<label>Formato<select name="format"><option value="json">JSON Quedaço</option><option value="csv">CSV (name, description, weight, tags, uuid)</option><option value="text">Texto — uma linha por resultado</option></select></label><label>Arquivo<input name="file" type="file" accept=".json,.csv,.txt"></label><label>Ou cole aqui<textarea name="text" rows="8"></textarea></label>`,
      async (root) => {
        const file = root.querySelector("[name=file]").files[0];
        if (file && file.size > 2000000)
          throw Error("Arquivo grande demais (máximo 2 MB).");
        const text = file
            ? await file.text()
            : root.querySelector("[name=text]").value,
          format = root.querySelector("[name=format]").value;
        if (format === "json") {
          const data = importJSON(text);
          this.config = {
            ...blank(),
            ...data.config,
            folder: "",
            newFolder: "",
          };
          this.rows = data.rows;
        } else {
          this.config = blank();
          this.config.theme = "manual";
          this.config.mode = "manual";
          this.rows =
            format === "csv"
              ? parseCSV(text)
              : text
                  .split(/\r?\n/)
                  .filter((s) => s.trim())
                  .map((name) => ({ name: name.trim(), weight: 1 }));
          if (this.rows.length < 1 || this.rows.length > 1000)
            throw Error("Importe de 1 a 1.000 linhas.");
          this.config.count = this.rows.length;
          this.config.formula = `1d${Math.max(2, this.rows.length)}`;
          this.config.name = "Tabela importada";
        }
        this.table = null;
        this.page = "create";
        this.offset = 0;
        this.render({ force: true });
      },
    );
  }
}
