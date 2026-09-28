// api.js — único arquivo que fala com o JSON Server (fetch fica isolado da UI).
// Rode "npm run server" em outro terminal para o JSON Server responder aqui.

const BASE_URL = "http://localhost:3001";

export async function buscarAvisos() {
  const resposta = await fetch(`${BASE_URL}/avisos`);
  if (!resposta.ok) throw new Error(`Falha ao buscar avisos (HTTP ${resposta.status}).`);
  return resposta.json();
}
