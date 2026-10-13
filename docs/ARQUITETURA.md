# Referência técnica

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| src/core.mjs | Validação, distribuição discreta de dados, alocação de faixas, probabilidades, filtros, JSON e CSV. Sem Foundry. |
| src/generators.mjs | Temas, nomes e receitas narrativas; seleção de fontes e preenchimento genérico. Sem Foundry. |
| src/catalog.mjs | Consulta a coleções e índices dos compêndios escolhidos; normaliza documentos em registros. |
| src/foundry.mjs | Criação/edição de RollTable, vínculos, sorteio com contexto, histórico, recursão, ações e exportação. |
| src/app.mjs | ApplicationV2, criador, editor, biblioteca e diálogos. |
| src/main.mjs | Botões no diretório e nos controles de cena; API pública. |
| styles/tables.css | Identidade visual em verde, papel claro e bronze; formulário e prévia com rolagens independentes. |
| tests/ | Probabilidades, geração, fontes, persistência simulada, encadeamento e DOM. |
| tools/preview.* | Navegador de QA com coleções fictícias; nunca toca no mundo. |

## Schema confirmado contra Foundry local v13

Lido em `C:/Program Files/Foundry Virtual Tabletop/resources/app/common/documents/roll-table.mjs` e `table-result.mjs`, e APIs cliente correspondentes em `client/documents/`.

RollTable: name, img, description, results, formula, replacement, displayRoll, folder, ownership, flags. TableResult v13: type **text/document**, **name**, description, **documentUuid**, img, weight (inteiro positivo), range (dois inteiros ordenados), drawn e flags. Campos antigos text, documentCollection e documentId não são usados.

RollTable.normalize muda a fórmula para 1d da soma dos pesos; o criador calcula faixas por conta própria para preservar o dado escolhido. Draw nativo aceita resultados recursivos, mas não conhece filtros do Quedaço. O sorteio adicional usa a massa de probabilidade real de cada faixa, condicionada aos candidatos disponíveis, e comunica isso no chat.

ApplicationV2 recebe HTML em _renderHTML e insere via _replaceHTML. DialogV2 fornece callbacks (event, button, dialog), evento render e opção form.closeOnSubmit. ImagePopout recebe options.src e options.window.title.

## Dados próprios

- `flags.quedaco-tabelas.schema`: versão do contrato (1).
- `.config`: preferências e avisos do criador.
- `.favorite`: favorito da biblioteca.
- `.history`: até 500 registros de data, usuário, sessão, IDs e nomes sorteados.
- TableResult `.flags.quedaco-tabelas`: tags, level, biome, time, quantity, action, media, macro, generic e origin.
- Documento de origem `.flags.quedaco-tabelas.tags`: classificação opcional para catálogo.

JSON de intercâmbio: `{format:'quedaco-tabelas',schema:1,config,rows}`. CSV é um subconjunto dos dados. A prévia não cria documentos até salvar. Geração nunca cria Item, Actor nem Scene.

O sorteio adicional acumula planos das tabelas envolvidas antes de gravar marcação/histórico. Ciclos e fontes ausentes são recusados antes do commit. Em falha de persistência, tenta restaurar o estado das tabelas já tocadas. Fila de sorteios por tabela é local ao cliente; coordenação entre múltiplas sessões da Mestra ainda não é distribuída. Ações de macro são opcionais e não fazem parte da recuperação do histórico.

## Extensões

Manter geradores separados de ações: gerar uma descrição não equivale a alterar o mundo. Adaptadores de Skyfall, clima, quests, tokens ou IA precisam de módulos opcionais e contrato estável. Testes não devem criar documentos no mundo oficial. Arquivos do sistema, compêndios privados e texto de livros não são redistribuídos.
