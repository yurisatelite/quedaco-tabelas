# Quedaço - Tabelas: escopo e evolução

Objetivo: construir tabelas sob demanda, salvar na pasta de tabelas do mundo e reutilizar o criador. O módulo é independente; conteúdo narrativo é gerado por modelos, conteúdo mecânico exige documentos existentes. API externa é opcional e não pode ser requisito do fluxo principal.

## Base entregue em 0.1.0

- Assistente visual com temas, fórmula, tamanho, dificuldade narrativa, fontes, prévia, pasta e salvamento.
- 23 temas e lista livre. Nomes por sílabas e situações por combinação de três componentes.
- Documentos do mundo e compêndios explicitamente escolhidos. Ausência de conteúdo é exposta; fallback em texto sem criar documentos.
- Probabilidades efetivas, pesos, faixas completas, fórmulas NdS e modificador fixo.
- Editor de resultados com vínculos, tags, contexto, quantidade/duração, mídia e ação opcional.
- Biblioteca com busca, favoritos, edição, duplicação e editor nativo.
- JSON, CSV e texto. Sorteios com contexto, controle de repetição, histórico e recursão limitada.
- Ações simples; integração complexa por macro existente e confirmada.

## Próxima calibração do criador

1. Conferir instalação e criação real de D20 de nomes, D100 de nomes, 2d6 de clima e tabela de documentos.
2. Validar pasta nova/existente, edição de tabela nativa e reset de histórico.
3. Ajustar tamanho da interface, vocabulário, estilos de nomes, coerência das combinações e presets de dificuldade.
4. Aperfeiçoar classificação e fontes: seleção de documentos individuais, busca textual mais rica, pastas recursivas, tags editáveis na fonte e critérios específicos de cada sistema.
5. Adicionar filtros de categoria, reordenação, duplicação de linha e seleção de resultados favoritos.

## Conteúdo e geradores especializados

- Armadilhas: gatilho, pista, desarme, risco, etapas, duração e consequência; regras de sistema só quando houver uma fonte verificável.
- Clima: bioma, estação, intensidade, duração, progressão e impacto narrativo.
- Encontros: tipo, intenção, terreno, complicação e vínculos com criaturas reais.
- Loot: pacotes de moedas, itens, pistas, origem, raridade e condição; itens reais só por UUID.
- NPCs: nome, aparência, voz, profissão, desejo, segredo, relações e reações; descrição pode existir sem ficha.
- Lojas: oferta, demanda, escassez, estoque e encomendas. Integração opcional futura com Quedaço NPCs de venda.
- Exploração: salas, portas, pistas, caminhos, obstáculos e recursos.
- Cidade/região: eventos, rumores, política, comércio e mudanças locais.
- Missões: objetivo, contratante, prazo, complicação, recompensa e alternativas.
- Combate: ambiente, tática, mudança de terreno e oportunidades sem impor regras inventadas.
- Magia: presságios, manifestações, rituais e consequências narrativas.
- Nomes: culturas customizáveis, léxicos de usuário, localidades, tavernas, organizações, navios, sobrenomes e títulos.
- Oráculo e interpretação: respostas, emoções, atitudes, sinceridade e opções de reação.

## Automação por adaptadores

Cada integração precisa de operação própria, permissões, prévia do que será alterado e recuperação em caso de falha. Não transformar texto genérico em item funcional automaticamente.

- Entregar item e moedas, aplicar condição/efeito, criar token, abrir/ativar cena.
- Tocar playlist, exibir imagem para jogadores e mídia adicional.
- Associar clima a Scene e alterar horário somente com integração de calendário definida.
- Criar e atualizar quests via módulo opcional.
- Estado de campanha: estoque, rumores descobertos, facções, alerta, investigação e resultados removidos.
- Rolar perícia, solicitar escolha, combinar respostas e produzir uma mensagem consolidada.

## Motor avançado

- Grafo visual de sub-tabelas, componentes e interpolação de frases.
- Regras condicionais estruturadas (sem eval de código), contexto de Scene/Actor e consequência de resultado anterior.
- Melhor/pior de N, vantagem/desvantagem, orçamento de tesouro, resultados adaptativos e curvas de raridade.
- Controle de repetição por sessão, campanha, jogador e janela temporal; histórico auditável e operações de desfazer.
- Receitas de geradores exportáveis e compartilháveis, pacotes opcionais e migração de schema.

## IA opcional

Não está conectada em 0.1.0. Primeiro definir um adaptador de provedor com contrato JSON validado: tema, dado, tamanho, contexto, conteúdo disponível e resultados. Mostrar custo/limites do provedor e escolher explicitamente o que pode ser enviado. Chave não deve ir ao repositório nem às flags compartilhadas do mundo. Falha da API preserva modos local, manual e de fontes. A saída da IA passa pela mesma prévia e validação; UUIDs precisam ser confirmados, e itens genéricos continuam sendo texto.

Alternativa que já funciona: preparar uma lista ou JSON fora do módulo e importar. Isso não exige provedor, conta ou API no Foundry.
