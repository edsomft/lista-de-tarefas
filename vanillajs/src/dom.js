import { listarTarefas, COLUNAS } from "./data.js";

const IDS_CONTAINERS = {
  [COLUNAS.A_FAZER]: "lista-a-fazer",
  [COLUNAS.EM_PROGRESSO]: "lista-em-progresso",
  [COLUNAS.CONCLUIDO]: "lista-concluido",
};

function criarElementoCard(tarefa) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = tarefa.id;

  const titulo = document.createElement("span");
  titulo.textContent = tarefa.titulo;

  const botaoRemover = document.createElement("button");
  botaoRemover.textContent = "✕";
  botaoRemover.className = "botao-remover";
  botaoRemover.dataset.id = tarefa.id;

  card.appendChild(titulo);
  card.appendChild(botaoRemover);

  return card;
}

export function renderizarQuadro() {
  const tarefas = listarTarefas();

  Object.values(IDS_CONTAINERS).forEach((idContainer) => {
    const container = document.getElementById(idContainer);
    container.innerHTML = "";
  });

  tarefas.forEach((tarefa) => {
    const idContainer = IDS_CONTAINERS[tarefa.coluna];
    const container = document.getElementById(idContainer);
    const card = criarElementoCard(tarefa);
    container.appendChild(card);
  });
}