# Especificação: múltiplos responsáveis (épico/iniciativa) e modo tela cheia do roadmap

- **Autor:** Product Analyst | **Fluxo:** Evolução de feature (fluxo 2) | **Prioridade:** P2
- **Destinatário:** Arquiteto (depois QA valida testabilidade)
- **Base:** código real lido em `src/` (referências `arquivo:símbolo` ao longo do texto). Onde não verifiquei, está marcado como suposição.

## 0. Estado atual relevante (o que o código faz hoje)

Fatos verificados que moldam as duas demandas:

1. **Épico e iniciativa têm um único `owner?: string`** (`src/types/roadmap.types.ts`, `Epic.owner`, `Initiative.owner`). **Objetivo já tem `owners?: string[]`** (`Objective.owners`) com UI multi-seleção pronta (`ObjectiveForm.tsx`: chips, `addOwner` com dedupe case-insensitive, vírgula para adicionar, Backspace remove o último, `OwnerCombobox` com `collapseWhenFilled={false}`, `excludeNames`, `onBlurCommit`). Ou seja, existe precedente de modelo e de UX dentro do próprio produto.
2. **Responsável é texto livre, não ID.** `OwnerCombobox` sugere membros do time (`teamMemberStore`), mas aceita nome não cadastrado ("Usar “X”"). A foto é resolvida por nome, case-insensitive (`findMemberPhoto`). `deleteMember` e `updateMember` **não** propagam para roadmaps: remover ou renomear um membro deixa o nome nos épicos como texto órfão, exibido com iniciais coloridas (`OwnerAvatar` + `ownerColor`).
3. **Persistência sem validação na leitura.** `storageService.readAll()` faz só `JSON.parse` + cast para `Roadmap[]`. Zod só roda no formulário e no import (`importService` -> `roadmapSchema`). O schema Zod usa `z.object` padrão, que **descarta chaves desconhecidas**: um JSON antigo com `owner` importado num schema que só tenha `owners` perderia o responsável em silêncio.
4. **Onde `owner` é consumido:** `EpicForm`, `InitiativeForm` (combobox simples), `EpicBar` e `InitiativeBar` (um `OwnerAvatar` de 18px/16px dentro da barra + linha "Responsável: X" no tooltip), `RoadmapDetail.tsx` (lista: `InitiativeRow`, `EpicCard`, avatar 18px), `seedData.ts`, `roadmapStore.ts` (`EpicInput`, `InitiativeInput`), `roadmap.schema.ts`. `cloneRoadmap.ts` e `exportService.ts` apenas espalham/serializam o objeto (não citam `owner`).
5. **Toggle "Responsáveis"** (`RoadmapDetail.tsx`, `showOwners`, localStorage `roadmap-builder:show-owners`) oculta todos os responsáveis na timeline e na lista; já vale para objetivos.
6. **Timeline:** `TimelineView.tsx` calcula `dayWidth = max(MIN_DAY_WIDTH[granularidade], largura_disponível / totalDays)` com `MIN_DAY_WIDTH = { monthly: 5, weekly: 14, daily: 56 }` px por **dia útil** (`rangeSpanBusinessDays`; fins de semana não existem na grade). `.scrollArea` tem `overflow-x: auto` -> **rolagem horizontal aparece** quando `totalDays * mínimo + labelWidth` excede o contêiner (ex.: período de 12 meses ≈ 261 dias úteis x 5px = 1305px + 220px de rótulo). Rótulo de raia: 220px (150px abaixo de 768px). Altura **dirigida por conteúdo**: cada épico = `epicBarSlot` 36px + faixa de iniciativas; iniciativas sobrepostas empilham via `packIntoRows` (linha 24px + 4px de gap, `INITIATIVE_ROW_H`/`INITIATIVE_ROW_GAP` em `TimelineLane.tsx`). A rolagem vertical vem do `.content { overflow-y: auto }` em `App.module.scss` (o shell é `100dvh`, `overflow: hidden`).
7. **Interações que dependem de coordenadas reais** (dnd-kit com modifier de snap por `dayWidth`, resize por `pointermove` em `EpicBar`/`InitiativeBar`): não são seguras sob escala/transform visual.
8. **Não há `@media print` nem Fullscreen API** em `src/` (busca por `print`/`@media` só achou breakpoints e `hover: none`). **Não há runner de testes** em `package.json` (scripts: dev, build, lint, preview). Os critérios abaixo precisam ser verificáveis manualmente ou por E2E/unit se o Arquiteto introduzir um runner (decisão dele).
9. **Esc:** `Modal.tsx` usa uma pilha (`modalStack`) para fechar só o modal do topo ao apertar Esc. `OwnerCombobox` trata Esc para fechar a lista de sugestões.
10. README diz granularidade "mensal ou semanal", mas o código tem também **diário** (`Granularity = 'monthly' | 'weekly' | 'daily'`). Não é escopo, só registro para docs.
11. **Não há telemetria/analytics** (app 100% client-side, sem back-end). Métrica de sucesso é, portanto, qualitativa/funcional.

