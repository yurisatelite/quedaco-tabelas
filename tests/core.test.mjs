import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ID,
  dice,
  allocate,
  source,
  eligible,
  pick,
  exportJSON,
  importJSON,
  parseCSV,
  toCSV,
} from "../src/core.mjs";
import { generate, THEMES } from "../src/generators.mjs";
const config = {
  name: "Teste",
  formula: "1d20",
  count: 20,
  distribution: "equal",
  mode: "local",
  theme: "names",
  culture: "draconic",
  gender: "male",
};
test("D20 e D100 geram quantidade exata de nomes únicos e faixas completas", () => {
  for (const count of [20, 100, 1000]) {
    const c = { ...config, count, formula: `1d${count}` },
      out = generate(c);
    assert.equal(out.rows.length, count);
    assert.equal(new Set(out.rows.map((r) => r.name)).size, count);
    const table = source(c, out.rows);
    assert.equal(table.results[0].range[0], 1);
    assert.equal(table.results.at(-1).range[1], count);
    assert.ok(table.results.every((r) => r.type === "text" && !r.documentUuid));
  }
});
test("nome de testemunha independe de armazenamento e também funciona com RNG constante", () => {
  const out = generate(
    { ...config, count: 100, purpose: "witness" },
    [],
    () => 0,
  );
  assert.equal(out.rows.length, 100);
  assert.equal(new Set(out.rows.map((r) => r.name)).size, 100);
});
test("chances reais de 2d6 somam 100% e 7 é mais provável", () => {
  const d = dice("2d6");
  assert.equal(d.min, 2);
  assert.equal(d.max, 12);
  assert.ok(Math.abs(d.probabilities.get(7) - 6 / 36) < 1e-9);
  const rows = allocate(
    Array.from({ length: 11 }, (_, i) => ({ name: String(i) })),
    "2d6",
  );
  assert.ok(rows[5].probability > rows[0].probability);
  assert.ok(Math.abs(rows.reduce((a, r) => a + r.probability, 0) - 1) < 1e-9);
});
test("dados inválidos, excesso de linhas, faixas com buracos e pesos impossíveis são recusados", () => {
  for (const s of ["1d0", "1d1", "1d6;alert(1)", "@foo", "30d20"])
    assert.throws(() => dice(s));
  assert.throws(() =>
    allocate(
      Array.from({ length: 21 }, () => ({ name: "x" })),
      "1d20",
    ),
  );
  assert.throws(() =>
    allocate([{ range: [1, 2] }, { range: [4, 6] }], "1d6", "ranges"),
  );
  assert.throws(() =>
    allocate([{ weight: 1 }, { weight: 9 }], "1d2", "weighted"),
  );
});
test("pesos relativos alocam mais faces e chance ao resultado comum", () => {
  const rows = allocate(
    [
      { name: "raro", weight: 1 },
      { name: "comum", weight: 9 },
    ],
    "1d100",
    "weighted",
  );
  assert.ok(rows[1].probability > rows[0].probability);
  assert.equal(rows[1].range[1], 100);
  assert.equal(rows[1].range[0], rows[0].range[1] + 1);
});
test("escassez de conteúdo gera aviso e texto, nunca um vínculo falso", () => {
  const c = {
      ...config,
      theme: "items",
      mode: "world",
      documentType: "Item",
      requiredTags: "amaldicoado",
      fallback: true,
    },
    out = generate(c, [
      {
        name: "Espada",
        uuid: "Item.abc",
        documentType: "Item",
        tags: ["weapon"],
      },
    ]);
  assert.equal(out.rows.length, 20);
  assert.ok(out.warnings.length);
  assert.ok(out.rows.every((r) => r.generic && !r.uuid));
  const table = source(c, out.rows);
  assert.ok(table.results.every((r) => r.type === "text"));
});
test("sem fallback preserva só documentos encontrados", () => {
  const out = generate(
    {
      ...config,
      theme: "items",
      mode: "world",
      documentType: "Item",
      fallback: false,
    },
    [{ name: "Anel", uuid: "Item.abc", documentType: "Item", tags: [] }],
  );
  assert.equal(out.rows.length, 1);
  assert.equal(out.rows[0].uuid, "Item.abc");
  assert.ok(out.warnings.length);
});
test("modelos narrativos geram tabelas completas em todas as categorias locais", () => {
  for (const t of THEMES.filter((t) => !["manual", "tables"].includes(t.id))) {
    const out = generate({ ...config, theme: t.id, count: 100 });
    assert.equal(out.rows.length, 100, t.id);
    assert.equal(new Set(out.rows.map((r) => r.name)).size, 100, t.id);
  }
});
test("JSON e CSV preservam caracteres, vírgulas, aspas e linhas", () => {
  const rows = [
    {
      name: 'Luz, "azul"',
      description: "Primeira\nSegunda",
      weight: 2,
      tags: ["noite", "floresta"],
    },
  ];
  const round = parseCSV(toCSV(rows));
  assert.equal(round[0].name, rows[0].name);
  assert.equal(round[0].description, rows[0].description);
  assert.deepEqual(round[0].tags, rows[0].tags);
  assert.equal(importJSON(exportJSON(config, rows)).rows[0].name, rows[0].name);
  assert.throws(() => importJSON('{"schema":99}'));
});
test("importação nunca injeta scripts no texto e ações desconhecidas são recusadas", () => {
  const table = source(config, [
    { name: "<script>x</script>", description: "<img onerror=x>" },
  ]);
  assert.ok(table.results[0].description.includes("&lt;img"));
  assert.throws(() =>
    source(config, [{ name: "x", action: "transfer-money" }]),
  );
  assert.throws(() =>
    source(config, [{ name: "x", media: "javascript:alert(1)" }]),
  );
});
test("filtros e repetição por sessão preservam resultados de outras sessões", () => {
  const row = {
    id: "x",
    flags: {
      [ID]: { tags: ["floresta"], level: 3, biome: "mata", time: "noite" },
    },
  };
  assert.equal(eligible(row, { tags: "cidade" }), false);
  assert.equal(eligible(row, { level: 2 }), false);
  assert.equal(eligible(row, { biome: "mata", time: "noite" }), true);
  assert.equal(
    eligible(
      row,
      { session: "s2" },
      [{ session: "s1", ids: ["x"] }],
      "session",
    ),
    true,
  );
  assert.equal(
    eligible(
      row,
      { session: "s1" },
      [{ session: "s1", ids: ["x"] }],
      "session",
    ),
    false,
  );
});
test("sorteio condicionado respeita massas de probabilidade e nunca escolhe linha excluída", () => {
  const rows = allocate([{ name: "a" }, { name: "b" }], "1d20");
  assert.equal(pick(rows, "1d20", () => 0).name, "a");
  assert.equal(pick([rows[1]], "1d20", () => 0).name, "b");
});
