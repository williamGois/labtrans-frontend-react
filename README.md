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
npm run build
npm audit
```

## Telas e Fluxos

- Login e cadastro integrados com a Auth API.
- Armazenamento do JWT em `localStorage`.
- Rotas protegidas sem token redirecionam para login.
- Listagem de reservas.
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

O Dockerfile usa `node:22-alpine` no build e Nginx para servir os arquivos estaticos.
