# Parecer QA: múltiplos responsáveis (épico/iniciativa) + tela cheia — ⚠️ APROVADO COM RESSALVAS

Data: 2026-10-01 | Autor: QA | Build testado: working tree (não commitado), Node 24, `vite preview` do build de produção
Ambiente de navegador: Google Chrome (headless, Chromium real) dirigido por playwright-core instalado fora do projeto (scratchpad). Nenhuma dependência foi adicionada ao projeto. A extensão Chrome não foi usada (headless dá controle exato de viewport).

## Resumo do gate
- Critérios de aceite: 41/43 atendidos e evidenciados; 2 sem verificação em navegador real (F19 impressão real pelo diálogo do SO; F7 Esc nativo do navegador). 0 critérios reprovados.
- Regressão (drag, resize, duplicar, import/export, toggle, timeline normal): passou.
- Bugs abertos: S1: 0 | S2: 0 | S3: 2 | S4: 4
- Lint limpo, `tsc -b` + build ok, `npm test`: 16 arquivos, 163 testes verdes.
- Por regra de gate (S1/S2 abertos = reprovado) não há bloqueio. As 2 S3 exigem aceite do Manager 🧑‍💼 ou correção.

## 1. Automatizado (VERIFICADO por teste)
- `npm run lint`: limpo. `npm run build`: ok (CSS 51 kB, JS 438 kB). `npm test`: 163/163.
- Cobertura por critério (busca de tags O/F nos nomes de teste): têm teste O1–O15, O17–O21 e F2–F8, F10–F16, F18, F20–F22.
- **Sem teste automatizado:** O16 (barra estreita; só validado em navegador), F1 (rolagem real, só navegador), F9 (resize, só navegador), F17 (não exigido), F19 (impressão, só navegador parcial). jsdom não mede layout, então F1/F2/F3/F9/F10 dependem do que está na seção 2.
- Não rodei cobertura numérica (não há script/ferramenta de coverage configurado).

## 2. VERIFICADO EM NAVEGADOR REAL (Chrome)

### Migração, import/export
| Critério | Resultado | Evidência |
| --- | --- | --- |
| O9 localStorage legado `owner` | OK | Injetei roadmap com `owner` em épico e iniciativas (inclusive `"   "` e épico sem `owners`) antes do load. Ler não grava (chave `roadmap-builder:roadmaps` idêntica byte a byte); backup `...:pre-owners-backup` === JSON legado original; UI mostra o responsável na barra, tooltip ("Responsável: Ana Souza") e chip preenchido ao editar; após salvar sem alterar: `owners=["Ana Souza"]` e sem `owner`; backup permanece o original. Warn único no console. Nada perdido. `owner:"   "` descartado sem derrubar a leitura. |
| O10 import antigo | OK | `owner` em épico e iniciativa vira `owners` com o valor original; sem erro |
| O11 export/import novo | OK | Export sem `"owner"`, com `"owners"`; reimportado com owners e ordem idênticos |
| O12 ambos os campos | OK | `owner:"Ana"`, `owners:["Bruno","ana"]` → `["Ana","Bruno"]` |
| O13 inválido | OK | `"Ana"` (string), `[""]`, `[123]` rejeitados, nenhum roadmap parcial; mensagem no padrão `Roadmap inválido: campo "objectives.0.epics.0.owners" — Invalid input` (ver B6) |

### Formulários (épico e iniciativa)
- O1/O2/O3: vários responsáveis, nome livre, ordem preservada. OK.
- O4: vírgula, Enter, blur (Tab) viram chip; Backspace com rascunho vazio remove o último; Enter não submete o formulário. OK.
- O5/O6: remover chip individual e remover todos (campo `owners` ausente do JSON salvo, sem avatar/tooltip). OK.
- O7/O8: "bruno LIMA  " ignorado e rascunho limpo; sugestão do Bruno some da lista (`excludeNames`); rascunho vazio ou só espaços não cria nada nem erro. OK.
- **Correções do review revalidadas:** (achado 1) `[Ana]` + digitar "Bob" + clicar × de Ana → resultado `[Bob]`/`[Bruno, Bob]`, Ana não ressuscita. (achado 2) digitar "Carla" sem confirmar e sair do campo (clique no título/Tab) e salvar → `["Carla"]` salvo. OK. Ressalva: ver B1 (com o mouse, não dá para clicar Salvar com a lista aberta).
- Nome com 95 caracteres: chip quebra linha, modal sem rolagem horizontal em 1280 e 320px (chips). Tooltip e `aria-label` com o nome completo.