---

# Item 1 - AJUSTE: mais de um responsável por épico e por iniciativa

## 1.1 Problema, resultado, métrica

**Problema:** épicos e iniciativas costumam ter mais de uma pessoa à frente (par de dev, dev + design, tech lead + PM). Hoje só cabe um `owner`; o usuário escolhe uma pessoa e perde a informação das outras, ou digita "Ana e Bruno" num único campo, o que quebra avatar, foto e consistência com a lista de membros. Objetivos já aceitam vários, então o produto é inconsistente entre níveis.

**Persona afetada:** quem planeja e apresenta o roadmap (líder/PM/Eng Manager) e quem consome (time, stakeholders).

**Resultado esperado:** épico e iniciativa aceitam 0..N responsáveis, com a mesma UX que o objetivo já tem, visíveis na timeline, na lista e no tooltip, sem perder nenhum dado existente.

**Métrica de sucesso (sem telemetria):** (a) 100% dos roadmaps pré-existentes abrem com os responsáveis intactos após a mudança (verificável com o seed e um JSON antigo); (b) criar um épico com 2+ responsáveis em até 1 formulário, sem digitar nomes compostos.

## 1.2 Escopo

**Inclui**
- Campo "Responsáveis" (0..N) em `EpicForm` e `InitiativeForm`, com o mesmo comportamento do `ObjectiveForm`.
- Exibição de todos os responsáveis em: barra do épico, barra da iniciativa (timeline), cartões da lista (`EpicCard`, `InitiativeRow`), tooltips.
- Compatibilidade com dados legados (`owner` único no localStorage e em JSON exportado antes) e com import/export.
- Atualização do seed (`seedData.ts`) para exercitar 2+ responsáveis em épico e iniciativa.
- Respeito ao toggle "Responsáveis" existente.

**Não inclui** (ver seção 3): filtro/busca por responsável, papéis (RACI), responsável "principal" explícito, limite por permissão, propagação de rename/remoção de membro, mudança de objetivo (já é multi), responsáveis por roadmap.

## 1.3 Modelo e decisões de produto (proposta; implementação é do Arquiteto)

- **Consistência com `Objective`:** o campo passa a ser `owners?: string[]` em `Epic` e `Initiative` (mesmo nome e forma do objetivo). `owner` deixa de ser escrito.
- **Ordem = ordem de inserção** (primeiro adicionado aparece primeiro, em todo lugar). Sem reordenação por drag no MVP.
- **Duplicados:** comparação case-insensitive e com trim (mesma regra de `ObjectiveForm.addOwner`); mantém a grafia do primeiro.
- **Vazio:** lista vazia é salva como `undefined` (igual `ObjectiveForm`), e `[]` é tratado como "sem responsáveis" na leitura.

## 1.4 User stories

- **US-O1** Como planejador, quero adicionar mais de um responsável a um épico, para refletir quem realmente está à frente.
- **US-O2** Como planejador, quero o mesmo para uma iniciativa.
- **US-O3** Como planejador, quero escolher responsáveis entre os membros do time (com foto) ou digitar um nome novo, como já faço no objetivo.
- **US-O4** Como planejador, quero remover um responsável individualmente sem perder os outros.
- **US-O5** Como espectador da timeline, quero ver todos os responsáveis de uma barra de relance (avatares) e a lista completa no tooltip.
- **US-O6** Como usuário existente, quero que meus roadmaps salvos e JSONs antigos continuem mostrando o responsável único que já tinha.
- **US-O7** Como usuário, quero continuar podendo ocultar todos os responsáveis com o botão "Responsáveis".

## 1.5 Critérios de aceite

