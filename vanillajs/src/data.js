export const COLUNAS = Object.freeze({
  A_FAZER: "a-fazer",
  EM_PROGRESSO: "em-progresso",
  CONCLUIDO: "concluido",
});

let tarefas = [];
let proximoId = 1;

function gerarId() {
  return proximoId++;
}

function criarObjetoTarefa(titulo) {
  return { id: gerarId(), titulo: titulo.trim(), coluna: COLUNAS.A_FAZER };
}

export function criarTarefa(titulo) {
  const novaTarefa = criarObjetoTarefa(titulo);
  tarefas.push(novaTarefa);
  return novaTarefa;
}

export function listarTarefas() {
  return tarefas;
}

export function moverTarefa(id, novaColuna) {
  const tarefa = tarefas.find((t) => t.id === id);
  if (!tarefa) return;
  tarefa.coluna = novaColuna;
}

export function deletarTarefa(id) {
  tarefas = tarefas.filter((t) => t.id !== id);
}

export function definirTarefas(tarefasCarregadas) {
  tarefas = tarefasCarregadas;
  const maiorId = tarefas.reduce((max, t) => Math.max(max, t.id), 0);
  proximoId = maiorId + 1;
}