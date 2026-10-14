import { TablesApp } from "./app.mjs";
import { ID } from "./core.mjs";
import { draw } from "./foundry.mjs";
import { scan } from "./catalog.mjs";
let app;
function open() {
  if (!game.user.isGM)
    return ui.notifications.warn(
      "O criador de tabelas é uma ferramenta da Mestra.",
    );
  app ??= new TablesApp();
  app.render({ force: true });
  return app;
}
Hooks.once("ready", () => {
  const module = game.modules.get(ID);
  const descriptor = Object.freeze({
    family: "quedaco",
    contractVersion: 1,
    id: ID,
    title: module.title,
    version: module.version,
    capabilities: Object.freeze({
      tableBuilder: true,
      rollTables: true,
      documentClimateImport: true,
      npcRegionalTables: true,
    }),
    open,
    getStatus: () => ({
      ready: true,
      integrations: {
        quedaco: Boolean(game.modules.get("quedaco")?.api?.family === "quedaco"),
      },
    }),
    draw,
    scan: (options) => scan(game, options),
  });
  module.api = descriptor;
  Hooks.callAll("quedaco:register", descriptor);
});
Hooks.on("renderRollTableDirectory", (directory, html) => {
  if (!game.user.isGM) return;
  const root =
    html instanceof HTMLElement ? html : (html?.[0] ?? directory.element);
  if (!root || root.querySelector("[data-qt-builder]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.qtBuilder = "";
  button.innerHTML =
    '<i class="fa-solid fa-wand-magic-sparkles"></i> Quedaço - Criar tabela';
  button.addEventListener("click", open);
  (
    root.querySelector(".header-actions") ??
    root.querySelector(".directory-header") ??
    root
  ).prepend(button);
});
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user?.isGM) return;
  const tool = {
    name: ID,
    title: "Quedaço - Tabelas",
    icon: "fa-solid fa-table-list",
    button: true,
    order: 98,
    onClick: open,
  };
  if (Array.isArray(controls)) {
    const group = controls.find((c) => c.name === "tokens") ?? controls[0];
    group?.tools?.push(tool);
  } else {
    const group = controls.tokens ?? Object.values(controls)[0];
    if (group?.tools) group.tools[tool.name] = tool;
  }
});

Hooks.on('quedaco:catalog-updated',()=>{if(app?.rendered){app.collect();app.render({force:true});}});
