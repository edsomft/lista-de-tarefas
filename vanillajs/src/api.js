// api.js — único arquivo que fala com o JSON Server (fetch fica isolado da UI).
// Rode "npm run server" em outro terminal para o JSON Server responder aqui.

const BASE_URL = "http://localhost:3001";

export async function buscarAvisos() {
  const resposta = await fetch(`${BASE_URL}/avisos`);
  if (!resposta.ok) throw new Error(`Falha ao buscar avisos (HTTP ${resposta.status}).`);
  return resposta.json();
}

// POST /avisos — cria um aviso novo no JSON Server.
// - method: "POST" e o header Content-Type dizem ao servidor que o corpo é JSON.
// - body precisa ser texto, por isso o JSON.stringify.
// - Não enviamos "id": o JSON Server gera o próximo sozinho e devolve o
//   objeto criado já com ele (ex.: { id: 4, mensagem: "..." }).
export async function criarAviso(mensagem) {
  const resposta = await fetch(`${BASE_URL}/avisos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensagem }),
  });
  if (!resposta.ok) throw new Error(`Falha ao criar aviso (HTTP ${resposta.status}).`);
  return resposta.json();
}

// DELETE /avisos/:id — apaga um aviso pelo id.
// Aqui o id vai na URL (é assim que o JSON Server sabe QUAL registro apagar)
// e não há body. Em caso de sucesso ele responde 200 com "{}", por isso
// não precisamos ler a resposta.
export async function removerAviso(id) {
  const resposta = await fetch(`${BASE_URL}/avisos/${id}`, { method: "DELETE" });
  if (!resposta.ok) throw new Error(`Falha ao excluir aviso (HTTP ${resposta.status}).`);
}