### Exibição (barras, lista, toggle)
- Barras com 1, 3, 5 e 6 responsáveis (épico: 1 → `AS`; 3 → `AS BL CN`; 5 → `AS BL CN +2`; 6 → `+3`; iniciativa: 2 avatares + "+N"). Tooltip com todos os nomes; contêiner com `aria-label="Responsáveis: ..."`; título continua truncado. 0 responsáveis: sem avatar. O15 e O16 OK (barra de 20 px recorta os avatares e continua sendo barra).
- O17: lista mostra todos os avatares em linha na ordem salva, `aria-label` por contêiner. OK.
- O14: toggle off remove todos os avatares/chips de barras, lista e objetivo; `show-owners` = `0` no localStorage. Ver B4 sobre o tooltip.
- O18: removi o membro Bruno do time e recarreguei: continua nos tooltips (avatar de iniciais), sem erro. OK.
- O20: duplicar roadmap pela UI preserva todos os owners (comparação estrutural). OK. Mover iniciativa entre épicos: só por teste automatizado (`roadmapStore.owners.test`).
- O21: arrastar épico/iniciativa e redimensionar nas duas bordas na timeline normal: datas mudam, `owners` intacto. Regressão de drag/resize: OK (mover +1 mês, resize D e E).

### Tela cheia
- F1/F2/F3/F10 (sem rolagem, medido por `scroll*`/`overflow` auto|scroll em todos os descendentes e `documentElement`): zero rolagem em 1280x720, 1366x768 e 360x640 para: seed (escala 1.0), roadmap alto de 8 objetivos/24 épicos/96 iniciativas ("ALTO8": 18,6%, 19,8%, 16,5%), roadmap denso 10 objetivos/60 épicos/180 iniciativas ("DENSO": 9–10%), títulos longos, objetivos sem épicos, período de 1 mês. Screenshots em `/private/tmp/claude-501/-Users-celsofabrijr-Documents/73966e6d-3208-4787-af1b-719549284e70/scratchpad/pw/shots/` (08-*).
- F4: somente leitura: único botão no overlay é "Sair"; sem dica de uso nem toolbar; clicar/arrastar/redimensionar barra não abre formulário nem altera o localStorage (conferido byte a byte).
- F5/F6: Esc e botão "Sair" saem; foco volta para "Tela cheia"; mesma aba, granularidade e toggles; `#root` deixa de ser `inert`, classe do body removida.
- F7: `document.exitFullscreen()` externo fecha o overlay e limpa estado (simula o Esc nativo). F8: sem `requestFullscreen` (e com promise rejeitada) cai em `overlay`, sem rolagem, Esc sai.
- F9: com overlay aberto, redimensionar 900x500 → 1600x900 → 360x640 → 1280x720 → 1100x600: sem rolagem em nenhum, ajuste recalculado.
- F11/F12/F22: com Responsáveis off, indicador de hoje off e granularidade Diário: sem avatares, sem linha de hoje, régua mensal forçada, sem rolagem; com tudo on, avatares e linha de hoje presentes.
- F13: roadmap vazio → botão desabilitado, tooltip "Adicione um objetivo para usar a tela cheia". F14: "Nenhum épico neste objetivo." na raia.
- F16: aviso "Exibindo a 19% para caber na tela." (+ "Gire o aparelho..." em <768px), dispensável. Sem aviso quando escala ≥ 50%.
- F20: `role="dialog"`, `aria-label="Roadmap em tela cheia: <nome>"`, foco inicial em "Sair", `#root` inert. F21: reload sai do modo.
- Impressão (parcial): `page.pdf` com o overlay aberto gera 1 página A4 paisagem, cores preservadas, sem botão Sair nem aviso de escala. **Não** foi usado o diálogo real do SO/Cmd+P, e o evento `beforeprint` pode não ter sido disparado pelo `page.pdf`; o encaixe de `PRINT_VIEWPORT` em A4 real fica NÃO VERIFICADO. No PDF do seed há uma faixa cinza clara abaixo do conteúdo (fundo da página), cosmético.

