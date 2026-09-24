// eventos.js — todos os addEventListener da aplicação.
// Padrão de cada evento: (1) altera o estado via data.js  →  (2) chama atualizarInterface().

import {
  estado,
  filtrosPadrao,
  buscarTarefa,
  buscarTag,
  criarTarefa,
  atualizarTarefa,
  removerTarefa,
  moverTarefa,
  criarTag,
  removerTag,
  statusVizinho,
  validarTarefa,
} from "./data.js";
import {
  atualizarInterface,
  sincronizarFiltros,
  renderizarFiltroTags,
  renderizarTagsNoModal,
  atualizarResumoTags,
  marcarTagNoModal,
  mostrarMensagemTag,
  abrirModal,
  fecharModal,
  lerFormulario,
  mostrarErroFormulario,
} from "./dom.js";

export function registrarEventos() {
  registrarEventosFiltros();
  registrarEventosQuadro();
  registrarEventosModal();
  registrarEventosArrastar();
}

/* ------------------------------------------------------------------ */
/* Busca e filtros                                                     */
/* ------------------------------------------------------------------ */

function registrarEventosFiltros() {
  // Busca: dispara a cada letra digitada.
  document.querySelector("#filtro-busca").addEventListener("input", (evento) => {
    estado.filtros.busca = evento.target.value;
    atualizarInterface();
  });

  // Selects: cada um grava o valor escolhido em uma chave de estado.filtros.
  const selects = [
    ["#filtro-categoria", "categoriaId"],
    ["#filtro-prioridade", "prioridade"],
    ["#filtro-tag", "tagId"],
    ["#filtro-ordem", "ordem"],
  ];
  selects.forEach(([seletor, chave]) => {
    document.querySelector(seletor).addEventListener("change", (evento) => {
      estado.filtros[chave] = evento.target.value;
      atualizarInterface();
    });
  });

  document.querySelector("#btn-limpar").addEventListener("click", () => {
    Object.assign(estado.filtros, filtrosPadrao);
    sincronizarFiltros();
    atualizarInterface();
  });
}

/* ------------------------------------------------------------------ */
/* Botões dos cartões (delegação de eventos)                           */
/* ------------------------------------------------------------------ */

// Os cartões são recriados a cada renderização. Por isso o listener fica no
// #quadro (que nunca é recriado) e descobrimos qual botão foi clicado com closest().
function registrarEventosQuadro() {
  document.querySelector("#btn-nova").addEventListener("click", () => abrirModal());

  document.querySelector("#quadro").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-acao]");
    if (!botao) return;

    const id = Number(botao.closest(".cartao").dataset.id);
    const tarefa = buscarTarefa(id);
    if (!tarefa) return;

    switch (botao.dataset.acao) {
      case "editar":
        abrirModal(tarefa);
        break;

      case "excluir":
        if (confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) {
          removerTarefa(id);
          atualizarInterface();
        }
        break;

      case "mover-anterior":
      case "mover-proximo": {
        const direcao = botao.dataset.acao === "mover-proximo" ? 1 : -1;
        const novoStatus = statusVizinho(tarefa.status, direcao);
        if (novoStatus) {
          moverTarefa(id, novoStatus);
          atualizarInterface();
        }
        break;
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/* Modal: salvar (criar ou editar) e fechar                            */
/* ------------------------------------------------------------------ */

function registrarEventosModal() {
  const modal = document.querySelector("#modal-tarefa");
  const formulario = document.querySelector("#form-tarefa");

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault(); // não deixa a página recarregar

    const { id, ...campos } = lerFormulario();
    const erro = validarTarefa(campos);
    if (erro) {
      mostrarErroFormulario(erro);
      return;
    }

    if (id) {
      atualizarTarefa(id, campos); // já existe → editar
    } else {
      criarTarefa(campos); // não tem id → cadastrar
    }

    fecharModal();
    atualizarInterface();
  });

  document.querySelector("#btn-cancelar").addEventListener("click", fecharModal);

  const menuTags = document.querySelector("#menu-tags");

  // Clicar fora da janela (no fundo escuro) também fecha;
  // clicar em qualquer lugar fora do menu de tags fecha só o menu.
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) fecharModal();
    if (!menuTags.contains(evento.target)) menuTags.open = false;
  });

  registrarEventosTags();
}

