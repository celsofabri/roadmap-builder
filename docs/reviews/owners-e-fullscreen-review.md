# Review: múltiplos responsáveis + Vitest/CI (T0–T7) e tela cheia (T8–T14)

Veredito: APROVADO COM RESSALVAS (nenhum bloqueante; 2 importantes a corrigir antes do merge ou em tarefa registrada)
Data: 2026-10-01 | Revisor: Code Reviewer

Verificações executadas: `npm run lint` (limpo), `npm run build` (tsc -b + vite, ok), `npm test` (16 arquivos, 156 testes, todos verdes).
Não verificado: comportamento em navegador real (DnD/resize, Fullscreen API, impressão), pois a revisão foi por leitura de código e suíte automatizada. Os achados 1 e 2 foram derivados por leitura, sem teste que os reproduza.

## Resumo
A migração `owner`→`owners` é em memória, idempotente, com backup do JSON bruto e sem tocar `updatedAt`; o import reaproveita a mesma dobra e o schema continua estrito. O refactor T9 só extrai views e constantes; a lógica de DnD/resize (`startResize`, sensores) não foi alterada no diff. O hook de tela cheia trata corretamente as corridas enter/close/unmount e remove listeners e efeitos no cleanup. Os problemas reais estão no `OwnersField`.

### 🔴 Bloqueantes
Nenhum.

### 🟡 Importantes

**1. Remover um chip é desfeito pelo commit atrasado do rascunho (estado obsoleto).**
`src/components/shared/OwnerCombobox.tsx:129-135` (handleBlur) + `src/components/shared/OwnersField.tsx:38-41,106` (`onBlurCommit={() => addOwner()}`).
Cenário: owners = [Ana]; o usuário digita "Bob" (sem Enter) e clica no × de "Ana". O clique tira o foco do input e agenda o `setTimeout` de 150 ms, cuja closure capturou o `value` do render anterior (`[Ana]`). `removeOwner` grava `[]`; 150 ms depois o timeout executa `onChange(dedupeOwners([Ana, Bob]))`, e Ana volta junto com Bob. O usuário vê o chip que acabou de apagar reaparecer.
Correção: `addOwner` deve usar o valor atual (ref atualizada a cada render, ou `onChange` funcional/`setOwners(prev => ...)` exposto pelos forms), e não a closure do blur.

**2. Nome digitado e não confirmado é perdido silenciosamente ao salvar o formulário.**
`src/components/shared/OwnerCombobox.tsx:129-135,~75` (cleanup `clearTimeout(blurTimeout.current)` no unmount) + `EpicForm.tsx`/`InitiativeForm.tsx` (submit lê só `owners`).
Cenário: o usuário digita "Carla" no campo e clica direto em "Salvar". O blur agenda o commit em 150 ms, mas o submit roda antes: o modal fecha, o componente desmonta e o cleanup cancela o timeout. O épico é salvo sem Carla e sem aviso.
Correção: no submit, comitar o rascunho pendente (expor `flushDraft` via ref/callback do `OwnersField`, ou elevar o rascunho ao form e mesclá-lo em `owners` ao validar). Fazer o commit de forma síncrona no blur também resolve (a lista de sugestões já usa `onMouseDown preventDefault`, então o atraso não é necessário para o commit). Adicionar teste: digitar, clicar em Salvar, esperar `owners` contendo o nome.

### 🟢 Sugestões

**3. Backup da migração nunca é limpo e duplica o uso de localStorage.** `storageService.ts:14-40`. `OWNERS_BACKUP_KEY` guarda uma cópia integral dos roadmaps legados (incluindo os que o usuário apagar depois) e consome cota; `writeAll` não tem try/catch, então um `QuotaExceededError` futuro estoura no store. Sugiro registrar no README/ADR a remoção manual (ou expirar o backup numa versão futura) e proteger os `write*` com tratamento de erro.

**4. Import legado com `owner: "   "` agora rejeita o arquivo inteiro.** `utils/owners.ts:41-57`. O `mergeLegacyOwner` preserva a entrada em branco "para o schema recusar", mas antes essa string passava (`min(1)`). Arquivos exportados antes da mudança com owner só de espaços falham no import; vale descartar o legado em branco em vez de repassá-lo ao schema.