## 3. Bugs

### B1 — S3 — Lista de sugestões cobre o rodapé (Salvar) e Esc fecha o modal inteiro
Ambiente: Chrome 1280x720 e 1280x1100. Passos: Lista → Editar épico "Redução de downtime" → digitar "Carla" no campo Responsáveis (não confirmar). Obtido: a lista ("Carla Nunes", "Usar “Carla”") cobre o rodapé, o modal recorta a lista; o clique onde seria "Salvar" seleciona a sugestão (adiciona chip, não salva). Esc para fechar a lista **fecha o modal e descarta todas as edições** (o `Escape` não é interceptado, só `setOpen(false)`). Agravante: depois de clicar no × de um chip o foco volta ao input (correção do achado 6) e a lista reabre, de novo cobrindo Salvar. Esperado: lista não deve esconder as ações; Esc com lista aberta deve fechar só a lista. Frequência: sempre. Sem perda de dados persistidos, mas pode perder edição não salva. O mesmo componente atende ao formulário de objetivo (provavelmente pré-existente; não consegui comparar com a versão anterior, sem git). Contorno: clicar fora do campo ou Tab e então Salvar.
Evidência: shots `05-tall-dropdown.png`, `05b-scrolled.png`, `05-form-after-remove.png`.

### B2 — S3 — Formulários de edição de épico/iniciativa estouram 320px na horizontal
Passos: janela 320x568 → Lista → Editar épico (qualquer um). Obtido: rodapé "Excluir épico + Cancelar + Salvar alterações" ultrapassa a largura (scrollWidth do modal 387 vs 320; iniciativa 410). Reproduz sem responsáveis, logo não é causado pelos chips (chips quebram linha corretamente). Contraria o NFR de responsividade se interpretado para o formulário inteiro; o formulário de objetivo e o "Novo épico" cabem. Provavelmente pré-existente.

### B3 — S4 — Em 360x640 o botão "Sair" sobrepõe o cabeçalho da tela cheia
Seed e roadmap com títulos longos em 360x640: "Sair" cobre parte de "Atualizado em" e dos chips da legenda (`08-360x640-LONGOS.png`). Conteúdo continua sem rolagem.

### B4 — S4 — Tooltip lista responsáveis mesmo com o toggle "Responsáveis" desligado
Toggle off: avatares somem (O14 ok), mas o atributo `title` das barras ainda traz "Responsáveis: ...". Não aparece em print/captura. Spec O14 fala só em avatares/chips; registrar como decisão de produto.

### B5 — S4 — Legibilidade em roadmaps densos e posição do aviso
Roadmap de 24 épicos/96 iniciativas já cai a ~19%, e o de 60 épicos/180 iniciativas a ~10% (ilegível). Está conforme Q-F3 (sem rolagem sempre), mas a premissa "texto legível até ~50%" só vale para roadmaps pequenos. O aviso de escala fica sobre as raias inferiores (dispensável com ×), não "fora da área capturada". Sugestão: avisar o PO/Manager.

### B6 — S4 — Mensagem de import "Invalid input" sem tradução/clareza
`owners: "Ana"` gera `Roadmap inválido: campo "objectives.0.epics.0.owners" — Invalid input`. Segue o padrão atual (O13 literal), mas não diz que se espera lista de nomes.

