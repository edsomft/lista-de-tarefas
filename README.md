# lista-de-tarefas
Repositório destinado ao projeto da etapa N1 da disciplina de Desenvolvimento Web

## Como executar

1. `cd vanillajs`
2. `npm install`
3. Em um terminal: `npm run dev` (abre o app em `http://localhost:5173`)
4. Em outro terminal: `npm run server` (sobe o JSON Server em `http://localhost:3001`, usado para os avisos do quadro)

Sem o `npm run server` rodando, o app funciona normalmente (login, CRUD, filtros, drag and drop) — só o painel "Avisos do quadro" mostra uma mensagem de erro, já que ele depende do fetch ao JSON Server.

Com o JSON Server rodando, o painel "Avisos do quadro" também permite **publicar um aviso novo** (requisição `POST /avisos`). O aviso é gravado no `db.json` e continua lá depois de recarregar a página. Cada aviso tem um botão **Excluir** (requisição `DELETE /avisos/:id`), que apaga o registro do `db.json`.