**5. `FullscreenRoadmap` pode ficar com estado "aberto" sem overlay.** `FullscreenRoadmap.tsx` (`open && !empty`). Se `roadmap.objectives` ficar vazio com o modo aberto, o overlay some, mas `#root` continua `inert`, a classe do body e o fullscreen nativo permanecem. Hoje o modo é somente leitura, então é praticamente inalcançável (exigiria alteração externa ao roadmap); ainda assim, chamar `close()` num efeito quando `empty` torna o hook seguro.

**6. Foco após remover chip.** `OwnersField.tsx:70-77`. O botão × é desmontado ao ser clicado e o foco vai para `body`. Devolver o foco ao input (ou ao próximo chip) ajuda quem usa teclado/leitor de tela.

**7. Camada invertida.** `src/utils/fullscreenFit.ts:1` importa `labelWidthFor` de `components/roadmap/layoutConstants`. Utils não deveriam depender de components; mover `layoutConstants.ts` para `src/utils/` (ou `src/constants/`) elimina o risco de ciclo futuro. Sem impacto funcional hoje.

**8. Workflows.** `ci.yml`/`deploy.yml`: ações fixadas por tag (`@v4`/`@v5`) e não por SHA, sem `timeout-minutes`. A ordem lint→test→build e `permissions` mínimas estão corretas; o deploy bloqueia em teste falho, como no ADR-0002.

### ❓ Perguntas
- Em print, `PRINT_VIEWPORT` (1050x720) é estimativa para A4 paisagem; confirmem com QA numa impressão real, já que o README declara "best effort".

### Pontos verificados sem achado
- Atalho `raw.includes('"owner"')`: não casa `"owners"`; texto de usuário com `"owner"` aparece escapado (`\"owner\"`) e não dispara; falso positivo seria inofensivo. Dados já migrados pulam a varredura.
- Migração: leitura nunca grava; backup só é criado uma vez (não sobrescreve o mais antigo); warn emitido uma vez por carga; `owners` corrupto é descartado sem quebrar a UI.
- `useFullscreenMode`: `enter` síncrono dentro do gesto; `close` idempotente; promise de `requestFullscreen` resolvida após `close` chama `exitNative`; listeners de `fullscreenchange`/`keydown` removidos no cleanup; `inert` restaurado respeitando valor prévio; unmount sai do fullscreen nativo. Esc só fecha a tela cheia sem modal aberto (a pilha de modais é limpa no cleanup do `Modal`).
- T9: `TimelineView`/`TimelineLane`/bars só trocaram tooltip/markup por views compartilhadas e constantes; pointer handlers e dnd-kit intactos.

### Segurança: ok
Sem entrada renderizada como HTML, sem segredos; nomes de responsáveis são texto React. Backup contém só dados do próprio usuário no localStorage.

## HANDOFF
De: Code Reviewer → Para: Dev Frontend
Demanda: Responsáveis múltiplos + Vitest/CI + tela cheia (revisão)
Fluxo: Feature owners-e-fullscreen | Etapa: Code Review
Prioridade: P2

### O que foi feito
- Lint, build e 156 testes executados (verdes); leitura completa de migração, schema, import, OwnersField, useFullscreenMode, FullscreenRoadmap, TimelineSnapshot, refactor T9 e workflows.
- Parecer em `docs/reviews/owners-e-fullscreen-review.md`: APROVADO COM RESSALVAS, 0 bloqueantes, 2 importantes, 6 sugestões.

### O que você precisa fazer
- Corrigir o achado 1 (commit de blur com `value` obsoleto desfaz remoção de chip) e o achado 2 (rascunho perdido ao salvar), ambos em `OwnersField`/`OwnerCombobox`, com testes que reproduzam os dois cenários.
- Avaliar as sugestões 3–8 (registrar em tarefa se não entrarem agora).
- Devolver ao Code Reviewer para re-review rápido; depois segue para QA.

### Artefatos
- docs/reviews/owners-e-fullscreen-review.md
- docs/specs/owners-e-fullscreen.md, docs/design/owners-e-fullscreen.md, docs/adr/ADR-0001..0003

