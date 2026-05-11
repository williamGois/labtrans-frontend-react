# ADR-001 - Frontend Diagnostics Strategy

## Contexto

O front-end consome dois back-ends independentes. Erros precisam ser rastreados sem expor stack trace ao usuario final.

## Decisao

- Enviar `X-Correlation-ID` em todos os requests Axios.
- Preservar mensagem amigavel retornada pela API.
- Exibir `Codigo de suporte` quando a API retornar `correlationId`.
- Nao exibir stack trace na UI.

## Consequencias

Um erro visto pelo usuario pode ser associado aos logs e metricas dos back-ends usando o mesmo correlation ID.
