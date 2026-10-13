export function quedacoIntegration(game) {
  const module = game?.modules?.get?.("quedaco");
  const api = module?.active === false ? null : module?.api;
  if (api?.family !== "quedaco" || !api.capabilities?.npcDatabase || !api?.listNpcs || !api?.listRegions) return null;
  return { npcs: api.listNpcs(), regions: api.listRegions() };
}

export function npcRows(integration, regionId = "") {
  const npcs = Array.from(integration?.npcs ?? []).filter((npc) => !regionId || npc.regionId === regionId);
  return npcs.map((npc) => ({
    name: npc.name,
    description: [npc.role, npc.placeName, npc.regionName].filter(Boolean).join(" · "),
    uuid: npc.uuid,
    img: npc.img,
    documentType: "Actor",
    weight: 1,
    tags: ["npc", npc.role, npc.regionId, npc.placeId].filter(Boolean),
    origin: "quedaco",
  }));
}
