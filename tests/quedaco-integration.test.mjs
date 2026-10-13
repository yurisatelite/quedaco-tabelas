import test from "node:test";
import assert from "node:assert/strict";
import { npcRows, quedacoIntegration } from "../src/quedaco-integration.mjs";

test("lê a API do QUEDAÇO e cria resultados vinculados aos Actors", () => {
  const api = {
    family: "quedaco",
    capabilities: { npcDatabase: true },
    listRegions: () => [{ id: "mirmir", name: "Deserto de Mirmir" }],
    listNpcs: () => [{ uuid: "Actor.a1", name: "Mara", img: "mara.webp", role: "merchant", regionId: "mirmir", regionName: "Deserto de Mirmir", placeId: "kravokia", placeName: "Kravokia" }],
  };
  const integration = quedacoIntegration({ modules: { get: () => ({ active: true, api }) } });
  const rows = npcRows(integration, "mirmir");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].uuid, "Actor.a1");
  assert.equal(rows[0].documentType, "Actor");
  assert.equal(rows[0].origin, "quedaco");
});

test("integração fica indisponível sem o QUEDAÇO ativo", () => {
  assert.equal(quedacoIntegration({ modules: { get: () => ({ active: false }) } }), null);
});

test("integração recusa APIs sem o contrato público da família", () => {
  const api = { listRegions: () => [], listNpcs: () => [] };
  assert.equal(quedacoIntegration({ modules: { get: () => ({ active: true, api }) } }), null);
});
