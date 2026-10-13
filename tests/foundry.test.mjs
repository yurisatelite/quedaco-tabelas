import { test } from "node:test";
import assert from "node:assert/strict";
import { ID } from "../src/core.mjs";
import { save, draw } from "../src/foundry.mjs";
import { scan } from "../src/catalog.mjs";
const docs = new Map(),
  messages = [];
globalThis.game = {
  user: { id: "gm", isGM: true },
  folders: Object.assign([], { get() {} }),
  packs: new Map(),
  items: [],
  actors: [],
  tables: [],
  scenes: [],
  journal: [],
};
globalThis.foundry = { utils: { randomID: () => String(Math.random()) } };
globalThis.fromUuid = async (uuid) => docs.get(uuid);
globalThis.ChatMessage = {
  async create(data, options) {
    messages.push({ data, options });
  },
};
function table(uuid, rows, { repeat = "normal", replacement = true } = {}) {
  const t = {
    uuid,
    documentName: "RollTable",
    name: uuid,
    formula: "1d2",
    isOwner: true,
    replacement,
    flags: { [ID]: { config: { repeat }, history: [] } },
    testUserPermission: () => true,
    results: rows.map((r, i) => ({
      id: String(i),
      name: r.name,
      range: r.range ?? [i + 1, i + 1],
      drawn: false,
      flags: { [ID]: {} },
      async getHTML() {
        return this.name;
      },
      ...r,
    })),
    async updateEmbeddedDocuments(_t, updates) {
      for (const u of updates) {
        const r = this.results.find((r) => r.id === u._id);
        r.drawn = u.drawn;
      }
    },
    async setFlag(id, key, value) {
      this.flags[id][key] = value;
    },
  };
  docs.set(uuid, t);
  return t;
}
test("salvar cria apenas RollTable v13 na pasta, nunca Item nem Actor", async () => {
  let called;
  globalThis.RollTable = {
    async create(data) {
      called = data;
      return data;
    },
  };
  const result = await save({ name: "Nomes", formula: "1d20", newFolder: "" }, [
    { name: "Nome" },
  ]);
  assert.equal(result, called);
  assert.equal(result.results[0].type, "text");
  assert.equal(result.results[0].name, "Nome");
  assert.equal(result.results[0].text, undefined);
  assert.equal(result.ownership.default, 0);
});
test("documento ausente bloqueia salvar antes de criar pasta", async () => {
  let made = false;
  globalThis.Folder = {
    async create() {
      made = true;
    },
  };
  await assert.rejects(
    save({ name: "Itens", formula: "1d20", newFolder: "Teste" }, [
      { name: "Item ausente", uuid: "Item.inexistente" },
    ]),
  );
  assert.equal(made, false);
});
test("consulta mundo e compêndios explícitos; não carrega compêndios não selecionados", async () => {
  game.items = [
    {
      name: "Anel Amaldiçoado",
      uuid: "Item.a",
      documentName: "Item",
      type: "loot",
      system: {},
      flags: {},
    },
  ];
  let scanned = 0;
  game.packs.set("pack.test", {
    documentName: "Item",
    async getIndex() {
      scanned++;
      return [{ _id: "b", name: "Espada", type: "weapon" }];
    },
  });
  const onlyWorld = await scan(game);
  assert.equal(scanned, 0);
  assert.ok(onlyWorld.documents[0].tags.includes("amaldicoado"));
  const both = await scan(game, { packs: ["pack.test"] });
  assert.equal(scanned, 1);
  assert.equal(both.documents[1].uuid, "Compendium.pack.test.b");
});
test("prévia não escreve histórico, drawn nem chat", async () => {
  const t = table("RollTable.preview", [{ name: "A" }, { name: "B" }], {
    repeat: "cycle",
    replacement: false,
  });
  const before = messages.length;
  await draw(t, { count: 2, preview: true });
  assert.equal(t.flags[ID].history.length, 0);
  assert.equal(
    t.results.some((r) => r.drawn),
    false,
  );
  assert.equal(messages.length, before);
});
test("ciclo sorteia cada resultado uma vez e registra a sessão", async () => {
  const t = table("RollTable.cycle", [{ name: "A" }, { name: "B" }], {
    repeat: "cycle",
    replacement: false,
  });
  const output = await draw(t, { count: 2, context: { session: "s1" } });
  assert.equal(new Set(output.results.map((r) => r.result.id)).size, 2);
  assert.equal(t.flags[ID].history.length, 2);
  assert.equal(t.flags[ID].history[0].session, "s1");
  await assert.rejects(draw(t));
});
test("encadeamento combina resultados em um chat; loop não deixa estado parcial", async () => {
  const child = table("RollTable.child", [
    { name: "Folha A" },
    { name: "Folha B" },
  ]);
  const root = table("RollTable.root", [
    { name: "Filha", documentUuid: child.uuid, range: [1, 2] },
  ]);
  const before = messages.length;
  const out = await draw(root);
  assert.equal(out.results.length, 1);
  assert.equal(messages.length, before + 1);
  assert.equal(child.flags[ID].history.length, 1);
  const loop = table("RollTable.loop", [
    { name: "Loop", documentUuid: "RollTable.loop", range: [1, 2] },
  ]);
  await assert.rejects(draw(loop));
  assert.equal(loop.flags[ID].history.length, 0);
});
test("filtro sem candidatos não muda estado nem envia chat", async () => {
  const t = table("RollTable.filters", [{ name: "A" }, { name: "B" }]);
  const before = messages.length;
  await assert.rejects(draw(t, { context: { tags: "inexistente" } }));
  assert.equal(messages.length, before);
  assert.equal(t.flags[ID].history.length, 0);
});
