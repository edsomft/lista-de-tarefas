import { criarTarefa, deletarTarefa, moverTarefa } from "./data.js";
import { renderizarQuadro } from "./dom.js";

function configurarFormulario() {
  const form = document.getElementById("form-tarefa");
  const input = document.getElementById("input-titulo");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault(); // impede o navegador de recarregar a página

    const titulo = input.value.trim();
    if (titulo === "") return; // proteção extra, além do "required" do HTML

    criarTarefa(titulo);   // altera o array (Create)
    renderizarQuadro();    // redesenha a tela com o novo estado
    input.value = "";      // limpa o campo pra próxima tarefa
    input.focus();         // devolve o foco no input
  });
}

function configurarCliquesNoQuadro() {
  const quadro = document.querySelector(".quadro");

  // Delegação de eventos: um único listener no container pai,
  // que funciona mesmo para cards criados dinamicamente depois
  quadro.addEventListener("click", (evento) => {
    const botao = evento.target.closest(".botao-remover");
    if (!botao) return; // clicou em outro lugar do quadro, ignora

    const id = Number(botao.dataset.id); // dataset retorna string, convertemos pra número
    deletarTarefa(id);
    renderizarQuadro();
  });
}

function configurarDragAndDrop() {
  const quadro = document.querySelector(".quadro");

  // 1) Início do arraste: guarda o id do card sendo arrastado
  quadro.addEventListener("dragstart", (evento) => {
    const card = evento.target.closest(".card");
    if (!card) return;
    evento.dataTransfer.setData("text/plain", card.dataset.id);
  });

  document.querySelectorAll(".lista-cards").forEach((lista) => {
    // 2) Passando por cima de uma coluna: precisa liberar o drop
    lista.addEventListener("dragover", (evento) => {
      evento.preventDefault(); // essencial, sem isso o "drop" nunca dispara
      lista.closest(".coluna").classList.add("arrastando-sobre");
    });

    lista.addEventListener("dragleave", () => {
      lista.closest(".coluna").classList.remove("arrastando-sobre");
    });

    // 3) Soltou o card: aqui acontece o Update (mudança de coluna)
    lista.addEventListener("drop", (evento) => {
      evento.preventDefault();
      lista.closest(".coluna").classList.remove("arrastando-sobre");

      const id = Number(evento.dataTransfer.getData("text/plain"));
      const novaColuna = lista.dataset.coluna;

      moverTarefa(id, novaColuna);
      renderizarQuadro();
    });
  });
}

export function configurarEventos() {
  configurarFormulario();
  configurarCliquesNoQuadro();
  configurarDragAndDrop();
}