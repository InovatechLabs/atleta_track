# Samples — FieldVision

Esta pasta contém arquivos fictícios para testar o fluxo de importação do FieldVision sem depender de dados reais.

## Arquivos

- `fieldvision_sample.csv`
- `fieldvision_sample.xlsx`

Ambos possuem as mesmas colunas oficiais aceitas pela tela **Importar** e pelo endpoint `POST /api/import`.

## Como usar

1. Suba o projeto conforme as instruções do `README.md` principal.
2. Acesse a tela **Importar** no frontend.
3. Envie `samples/fieldvision_sample.xlsx` ou `samples/fieldvision_sample.csv`.
4. Verifique os dashboards, atletas, comparação e alertas recalculados.

## Observações

- Os dados são 100% fictícios.
- As colunas obrigatórias mínimas são `Athlete ID` e `Start Date`.
- As demais colunas foram mantidas para representar o layout oficial esperado pelo importador.
