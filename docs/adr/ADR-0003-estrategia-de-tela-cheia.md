# ADR-0003: Tela cheia como overlay CSS com Fullscreen API progressiva e snapshot somente leitura com escala uniforme

- **Status:** Aceita e implementada (T8–T14). Impressão (`@media print` + `beforeprint`) permanece *best effort*, não validada em navegadores reais
- **Data:** 2026-10-01
- **Relacionados:** `docs/design/owners-e-fullscreen.md` (seção 2), spec Item 2 (Q-F1, Q-F2, Q-F3, Q-F4)

## Contexto

O usuário precisa ver todo o roadmap em uma tela, sem rolagem, para print/apresentação. Hoje a timeline usa `MIN_DAY_WIDTH` por granularidade (gera rolagem horizontal), altura dirigida por conteúdo com rolagem vertical no `.content`, e interações (dnd-kit com snap por `dayWidth`, resize por `pointermove`) que assumem pixels sem escala. Fullscreen API não existe em iOS Safari para elementos não-vídeo e o Esc nativo não chega ao app.

## Decisão

1. **Overlay CSS como base, Fullscreen API como melhoria progressiva.** O overlay (`position: fixed; inset: 0; height: 100dvh`, via `createPortal`) é sempre renderizado; no clique de entrada tenta-se `document.documentElement.requestFullscreen()` (síncrono, dentro do gesto), com `try/catch`. `fullscreenchange` fecha o modo se o nativo terminar (Esc nativo); Esc no `keydown` fecha o overlay, exceto com modal aberto. `data-fullscreen-mode="native|overlay"` registra o caminho usado.
2. **Componente separado e somente leitura** (`TimelineSnapshot`), reaproveitando só a apresentação (`EpicBarView`, `InitiativeBarView`, `OwnerAvatarStack`, helpers puros). A `TimelineView` interativa **não** é alterada.
3. **Fit por escala uniforme:** `scale = clamp(viewportH / naturalH, 0.05, 1)`, `logicalW = viewportW / scale`, `dayWidth = (logicalW - labelWidth) / totalDays` **sem** `MIN_DAY_WIDTH`, renderizado com `transform: scale()` e `transform-origin: top left`. Nunca amplia, nunca rola; abaixo de 50% mostra aviso (sem bloquear). Lógica em função pura `computeFit`.
4. **Régua mensal forçada** no modo; rótulos com stride quando a célula fica estreita.
5. Foco e isolamento: `role="dialog"`, foco no botão Sair, `inert` em `#root`, foco devolvido ao botão de entrada. Estado não persistido.
6. Impressão (`@media print` + `beforeprint/afterprint`) é iteração 2, tratada como spike *best effort*.

## Alternativas rejeitadas

- **Só Fullscreen API:** quebra no iOS e deixa o app "preso" quando o nativo é negado/encerrado sem o app saber.
- **Só overlay CSS:** funciona, mas perde a tela inteira real no desktop, que é o ganho para captura e apresentação.
- **Fullscreen API no elemento do overlay:** exigiria criar o elemento antes do gesto; usar `documentElement` mantém o gesto síncrono e modais/portais visíveis.
- **Adicionar `readOnly` à `TimelineView`/barras existentes:** `useDraggable`/`useDroppable` não podem ser condicionais, aumenta o risco de regressão na timeline atual (o comportamento atual é o contrato) e carrega rolagem/`MIN_DAY_WIDTH` que queremos evitar.
- **Aplicar `transform: scale` sobre a `TimelineView` atual:** dnd-kit e resize ficam com coordenadas erradas; a rolagem e a altura dirigida por conteúdo continuam.
- **`zoom` CSS ou reduzir fontes por JS:** `zoom` afeta o layout e dificulta a medição; reduzir fontes individualmente perde proporção entre barras e texto.
- **Biblioteca de captura (html2canvas) para exportar PNG:** fora de escopo (Q-F8); exigiria dependência nova e ADR própria.

## Consequências

**Positivas**
- Funciona em qualquer navegador (fallback nativo) com um único caminho de render.
- Zero regressão na timeline interativa; o snapshot é simples e testável (`computeFit` puro; `data-fit-scale`).
- Sem dependência nova.

**Negativas / riscos**
- Duas fontes de estado (app e navegador) a sincronizar; coberto por teste simulado e QA manual em 4 navegadores.
- Pequena duplicação de layout entre lane interativa e snapshot (mitigada compartilhando views e SCSS).
- Risco de oscilação do fit se algo quebrar linha em função da largura: exige cabeçalho/legenda em linha única e histerese de 0,5%.
- Texto pode ficar pequeno em roadmaps densos (aviso < 50%).
- Impressão fiel ao tamanho da folha não é garantida (spike).
- `inert` exige navegadores modernos (suportado nos atuais; sem polyfill).