```gherkin
Cenário O1: adicionar vários responsáveis a um épico (caminho feliz)
  Dado o formulário "Novo épico" aberto e membros "Ana Souza" e "Bruno Lima" cadastrados
  Quando seleciono "Ana Souza" na lista de sugestões e depois "Bruno Lima"
  E clico em "Criar épico"
  Então o épico é salvo com os responsáveis ["Ana Souza", "Bruno Lima"] nessa ordem
  E a barra do épico na timeline mostra os avatares dos dois
  E o tooltip da barra contém "Responsáveis: Ana Souza, Bruno Lima"

Cenário O2: adicionar vários responsáveis a uma iniciativa
  Dado o formulário de iniciativa aberto
  Quando adiciono dois responsáveis e salvo
  Então a iniciativa persiste os dois, na ordem de adição
  E a barra da iniciativa e a linha da lista exibem ambos

Cenário O3: nome livre (não cadastrado) continua permitido
  Dado o campo "Responsáveis" de um épico
  Quando digito "Dani Externo" (não está no time) e pressiono Enter
  Então "Dani Externo" vira um chip e é salvo
  E é exibido com avatar de iniciais (sem foto), como hoje

Cenário O4: atalhos de edição idênticos ao objetivo
  Dado o campo "Responsáveis" com o rascunho "Carla" digitado
  Quando pressiono vírgula, ou Enter, ou tiro o foco do campo
  Então "Carla" vira chip e o rascunho é limpo
  Quando o rascunho está vazio e pressiono Backspace
  Então o último chip é removido

Cenário O5: remover um responsável pelo chip
  Dado um épico com ["Ana Souza", "Bruno Lima"]
  Quando abro "Editar épico" e clico no × do chip "Ana Souza" e salvo
  Então o épico passa a ter apenas ["Bruno Lima"]

Cenário O6: remover todos os responsáveis
  Dado um épico com 1 ou mais responsáveis
  Quando removo todos os chips e salvo
  Então o épico é salvo sem responsáveis (campo ausente)
  E não aparece avatar na barra nem "Responsável(is)" no tooltip

Cenário O7: duplicado é ignorado
  Dado um épico com o chip "Ana Souza"
  Quando digito "ana souza " (caixa diferente, espaço no fim) e confirmo
  Então nenhum chip novo é criado e o rascunho é limpo
  E a sugestão "Ana Souza" não é mais oferecida na lista (excludeNames)

Cenário O8: entrada vazia ou só espaços
  Dado o campo "Responsáveis"
  Quando confirmo um rascunho vazio ou só com espaços
  Então nada é adicionado e nenhum erro é exibido

Cenário O9: dado legado com owner único no armazenamento local
  Dado um roadmap salvo no localStorage por versão anterior, com epic.owner = "Ana Souza" e sem "owners"
  Quando abro o roadmap
  Então o épico exibe "Ana Souza" como único responsável (barra, lista, tooltip)
  E ao abrir "Editar épico" o chip "Ana Souza" já aparece preenchido
  E ao salvar sem alterações, o dado persistido passa a ter owners = ["Ana Souza"] e não tem mais "owner"

Cenário O10: import de JSON antigo
  Dado um arquivo JSON exportado antes da mudança, com "owner" em épicos e iniciativas
  Quando importo o arquivo
  Então a importação é aceita (sem erro de schema)
  E cada épico/iniciativa aparece com o responsável original
  E nenhum responsável é perdido silenciosamente

Cenário O11: import de JSON novo e exportação
  Dado um roadmap com épicos com 2+ responsáveis
  Quando exporto o JSON e importo em outro workspace
  Então os responsáveis e sua ordem são idênticos
  E o JSON exportado contém "owners" (array) e não contém "owner"

Cenário O12: JSON com os dois campos
  Dado um item importado com "owner": "Ana" e "owners": ["Bruno"]
  Quando importo
  Então o resultado é ["Ana", "Bruno"] (owner legado primeiro, sem duplicar)

Cenário O13: JSON inválido de responsáveis
  Dado um JSON com "owners": "Ana" (string) ou "owners": [""] ou [123]
  Quando importo
  Então a importação falha com mensagem no padrão atual
       ('Roadmap inválido: campo "<caminho>" — <mensagem>'), sem importar parcialmente

Cenário O14: toggle "Responsáveis" oculta tudo
  Dado épicos e iniciativas com vários responsáveis
  Quando desativo "Responsáveis"
  Então nenhum avatar de responsável aparece em barras, lista ou chips de objetivo
  E o estado é lembrado como hoje (chave roadmap-builder:show-owners)

Cenário O15: muitos responsáveis na barra da timeline
  Dado um épico com 6 responsáveis
  Quando a barra é renderizada com showOwners ativo
  Então a barra mostra no máximo 3 avatares sobrepostos mais um indicador "+3"
  E o tooltip lista os 6 nomes completos
  E o título do épico continua truncado com reticências, sem quebrar o layout da barra

Cenário O16: barra estreita
  Dado um épico/iniciativa de poucos dias (barra com a largura mínima de 14px)
  Quando renderizado com vários responsáveis
  Então os avatares são recortados pelo overflow da barra, como hoje com um só
  E o tooltip continua mostrando todos os nomes
  E a barra continua clicável/arrastável/redimensionável

Cenário O17: lista (visão "Lista")
  Dado épico e iniciativa com 4 responsáveis
  Quando abro a aba Lista
  Então todos os avatares aparecem em linha, com quebra de linha se faltar espaço (sem cortar), na ordem salva
  E cada avatar tem o nome acessível (title/aria) para leitor de tela

Cenário O18: responsável removido do time
  Dado um épico com ["Ana Souza", "Bruno Lima"] e "Bruno Lima" excluído em "Time"
  Quando abro o roadmap
  Então "Bruno Lima" continua listado como responsável, com avatar de iniciais (sem foto)
  E nenhum erro ou perda de dado ocorre
  # comportamento atual de nome livre; propagação de remoção está fora de escopo (ver 1.7)

Cenário O19: foto do membro aparece para vários
  Dado dois responsáveis cadastrados com foto
  Então cada avatar usa a foto do respectivo membro (busca case-insensitive por nome)

Cenário O20: duplicar roadmap e mover itens preservam responsáveis
  Dado um roadmap com épicos/iniciativas com vários responsáveis
  Quando duplico o roadmap, ou movo uma iniciativa para outro épico, ou reordeno por drag
  Então os responsáveis permanecem intactos

Cenário O21: arrastar/redimensionar não altera responsáveis
  Dado um épico com vários responsáveis
  Quando arrasto a barra ou puxo a borda para mudar datas
  Então apenas as datas mudam (updateEpic com patch de datas); owners permanece
```