/* ------------------------------------------------------------------ */
/* Tags: marcar e criar direto pelo menu suspenso                      */
/* ------------------------------------------------------------------ */

function registrarEventosTags() {
  const listaTags = document.querySelector("#lista-tags-menu");

  // Marcou/desmarcou uma tag: atualiza o texto "2 tags selecionadas".
  listaTags.addEventListener("change", atualizarResumoTags);

  // Clique no "×" de uma tag: exclui a tag (e remove ela de qualquer tarefa que a usava).
  listaTags.addEventListener("click", (evento) => {
    const botao = evento.target.closest(".botao-excluir-tag");
    if (!botao) return;

    const id = Number(botao.dataset.tagId);
    const tag = buscarTag(id);
    if (!tag) return;

    if (confirm(`Excluir a tag "${tag.nome}"? Ela será removida de todas as tarefas.`)) {
      removerTag(id);
      renderizarTagsNoModal();
      renderizarFiltroTags();
      atualizarInterface();
      mostrarMensagemTag(`Tag "${tag.nome}" excluída.`);
    }
  });

  const campo = document.querySelector("#nova-tag");

  function criarTagDoCampo() {
    const resultado = criarTag(campo.value);
    if (resultado.erro) {
      mostrarMensagemTag(resultado.erro);
      return;
    }

    const { tag, criada } = resultado;
    renderizarTagsNoModal(); // a tag nova aparece na lista (mantendo as marcadas)
    marcarTagNoModal(tag.id); // e já vem marcada para esta tarefa
    renderizarFiltroTags(); // e também passa a existir no filtro
    campo.value = "";
    mostrarMensagemTag(
      criada ? `Tag "${tag.nome}" criada.` : `A tag "${tag.nome}" já existia e foi marcada.`
    );
  }

  document.querySelector("#btn-criar-tag").addEventListener("click", criarTagDoCampo);

  // Enter dentro do campo criaria a tag; sem o preventDefault ele ENVIARIA o formulário.
  campo.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      criarTagDoCampo();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Arrastar e soltar entre colunas                                     */
/* ------------------------------------------------------------------ */

function registrarEventosArrastar() {
  const quadro = document.querySelector("#quadro");

  quadro.addEventListener("dragstart", (evento) => {
    const cartao = evento.target.closest(".cartao");
    if (!cartao) return;
    evento.dataTransfer.setData("text/plain", cartao.dataset.id);
    evento.dataTransfer.effectAllowed = "move";
    cartao.classList.add("arrastando");
  });

  quadro.addEventListener("dragend", (evento) => {
    const cartao = evento.target.closest(".cartao");
    if (cartao) cartao.classList.remove("arrastando");
  });

  // Sem preventDefault() no dragover, o navegador não permite soltar (drop).
  quadro.addEventListener("dragover", (evento) => {
    const coluna = evento.target.closest(".coluna");
    if (!coluna) return;
    evento.preventDefault();
    coluna.classList.add("alvo");
  });

  quadro.addEventListener("dragleave", (evento) => {
    const coluna = evento.target.closest(".coluna");
    if (coluna && !coluna.contains(evento.relatedTarget)) {
      coluna.classList.remove("alvo");
    }
  });

  quadro.addEventListener("drop", (evento) => {
    const coluna = evento.target.closest(".coluna");
    if (!coluna) return;
    evento.preventDefault();
    coluna.classList.remove("alvo");

    const id = Number(evento.dataTransfer.getData("text/plain"));
    const tarefa = buscarTarefa(id);
    if (tarefa && tarefa.status !== coluna.dataset.status) {
      moverTarefa(id, coluna.dataset.status);
      atualizarInterface();
    }
  });
}