## 4. NÃO VERIFICADO
- Fullscreen nativo e Esc em Safari, Firefox, iOS Safari; Esc nativo real do Chrome (só simulado via `exitFullscreen`). F11 do navegador.
- Impressão real pelo diálogo do SO e o `PRINT_VIEWPORT` em A4 real; `beforeprint` em impressão real.
- Mover iniciativa entre épicos por drag em navegador (só teste automatizado).
- Drag/resize de barra de 14–20 px de largura (O16 "clicável/arrastável") e dispositivos de toque.
- Leitor de tela (apenas conferência de `aria-label`/roles no DOM). Foto de avatar de membro (O19, só teste automatizado; o seed usa iniciais).
- Quota de localStorage (achado 3 do review: backup duplica o armazenamento; `writeAll` sem try/catch).
- Desempenho percebido do resize com roadmap denso (renderizou 2 mil nós sem travar nas medições, mas sem benchmark).

## 5. Riscos residuais e ressalvas para o Manager 🧑‍💼
1. B1 e B2 (S3): aceitar como dívida registrada (corrigir em tarefa própria; B1 é pequeno: parar propagação do Esc e/ou posicionar a lista acima do campo) ou exigir correção antes do merge.
2. B5: decisão de produto sobre escala mínima/aviso em roadmaps grandes.
3. Rollback: roadmaps salvos com `owners` perdem responsáveis de épico/iniciativa se a versão antiga voltar (backup `pre-owners-backup` mitiga manualmente). Já documentado no spec.

## HANDOFF
De: QA → Para: Orquestrador
Demanda: owners-e-fullscreen (QA)
Veredito: ⚠️ APROVADO COM RESSALVAS (S1/S2: 0; S3: 2; S4: 4)
- lint/build/163 testes verdes; migração, import/export, vários responsáveis, barras 1/3/5+, drag/resize, tela cheia (sem rolagem em 1280x720, 1366x768, 360x640 inclusive denso, F7/F8/F9, toggles, vazio) VERIFICADOS em Chrome real.
- Ressalvas: B1 (lista de sugestões cobre Salvar e Esc fecha o modal inteiro), B2 (rodapé do form de edição estoura 320px; não relacionado a owners).
- Não verificado: Safari/iOS/Firefox, impressão pelo diálogo real, Esc nativo real.
- Parecer completo: /Users/celsofabrijr/Documents/projects/roadmap-builder/docs/reviews/owners-e-fullscreen-qa.md

## Correções B1/B2 (Dev Frontend, 2026-10-01)

### B1: lista de sugestões de Responsáveis
- **Cobertura do rodapé:** `OwnerCombobox.module.scss` — `.dropdown` deixou de ser `position: absolute` e passou a ficar no fluxo (`margin-top: 4px`, `max-height: 11rem`). A lista empurra o rodapé para baixo e o painel do modal rola, em vez de cobrir Salvar. Afeta também o formulário de objetivo (mesmo componente).
- **Esc:** `OwnerCombobox.tsx` chama `preventDefault()` no Esc quando a lista está visível (e fecha só a lista); `Modal.tsx` ignora Esc com `defaultPrevented`. A pilha `modalStack` (só o modal do topo reage) permanece intacta. Com a lista fechada, o Esc seguinte fecha o modal normalmente.
- **Remover chip:** `OwnersField.tsx` devolve o foco ao input com `suppressOpenOnFocusRef` ativo, então o foco volta sem abrir sugestões. Digitar/clicar/ArrowDown ainda abrem a lista.
- Testes novos em `OwnersField.test.tsx` (2): foco após remover chip não reabre a lista; Esc com a lista aberta não fecha o modal e o Esc seguinte fecha. Ambos vermelhos antes (confirmado revertendo as correções), verdes depois.

### B2: rodapé a 320px
- `styles/shared.module.scss`: `.formActions` e `.formActionsGroup` com `flex-wrap: wrap` (grupo com `justify-content: flex-end`). Em 320px "Excluir épico" fica numa linha e "Cancelar + Salvar alterações" na seguinte.
- Sem teste automatizado (jsdom não mede layout); validado em Chrome real.