## 1.6 Casos de borda (resumo)

| Caso | Comportamento esperado |
| --- | --- |
| 0 responsáveis | Sem avatar, sem linha de tooltip, campo vazio no form; salva como ausente |
| 1 responsável | Visual idêntico ao de hoje (um avatar) |
| Muitos (N>3) | Barra: 3 avatares + "+N"; tooltip e lista: todos. Sem limite rígido de dados (ver Q-O3) |
| Responsável removido/renomeado no time | Permanece como texto livre com iniciais; sem cascata (fora de escopo) |
| Dado legado `owner` único (localStorage) | Normalizado na leitura para `owners=[owner]`; `owner` descartado na próxima gravação |
| JSON antigo (só `owner`) | Aceito; convertido; nunca descartado em silêncio (atenção: Zod remove chaves desconhecidas) |
| JSON com `owner` e `owners` | Mesclar, `owner` primeiro, dedupe |
| `owner` string vazia / `owners: []` / nomes só com espaço | Tratados como ausência; entradas vazias descartadas |
| Duplicados | Case-insensitive + trim; mantém primeira grafia |
| Ordem | Ordem de inserção, estável em salvar/exportar/importar/duplicar |
| Nomes muito longos | Chip/tooltip quebram linha (`overflow-wrap`); avatar usa 2 iniciais (`ownerInitials`) |
| Mesma pessoa em épico e em iniciativa | Permitido, sem relação entre os campos |
| Roadmap vazio | Não aplicável (sem épicos) |
| Vários responsáveis com mesmas iniciais | Cores deterministas por nome (`ownerColor`); `title` distingue |
| Lista de sugestões | Esconde quem já é chip (`excludeNames`); no máx. 8 sugestões (comportamento atual) |

## 1.7 Requisitos não funcionais

- **Acessibilidade:** chip com botão "Remover <nome>" (padrão do `ObjectiveForm`); campo com `role="combobox"`, `aria-expanded` e navegação por setas/Enter já existentes. Avatares têm `alt=""` hoje e só `title`; no agrupamento "+N" precisar de rótulo acessível (ex.: `aria-label="Responsáveis: A, B, C"` no contêiner, em vez de depender só do `title`). Contraste dos chips segue `ownerColor`.
- **Responsividade:** chips e avatares não podem causar rolagem horizontal nos formulários em 320px; na lista os avatares quebram linha.
- **Compatibilidade/rollback:** migração deve ser **na leitura (em memória) e gravada só no próximo save**, para que um rollback da versão logo após o deploy não perca dados de roadmaps não editados. Risco: roadmaps salvos já com `owners` por uma versão nova perdem os responsáveis de épico/iniciativa se voltarmos à versão antiga (que só lê `owner`). Mitigação sugerida: documentar; opcional dual-write (ver Q-O5).
- **Performance:** sem impacto relevante (listas curtas).
- **Dados pessoais:** nomes e fotos permanecem só no localStorage do navegador; nenhum dado novo.

## 1.8 Perguntas em aberto e recomendação default

| # | Pergunta | Default assumido |
| --- | --- | --- |
| Q-O1 | Renomear o campo para `owners: string[]` (igual ao objetivo) ou manter `owner` e adicionar `owners`? | **`owners`**, descartando `owner` após migrar. Consistência com `Objective`. |
| Q-O2 | Existe "responsável principal"? | **Não.** O primeiro da lista é só o primeiro visualmente; sem semântica. |
| Q-O3 | Limite máximo de responsáveis? | **Sem limite no dado**; UI colapsa em "+N" nas barras. O Arquiteto pode propor um teto técnico alto (ex.: 20) se necessário, a confirmar. |
| Q-O4 | Excluir/renomear membro do time deve atualizar épicos? | **Não** (fora de escopo; hoje também não atualiza). Registrar como dívida. |
| Q-O5 | Exportar mantendo `owner` para compatibilidade com versões antigas? | **Não.** Só `owners`. Importar aceita ambos. |
| Q-O6 | Reordenar responsáveis por drag? | **Não** no MVP. |
| Q-O7 | Quantos avatares na barra antes do "+N"? | **3** em épico (18px) e **2 ou 3** em iniciativa (16px); Arquiteto/UX ajustam conforme a largura. |
| Q-O8 | Reutilizar a UI do `ObjectiveForm` extraindo um componente compartilhado? | **Sim, recomendado** (hoje o código de chips está inline e usa `ObjectiveForm.module.scss`); decisão de implementação do Arquiteto. |

## 1.9 Fatiamento sugerido

