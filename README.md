# Caderno de Lembretes — Programação III (UMFG)

Front-end (HTML/CSS/JS) + Minimal API .NET de lembretes.

## Estrutura
- `api/` — Minimal API (.NET + MySQL)
- `front-end/` — interface web

## Como executar
1. Suba o MySQL (porta 3306, usuário `root`, senha `root`) — as migrations rodam sozinhas.
2. API:
   ```bash
   cd api/umfg.programacaoiii.minimalapi.2026
   dotnet dev-certs https --trust   # só na primeira vez
   dotnet run --launch-profile https
   ```

3. Front-end: abrir `front-end/index.html` com a extensão **Live Server** do VS Code.

## Funcionalidades
- CRUD de lembretes (GET, GET por id, POST, PUT, DELETE)
- Filtros: descrição, cadastro inicial/final, atualização inicial/final
- Paginação e quantidade por página; ordenação ao clicar no cabeçalho da coluna
- Mensagens de sucesso, erro de comunicação com a API, lista vazia e campos obrigatórios
- Layout responsivo com tema próprio "caderno"

## Ajustes feitos na API
- `Program.cs`: a ordenação usava `x => dto.Ordem` (constante) e não ordenava; agora ordena por Descrição, DataCadastro ou DataAtualizacao.
- `LembreteQueryDTO.cs`: padrões de `DataCadastroFinal` e `DataAtualizacaoInicial` corrigidos, para que filtros de data não preenchidos não bloqueiem os resultados.
