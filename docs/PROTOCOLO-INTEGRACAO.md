# Protocolo de integração QUEDAÇO

## QUEDAÇO - Tabelas 0.4.0

- ID: `quedaco-tabelas`
- Família: `quedaco`
- `contractVersion`: `1`
- Capabilities: `tableBuilder`, `rollTables`, `documentClimateImport`, `npcRegionalTables`
- Métodos públicos: `open`, `getStatus`, `draw`, `scan`
- Integração opcional reconhecida: módulo `quedaco`, quando sua API pública anuncia `family: "quedaco"` e a capability `npcDatabase`
- Funcionamento independente: criação e edição de RollTables, geradores locais, importação de clima, leitura de documentos do próprio mundo e sorteios continuam disponíveis sem outros módulos

O módulo emite `quedaco:register` no Hook `ready`. A API não expõe documentos inteiros, chaves privadas ou métodos que gravem dados em outro módulo.