1. **Modelo + migração + import/export + seed** (tipo, Zod aceitando `owner` legado e `owners`, normalização na leitura do storage, serialização). Sem mudança visual, cobre O9-O13.
2. **Formulários** de épico e iniciativa com multi-seleção (O1-O8).
3. **Exibição** em barras, lista e tooltips, com colapso "+N" (O14-O19).
4. Regressão de drag/duplicar/mover (O20-O21).

---

# Item 2 - FEATURE: tela cheia para ver o roadmap inteiro em uma única tela

## 2.1 Problema, resultado, métrica

**Problema:** hoje a timeline não cabe numa tela para períodos longos ou muitas raias: aparece rolagem horizontal (`.scrollArea { overflow-x: auto }`, `MIN_DAY_WIDTH` por granularidade) e rolagem vertical (`.content { overflow-y: auto }`), além de header, abas, toolbar, dicas e a sidebar ocupando espaço. Não dá para tirar um print da "fotografia" do planejamento completo para compartilhar em chat, e-mail ou slide.

**Persona:** líder/PM que precisa mostrar o roadmap a stakeholders; time que quer colar o plano num documento.

**Resultado esperado:** um modo "Tela cheia" que renderiza todo o roadmap (todas as raias, épicos e iniciativas, toda a régua de tempo) dentro da janela, sem nenhuma barra de rolagem, limpo de controles de edição, pronto para captura.

**Métrica de sucesso (sem telemetria):** em 1 clique entra no modo e, em qualquer roadmap de até ~10 objetivos / ~60 épicos / ~150 iniciativas, **100% do conteúdo é visível sem rolagem** (verificável por `scrollWidth <= clientWidth` e `scrollHeight <= clientHeight` do contêiner do snapshot) e o texto principal continua identificável (ver piso de escala, Q-F3).

## 2.2 Escopo

**Inclui**
- Botão de entrada "Tela cheia" no detalhe do roadmap, e saída por Esc e por botão visível.
- Renderização "fit to screen" da timeline completa: grade de tempo, raias, barras de épico/iniciativa, status, responsáveis (conforme toggle), linha de "hoje" (conforme toggle), legenda de status, título e período do roadmap.
- Modo **somente leitura** (sem arrastar, redimensionar, adicionar, excluir, abrir formulários).
- Recalcular o ajuste ao redimensionar a janela.
- Cores preservadas para captura e impressão.

**Não inclui:** exportar imagem/PDF por botão próprio (usuário usa print do SO ou Ctrl+P), compartilhar link, edição dentro do modo, a visão "Lista" em tela cheia, múltiplos roadmaps na mesma tela, filtros.

## 2.3 User stories

- **US-F1** Como líder, quero entrar em tela cheia com um clique para ver todo o roadmap de uma vez, sem rolar.
- **US-F2** Como líder, quero que a tela cheia esconda controles de edição e menus, para que o print fique limpo.
- **US-F3** Como líder, quero sair a qualquer momento com Esc ou um botão.
- **US-F4** Como apresentador, quero que o layout se ajuste se eu redimensionar a janela ou girar o aparelho.
- **US-F5** Como líder, quero que o modo respeite o que escolhi mostrar (responsáveis, linha de hoje) para que a captura reflita minha escolha.
- **US-F6** Como líder, quero imprimir (Ctrl/Cmd+P) a tela cheia em uma folha, com cores.

## 2.4 Comportamento proposto (decisões de produto)

- **Entrada:** botão "Tela cheia" (ícone `ExpandIcon`, já existe em `Icon.tsx`) na linha de abas/ações de `RoadmapDetail`, ao lado do toggle "Responsáveis". Disponível a partir de qualquer aba; sempre mostra a **timeline** (a lista não é o alvo).
- **O que aparece:** título do roadmap, período, contagens (opcional, ver Q-F5), legenda de status (`statusCounts` já existe), régua, raias com rótulo (título do objetivo, contagem, responsáveis do objetivo se `showOwners`), barras, linha de hoje se ativa e se hoje está no período.
- **O que não aparece:** sidebar, `mobileBar`, header de edição (Editar, +Objetivo), abas, toolbar de granularidade/hoje, alça de arrasto de raia, botões excluir/info/"+ Épico"/"+" de iniciativa, texto de dica.
- **Granularidade:** mantém a escolhida no momento da entrada (sem controles dentro do modo no MVP). Ver Q-F4.
- **Ajuste ("fit"):** largura: a grade ocupa a largura disponível **sem usar o `MIN_DAY_WIDTH`** como piso; altura: se o conteúdo vertical exceder a janela, a visualização inteira é reduzida proporcionalmente até caber (escala uniforme), com piso e tratamento conforme Q-F3. Não aumenta além de 100% (sem ampliar fontes); se sobrar espaço, o conteúdo fica no topo/centralizado sem esticar alturas de barra.
- **Somente leitura:** o `DndContext` não é montado (ou é desabilitado) e handlers de resize/clique de edição ficam inativos, porque o dnd-kit/resize assumem coordenadas sem escala (item 7 da seção 0).
- **Dias úteis:** a régua continua só com dias úteis (como hoje); não mudar.

