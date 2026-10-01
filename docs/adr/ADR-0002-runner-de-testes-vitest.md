# ADR-0002: Adotar Vitest + Testing Library como runner de testes e gate de CI/deploy

- **Status:** Aceita (aprovado pelo Manager em 2026-10-01; adiciona devDependencies e altera `ci.yml` e `deploy.yml`)
- **Data:** 2026-10-01
- **Relacionados:** `docs/design/owners-e-fullscreen.md` (seção 4), ADR-0001

## Contexto

O repositório não tem runner de testes (`package.json` só tem `dev`, `build`, `lint`, `preview`). O Definition of Done do squad exige testes automatizados para comportamento novo, e o princípio "primeiro cubra com teste, depois mude" se aplica à migração de dados do ADR-0001. O deploy é automático a cada push em `main`, sem staging, e `deploy.yml` hoje roda só lint e `tsc -b && vite build`. Stack: Vite 8, React 19, TS 6, SCSS Modules, alias `@/`.

## Decisão

Adotar **Vitest** com **jsdom** e **@testing-library/react** (+ `jest-dom`, `user-event` e o peer `@testing-library/dom`, exigido pelo RTL 16), **somente como `devDependencies`** (não entram no bundle).

- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
- Configuração no `vite.config.ts` (bloco `test`): ambiente `node` por padrão, `jsdom` por arquivo; `setupFiles` com jest-dom e stub de `ResizeObserver`. Testes em `src/**/*.test.ts(x)`, importando de `vitest` explicitamente (sem `globals`, sem alterar `tsconfig.app.json`).
- **CI:** novo passo `npm test` em `ci.yml` (após lint) e em `deploy.yml` (job `build`, antes do build). Teste vermelho **bloqueia o deploy**.
- Escopo mínimo: unitário (utils, schema), serviço (`localStorage` em jsdom) e componente. **Não** adotar E2E agora.
- Layout real (rolagem, Fullscreen API, print) continua em roteiro manual do QA; `data-fit-scale` e `data-fullscreen-mode` facilitam a conferência.

## Alternativas rejeitadas

- **`node:test` + tsx:** zero dependência, mas não resolve alias `@/`, SCSS Modules nem DOM.
- **Jest:** segunda cadeia de transformação ao lado do Vite; mais configuração e atrito com ESM/TS 6.
- **Playwright agora:** valida layout real, mas traz binários de browser, tempo e flakiness no CI; custo desproporcional para duas features. Reavaliar se houver regressões de fullscreen/print.
- **Só roteiro manual:** não protege migração de dados nem regressões em deploy automático.

## Consequências

**Positivas**
- Reuso da configuração do Vite (mesma resolução e transformação), execução rápida.
- Migração de dados e `computeFit` ficam cobertos por testes numéricos determinísticos.
- Deploy passa a ter um gate de comportamento, não só de tipos.

**Negativas**
- 5 novas devDependencies para manter (Dependabot/atualização) e mais tempo de `npm ci` (estimado +20-40 s por execução de CI, não medido).
- jsdom não faz layout: não substitui o QA manual para rolagem/escala/print.
- Compatibilidade exata das versões com Vite 8 / TS 6 precisa ser conferida no `npm install` (confiança média hoje); plano B: ajustar versões ou, se inviável, manter T0 isolado e voltar ao roteiro manual.
- `tsc -b` passa a compilar os testes (desejado, mas exige tipos de jest-dom no setup).

## Reversão

Remover o bloco `test`, os scripts, o passo nos dois workflows e as devDependencies. Nenhum código de produção depende do runner.
