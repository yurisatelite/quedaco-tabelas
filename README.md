# Quedaço - Tabelas

Criador independente de tabelas para Foundry VTT 13. Funciona sem QUEDAÇO, sem Skyfall e sem conexão com API.

## Instalação

Manifest: https://github.com/yurisatelite/quedaco-tabelas/releases/latest/download/module.json

Instale e ative o módulo no mundo. Abra **Quedaço - Criar tabela** na aba Tabelas ou use o botão de tabela nos controles de tokens. A criação é uma ferramenta da Mestra. Não abre uma janela automaticamente ao iniciar o mundo.

## Fluxo

1. Escolha o tema: nomes, clima, armadilhas, encontros, itens, NPCs, rumores, missões, exploração, viagem, cidade, complicações, magia, combate, consequências, comércio, descrições, oráculo, locais, facções, recompensas, tabelas encadeadas ou lista livre.
2. Escolha o dado e o tamanho. Selecionar D20 pede 20 linhas; D100 pede 100. A fórmula personalizada aceita NdS e bônus, como 2d6+1. Número de linhas e fórmula também podem ser ajustados separadamente.
3. Escolha gerar localmente, consultar conteúdo existente ou colar uma lista. Revise os resultados e as chances reais na prévia.
4. Escolha uma pasta existente de Tabelas ou dê o nome de uma nova pasta. Clique em Criar tabela no Foundry.
5. Ela fica salva como RollTable nativa na pasta. Volte ao criador para criar mais tabelas, ou use a Biblioteca para editar, duplicar, favoritar ou sortear.

A prévia só vira documento ao salvar. As tabelas criadas continuam com texto, vínculos, fórmula e faixas nativas mesmo com o módulo desativado. Recursos adicionais do Quedaço precisam do módulo ativo.

## Fontes e geração

- **Nomes:** combinações locais de sílabas, com estilos humano/fantasia, dracônico, élfico e anão, variações masculinas, femininas e neutras, sobrenomes opcionais e uso como testemunha. São nomes fictícios; não reproduzem listas oficiais do cenário. A variação feminina acrescenta uma terminação; masculino e neutro usam a base.
- **Temas narrativos:** combinações de modelos originais (situação + local/detalhe + consequência). Produzem conteúdo novo ao gerar; não instalam tabelas prontas no mundo.
- **Dificuldade:** muda a orientação das consequências narrativas. CD é um valor opcional escolhido pela Mestra. Nenhum dano, condição ou regra de sistema é aplicado automaticamente.
- **Tema/orientação:** registra o pedido e o inclui nas descrições. Não é um interpretador de linguagem natural. O termo “amaldiçoado” no tema de itens ativa explicitamente o filtro dessa classificação.
- **Documentos:** consulta itens, atores, cenas, diários e tabelas existentes. Fontes padrão são do mundo. Compêndios só entram quando você os marca. Filtre por tipo, pasta exata, nome, tags e nível máximo (quando há nível disponível). Pasta de origem não inclui subpastas automaticamente.
- **Classificação de itens amaldiçoados:** consulta tags do documento, descritores e indícios no nome. Não certifica mecânicas de maldição. Uma tag manual pode ser guardada em `flags.quedaco-tabelas.tags` no documento de origem.
- **Fontes insuficientes:** exibe a quantidade encontrada. Com preenchimento genérico habilitado, completa com texto narrativo identificado como genérico; caso contrário, mantém só os documentos encontrados. Não cria Item, Actor ou Scene, nem inventa um UUID. O aviso também fica na descrição da tabela salva.

## Editor e probabilidades

Resultados têm texto, descrição, peso, faixas, vínculo de documento, imagem, tags, nível, bioma, hora, fórmula de quantidade/duração e ação opcional. Arraste itens, atores, cenas, diários ou outras tabelas para a prévia.

Faixas iguais distribuem os totais possíveis. Pesos relativos distribuem faces disponíveis de forma aproximada, reservando pelo menos um total para cada linha. O editor mostra a probabilidade efetiva, não promete que peso relativo seja uma porcentagem exata. D20 com 20 linhas não tem faces livres para diferenciar pesos: use um dado maior. Em 2d6, os totais centrais são mais comuns. Faixas manuais devem estar ordenadas, cobrir todo o dado e não se sobrepor.

Importe ou exporte JSON completo, CSV (name, description, weight, tags, uuid) e listas de texto. CSV aceita vírgulas, aspas e quebras de linha. JSON guarda configuração e metadados. UUIDs importados precisam existir no mundo de destino para salvar. As páginas da prévia mostram 50 linhas; limite por tabela: 1.000.

## Sorteios e histórico

Use **Biblioteca → Sortear** para os recursos adicionais: quantidade, visibilidade do chat, tags, nível, bioma, hora, sessão e ações opcionais. Sorteios respeitam a massa de probabilidade das faixas e a redistribuem entre candidatos permitidos pelo contexto. O chat explica o critério; o sorteio adicional não simula uma animação de dados. Para rolagens de dado nativas, use o editor nativo do Foundry.

Modos: repetir normalmente; sem repetir até resetar; evitar uma quantidade recente; não repetir na sessão informada. O histórico guarda até 500 sorteios por tabela, e pode ser consultado no diálogo de sorteio, baixado em JSON ou salvo em um diário privado. Resetar limpa a marcação de resultados e o histórico. Controle persistente de repetição exige que a Mestra ou o dono faça o sorteio.

Tabelas encadeadas usam documentos de RollTable existentes. O sorteio consolida os resultados no chat e bloqueia ciclos e mais de seis níveis. A fórmula de quantidade informa um número; não entrega moedas, itens ou dano.

Ações disponíveis: abrir documento, mostrar imagem, tocar áudio local ou executar uma macro com confirmação. Ações ficam desabilitadas até a Mestra marcar a opção no sorteio. O botão nativo de rolar do Foundry não executa ações, filtros ou histórico do Quedaço. Compartilhar uma tabela libera seus resultados e metadados; use chat privado para sorteios que não queira anunciar.

## Estado da versão 0.1.0

Inclui o criador, geradores locais, consulta de fontes, editor, tabelas nativas, importação/exportação, biblioteca e sorteio com contexto. É a primeira base instalável para calibrar e expandir, não a implementação final de todas as automações discutidas.

Não inclui API de IA, criação de itens ausentes, efeitos de sistema, entrega automática de recompensas, criação automática de tokens, clima persistente de cena, alterações automáticas de relógio, exportação de mídia, gráfico visual de encadeamento ou acompanhamento automático de quests. Macros existentes podem oferecer integrações opcionais. O plano completo está em [docs/PLANO.md](docs/PLANO.md).

Verificação: testes Node de probabilidades, geração, fontes, persistência simulada, recursão e interface DOM; conferência visual em navegador usando o mesmo código da interface com dados fictícios. Ainda precisa da conferência final dentro de uma sessão real de Foundry. Nenhum documento do mundo oficial foi criado ou alterado durante os testes.

## Desenvolvimento

`npm ci`, `npm test`, `npm run package`. O ZIP em `dist/quedaco-tabelas.zip` tem module.json na raiz. A versão instalada não precisa de npm nem das dependências de teste.

API: `game.modules.get('quedaco-tabelas').api.open()`, `.api.scan({packs:[]})` e `.api.draw(table, options)`. Desenho interno e schema conferido: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
