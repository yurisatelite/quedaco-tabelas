import test from "node:test";
import assert from "node:assert/strict";
import { parseClimateText, expandClimate } from "../src/pdf-climate.mjs";

const sample = `DESERTO DE MIRMIR
TIPO: Região
CLIMA: Árido (Seco)
Clima Comum: Seco (1-13/d20)
Clima Ocasional: ------
Clima Perigoso: Tempestade de Areia (14-20/d20)

ATOLEIRO DE KRAMBOSO
TIPO: Região
CLIMA: Temperado (Enevoado)
Clima Comum: Enevoado (1-10/d20)
Clima Ocasional: Chuva (11-15/d20)
Clima Perigoso: Névoa Negra (16-20/d20)`;

test("lê localidades e faixas de clima do texto extraído", () => {
  const locations = parseClimateText(sample);
  assert.equal(locations.length, 2);
  assert.equal(locations[0].location, "DESERTO DE MIRMIR");
  assert.equal(locations[0].climate.dangerous.label, "Tempestade de Areia");
  assert.equal(locations[1].climate.occasional.min, 11);
});

test("expande o d20 original sem perder a faixa de origem", () => {
  const location = parseClimateText(sample)[0];
  const rows = expandClimate(location, 100);
  assert.equal(rows.length, 100);
  assert.ok(rows.some((row) => row.category === "common"));
  assert.ok(rows.some((row) => row.category === "dangerous"));
  assert.ok(rows.some((row) => row.description.includes("Faixa original: dangerous")));
  assert.ok(rows.every((row) => row.tags.includes("clima")));
});
