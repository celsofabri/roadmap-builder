# ADR-0001: Responsáveis de épico e iniciativa passam a `owners: string[]`

- **Status:** Aceita (decisão do Arquiteto dentro da stack atual; sem nova tecnologia)
- **Data:** 2026-10-01
- **Relacionados:** `docs/design/owners-e-fullscreen.md` (seção 1), `docs/specs/owners-e-fullscreen.md` (Item 1)

## Contexto

`Epic` e `Initiative` têm um único `owner?: string`; `Objective` já tem `owners?: string[]`. O produto precisa de 0..N responsáveis por épico/iniciativa. Os dados vivem no `localStorage` (lidos por `storageService.readAll` com `JSON.parse` + cast, sem validação) e em JSONs exportados que circulam entre pessoas (validados por Zod, que **descarta chaves desconhecidas**). Não existe campo de versão de schema. Cada push em `main` publica automaticamente, e não há como migrar dados no servidor.

## Decisão

1. O campo passa a ser `owners?: string[]` em `Epic` e `Initiative` (mesmo nome e forma de `Objective`). `owner` deixa de existir no tipo e nunca mais é gravado nem exportado.
2. **Migração na leitura, em memória** (`migrateRoadmapOwners`, pura, idempotente, leniente): `owners = dedupe([owner, ...owners])`, `owner` removido, `[]` vira ausente, `updatedAt` intocado. Nada é gravado na leitura.
3. **Backup único** da chave crua em `roadmap-builder:roadmaps:pre-owners-backup` quando a primeira leitura encontra `owner` legado (nunca sobrescreve; falha de cota é ignorada).
4. **Import:** `mergeLegacyOwner` antes do `roadmapSchema` (aceita arquivo antigo, novo e misto, com `owner` legado primeiro); o schema novo é estrito (`owners` inválido gera o erro atual com caminho). `ownersSchema` aplica trim, dedupe case-insensitive e vazio→ausente, **apenas** a épico/iniciativa (o schema do objetivo não muda).
5. **Sem dual-write** e sem versionamento explícito de schema neste momento.
6. Sem limite de quantidade no dado; ordem de inserção preservada; sem "principal".

## Alternativas rejeitadas

- **Manter `owner` e adicionar `owners`:** dois campos vivos para sempre, precedência em todo consumidor, export ambíguo.
- **Dual-write (`owner = owners[0]`):** facilita rollback, mas faz o export novo conter `owner` (contraria a spec) e perpetua a dívida.
- **IDs de membro em vez de nomes:** resolve rename/remoção, mas está fora de escopo e exige mexer em combobox e store.
- **Versão de schema + migração com gravação em lote no boot:** correto a longo prazo, porém grava dados do usuário sem ele ter editado nada, piorando o rollback. Fica como evolução se surgirem novas migrações.

## Consequências

**Positivas**
- Um único modelo por nível, consistente com `Objective`; UI e componente compartilhados (`OwnersField`, `OwnerAvatarStack`).
- Rollback de código não destrói dado (a leitura não grava; a versão antiga preserva `owners` por spread; backup disponível).
- Migração é função pura, totalmente testável.

**Negativas / dívidas**
- Na prática a **1ª gravação de qualquer roadmap migra todos** (porque `writeAll` regrava o array inteiro); o backup mitiga.
- Após rollback de código, a versão antiga não **exibe** os responsáveis de épico/iniciativa (dado preservado); preferir roll-forward.
- JSON novo importado numa versão antiga perde `owners` em silêncio (Zod antigo); só ocorre após rollback.
- Nomes continuam texto livre: renomear/remover membro do time não propaga (dívida registrada, Q-O4).
- A chave de backup e o ramo de leitura de `owner` precisam ser removidos numa release futura.