### Decisões tomadas (e por quem)
- Code Reviewer: sem bloqueantes, pois os dois importantes não corrompem dados persistidos (o primeiro desfaz uma edição na tela; o segundo perde um nome ainda não confirmado).

### Suposições (não verificadas)
- Achados 1 e 2 derivados por leitura de código, sem execução em navegador.
- DnD/resize sem regressão com base no diff (lógica intocada); não testado manualmente.

### Riscos / atenção
- Fullscreen API e impressão dependem de navegador real (Safari/iOS, A4); QA deve cobrir.

### Critério de aceite deste handoff
- Testes novos para os achados 1 e 2 passando; lint/build/test verdes; re-review sem pendências importantes.

## Correções

Data: 2026-10-01 | Autor: Dev Frontend. Cada item teve teste escrito antes (8 testes vermelhos confirmados) e verde depois.

- **Achado 1 (importante) Remoção de chip desfeita:** o blur do `OwnerCombobox` não usa mais `setTimeout` de 150 ms; o commit do rascunho é síncrono. O atraso era desnecessário (as sugestões usam `onMouseDown preventDefault`, então clicar nelas não dispara blur). Sem commit tardio, não há closure obsoleta: o clique no × já enxerga a lista com o rascunho. Teste: `OwnersField.test.tsx` (`[Ana]` + digitar "Bob" + remover Ana + esperar 250 ms => só Bob).
- **Achado 2 (importante) Rascunho perdido ao salvar:** mesma correção (blur síncrono dispara antes do click de Salvar; React processa o update do blur antes do submit). Vale para Epic, Initiative e Objective, pois todos usam `OwnersField`. O teste do Epic que fixava a perda (`['Ana Souza']`) passou a esperar `['Ana Souza', 'Carla']`, porque a perda era o defeito documentado, não comportamento desejado. Novos testes em Initiative e Objective. O teste "Enter não submete o form" segue intacto e verde.
- **Achado 4 (sugestão) `owner: "   "` legado:** `mergeLegacyOwner` trata string em branco como ausente (não rejeita mais o arquivo). Testes em `owners.test.ts` e `importExport.test.ts`. Blank dentro de `owners: ['']` continua sendo rejeitado (contrato O13 preservado).
- **Achado 5 (sugestão) FullscreenRoadmap vazio com modo aberto:** efeito chama `close()` quando `open && empty`, restaurando inert, classe do body e fullscreen nativo. Teste com rerender para roadmap sem objetivos.
- **Achado 6 (sugestão) Foco após remover chip:** `removeOwner` foca o input do campo (`document.getElementById(id)`). Teste confirma o foco.
- Não alterados (fora do escopo pedido): achados 3 (backup/quota), 7 (camada invertida) e 8 (workflows) do parecer original; seguem como sugestões a registrar em tarefa.

Verificação: `npm run lint` limpo, `npm run build` ok, `npm test` verde (ver HANDOFF abaixo).

## Re-review

Data: 2026-10-01 | Revisor: Code Reviewer | Escopo: correções dos achados 1, 2, 4, 5 e 6.
Verificações: `npm run lint` limpo, `npm run build` ok, `npm test` 16 arquivos / 163 testes verdes (eram 156).

**Veredito: APROVADO** (sem bloqueantes e sem importantes pendentes; 3 nits abaixo, opcionais).

### Achados 1 e 2 (blur síncrono)
- Fluxos que dependiam do atraso de 150 ms: nenhum. Clique em sugestão/"Usar ..." com mouse não tira o foco (`onMouseDown preventDefault`), então não há blur concorrente com o `select`. Enter e Escape não passam por blur. Tab comita o rascunho, como antes, só que sem atraso.
- Remover chip com rascunho pendente: o mousedown dispara o blur, que comita e re-renderiza antes do click; o click no × usa o `value` atualizado e resulta em só Bob. O teste (espera 250 ms, `onChange` final `['Bob']`) falharia com o código antigo, portanto é válido.
- Salvar com rascunho: o blur do mousedown em "Salvar" comita antes do click/submit. Cobertos Epic, Initiative e Objective.
- Mudança do teste que fixava a perda (`['Ana Souza']` -> `['Ana Souza', 'Carla']`): legítima. O teste documentava o defeito do achado 2, não um requisito; o comentário no teste explica o histórico. O teste de Enter não submeter permanece.

