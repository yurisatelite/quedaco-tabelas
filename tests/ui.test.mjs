import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM('<!doctype html><body><main id="app"></main></body>', {
  url: "http://localhost",
});
Object.assign(globalThis, {
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  FormData: dom.window.FormData,
  Hooks: { on() {}, off() {} },
  game: { folders: [], packs: [], tables: [], user: { isGM: true } },
  ui: { notifications: { info() {}, warn() {}, error() {} } },
});
globalThis.foundry = {
  applications: {
    api: {
      ApplicationV2: class {
        constructor() {
          this.element = document.querySelector("#app");
        }
        async _onRender() {}
        async render() {
          this.element.innerHTML = await this._renderHTML();
          await this._onRender();
        }
      },
    },
  },
};
game.tables.get = () => null;
const { TablesApp } = await import("../src/app.mjs");
test("criador renderiza e gera D100 dracônico com controles reais de formulário", async () => {
  const app = new TablesApp();
  await app.render();
  const preset = app.element.querySelector("[name=preset]");
  preset.value = "1d100";
  preset.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(app.config.count, 100);
  assert.equal(app.config.formula, "1d100");
  app.element.querySelector("[name=name]").value = "100 nomes dracônicos";
  app.element.querySelector("[name=culture]").value = "draconic";
  await app.action("generate");
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(app.rows.length, 100);
  assert.equal(app.element.querySelectorAll(".qt-result").length, 50);
  assert.ok(app.element.textContent.includes("100 resultados"));
  assert.equal(app.element.querySelector("[data-op=save]").disabled, false);
});
test("edição de linha sobrevive a troca de página da prévia", async () => {
  const app = new TablesApp();
  app.config.count = 100;
  app.config.formula = "1d100";
  await app.render();
  await app.action("generate");
  await new Promise((r) => setTimeout(r, 0));
  const field = app.element.querySelector("[data-row=name]");
  field.value = "Nome editado";
  field.dispatchEvent(new dom.window.Event("input"));
  await app.action("next");
  await new Promise((r) => setTimeout(r, 0));
  await app.action("prev");
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(
    app.element.querySelector("[data-row=name]").value,
    "Nome editado",
  );
});
test("tabela sem conteúdo não pode ser salva e fontes genéricas são visíveis", async () => {
  const app = new TablesApp();
  await app.render();
  assert.equal(app.element.querySelector("[data-op=save]").disabled, true);
  await app.action("theme", { id: "items" });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(app.config.mode, "world");
  assert.ok(
    app.element.textContent.includes("Nenhum Item ou Actor será criado"),
  );
});
