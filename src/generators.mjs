import { int, normalize, tags } from "./core.mjs";
export const THEMES = [
  [
    "names",
    "Nomes",
    "fa-signature",
    "Nomes de pessoas, testemunhas e culturas fictícias.",
  ],
  [
    "weather",
    "Clima",
    "fa-cloud-sun",
    "Condição, intensidade, duração e consequência.",
  ],
  [
    "traps",
    "Armadilhas",
    "fa-skull-crossbones",
    "Gatilho, pista, perigo e solução narrativa.",
  ],
  [
    "encounters",
    "Encontros",
    "fa-people-group",
    "Situações, intenções e complicações.",
  ],
  [
    "items",
    "Itens e tesouros",
    "fa-gem",
    "Itens existentes ou propostas genéricas claramente marcadas.",
  ],
  [
    "npcs",
    "NPCs",
    "fa-user",
    "Personagens existentes ou descrições narrativas.",
  ],
  [
    "rumors",
    "Rumores",
    "fa-comment-dots",
    "Informações, fontes e possíveis dúvidas.",
  ],
  [
    "quests",
    "Missões e ganchos",
    "fa-scroll",
    "Objetivo, motivo e complicação.",
  ],
  [
    "rooms",
    "Salas e exploração",
    "fa-door-open",
    "Ambientes, pistas e elementos interativos.",
  ],
  ["travel", "Viagem", "fa-route", "Acontecimentos e obstáculos na estrada."],
  [
    "city",
    "Eventos de cidade",
    "fa-city",
    "Vida urbana, autoridades, festivais e crises.",
  ],
  [
    "complications",
    "Complicações",
    "fa-bolt",
    "Imprevistos que mudam uma situação.",
  ],
  [
    "magic",
    "Magia e presságios",
    "fa-wand-magic-sparkles",
    "Anomalias e manifestações narrativas.",
  ],
  [
    "combat",
    "Eventos de combate",
    "fa-shield-halved",
    "Mudanças de terreno e oportunidades.",
  ],
  [
    "consequences",
    "Consequências",
    "fa-heart-crack",
    "Custos e consequências narrativas.",
  ],
  [
    "shops",
    "Comércio",
    "fa-store",
    "Ofertas, abastecimento e situações comerciais.",
  ],
  ["descriptions", "Descrições", "fa-eye", "Detalhes sensoriais e indícios."],
  ["oracle", "Oráculo", "fa-question", "Respostas para perguntas abertas."],
  [
    "places",
    "Locais",
    "fa-map-location-dot",
    "Locais existentes ou ideias de exploração.",
  ],
  ["factions", "Facções", "fa-flag", "Objetivos, disputas e oportunidades."],
  [
    "loot",
    "Pacotes de recompensa",
    "fa-coins",
    "Combinações narrativas de recompensa e pistas.",
  ],
  [
    "tables",
    "Tabelas encadeadas",
    "fa-diagram-project",
    "Resultados que sorteiam outras tabelas existentes.",
  ],
  [
    "manual",
    "Lista livre",
    "fa-pen",
    "Cole uma lista, importe ou escreva cada resultado.",
  ],
].map(([id, label, icon, hint]) => ({ id, label, icon, hint }));
export const DIFFICULTIES = {
  soft: {
    label: "Tranquila",
    consequence: "Oferece uma descoberta ou escolha sem urgência.",
  },
  moderate: {
    label: "Moderada",
    consequence: "Exige uma escolha e pode consumir tempo ou recursos.",
  },
  hard: {
    label: "Difícil",
    consequence:
      "Há risco evidente; a situação pede preparação ou uma alternativa.",
  },
  extreme: {
    label: "Extrema",
    consequence:
      "A ameaça pode mudar a cena; sinalize o risco e ofereça uma saída.",
  },
};
const pools = {
  weather: [
    [
      "Céu limpo",
      "Chuva fina",
      "Chuva pesada",
      "Neblina",
      "Ventania",
      "Frio persistente",
      "Calor abafado",
      "Tempestade distante",
      "Poeira no ar",
      "Nuvens muito baixas",
    ],
    [
      "na manhã",
      "ao anoitecer",
      "sobre o vale",
      "junto ao rio",
      "na passagem estreita",
      "em toda a região",
      "durante a travessia",
      "antes de uma parada",
      "na encosta",
      "no horizonte",
    ],
    [
      "dura 1d4 horas",
      "se dissipa ao amanhecer",
      "oscila durante a tarde",
      "piora perto da água",
      "muda ao fim da próxima cena",
      "abre uma janela de tempo bom",
      "encobre pegadas recentes",
      "dificulta ouvir sons distantes",
      "torna o chão escorregadio",
      "atrai pessoas para um abrigo",
    ],
  ],
  traps: [
    [
      "Placa de pressão",
      "Fio quase invisível",
      "Símbolo luminoso",
      "Porta contrapesada",
      "Piso falso",
      "Estátua articulada",
      "Fechadura adulterada",
      "Baú com mecanismo oculto",
      "Alarme arcano",
      "Passagem inundável",
    ],
    [
      "sob folhas secas",
      "junto à soleira",
      "no centro de um corredor",
      "atrás de uma decoração",
      "perto do objeto mais valioso",
      "no degrau superior",
      "entre duas colunas",
      "sob uma camada de poeira",
      "num atalho",
      "diante de uma saída",
    ],
    [
      "um ruído metálico denuncia o mecanismo",
      "marcas de reparo revelam onde tocar",
      "uma rota lateral permite contornar",
      "um objeto pesado pode testar o gatilho",
      "a armadilha dispara um alarme",
      "o gatilho fecha a passagem",
      "há instruções parcialmente apagadas",
      "a ameaça separa temporariamente o grupo",
      "o mecanismo pode ser travado com uma cunha",
      "a falha revela uma câmara escondida",
    ],
  ],
  encounters: [
    [
      "Viajante com pressa",
      "Patrulha desconfiada",
      "Caravana parada",
      "Caçador ferido",
      "Mensageiro perdido",
      "Grupo rival",
      "Criatura observando",
      "Artista itinerante",
      "Família em mudança",
      "Explorador exausto",
    ],
    [
      "numa bifurcação",
      "junto a uma ponte",
      "dentro de um abrigo",
      "perto de ruínas",
      "à beira do caminho",
      "num terreno alagado",
      "ao redor de uma fogueira",
      "perto de um marco antigo",
      "numa passagem estreita",
      "diante de uma barreira",
    ],
    [
      "procura uma pessoa desaparecida",
      "esconde um objeto importante",
      "pede uma informação",
      "confunde o grupo com aliados",
      "negocia uma troca",
      "traz uma notícia incompleta",
      "tenta evitar perseguição",
      "oferece uma rota alternativa",
      "protege alguém vulnerável",
      "sabe algo sobre o próximo destino",
    ],
  ],
  rumors: [
    [
      "Um carregamento desapareceu",
      "Uma passagem foi descoberta",
      "Alguém está comprando mapas",
      "Uma figura importante sumiu",
      "Há luzes nas ruínas",
      "Um comerciante mudou de nome",
      "A estrada está sendo vigiada",
      "Uma expedição retornou sem líder",
      "Uma festa foi cancelada",
      "Um visitante procura aventureiros",
    ],
    [
      "segundo uma testemunha",
      "segundo um funcionário",
      "numa conversa de taverna",
      "num bilhete anônimo",
      "entre guardas",
      "no mercado",
      "entre viajantes",
      "no templo local",
      "entre artesãos",
      "numa carta interceptada",
    ],
    [
      "há uma pista verificável",
      "a data está errada",
      "um detalhe foi exagerado",
      "duas fontes discordam",
      "o boato beneficia uma facção",
      "alguém omitiu o motivo",
      "a história está desatualizada",
      "um lugar pode confirmar a história",
      "o nome citado é um apelido",
      "a informação tem uma segunda interpretação",
    ],
  ],
  quests: [
    [
      "Recuperar um objeto",
      "Escoltar uma pessoa",
      "Investigar um sumiço",
      "Entregar uma mensagem",
      "Mapear uma passagem",
      "Mediar uma disputa",
      "Proteger um local",
      "Identificar uma ameaça",
      "Encontrar uma testemunha",
      "Localizar um documento",
    ],
    [
      "para uma comunidade isolada",
      "para um artesão",
      "para uma família",
      "para uma associação",
      "para um viajante",
      "para um pesquisador",
      "para um comerciante",
      "para uma autoridade local",
      "para um antigo aliado",
      "para um desconhecido",
    ],
    [
      "há um prazo curto",
      "outro grupo recebeu o mesmo pedido",
      "a recompensa é um favor",
      "o objetivo mudou de lugar",
      "uma informação está incompleta",
      "há uma solução diplomática",
      "alguém tenta impedir a missão",
      "o caminho oferece uma descoberta",
      "o contratante omitiu um detalhe",
      "a missão expõe um conflito maior",
    ],
  ],
  rooms: [
    [
      "Sala de armazenamento",
      "Biblioteca abandonada",
      "Galeria de estátuas",
      "Oficina silenciosa",
      "Câmara circular",
      "Antiga cozinha",
      "Salão de reuniões",
      "Passagem subterrânea",
      "Observatório",
      "Dormitório vazio",
    ],
    [
      "com sinais de atividade recente",
      "com uma saída bloqueada",
      "com luz entrando por frestas",
      "com água no chão",
      "com marcas na parede",
      "com cheiro de fumaça",
      "com móveis deslocados",
      "com uma janela selada",
      "com uma passagem discreta",
      "com um objeto fora do lugar",
    ],
    [
      "há um bilhete incompleto",
      "pegadas terminam numa parede",
      "um recipiente foi esvaziado",
      "um desenho indica outra sala",
      "um mecanismo ainda funciona",
      "uma peça pode ser reutilizada",
      "um som vem do piso",
      "uma inscrição muda sob outra luz",
      "um objeto pertence a alguém conhecido",
      "uma pista aponta para um perigo",
    ],
  ],
  travel: [
    [
      "Ponte danificada",
      "Estrada bloqueada",
      "Carroça abandonada",
      "Acampamento recente",
      "Desvio desconhecido",
      "Vestígios de perseguição",
      "Passagem estreita",
      "Rio transbordando",
      "Marco deslocado",
      "Abrigo improvisado",
    ],
    [
      "na subida",
      "perto de uma mata",
      "na margem do rio",
      "no caminho principal",
      "junto a uma pedreira",
      "entre colinas",
      "na entrada do vale",
      "após uma bifurcação",
      "perto de um povoado",
      "na rota mais curta",
    ],
    [
      "exige escolher outra rota",
      "revela um caminho antigo",
      "oferece uma pausa segura",
      "há alguém pedindo ajuda",
      "a informação dos mapas está errada",
      "permite seguir um rastro",
      "há uma ferramenta útil esquecida",
      "o atraso afeta um compromisso",
      "o obstáculo pode ser negociado",
      "um detalhe sugere sabotagem",
    ],
  ],
  city: [
    [
      "Festival improvisado",
      "Feira movimentada",
      "Disputa comercial",
      "Busca por desaparecido",
      "Reunião pública",
      "Chegada de viajantes",
      "Greve de trabalhadores",
      "Interdição de rua",
      "Anúncio de recompensa",
      "Mudança de autoridade",
    ],
    [
      "no mercado",
      "na praça",
      "perto dos portões",
      "no bairro dos artesãos",
      "na margem do rio",
      "diante de um templo",
      "perto de uma hospedaria",
      "na sede de uma associação",
      "num bairro afastado",
      "na rua principal",
    ],
    [
      "atrai uma multidão",
      "gera oportunidades de informação",
      "divide opiniões",
      "aumenta a procura por suprimentos",
      "cria uma rota alternativa",
      "envolve um nome conhecido",
      "pode ser resolvido por negociação",
      "revela uma rivalidade",
      "esconde uma segunda intenção",
      "altera a rotina do dia",
    ],
  ],
  complications: [
    [
      "O contato não aparece",
      "O prazo diminui",
      "Uma testemunha muda a versão",
      "A rota fica bloqueada",
      "Uma peça essencial quebra",
      "Um rival chega primeiro",
      "A informação perde validade",
      "Alguém reconhece o grupo",
      "Um aliado pede um favor",
      "O objetivo é transportado",
    ],
    [
      "durante a preparação",
      "antes da chegada",
      "após a negociação",
      "no meio da viagem",
      "no momento da entrega",
      "durante uma pausa",
      "ao começar uma cena",
      "após uma descoberta",
      "quando tudo parecia resolvido",
      "antes do amanhecer",
    ],
    [
      "surge uma pista nova",
      "uma alternativa custa recursos",
      "há chance de negociar",
      "uma pessoa sabe o motivo",
      "a mudança favorece outra facção",
      "a solução exige tempo",
      "um atalho tem um risco evidente",
      "é possível mudar o objetivo",
      "a consequência pode ser adiada",
      "uma escolha define quem será ajudado",
    ],
  ],
  magic: [
    [
      "Luz sem fonte",
      "Eco de uma voz",
      "Sombra deslocada",
      "Símbolo recorrente",
      "Objeto flutuando",
      "Frio localizado",
      "Memória compartilhada",
      "Reflexo diferente",
      "Sussurro numa língua desconhecida",
      "Som impossível",
    ],
    [
      "perto de um objeto antigo",
      "junto a uma inscrição",
      "sob a luz da lua",
      "na borda de uma sala",
      "sobre água parada",
      "num corredor vazio",
      "perto de uma árvore",
      "diante de um espelho",
      "no local de um ritual",
      "em torno de uma porta",
    ],
    [
      "dura apenas alguns instantes",
      "reage a uma palavra",
      "aponta para um lugar",
      "repete uma sequência",
      "revela uma memória incompleta",
      "cessa quando observado de perto",
      "acompanha um objeto",
      "muda conforme a iluminação",
      "pode ser estudado com tempo",
      "anuncia uma alteração no ambiente",
    ],
  ],
  combat: [
    [
      "Cobertura se desloca",
      "Iluminação muda",
      "Fumaça invade o terreno",
      "Passagem se abre",
      "Obstáculo desaba",
      "Água começa a subir",
      "Um som distrai os presentes",
      "Objeto útil fica exposto",
      "Uma saída fica livre",
      "O terreno perde estabilidade",
    ],
    [
      "no centro da cena",
      "numa lateral",
      "perto de uma saída",
      "na posição mais elevada",
      "junto a um aliado",
      "na rota de fuga",
      "atrás de uma cobertura",
      "perto do objetivo",
      "entre dois grupos",
      "num ponto de passagem",
    ],
    [
      "há uma oportunidade de reposicionamento",
      "o risco fica visível antes de agir",
      "uma ação pode estabilizar a situação",
      "os dois lados precisam se adaptar",
      "um objeto do cenário oferece solução",
      "a mudança dura uma rodada narrativa",
      "a área pede uma escolha tática",
      "o objetivo pode ser protegido",
      "surge uma rota de negociação",
      "a ameaça pode ser contornada",
    ],
  ],
  consequences: [
    [
      "Perda de tempo",
      "Recurso consumido",
      "Equipamento avariado",
      "Obrigação assumida",
      "Suspeita pública",
      "Informação revelada",
      "Separação temporária",
      "Dívida de favor",
      "Rota comprometida",
      "Confiança abalada",
    ],
    [
      "diante de uma testemunha",
      "no momento da fuga",
      "após uma promessa",
      "durante uma negociação",
      "num local público",
      "antes de uma viagem",
      "durante o descanso",
      "após uma descoberta",
      "no retorno à cidade",
      "no fim de uma tarefa",
    ],
    [
      "existe uma forma de reparar",
      "um favor pode compensar",
      "a situação abre um gancho",
      "o custo pode ser negociado",
      "há alguém disposto a ajudar",
      "a consequência tem prazo",
      "uma informação reduz o impacto",
      "o grupo escolhe como responder",
      "a consequência pode ser compartilhada",
      "o impacto depende do próximo passo",
    ],
  ],
  shops: [
    [
      "Estoque reduzido",
      "Mercadoria em promoção",
      "Oferta de troca",
      "Encomenda especial",
      "Carga atrasada",
      "Produto com origem suspeita",
      "Ferramenta usada",
      "Serviço disputado",
      "Leilão anunciado",
      "Fornecedor desconhecido",
    ],
    [
      "numa loja pequena",
      "no mercado principal",
      "num balcão improvisado",
      "na feira",
      "num entreposto",
      "perto de uma hospedaria",
      "junto a um armazém",
      "na rua dos artesãos",
      "numa banca itinerante",
      "numa venda de bairro",
    ],
    [
      "o preço pode ser negociado",
      "a oferta termina hoje",
      "é preciso verificar a procedência",
      "o vendedor quer uma informação",
      "há um comprador interessado",
      "o produto exige avaliação",
      "a entrega leva alguns dias",
      "um favor substitui parte do pagamento",
      "o estoque muda ao anoitecer",
      "o vendedor conhece uma alternativa",
    ],
  ],
  descriptions: [
    [
      "Cheiro de madeira úmida",
      "Som metálico distante",
      "Luz dourada nas frestas",
      "Poeira assentada",
      "Vento frio",
      "Perfume de ervas",
      "Marcas de fuligem",
      "Textura áspera",
      "Gotas ritmadas",
      "Som de passos",
    ],
    [
      "na entrada",
      "junto ao teto",
      "perto de uma parede",
      "sob uma mesa",
      "no centro",
      "na saída",
      "atrás de um móvel",
      "na área mais escura",
      "perto da água",
      "ao redor de um objeto",
    ],
    [
      "sugere atividade recente",
      "contrasta com o restante",
      "revela uma mudança de uso",
      "pode orientar uma busca",
      "indica uma passagem de ar",
      "esconde uma pista",
      "é percebido ao parar para observar",
      "muda quando alguém se aproxima",
      "parece vir de outro lugar",
      "aponta para uma história anterior",
    ],
  ],
  oracle: [
    [
      "Sim",
      "Não",
      "Sim, com custo",
      "Não, mas há uma alternativa",
      "Sim, e surge uma oportunidade",
      "Não, e surge uma complicação",
      "Ainda não",
      "Depende de uma escolha",
      "A resposta é incompleta",
      "A pergunta precisa de uma pista",
    ],
    [
      "por causa de uma decisão anterior",
      "por influência de outra pessoa",
      "por uma mudança recente",
      "por uma circunstância local",
      "por um prazo",
      "por um recurso disponível",
      "por um acordo",
      "por uma informação escondida",
      "por uma coincidência",
      "por uma necessidade",
    ],
    [
      "uma testemunha pode esclarecer",
      "um objeto oferece uma pista",
      "o tempo muda a resposta",
      "uma conversa revela o motivo",
      "um risco está aparente",
      "uma escolha altera o resultado",
      "há uma interpretação alternativa",
      "um detalhe foi esquecido",
      "uma consequência pode ser negociada",
      "o próximo passo revela mais",
    ],
  ],
  factions: [
    [
      "Disputa por influência",
      "Busca por informação",
      "Negociação secreta",
      "Recrutamento",
      "Proteção de interesses",
      "Rivalidade interna",
      "Acordo temporário",
      "Escassez de recursos",
      "Mudança de liderança",
      "Expansão territorial",
    ],
    [
      "numa associação local",
      "entre comerciantes",
      "num grupo de estudiosos",
      "entre trabalhadores",
      "numa organização religiosa",
      "num círculo de exploradores",
      "entre autoridades",
      "numa comunidade isolada",
      "entre famílias",
      "num grupo de viajantes",
    ],
    [
      "oferece um trabalho",
      "procura mediadores",
      "esconde uma divisão",
      "cria uma oportunidade",
      "pressiona um aliado",
      "muda relações locais",
      "requer provas",
      "pode ser resolvida por acordo",
      "revela uma dívida antiga",
      "depende de uma informação",
    ],
  ],
  loot: [
    [
      "Bolsa de moedas antigas",
      "Ferramenta bem conservada",
      "Mapa anotado",
      "Carta lacrada",
      "Objeto ornamental",
      "Peça de equipamento usada",
      "Recipiente de ingredientes",
      "Chave sem identificação",
      "Livro de registros",
      "Lembrança de viagem",
    ],
    [
      "junto a um recibo",
      "envolto em tecido",
      "num estojo gasto",
      "numa caixa marcada",
      "sob uma anotação",
      "junto a um símbolo",
      "dentro de um pacote",
      "com um nome gravado",
      "junto a um bilhete",
      "num compartimento falso",
    ],
    [
      "uma pista aponta para o dono",
      "o valor exige avaliação",
      "um detalhe liga a uma missão",
      "há sinais de reparo",
      "a origem pode ser investigada",
      "o conteúdo interessa a um NPC",
      "a recompensa pode ser trocada",
      "há uma informação incompleta",
      "o objeto tem valor sentimental",
      "um detalhe indica outra localização",
    ],
  ],
};
pools.npcs = [
  [
    "Pessoa reservada",
    "Mercador curioso",
    "Artesã experiente",
    "Guarda cansado",
    "Testemunha nervosa",
    "Pesquisador distraído",
    "Viajante animado",
    "Mensageira cautelosa",
    "Mediador paciente",
    "Exploradora desconfiada",
  ],
  [
    "com um mapa dobrado",
    "com roupa de viagem",
    "com uma cicatriz antiga",
    "com anotações na mão",
    "com uma ferramenta incomum",
    "com um distintivo gasto",
    "com um pacote lacrado",
    "com um instrumento musical",
    "com uma capa remendada",
    "com um livro marcado",
  ],
  pools.encounters[2],
];
pools.items = [
  [
    "Lâmina antiga",
    "Anel opaco",
    "Amuleto marcado",
    "Botas gastas",
    "Escudo gravado",
    "Cajado entalhado",
    "Frasco lacrado",
    "Manto bordado",
    "Caixa ornamentada",
    "Luvas manchadas",
  ],
  [
    "de ferro escuro",
    "com inscrição incompleta",
    "de acabamento simples",
    "com um símbolo estranho",
    "de origem desconhecida",
    "envolto em tecido",
    "com um selo antigo",
    "com sinais de reparo",
    "com um nome apagado",
    "de aspecto cerimonial",
  ],
  [
    "precisa de identificação",
    "tem uma história por descobrir",
    "é apenas uma proposta narrativa",
    "pode inspirar um item futuro",
    "a procedência ainda é desconhecida",
    "não possui mecânica definida",
    "exige criação posterior do documento",
    "tem valor a ser definido pela Mestra",
    "aguarda avaliação",
    "pode estar ligado a um rumor",
  ],
];
pools.places = [
  [
    "Ruína",
    "Santuário",
    "Ponte",
    "Torre",
    "Clareira",
    "Entreposto",
    "Caverna",
    "Mirante",
    "Moinho",
    "Arquivo",
  ],
  [
    "junto ao rio",
    "no alto da colina",
    "perto da estrada",
    "dentro de uma mata",
    "na borda da cidade",
    "ao lado de um lago",
    "entre pedras",
    "na entrada do vale",
    "sob a encosta",
    "num antigo caminho",
  ],
  pools.rooms[2],
];
const syllables = {
  common: [
    [
      "Al",
      "Ben",
      "Ca",
      "Da",
      "El",
      "Fa",
      "Ga",
      "Hen",
      "Jo",
      "Lu",
      "Mar",
      "Ni",
      "Or",
      "Pa",
      "Ra",
      "Sa",
      "Te",
      "Vi",
      "Ya",
      "Za",
    ],
    ["an", "ar", "el", "en", "in", "ir", "on", "or", "un", "ur"],
    ["do", "rio", "no", "lio", "mir", "ton", "vel", "ren", "dor", "ric"],
  ],
  draconic: [
    [
      "Ar",
      "Bal",
      "Dra",
      "Ghar",
      "Khar",
      "Kra",
      "Rhaz",
      "Ssar",
      "Thar",
      "Vrax",
      "Xar",
      "Zhar",
      "Brak",
      "Dar",
      "Gar",
      "Kor",
      "Nar",
      "Rhaz",
      "Var",
      "Zor",
    ],
    ["a", "ak", "ar", "az", "ek", "ir", "or", "rak", "ul", "ur"],
    ["dor", "gash", "khan", "kor", "rax", "rion", "thar", "thos", "vax", "zar"],
  ],
  elven: [
    [
      "Ae",
      "Al",
      "Ari",
      "Cele",
      "Eli",
      "Fa",
      "Gala",
      "Ili",
      "Lae",
      "Lira",
      "Mira",
      "Na",
      "Ori",
      "Rae",
      "Sa",
      "Sha",
      "Ta",
      "The",
      "Va",
      "Yli",
    ],
    ["la", "le", "li", "na", "ne", "ni", "ra", "re", "ri", "sa"],
    ["el", "en", "eth", "iel", "ion", "is", "or", "riel", "ris", "wyn"],
  ],
  dwarven: [
    [
      "Bar",
      "Brom",
      "Dar",
      "Dur",
      "Far",
      "Gar",
      "Gim",
      "Gor",
      "Har",
      "Kar",
      "Khor",
      "Mor",
      "Nar",
      "Nor",
      "Or",
      "Ror",
      "Tar",
      "Thor",
      "Tor",
      "Var",
    ],
    ["a", "al", "an", "ar", "da", "di", "ga", "in", "or", "un"],
    ["bar", "dak", "din", "dor", "gar", "grim", "mund", "rik", "son", "var"],
  ],
};
const surnames = [
  "Almeida",
  "Barros",
  "Campos",
  "Dias",
  "Esteves",
  "Faria",
  "Gomes",
  "Lopes",
  "Matos",
  "Neves",
  "Oliveira",
  "Pereira",
  "Reis",
  "Rocha",
  "Santos",
  "Silva",
  "Sousa",
  "Teixeira",
  "Vale",
  "Vieira",
];
function sampleIndex(max, rng) {
  return Math.min(max - 1, Math.floor(rng() * max));
}
export function generate(config, catalog = [], rng = Math.random) {
  const count = int(config.count, 1, 1000, "Linhas"),
    warnings = [],
    rows = [],
    seen = new Set();
  const theme = config.theme ?? "names";
  function add(r) {
    const key = r.uuid || normalize(r.name);
    if (seen.has(key)) return false;
    seen.add(key);
    rows.push({ weight: 1, tags: tags(config.tags), ...r });
    return true;
  }
  if (config.mode === "manual") {
    for (const line of String(config.list ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean))
      add({ name: line, description: "", origin: "manual" });
    if (rows.length !== count)
      warnings.push(
        `A lista tem ${rows.length} entradas únicas; a quantidade final acompanha a lista.`,
      );
    return { rows, warnings };
  }
  if (config.mode === "world") {
    const required = tags(config.requiredTags);
    if (
      theme === "items" &&
      /amaldico|cursed/.test(normalize(config.subject)) &&
      !required.includes("amaldicoado")
    ) {
      required.push("amaldicoado");
      warnings.push(
        "O tema contém “amaldiçoado”: aplicado o filtro de classificação amaldicoado às fontes.",
      );
    }
    const candidates = catalog.filter(
      (d) =>
        (!config.documentType || d.documentType === config.documentType) &&
        (!config.sourceFolder || d.folder === config.sourceFolder) &&
        (!config.search ||
          normalize(d.name).includes(normalize(config.search))) &&
        required.every((t) => d.tags.includes(t)) &&
        (!config.level || d.level == null || d.level <= Number(config.level)),
    );
    if (required.includes("amaldicoado") && !candidates.length)
      warnings.push(
        "Não foram encontrados itens classificados como amaldiçoados nas fontes consultadas.",
      );
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = sampleIndex(i + 1, rng);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (const d of shuffled.slice(0, count))
      add({
        name: d.name,
        uuid: d.uuid,
        img: d.img,
        description: d.description ?? "",
        tags: d.tags,
        level: d.level,
        origin: d.pack ? "compendium" : "world",
      });
    if (rows.length < count) {
      warnings.push(
        `Encontrados ${rows.length} documentos compatíveis para ${count} linhas. ${config.fallback ? "As linhas restantes serão genéricas, sem criar documentos." : "Nenhum documento será inventado; adicione fontes ou habilite o preenchimento genérico."}`,
      );
      if (!config.fallback) return { rows, warnings };
    }
    if (rows.length === count) return { rows, warnings };
  }
  if (theme === "tables" && config.mode !== "world")
    throw Error(
      "Para encadear, escolha tabelas existentes como fonte ou arraste tabelas para as linhas.",
    );
  if (theme === "names") {
    const [a, b, c] = syllables[config.culture] ?? syllables.common;
    let attempts = 0;
    while (rows.length < count && attempts++ < 50000) {
      const base =
        a[sampleIndex(a.length, rng)] +
        b[sampleIndex(b.length, rng)] +
        c[sampleIndex(c.length, rng)];
      const suffix =
        config.gender === "female"
          ? "a"
          : config.gender === "neutral"
            ? ""
            : "";
      const name =
        base +
        suffix +
        (config.surname
          ? " " + surnames[sampleIndex(surnames.length, rng)]
          : "");
      add({
        name,
        description:
          config.purpose === "witness"
            ? "Nome disponível para uma testemunha; nenhuma ficha foi criada."
            : "Nome fictício gerado localmente.",
        origin: "local",
      });
    }
    // Garante o tamanho mesmo com uma fonte de aleatoriedade ruim.
    for (
      let i = 0;
      rows.length < count && i < a.length * b.length * c.length;
      i++
    ) {
      const name =
        a[Math.floor(i / (b.length * c.length))] +
        b[Math.floor(i / c.length) % b.length] +
        c[i % c.length] +
        (config.gender === "female" ? "a" : "") +
        (config.surname ? " " + surnames[i % surnames.length] : "");
      add({
        name,
        description: "Nome fictício gerado localmente.",
        origin: "local",
      });
    }
    return { rows, warnings };
  }
  const recipe = pools[theme] ?? pools.descriptions;
  const combos = [];
  for (let a = 0; a < recipe[0].length; a++)
    for (let b = 0; b < recipe[1].length; b++)
      for (let c = 0; c < recipe[2].length; c++) combos.push([a, b, c]);
  for (let i = combos.length - 1; i > 0; i--) {
    const j = sampleIndex(i + 1, rng);
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }
  const generic =
    config.mode === "world" ||
    ["items", "npcs", "places", "loot"].includes(theme);
  if (generic && !warnings.length)
    warnings.push(
      "São propostas narrativas genéricas; não representam documentos existentes e não criam itens, fichas ou cenas.",
    );
  for (const [a, b, c] of combos) {
    if (rows.length >= count) break;
    const title = `${recipe[0][a]} ${recipe[1][b]}`;
    const name = `${title} — ${recipe[2][c]}`;
    add({
      name,
      description: [
        config.subject ? `Tema: ${config.subject}.` : "",
        recipe[2][c] + ".",
        DIFFICULTIES[config.difficulty]?.consequence ?? "",
        config.dc ? `CD sugerida pela Mestra: ${config.dc}.` : "",
        generic ? "Genérico: mecânica e documento não definidos." : "",
      ]
        .filter(Boolean)
        .join(" "),
      generic,
      biome: config.biome ?? "",
      time: config.time ?? "",
      origin: "local",
    });
  }
  if (rows.length < count)
    throw Error("Não foi possível gerar a quantidade pedida sem repetir.");
  return { rows, warnings };
}
