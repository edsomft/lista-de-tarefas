// eventos.js — todos os addEventListener da aplicação.
// Padrão de cada evento: (1) altera o estado (data.js/auth.js) → (2) redesenha a tela.

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
  login,
  validarLogin,
  registrarUsuario,
  validarRegistro,
  logout,
  usuarioLogado,
  atualizarPerfil,
} from "./auth.js";
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
  mostrarErrosCampos,
  limparErrosCampos,
  alternarParaRegistro,
  alternarParaLogin,
  abrirModalPerfil,
  fecharModalPerfil,
  atualizarPreviewAvatar,
} from "./dom.js";

/* ==================================================================== */
/* Tela de login / criar conta                                          */
/* ==================================================================== */

// renderizarApp é passado pelo main.js: é a função que decide, de novo,
// se mostra o quadro ou a tela de login (chamada depois de qualquer
// mudança de sessão: login, registro, perfil salvo, logout).
export function registrarEventosAuth(renderizarApp) {
  document.querySelector("#btn-ir-registro").addEventListener("click", alternarParaRegistro);
  document.querySelector("#btn-ir-login").addEventListener("click", alternarParaLogin);

  const formLogin = document.querySelector("#form-login");
  formLogin.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const dados = {
      email: formLogin.elements.email.value,
      senha: formLogin.elements.senha.value,
    };

    const errosCampos = validarLogin(dados);
    if (Object.keys(errosCampos).length > 0) {
      mostrarErrosCampos(formLogin, errosCampos);
      return;
    }
    limparErrosCampos(formLogin);
    document.querySelector("#erro-login-geral").textContent = "";

    const resultado = login(dados);
    if (resultado.erro) {
      document.querySelector("#erro-login-geral").textContent = resultado.erro;
      return;
    }

    renderizarApp(); // login deu certo: troca a tela de login pelo quadro
  });

  const formRegistro = document.querySelector("#form-registro");
  formRegistro.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const dados = {
      nome: formRegistro.elements.nome.value,
      email: formRegistro.elements.email.value,
      senha: formRegistro.elements.senha.value,
      confirmarSenha: formRegistro.elements.confirmarSenha.value,
    };

    const erros = validarRegistro(dados);
    if (Object.keys(erros).length > 0) {
      mostrarErrosCampos(formRegistro, erros);
      return;
    }
    limparErrosCampos(formRegistro);

    registrarUsuario(dados); // já entra logado com a conta criada
    renderizarApp();
  });
}

/* ==================================================================== */
/* Cabeçalho: abrir perfil e sair                                       */
/* ==================================================================== */

// Guarda a foto escolhida (ainda não salva) enquanto o modal de perfil está aberto.
let avatarSelecionadoDataUrl = null;

function registrarEventosPerfil(renderizarApp) {
  document.querySelector("#btn-perfil").addEventListener("click", () => {
    avatarSelecionadoDataUrl = null;
    abrirModalPerfil(usuarioLogado());
  });

  document.querySelector("#btn-sair").addEventListener("click", () => {
    logout();
    renderizarApp(); // "redireciona" para a tela de login
  });

  document.querySelector("#btn-sair-perfil").addEventListener("click", () => {
    logout();
    renderizarApp();
  });

  const modal = document.querySelector("#modal-perfil");
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) fecharModalPerfil();
  });

  document.querySelector("#input-avatar").addEventListener("change", (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = () => {
      avatarSelecionadoDataUrl = leitor.result; // string base64 (data:image/...;base64,...)
      atualizarPreviewAvatar(avatarSelecionadoDataUrl);
    };
    leitor.readAsDataURL(arquivo);
  });

  const formulario = document.querySelector("#form-perfil");
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const nome = formulario.elements.nome.value;
    const erros = {};
    if (nome.trim().length < 2) {
      erros.nome = "Informe um nome (mínimo 2 caracteres).";
    }
    if (Object.keys(erros).length > 0) {
      mostrarErrosCampos(formulario, erros);
      return;
    }
    limparErrosCampos(formulario);

    const campos = { nome: nome.trim() };
    if (avatarSelecionadoDataUrl) campos.avatar = avatarSelecionadoDataUrl;

    atualizarPerfil(usuarioLogado().id, campos);
    renderizarApp(); // redesenha o cabeçalho com o nome/foto atualizados
  });
}

/* ==================================================================== */
/* Busca e filtros                                                      */
/* ==================================================================== */

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

/* ==================================================================== */
/* Botões dos cartões (delegação de eventos)                            */
/* ==================================================================== */

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

/* ==================================================================== */
/* Modal de tarefa: salvar (criar ou editar) e fechar                   */
/* ==================================================================== */

function registrarEventosModal() {
  const modal = document.querySelector("#modal-tarefa");
  const formulario = document.querySelector("#form-tarefa");

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault(); // não deixa a página recarregar

    const { id, ...campos } = lerFormulario();
    const erros = validarTarefa(campos);
    if (Object.keys(erros).length > 0) {
      mostrarErrosCampos(formulario, erros);
      return;
    }
    limparErrosCampos(formulario);

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

  // Clique no "×" de uma tag: exclui a tag (e some das tarefas que a usavam).
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

/* ==================================================================== */
/* Arrastar e soltar entre colunas                                      */
/* ==================================================================== */

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

/* ==================================================================== */
/* Ponto de entrada: registra tudo que pertence ao quadro (usuário logado) */
/* ==================================================================== */

export function registrarEventosApp(renderizarApp) {
  registrarEventosFiltros();
  registrarEventosQuadro();
  registrarEventosModal();
  registrarEventosArrastar();
  registrarEventosPerfil(renderizarApp);
}
