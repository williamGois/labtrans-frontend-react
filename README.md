# Frontend React

Aplicacao React TypeScript para login, cadastro e gestao de reservas consumindo a Auth API .NET e a Reservations API Python.

## Tecnologias

- React
- TypeScript
- Vite
- Axios
- React Router
- React Hook Form
- Lucide React
- Vitest + Testing Library
- Playwright

## Variaveis

Copie `.env.example`:

```env
VITE_AUTH_API_URL=http://localhost:5001
VITE_RESERVATIONS_API_URL=http://localhost:8000
```

## Instalar

```powershell
npm ci
```

Se o cache padrao do npm estiver sem espaco:

```powershell
$env:npm_config_cache='D:\teste_python_dotnet\.npm-cache'
npm ci
```

## Rodar

```powershell
npm run dev
```

URL:

```text
http://localhost:5173
```

## Build, Lint e Testes

```powershell
npm run lint
npm run typecheck
npm run test
npm run e2e
npm run build
npm audit
```

Para rodar o Playwright contra o stack Docker completo ja ativo:

```powershell
npx playwright install chromium
$env:PLAYWRIGHT_SKIP_WEB_SERVER='1'
$env:PLAYWRIGHT_BASE_URL='http://localhost:5173'
npm run e2e
```

## Telas e Fluxos

- Login e cadastro integrados com a Auth API.
- Armazenamento do JWT em `localStorage`.
- Rotas protegidas sem token redirecionam para login.
- Listagem de reservas.
- Filtros por local, sala, periodo e busca textual.
- Visao de agenda por dia alem da tabela.
- Criacao e edicao de reservas.
- Filtro de salas por local.
- Confirmacao antes de excluir.
- Exclusao em lote por checkbox.
- Logout limpando token.
- Mensagem amigavel para conflito `409`.

## Integracao

O token recebido da Auth API e enviado para a Reservations API em todas as chamadas protegidas:

```text
Authorization: Bearer <token>
```

Todas as chamadas Axios tambem enviam `X-Correlation-ID`. Se uma API retornar `correlationId`, a UI mostra `Codigo de suporte: <correlationId>` junto da mensagem amigavel de erro.

## Observabilidade e Diagnostico

- Auth API: `http://localhost:5001/health/live`, `/health/ready`, `/metrics`.
- Reservations API: `http://localhost:8000/health/live`, `/health/ready`, `/metrics`.
- Runbook do front-end: `docs/OPERATIONS.md`.
- Decisao de diagnostico: `docs/ADR-001-observability-strategy.md`.
- Relatorio: `OBSERVABILITY_REPORT.md`.

O Dockerfile usa `node:22-alpine` no build e Nginx para servir os arquivos estaticos.
