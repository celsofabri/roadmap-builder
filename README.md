# Roadmap Builder

Ferramenta front-end para criar e gerenciar roadmaps de time — por formulário e por
drag-and-drop numa timeline visual. Todos os dados ficam no `localStorage` do navegador.

## Stack

- **React 19 + TypeScript + Vite**
- **Zustand** — estado global
- **@dnd-kit** — drag-and-drop da timeline
- **Zod** — validação de formulários e do JSON importado
- **date-fns** — datas "civis" (sem timezone)
- **SCSS Modules** — estilos por componente, tokens em `src/styles/`

## Modelo de dados

```
Roadmap → Objective → Epic → Initiative
```

O período do roadmap é livre (mês/ano de início e fim), não precisa coincidir com o ano
calendário. Datas de épicos e iniciativas fora do intervalo do pai geram apenas um aviso,
nunca bloqueiam o salvamento.

## Desenvolvimento

```bash
npm install
npm run dev        # servidor de desenvolvimento em http://localhost:5173
npm run build      # tsc -b && vite build
npm run preview    # serve o build de produção
npm run lint       # oxlint
```

## Deploy — GitHub Pages

O deploy é automático via GitHub Actions: todo push em `main` roda lint, type check e build,
e publica o resultado no GitHub Pages.

### Configuração inicial (uma vez)

1. Crie o repositório no GitHub e faça o push da branch `main`.
2. Em **Settings → Pages → Build and deployment**, defina **Source: GitHub Actions**.
3. Pronto — o próximo push em `main` publica o site.

O endereço final é `https://<usuario>.github.io/<repositorio>/`.

### Sobre o `base` do Vite

GitHub Pages serve projetos a partir de um subcaminho (`/<repositorio>/`), então o build
precisa desse prefixo nos assets. O workflow resolve isso sozinho:
`actions/configure-pages` informa o caminho, que é normalizado e passado ao build via
`VITE_BASE_PATH`. Builds locais continuam usando `/`.

Isso significa que **renomear o repositório não quebra o deploy** — o caminho é derivado em
tempo de execução, não fixado no código.

### Workflows

| Arquivo | Quando roda | O que faz |
| --- | --- | --- |
| `.github/workflows/deploy.yml` | push em `main`, ou manualmente | lint → build → publica no Pages |
| `.github/workflows/ci.yml` | pull requests para `main` | lint → build (sem publicar) |
