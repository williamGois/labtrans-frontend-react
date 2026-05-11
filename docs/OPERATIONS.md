# Frontend Operations

## Variaveis

```env
VITE_AUTH_API_URL=http://localhost:5001
VITE_RESERVATIONS_API_URL=http://localhost:8000
```

## Rodar

```powershell
npm ci
npm run dev
```

## Diagnostico de erro

O front-end envia `X-Correlation-ID` em chamadas Axios para Auth API e Reservations API.

Quando uma API retorna `correlationId` no corpo ou no header `X-Correlation-ID`, a mensagem amigavel mostra:

```text
Codigo de suporte: <correlationId>
```

Use esse valor para procurar nos logs dos back-ends.

## Build e testes

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --audit-level=high
```

## 401 no front-end

1. Confirme se `labtrans_access_token` existe no `localStorage`.
2. Confirme se o token foi enviado como `Authorization: Bearer <token>`.
3. Use o codigo de suporte exibido pela UI para buscar logs nos back-ends.
4. Se o token estiver expirado ou invalido, execute logout e login novamente.

## 409 conflito de reserva

O front-end exibe a mensagem retornada pela Reservations API e o codigo de suporte quando disponivel.