## 2.5 Critérios de aceite

```gherkin
Cenário F1: entrar em tela cheia (caminho feliz)
  Dado um roadmap com objetivos, épicos e iniciativas aberto na aba Timeline
  Quando clico em "Tela cheia"
  Então a visualização ocupa toda a janela (sidebar, header e abas não aparecem)
  E vejo todas as raias, a régua completa do período e todas as barras
  E não existe barra de rolagem horizontal nem vertical (scrollWidth<=clientWidth e scrollHeight<=clientHeight)

Cenário F2: sem rolagem em roadmap longo
  Dado um roadmap de 12 meses (≈261 dias úteis) em janela de 1280x720
  Quando entro em tela cheia
  Então a grade inteira de Jan a Dez cabe na largura (sem usar o mínimo de 5px/dia)
  E nenhuma rolagem horizontal aparece

Cenário F3: sem rolagem em roadmap alto
  Dado um roadmap com 8 objetivos e muitas iniciativas sobrepostas empilhadas
  Quando entro em tela cheia numa janela 1366x768
  Então todo o conteúdo é reduzido proporcionalmente até caber na altura
  E nenhuma rolagem vertical aparece
  E nenhuma raia, épico ou iniciativa é omitido

Cenário F4: modo somente leitura e limpo para captura
  Dado o modo tela cheia ativo
  Então não há botões de editar/excluir/adicionar, alças de arrasto, dica de uso, nem toolbar
  E clicar ou arrastar uma barra não abre formulário nem altera datas

Cenário F5: sair com Esc
  Dado o modo tela cheia ativo e nenhum modal aberto
  Quando pressiono Esc
  Então volto à tela anterior com a mesma aba, o mesmo roadmap, mesma granularidade e mesmos toggles
  E nenhum dado foi alterado

Cenário F6: sair pelo botão
  Dado o modo tela cheia ativo
  Então existe um botão "Sair da tela cheia" visível e focável (alcançável por teclado e toque)
  Quando o ativo
  Então saio do modo e o foco retorna ao botão "Tela cheia"

Cenário F7: Esc quando o navegador também está em fullscreen nativo
  Dado que o modo usa (ou coexiste com) fullscreen nativo do navegador
  Quando pressiono Esc
  Então o estado interno da aplicação sincroniza com o do navegador (nunca fica "preso" em modo tela cheia sem fullscreen real nem o contrário)

Cenário F8: fallback sem Fullscreen API
  Dado um navegador/dispositivo sem suporte à Fullscreen API para elementos (ex.: iOS Safari)
  Quando clico em "Tela cheia"
  Então o modo ainda funciona como sobreposição que cobre a janela inteira, com as mesmas regras de F1-F6

Cenário F9: redimensionar a janela
  Dado o modo ativo
  Quando redimensiono a janela ou giro o aparelho
  Então o ajuste é recalculado e continua sem rolagem em ambos os eixos

Cenário F10: janela pequena
  Dado uma janela de 360x640
  Quando entro em tela cheia
  Então não há rolagem em nenhum eixo
  E o rótulo da raia usa a largura reduzida atual (150px abaixo de 768px)
  E é exibida uma dica não bloqueante sugerindo girar o aparelho/ampliar a janela se a escala ficar abaixo do piso legível (Q-F3)

Cenário F11: respeita "Responsáveis"
  Dado "Responsáveis" ativado
  Então os avatares/chips de responsáveis aparecem como na timeline normal (inclusive vários por barra, do Item 1)
  Dado "Responsáveis" desativado antes de entrar
  Então não aparecem na tela cheia

Cenário F12: respeita "Indicador de hoje"
  Dado o indicador de hoje ativo e hoje dentro do período
  Então a linha de hoje é desenhada na posição correta após o ajuste de escala
  Dado hoje fora do período, ou indicador desativado
  Então a linha não aparece

Cenário F13: roadmap sem objetivos
  Dado um roadmap sem objetivos
  Então o botão "Tela cheia" fica desabilitado com o motivo no tooltip ("Adicione um objetivo para usar a tela cheia")
  # (a timeline vazia atual mostra "Timeline vazia"; não há o que fotografar)

Cenário F14: objetivo sem épicos
  Dado um objetivo sem épicos
  Então a raia aparece com a mensagem "Nenhum épico neste objetivo." e não quebra o ajuste

Cenário F15: roadmap pequeno
  Dado um roadmap de 1 mês com 2 épicos
  Quando entro em tela cheia
  Então a grade se estica na largura (como hoje), a escala não passa de 100% e as barras não ficam gigantes
  E o conteúdo permanece legível e alinhado

Cenário F16: roadmap muito grande/denso
  Dado um roadmap que exigiria escala abaixo do piso (Q-F3)
  Quando entro em tela cheia
  Então ainda não há rolagem (o ajuste usa a escala necessária)
  E um aviso discreto informa a escala aplicada, posicionado fora da área a ser capturada ou ocultável (ver Q-F3)

Cenário F17: dados mudam em outra aba
  # Hoje não há sincronização entre abas (sem listener de storage); manter assim.
  Dado o modo ativo e dados alterados em outra aba
  Então não é exigida atualização automática (comportamento atual)

Cenário F18: modais e Esc
  Dado que o modo tela cheia está ativo
  Então nenhum modal deveria estar acessível; se algum estiver aberto ao entrar, o Esc fecha apenas o modal do topo (pilha de Modal) e só um segundo Esc sai do modo

Cenário F19: impressão
  Dado o modo ativo
  Quando aciono imprimir (Ctrl/Cmd+P)
  Então a pré-visualização mostra apenas o snapshot, em uma única página paisagem, com cores de barras/status preservadas
  E sem controles de UI (botão Sair, avisos)

Cenário F20: acessibilidade de teclado e foco
  Dado o modo ativo
  Então o foco é movido para dentro do modo ao entrar (botão Sair ou contêiner) e não escapa para elementos ocultos atrás
  E o contêiner tem papel/rótulo acessível (ex.: role="dialog" ou região com aria-label "Roadmap em tela cheia: <nome>")

Cenário F21: estado não persistente
  Dado o modo tela cheia ativo
  Quando recarrego a página
  Então volto ao estado normal (o modo não é persistido)

Cenário F22: mudança de granularidade/ruler
  Dado o modo ativo com granularidade "Diário" selecionada (≈56px por dia útil no mínimo normal)
  Então o ajuste ignora o mínimo e continua sem rolagem
  # Pode ficar ilegível; ver Q-F4 (default: entrar sempre em mensal)
```

