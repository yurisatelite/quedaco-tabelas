const norm = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const EXPANSIONS = {
  seco: ["Sol branco e ar sem umidade", "Calor seco durante o dia", "Frio cortante depois do ocaso", "Areia fina entra nas roupas", "A água evapora depressa", "O horizonte permanece limpo"],
  "tempestade de areia": ["Uma parede de areia surge no horizonte", "Rajadas cegantes apagam as trilhas", "A areia cobre equipamentos expostos", "O vento muda de direção sem aviso", "Descargas estáticas percorrem o ar", "A tempestade deixa destroços pelo caminho"],
  enevoado: ["Nuvens baixas achatam o horizonte", "A umidade deixa pedra e madeira escorregadias", "Sons parecem vir de longe", "A visibilidade cai entre uma rajada e outra", "O céu abre por instantes", "A névoa esconde movimento próximo"],
  chuva: ["Chuva fina acompanha a viagem", "Uma pancada repentina encharca o terreno", "Poças refletem luz e movimento", "A chuva apaga rastros recentes", "O chão vira lama nas passagens estreitas", "O som da água abafa conversas"],
  "nevoa negra": ["A névoa escurece ao redor dos viajantes", "Luzes perdem alcance dentro da fumaça", "A respiração fica pesada", "Formas se movem no limite da visão", "O frio parece concentrado no negrume", "A névoa deixa fuligem em superfícies"],
  ensolarado: ["Luz clara favorece a navegação", "O calor aumenta ao meio-dia", "Sombras curtas revelam poucos abrigos", "A paisagem ganha cores intensas", "O vento traz cheiro de terra distante", "O fim da tarde fica dourado e seco"],
  umido: ["O ar pesa e a roupa não seca", "Vegetação libera cheiros fortes", "Metal começa a criar marcas de ferrugem", "A pele fica coberta por uma fina película de suor", "Insetos aparecem perto de água parada", "Madeira estala com a umidade"],
  tempestade: ["Trovões chegam antes da chuva", "Raios iluminam a paisagem em flashes", "Ventos derrubam objetos leves", "A água corre pelas partes baixas", "Abrigos tornam-se disputados", "A tempestade abre e fecha rapidamente"],
  neve: ["Flocos isolados começam a se acumular", "O frio endurece a terra", "Pegadas ficam bem marcadas", "A neve abafa sons", "O céu ganha um brilho pálido", "A travessia exige cuidado com o gelo"],
  nevasca: ["A neve reduz a visão a poucos metros", "Trilhas desaparecem sob uma camada nova", "O vento corta rosto e mãos", "Equipamentos ficam pesados de gelo", "Abrigos precisam ser encontrados depressa", "A nevasca muda a leitura do terreno"],
  gelido: ["O ar queima os pulmões", "Superfícies expostas ficam escorregadias", "A água congela nas bordas", "O silêncio é quebrado pelo gelo estalando", "O frio torna movimentos mais lentos", "O céu limpo não traz alívio"],
  "tempestade de neve": ["Ventos levantam colunas de neve", "A temperatura despenca em minutos", "Marcos do caminho somem", "O gelo prende cordas e dobradiças", "Uma rajada abre uma janela de visibilidade", "A tempestade empurra viajantes para fora da rota"],
  variado: ["O céu muda de aparência sem aviso", "Calor e frio se alternam na mesma hora", "Uma chuva breve atravessa a região", "O vento muda a direção dos sinais", "A visibilidade abre e fecha rapidamente", "O clima parece seguir um padrão próprio"],
};

function line(text) { return String(text ?? "").replace(/\r/g, "").replace(/^\s*[•·]\s*/, "").trim(); }
function parseBand(value) {
  const raw = line(value), match = raw.match(/^(.*?)\s*\((\d+)\s*[-–]\s*(\d+)\s*\/\s*d(\d+)\)/i);
  if (!match) return null;
  return { label: line(match[1]), min: Number(match[2]), max: Number(match[3]), die: Number(match[4]) };
}

export function parseClimateText(text) {
  const blocks = String(text ?? "").split(/\n(?=\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9][^\n]{2,}\n\s*[•·]?\s*TIPO\s*:)/g).filter((b) => /CLIMA\s*:/i.test(b));
  return blocks.map((block) => {
    const lines = block.split("\n").map(line).filter(Boolean);
    const typeIndex = lines.findIndex((v) => /^TIPO\s*:/i.test(v));
    const location = line((typeIndex > 0 ? lines[typeIndex - 1] : lines[0]).replace(/^[-#\s]+/, ""));
    const climate = { common: null, occasional: null, dangerous: null };
    for (const [key, pattern] of [["common", /Clima\s+Comum\s*:\s*(.*)/i], ["occasional", /Clima\s+Ocasional\s*:\s*(.*)/i], ["dangerous", /Clima\s+Perigoso\s*:\s*(.*)/i]]) {
      const found = lines.find((v) => pattern.test(v));
      if (found) climate[key] = parseBand(found.match(pattern)[1]);
    }
    const kind = line((lines.find((v) => /^CLIMA\s*:/i.test(v)) ?? "").split(":").slice(1).join(":").replace(/\(.*/, ""));
    return { location, kind, climate, source: "Localidades Skyfall.pdf" };
  }).filter((x) => x.location && Object.values(x.climate).some(Boolean));
}

function detail(label, category, index, location) {
  const variants = EXPANSIONS[norm(label)] ?? [`Condição de ${label}`, `Variação intensa de ${label}`, `Intervalo de ${label}`];
  return { name: `${label} · ${index + 1}`, description: `${variants[index % variants.length]}. Localidade: ${location}. Faixa original: ${category}.`, category, climate: label, generic: true, tags: ["clima", norm(label), norm(category)] };
}

export function expandClimate(location, count = 100) {
  const bands = Object.entries(location.climate).filter(([, band]) => band).map(([category, band]) => ({ category, band }));
  const die = Math.max(...bands.map(({ band }) => band.die), 20);
  const rows = [];
  for (let roll = 1; roll <= count; roll++) {
    const original = Math.min(die, Math.ceil((roll * die) / count));
    const match = bands.find(({ band }) => original >= band.min && original <= band.max) ?? bands.at(-1);
    if (!match) continue;
    const within = original - match.band.min;
    const variants = EXPANSIONS[norm(match.band.label)] ?? [match.band.label];
    const row = detail(match.band.label, match.category, within + Math.floor((roll - 1) / die), location.location);
    row.range = [roll, roll];
    row.weight = 1;
    row.description += ` Resultado ${roll} em ${count}.`;
    rows.push(row);
  }
  return rows;
}

export const climateExpansions = EXPANSIONS;
