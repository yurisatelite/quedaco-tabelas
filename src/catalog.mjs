import { ID, tags, normalize } from "./core.mjs";
function entry(
  document,
  { pack = "", documentType = document.documentName } = {},
) {
  const system = document.system ?? {},
    name = String(document.name ?? ""),
    flags = document.flags ?? {};
  const level = system.level?.value ?? system.level;
  const labels = [
    ...tags(flags[ID]?.tags),
    ...tags(system.tags),
    ...tags(system.descriptors),
    document.type,
  ];
  // Indícios de classificação; não afirmam que uma regra de maldição está aplicada.
  if (/amaldico|cursed|curse/.test(normalize(name))) labels.push("amaldicoado");
  return {
    name,
    uuid: document.uuid ?? `Compendium.${pack}.${document._id}`,
    img: document.img,
    documentType,
    folder: document.folder?.id ?? document.folder ?? "",
    tags: tags(labels),
    level: Number.isFinite(Number(level)) ? Number(level) : null,
    pack,
  };
}
export async function scan(game, { packs = [] } = {}) {
  const documents = [];
  for (const key of ["items", "actors", "scenes", "journal", "tables"])
    for (const doc of game[key] ?? [])
      if (doc.visible !== false) documents.push(entry(doc));
  const warnings = [];
  for (const id of packs) {
    const pack = game.packs.get(id);
    if (
      !pack ||
      !["Item", "Actor", "RollTable", "Scene", "JournalEntry"].includes(
        pack.documentName,
      )
    ) {
      warnings.push(`Compêndio indisponível: ${id}`);
      continue;
    }
    try {
      const index = await pack.getIndex({
        fields: [
          "type",
          "system.level",
          "system.tags",
          "system.descriptors",
          `flags.${ID}.tags`,
        ],
      });
      for (const doc of index)
        documents.push(
          entry(doc, { pack: id, documentType: pack.documentName }),
        );
    } catch {
      warnings.push(`Não foi possível ler ${pack.title ?? id}.`);
    }
  }
  return { documents, warnings };
}