## 2.6 Casos de borda (resumo)

| Caso | Comportamento esperado |
| --- | --- |
| Roadmap vazio (0 objetivos) | Botão desabilitado com tooltip |
| Objetivo sem épico / épico sem iniciativa | Renderiza normalmente (mensagem de raia vazia; lane de iniciativas com altura mínima) |
| Muitas raias/épicos/iniciativas (denso) | Escala uniforme até caber; aviso de escala; nunca rolagem (ver Q-F3) |
| Muitas iniciativas sobrepostas | `packIntoRows` já empilha; a altura total entra no cálculo do ajuste |
| Período curto | Estica na largura como hoje; sem upscale além de 100% |
| Período muito longo (vários anos) | Mesmo ajuste; régua mensal pode ter rótulos truncados (já usam `title`): rótulos devem truncar com reticências, não sobrepor |
| Janela pequena / retrato mobile | Sem rolagem; rótulo de raia 150px; dica para girar; piso de escala |
| Redimensionar/rotacionar | Recalcula (já existe `useElementWidth` com `ResizeObserver` para largura; altura precisa ser considerada também) |
| Esc | Sai do modo; com modal aberto, fecha só o modal (pilha) |
| Fullscreen nativo negado/indisponível | Fallback para sobreposição CSS |
| Usuário já em F11 do navegador | Funciona (a sobreposição ocupa a janela) |
| Barra muito curta (largura mínima 14px) | Mantém o mínimo atual; texto truncado; tooltip não aplicável (somente leitura sem hover em print) |
| Hoje fora do período | Sem linha de hoje (comportamento atual) |
| Fins de semana | Continuam fora da grade (dias úteis) |
| Lista de responsáveis longa | Aplica o colapso "+N" do Item 1 |
| Títulos longos | Truncados com reticências nas barras; rótulo de raia quebra linha (`overflow-wrap: anywhere`) e entra no cálculo de altura |
| Descrição do objetivo | Não exibida (botão de info oculto) |
| Tema/cores | Cores de objetivo/épico/status inalteradas |

## 2.7 Requisitos não funcionais

- **Acessibilidade:** botão com rótulo textual e `aria-pressed`/estado claro; Esc e botão "Sair" equivalentes; foco aprisionado/retornado corretamente (F6, F20); texto com contraste igual ao atual; não depender só de cor (status já tem ponto + legenda com rótulo, `STATUS_LABELS`); respeitar `prefers-reduced-motion` se houver transição de entrada.
- **Responsividade:** funciona de 320px a telas grandes e ultrawide; recalcula em resize/rotação; usa `100dvh` (padrão já usado em `App.module.scss`) para evitar o problema da barra de endereço móvel.
- **Impressão/captura:** `@media print` (hoje inexistente): uma página, paisagem, sem margens que forcem quebra, `print-color-adjust: exact` para manter as cores das barras, ocultar UI não essencial. Print do SO (Cmd+Shift+4 etc.) deve pegar a área limpa; por isso controles de UI do modo (Sair, aviso de escala) devem ser discretos e idealmente auto-ocultáveis ou posicionados na borda (Q-F6).
- **Desempenho:** o ajuste não deve causar loop de re-render nem "flicker" no resize; recalcular com `ResizeObserver` (já usado para largura). Roadmap denso (~150 iniciativas) deve renderizar sem travar perceptivelmente (sem benchmark medido; suposição).
- **Segurança/privacidade:** só front-end; nada sai do navegador.
- **Não regressão:** fora do modo, timeline, drag-and-drop, resize, toolbar e rolagem horizontal continuam exatamente como hoje (o comportamento atual é o contrato).