### Achados 4, 5 e 6
- 4: `mergeLegacyOwner` trata owner legado em branco como ausente; `owners: ['']` continua rejeitado pelo schema. Correto.
- 5: efeito `open && empty -> close()` correto; `close` é idempotente e o hook cobre inert/classe/fullscreen nativo.
- 6: foco devolvido ao input após remover. Teste presente.

### 🟢 Nits (opcionais, não bloqueiam)
- O foco programático em `removeOwner` dispara `onFocus -> setOpen(true)`, então o dropdown de sugestões reabre após remover um chip (inclusive pelo teclado). Inofensivo, mas pode surpreender; se incomodar, focar sem abrir (flag) ou ignorar o foco originado em `removeOwner`.
- O blur agora comita também ao trocar de aba/janela com rascunho digitado (antes também ocorria, após 150 ms). Comportamento aceitável, só registro.
- Se o commit do blur fizer o layout dos chips deslocar o × alvo entre mousedown e mouseup (quebra de linha), o click pode errar o botão. Improvável; sem ação.

Pendências herdadas (3, 7, 8) seguem como sugestões a registrar em tarefa; não afetam o veredito. Liberado para QA.

## Re-review B1/B2 (Code Reviewer, 2026-10-01)

Veredito: ✅ APROVADO (com 2 sugestões não bloqueantes)

Verificação: `npm run lint` limpo, `npm run build` ok, `npm test` 16 arquivos / 165 testes verdes.

### B1 (lista cobrindo Salvar / Esc / foco ao remover chip)
- Esc: o `onKeyDown` do React (delegado em `document.body`, container do portal) roda antes do listener nativo de `document` do `Modal`, então o `preventDefault` do combobox chega a tempo; o teste novo cobre isso. `Modal` só ignora Esc com `defaultPrevented`; a checagem da `modalStack` (só o topo reage) continua intacta, logo modais empilhados (ConfirmDialog sobre outro modal) não regridem. Esc fora do combobox ou com a lista fechada/sem opções (`open && totalOptions > 0`) não chama `preventDefault`, então fecha o modal normalmente. O Esc do fullscreen (`useFullscreenMode`) já cede enquanto há modal aberto; sem mudança.
- `onExtraKeyDown` roda antes e só trata `,`/Backspace; sem conflito. Nenhum outro handler de Esc depende de `defaultPrevented` (Sidebar/WorkspaceSwitcher são locais).
- `suppressOpenOnFocusRef`: o `focus()` dispara o `onFocus` do React de forma síncrona, então ligar/desligar a ref em torno da chamada funciona (teste vermelho antes, verde depois). Opcional; os demais consumidores (ObjectiveForm via `OwnersField`, Épico, Iniciativa) são compatíveis. O formulário de membros não usa o `OwnerCombobox`.
- Mudança visual (lista no fluxo, empurra o rodapé, painel rola): aceitável. Troca sobreposição por deslocamento de layout previsível, resolve o bug real (Salvar inclicável) e a lista é limitada a 11rem. O `box-shadow` virou decorativo, inofensivo.

### B2 (flex-wrap nos rodapés)
- `flex-wrap: wrap` só tem efeito quando o conteúdo estouraria a linha; em desktop (30rem/38rem) os rodapés de Roadmap, Objetivo, Workspace, Membro, Épico e Iniciativa cabem em uma linha, sem mudança. Com `formActionsSpread`, o wrap mantém "Excluir" à esquerda e o grupo à direita (`justify-content: flex-end`). Sem regressão identificada.

### 🟢 Sugestões (não bloqueantes)
1. Ao abrir a lista perto do fim do painel, nada rola a lista para a vista; considerar `scrollIntoView({ block: 'nearest' })` na lista ao abrir (principalmente em celular/teclado virtual, já listado como não testado).
2. Itens "Não verificado" do QA (modais de equipe/workspace e Importar a 320px, Safari/Firefox, leitor de tela) seguem abertos; baixo risco, pois usam as mesmas classes.

### Segurança: ok (sem mudança de superfície).