### Validação em Chrome real (playwright-core, `vite preview` do build)
- 1280x720 e 320x568, épico "Redução de downtime": com "Carla" digitado, lista a [528–602] e Salvar a [624–663] (sem sobreposição); `elementFromPoint` no centro de Salvar devolve "Salvar alterações" (antes selecionava a sugestão). Esc: modal continua aberto, lista some, texto "Carla" preservado; 2º Esc fecha o modal. Remover chip: foco no input, 0 listbox.
- 320px: `scrollWidth` do modal = 320 (antes 387/410) para editar épico e editar iniciativa; também 320 em novo roadmap, editar roadmap, editar/adicionar objetivo e confirmação de exclusão; documento sem rolagem horizontal. Screenshots em `.../scratchpad/shots/` (`b1-*.png`, `b2-*.png`, `b2all-*.png`).
- `npm run lint` limpo; `npm run build` ok; `npm test` verde (ver HANDOFF).

### Não verificado
- Modais de equipe/workspace e "Importar" a 320px (não localizei o gatilho no script; usam as mesmas classes de rodapé, mas não medi).
- Touch real, Safari/Firefox; leitor de tela com a lista em fluxo.
- Em viewports muito baixos a lista aberta aumenta a altura do formulário (o painel rola); não testado em teclado virtual de celular.

## Correção: lista visível em viewport baixo (Dev Frontend, 2026-10-01)

Origem: sugestão 1 do re-review B1/B2 (lista aberta perto do fim do painel não rolava para a vista).

### O que mudou
- `OwnerCombobox.tsx`: ao abrir a lista (`open && totalOptions > 0`), um efeito chama `scrollIntoView({ block: 'nearest' })` na lista e, em seguida, no input (o input tem prioridade se o painel for menor que input+lista). Navegação por setas (ArrowUp/Down) mantém a opção ativa visível via `scrollIntoView({ block: 'nearest' })`, apenas quando o realce mudou por teclado (flag `keyNavRef`); hover do mouse não rola nada.
- `scrollIntoView` é protegido com `typeof ... === 'function'` (jsdom não implementa). Sem `behavior: 'smooth'`, então `prefers-reduced-motion` é respeitado por construção.
- Foco, Esc (fecha só a lista), remover chip (não reabre a lista) e `suppressOpenOnFocusRef` intactos.
- Teste novo em `OwnersField.test.tsx`: lista e input rolam com `block: 'nearest'` ao abrir; seta para baixo rola a opção ativa; hover não rola; Esc fecha só a lista.

### Chrome real (playwright-core, `vite preview`), seed "Ano fiscal 2026"
Painel rolável do modal; todas as posições em px de viewport.
- 320x300 (simula teclado virtual; painel com 276px de altura útil): épico, iniciativa e objetivo. Input [142-181] e lista visíveis em todos (épico: lista [185-295] dentro de 300); opção ativa visível após 6x ArrowDown e 8x ArrowUp; Salvar alcançável (`scrollIntoViewIfNeeded` + `elementFromPoint` acerta o botão); Esc fecha só a lista (modal segue aberto, foco no input).
- 320x568: mesmos três formulários, input/lista/opção ativa visíveis, Salvar alcançável.
- 1280x720: sem regressão (input/lista/opção ativa visíveis, Salvar [706-745] sem sobreposição, Esc ok).
- Re-teste B1: após Esc o texto "Carla" é preservado e o modal fica aberto; remover chip devolve foco ao input sem abrir lista; 2º Esc fecha o modal (320 e 1280).
- Screenshots: `.../scratchpad/shots/c-{epic,ini,obj}-{320x300,320x568,1280x720}-*.png` (conferi visualmente o épico 320x300).
- `npm run lint` limpo; `npm run build` ok; `npm test` verde.

### Não verificado
- Teclado virtual real (iOS/Android): simulei só reduzindo a altura do viewport; `visualViewport` não é tratado.
- Safari/Firefox; leitor de tela; `prefers-reduced-motion` emulado (garantido só por não usar `smooth`).
- Em 320x300 o botão de abrir o formulário ficou coberto pelo cabeçalho da página para o Playwright (cliquei via `el.click()`); não investiguei se é problema real de layout nessa altura extrema.