## 2.8 Perguntas em aberto e recomendação default

| # | Pergunta | Default assumido |
| --- | --- | --- |
| Q-F1 | Usar a Fullscreen API nativa, sobreposição CSS ou ambas? | **Decisão do Arquiteto.** Requisito de produto: parecer tela cheia, ter fallback (F8) e sincronizar o Esc (F7). |
| Q-F2 | O modo é somente leitura? | **Sim** (por causa do dnd-kit/resize sem escala e para limpar o print). |
| Q-F3 | Piso de escala e o que fazer abaixo dele? | **Sempre cabe (sem rolagem), mesmo abaixo do piso**; piso de referência de legibilidade 50%; abaixo disso mostrar aviso discreto "Exibindo a X% para caber na tela". Alternativa mais rígida (bloquear) descartada porque quebra o requisito "sem rolagem". |
| Q-F4 | Granularidade dentro do modo? | **Forçar régua mensal ao entrar** (diária/semanal estouram o espaço); sem seletor dentro do modo no MVP. Se o usuário já está em mensal, nenhuma mudança. A confirmar com o Manager. |
| Q-F5 | Cabeçalho do snapshot (nome, período, contagens, data da captura)? | **Nome + período + legenda de status**; contagens e data "Gerado em" opcionais. Recomendo incluir uma data discreta ("Atualizado em dd/mm/aaaa" a partir de `roadmap.updatedAt`) por ser útil em prints compartilhados; a confirmar. |
| Q-F6 | Controles do modo (Sair, aviso)? | **Botão "Sair" pequeno no canto superior direito**, aviso de escala só quando <100%; ambos com `data-` ou classe para ocultar em `@media print`. Auto-ocultar após alguns segundos fica como melhoria. |
| Q-F7 | Visão Lista em tela cheia? | **Fora de escopo.** Botão leva sempre à timeline. |
| Q-F8 | Botão "Baixar imagem/PNG"? | **Fora de escopo** (precisaria biblioteca como html2canvas; decisão do Manager/Arquiteto). O MVP é "pronto para print do SO / imprimir". |
| Q-F9 | Atalho de teclado para entrar (ex.: F)? | **Não** no MVP (evitar conflito com digitação em campos). |
| Q-F10 | Mostrar sidebar recolhida? | **Não**; cobre a janela inteira. |

## 2.9 Fatiamento sugerido

1. **MVP:** botão + modo (somente leitura) + ajuste de largura (sem `MIN_DAY_WIDTH`) + ajuste de altura por escala uniforme + saída (Esc/botão) + fallback + sync de resize. Cobre F1-F9, F13-F15, F18, F20, F21.
2. **Iteração 1:** respeitar toggles, cabeçalho do snapshot, aviso de escala, janela pequena (F10-F12, F16).
3. **Iteração 2:** `@media print` (F19) e polimento de captura (auto-ocultar controles).
4. **Futuro (fora de escopo agora):** exportar PNG/PDF, link compartilhável, filtros.

---

# 3. Fora de escopo (global)

- Filtro, busca ou visão "por pessoa"; carga/alocação por responsável; papéis (RACI).
- Propagar renomeação/remoção de membro para roadmaps; migrar `owners` para IDs de membro.
- Alterar o modelo de `Objective.owners`.
- Sincronização entre abas/dispositivos; back-end; telemetria.
- Exportar imagem/PDF por botão; compartilhar por link; tela cheia da visão Lista.
- Atualizar o README (granularidade diária) - apenas registrado em 0.10.

# 4. Impacto em outros "lados" do produto

Produto é um app único client-side: sem parceiro/entregador. Impactos: (a) usuários existentes (dados em localStorage) - migração; (b) arquivos JSON circulando entre pessoas - compatibilidade de import; (c) CI (lint + `tsc -b` + build) deve passar; não há testes automatizados hoje.

# 5. Suposições registradas (não verificadas)

1. Nenhum outro consumidor de `owner` além dos listados (busca por "owner" em `src/` feita; o termo também aparece em `findEpicOwner`/`findInitiativeOwner` no store, que são nomes de helpers de objetivo/épico pai, sem relação com responsável).
2. A normalização de dados legados não precisa de versionamento explícito de schema (nenhum campo `version` existe hoje).
3. Roadmaps típicos: até ~10 objetivos / 60 épicos / 150 iniciativas (não há dado de uso real; é premissa de dimensionamento).
4. O texto continua legível até ~50% de escala (valor de referência, a validar com UX/QA em captura real).
5. Fullscreen nativo pode não estar disponível em todos os dispositivos (iOS Safari); por isso o fallback é requisito.
6. Sem runner de testes, QA validará por roteiro manual ou o Arquiteto introduz um runner; os cenários são escritos para servir às duas opções.
