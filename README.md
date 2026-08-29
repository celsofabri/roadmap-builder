# Roadmap Builder

Ferramenta front-end para criar e gerenciar roadmaps de time — por formulário e por
drag-and-drop numa timeline visual.

**No ar:** https://celsofabri.github.io/roadmap-builder/

> Os dados ficam apenas no `localStorage` do navegador. Não há back-end: nada é enviado para
> nenhum servidor, e limpar os dados do site apaga os roadmaps. Use **Exportar JSON** para
> guardar uma cópia.

---

## Funcionalidades

- **Múltiplos roadmaps** — criar, renomear, duplicar e excluir pela sidebar
- **Hierarquia completa** — Objetivo → Épico → Iniciativa, com CRUD por formulário
- **Timeline drag-and-drop** — arrastar barras para mover datas, puxar as bordas para
  redimensionar, soltar em outra raia para reatribuir
- **Granularidade** mensal ou semanal (muda só a régua, não os dados)
- **Import/export JSON** — de um roadmap ou de todos; a importação valida o schema e
  regenera todos os IDs para não colidir com o que já existe
- **Responsivo** — sidebar vira drawer abaixo de 1024px; pode ser reduzida a um rail no desktop

## Stack

| Área | Escolha |
| --- | --- |
| Base | React 19 + TypeScript + Vite |
| Estado | Zustand |
| Drag-and-drop | `@dnd-kit` |
| Validação | Zod (formulários e JSON importado) |
| Datas | date-fns — datas "civis", sem timezone |
| Estilos | SCSS Modules, com tokens em `src/styles/` |
| Lint | oxlint |

## Modelo de dados

```
Roadmap → Objective → Epic → Initiative
```

O período do roadmap é livre (mês/ano de início e fim) — não precisa coincidir com o ano
calendário. Datas de épicos e iniciativas fora do intervalo do pai geram apenas um **aviso**,
nunca bloqueiam o salvamento.

---

## Rodando localmente

### 1. Requisito: Node 24.20.0 (LTS "Krypton")

A versão está fixada em [`.nvmrc`](.nvmrc). Com [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install          # lê o .nvmrc e instala a versão certa
nvm use              # ativa nela nesta sessão do terminal
```

Para deixar como padrão em **todo terminal novo** (recomendado):

```bash
nvm alias default 24.20.0
```

Com [fnm](https://github.com/Schniz/fnm), use `fnm use` — ele também lê o `.nvmrc`.

Confira antes de seguir:

```bash
node -v    # precisa imprimir v24.20.0
```

### 2. Instalar e rodar

```bash
npm ci               # instalação limpa, respeitando o package-lock.json
npm run dev          # http://localhost:5173
```

Use `npm ci` (e não `npm install`) para reproduzir exatamente as versões do lockfile — é o
mesmo comando que o CI roda.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com HMR em http://localhost:5173 |
| `npm run build` | `tsc -b && vite build` — erro de tipo falha o build |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | oxlint |

### Estrutura

```
src/
├── components/
│   ├── forms/      formulários de objetivo, épico e iniciativa
│   ├── layout/     sidebar e estado vazio do workspace
│   ├── roadmap/    detalhe do roadmap, timeline, barras e raias
│   └── shared/     modal, confirmação, date picker, ícones, badge
├── schemas/        schemas Zod (formulários + JSON importado)
├── services/       storage (localStorage), export e import
├── store/          store Zustand — toda mutação passa por aqui
├── styles/         tokens, mixins e o módulo de estilos compartilhados
├── types/          o modelo de dados
└── utils/          datas, empilhamento da timeline, seed, status
```

`services/storageService.ts` isola o `localStorage` atrás de uma interface — trocar por uma
API depois não exige reescrever a lógica de negócio.

---

## Deploy — GitHub Pages

Já está configurado e funcionando. **Todo push em `main` publica automaticamente**: o
workflow roda lint, type check e build, e só então publica. Se qualquer etapa falhar, o
deploy não acontece.

Para acompanhar um deploy, veja a aba **Actions** do repositório. Também dá para disparar
manualmente em **Actions → Deploy to GitHub Pages → Run workflow**.

### Workflows

| Arquivo | Quando roda | O que faz |
| --- | --- | --- |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | push em `main`, ou manualmente | lint → build → publica no Pages |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | pull requests para `main` | lint → build (sem publicar) |

Os dois usam `node-version-file: .nvmrc`, então a versão do Node no CI é sempre a mesma do
ambiente local — não existe número duplicado para manter em sincronia.

### Sobre o `base` do Vite

GitHub Pages serve projetos a partir de um subcaminho (`/<repositorio>/`), então os assets
precisam desse prefixo. O workflow resolve sozinho: `actions/configure-pages` informa o
caminho, que é normalizado e passado ao build via `VITE_BASE_PATH`. Builds locais continuam
usando `/`.

Como o caminho é derivado em tempo de execução e não fixado no código, **renomear o
repositório não quebra o deploy**.

Para simular o build de produção localmente:

```bash
VITE_BASE_PATH=/roadmap-builder/ npm run build
npm run preview
```

### Refazendo a configuração do zero

Se for publicar em outro repositório:

1. Faça o push da branch `main`.
2. Em **Settings → Pages → Build and deployment**, escolha **Source: GitHub Actions**.
3. O próximo push em `main` publica em `https://<usuario>.github.io/<repositorio>/`.

---

## Solução de problemas

**`node -v` não mostra v24.20.0 mesmo depois do `nvm use`**
O nvm é carregado pelo `.zshrc`, que só roda em shell **interativo**. Em shell
não-interativo (scripts com `sh -c`, integrações de editor, apps de GUI) o `PATH` pode cair
em outro Node — por exemplo um instalado via Homebrew em `/opt/homebrew/bin/node`. Confira
com `which -a node`. Se isso atrapalhar, considere manter só o nvm (`brew uninstall node`).

**Erros estranhos depois de trocar de versão do Node**
`fsevents` e `@parcel/watcher` são módulos nativos ligados à ABI do Node. Ao mudar de versão,
reinstale:

```bash
rm -rf node_modules && npm ci
```

**O deploy passou mas o site mostra página em branco**
Quase sempre é o `base` do Vite. Confira no log do job **Resolve base path** se o valor
impresso bate com o nome do repositório, e no HTML publicado se os assets apontam para
`/<repositorio>/assets/...`.

**Aviso "Node.js 20 is deprecated" nos logs do Actions**
É sobre o runtime das actions oficiais (`checkout`, `setup-node`, `deploy-pages`), não sobre
a versão que compila o projeto. Não afeta o build e some quando a GitHub publicar as versões
novas dessas actions.
