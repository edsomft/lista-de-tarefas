// dom.js — tudo que cria, altera ou remove elementos da tela.
// Este arquivo lê o estado (data.js), mas não decide regras: quem reage aos cliques é o eventos.js.
// Não conhece o auth.js: recebe o usuário já pronto como parâmetro (evita import circular).

import {
  estado,
  colunas,
  categorias,
  prioridades,
  ordens,
  filtrosPadrao,
  carregarTarefas,
  carregarTags,
  obterTarefasVisiveis,
  existemFiltrosAtivos,
  buscarCategoria,
  buscarTag,
  buscarPrioridade,
  statusVizinho,
  contarPorStatus,
  contarPorCategoria,
  calcularProgresso,
} from "./data.js";

/* ------------------------------------------------------------------ */
/* Helpers para criar elementos                                        */
/* ------------------------------------------------------------------ */

// criarElemento("button", { classe: "botao", texto: "Salvar", dataset: { acao: "x" } }, [filhos])
// - classe   -> className
// - texto    -> textContent (seguro: não interpreta HTML)
// - dataset  -> atributos data-*
// - o resto  -> vira atributo normal (id, type, name, ...)
export function criarElemento(tag, propriedades = {}, filhos = []) {
  const elemento = document.createElement(tag);
  const { classe, texto, dataset, ...atributos } = propriedades;

  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  if (dataset) Object.assign(elemento.dataset, dataset);
  for (const [nome, valor] of Object.entries(atributos)) {
    elemento.setAttribute(nome, valor);
  }

  elemento.append(...filhos);
  return elemento;
}

function criarOpcao(valor, texto) {
  return criarElemento("option", { value: String(valor), texto });
}

// opcoes = [[valor, texto], [valor, texto], ...]
function criarSelect(atributos, opcoes) {
  const select = criarElemento("select", atributos);
  opcoes.forEach(([valor, texto]) => select.append(criarOpcao(valor, texto)));
  return select;
}

// <label> simples: texto + controle (sem espaço para mensagem de erro).
function criarCampo(rotulo, controle) {
  return criarElemento("label", { classe: "campo" }, [
    criarElemento("span", { texto: rotulo }),
    controle,
  ]);
}

// <label> com um <span> reservado para a mensagem de erro daquele campo
// (fica vazio até algum submit inválido preenchê-lo, ver mostrarErrosCampos).
function criarCampoComErro(rotulo, controle, nomeCampo) {
  return criarElemento("label", { classe: "campo" }, [
    criarElemento("span", { texto: rotulo }),
    controle,
    criarElemento("span", { classe: "erro-campo", role: "alert", dataset: { erro: nomeCampo } }),
  ]);
}

/* ------------------------------------------------------------------ */
/* Validação por campo (usada no formulário de tarefa e nos de conta)  */
/* ------------------------------------------------------------------ */

// erros = { nomeDoCampo: "mensagem" }. Cada campo precisa de um elemento
// [data-erro="nomeDoCampo"] dentro do form (criado por criarCampoComErro).
export function mostrarErrosCampos(form, erros) {
  limparErrosCampos(form);
  Object.entries(erros).forEach(([campo, mensagem]) => {
    const aviso = form.querySelector(`[data-erro="${campo}"]`);
    if (aviso) aviso.textContent = mensagem;
    const controle = form.elements[campo];
    if (controle) controle.classList.add("invalido");
  });
}

export function limparErrosCampos(form) {
  form.querySelectorAll(".erro-campo").forEach((aviso) => (aviso.textContent = ""));
  [...form.elements].forEach((elemento) => elemento.classList?.remove("invalido"));
}

/* ------------------------------------------------------------------ */
/* Avatar: foto (se houver) ou um círculo com a inicial do nome         */
/* ------------------------------------------------------------------ */

function criarAvatar(usuario, classe) {
  if (usuario.avatar) {
    return criarElemento("img", { classe, src: usuario.avatar, alt: `Foto de ${usuario.nome}` });
  }
  const inicial = usuario.nome.trim().charAt(0).toUpperCase() || "?";
  return criarElemento("div", { classe: `${classe} avatar-letra`, texto: inicial });
}

/* ==================================================================== */
/* TELA DE AUTENTICAÇÃO (login / criar conta)                           */
/* ==================================================================== */

function criarFormularioLogin() {
  return criarElemento("form", { id: "form-login", classe: "form-auth", novalidate: "" }, [
    criarElemento("h2", { texto: "Entrar" }),
    criarCampoComErro(
      "E-mail",
      criarElemento("input", { type: "email", name: "email", autocomplete: "username" }),
      "email"
    ),
    criarCampoComErro(
      "Senha",
      criarElemento("input", { type: "password", name: "senha", autocomplete: "current-password" }),
      "senha"
    ),
    criarElemento("p", { id: "erro-login-geral", classe: "erro-campo", role: "alert" }),
    criarElemento("button", { classe: "botao botao-primario", type: "submit", texto: "Entrar" }),
    criarElemento("p", { classe: "auth-alternar" }, [
      criarElemento("span", { texto: "Ainda não tem conta? " }),
      criarElemento("button", {
        id: "btn-ir-registro",
        classe: "botao-link",
        type: "button",
        texto: "Criar conta",
      }),
    ]),
  ]);
}

function criarFormularioRegistro() {
  return criarElemento(
    "form",
    { id: "form-registro", classe: "form-auth", hidden: "", novalidate: "" },
    [
      criarElemento("h2", { texto: "Criar conta" }),
      criarCampoComErro(
        "Nome",
        criarElemento("input", { type: "text", name: "nome", autocomplete: "name" }),
        "nome"
      ),
      criarCampoComErro(
        "E-mail",
        criarElemento("input", { type: "email", name: "email", autocomplete: "username" }),
        "email"
      ),
      criarCampoComErro(
        "Senha",
        criarElemento("input", { type: "password", name: "senha", autocomplete: "new-password" }),
        "senha"
      ),
      criarCampoComErro(
        "Confirmar senha",
        criarElemento("input", {
          type: "password",
          name: "confirmarSenha",
          autocomplete: "new-password",
        }),
        "confirmarSenha"
      ),
      criarElemento("button", { classe: "botao botao-primario", type: "submit", texto: "Criar conta" }),
      criarElemento("p", { classe: "auth-alternar" }, [
        criarElemento("span", { texto: "Já tem conta? " }),
        criarElemento("button", {
          id: "btn-ir-login",
          classe: "botao-link",
          type: "button",
          texto: "Entrar",
        }),
      ]),
    ]
  );
}

// Monta a tela cheia de login/cadastro dentro de #app (substitui o quadro).
export function montarTelaAuth() {
  document.querySelector("#app").replaceChildren(
    criarElemento("section", { classe: "auth-tela" }, [
      criarElemento("div", { classe: "auth-cartao" }, [
        criarElemento("h1", { texto: "Quadro de tarefas" }),
        criarElemento("p", {
          classe: "subtitulo",
          texto: "Entre com sua conta ou crie uma para começar.",
        }),
        criarFormularioLogin(),
        criarFormularioRegistro(),
      ]),
    ])
  );
}

export function alternarParaRegistro() {
  document.querySelector("#form-login").hidden = true;
  document.querySelector("#form-registro").hidden = false;
}

export function alternarParaLogin() {
  document.querySelector("#form-registro").hidden = true;
  document.querySelector("#form-login").hidden = false;
}

/* ==================================================================== */
/* CABEÇALHO (com informações do usuário logado)                        */
/* ==================================================================== */

function criarCabecalho(usuario) {
  return criarElemento("header", { classe: "topo" }, [
    criarElemento("div", {}, [
      criarElemento("h1", { texto: "Quadro de tarefas" }),
      criarElemento("p", {
        classe: "subtitulo",
        texto: "O que falta fazer, o que está em andamento e o que já terminou.",
      }),
    ]),
    criarElemento("div", { classe: "progresso" }, [
      criarElemento("p", { id: "progresso-texto" }),
      criarElemento("progress", { id: "progresso-barra", max: "100", value: "0" }),
    ]),
    criarElemento("button", {
      id: "btn-perfil",
      classe: "usuario-info",
      type: "button",
      "aria-label": "Abrir meu perfil",
    }, [
      criarAvatar(usuario, "avatar-mini"),
      criarElemento("span", { classe: "usuario-nome", texto: usuario.nome }),
    ]),
    criarElemento("button", {
      id: "btn-sair",
      classe: "botao",
      type: "button",
      texto: "Sair",
    }),
    criarElemento("button", {
      id: "btn-nova",
      classe: "botao botao-primario",
      type: "button",
      texto: "Nova tarefa",
    }),
  ]);
}

/* ==================================================================== */
/* MODAL DE PERFIL                                                       */
/* ==================================================================== */

function criarModalPerfil(usuario) {
  const formulario = criarElemento("form", { id: "form-perfil", novalidate: "" }, [
    criarElemento("h2", { id: "perfil-titulo", texto: "Meu perfil" }),
    criarElemento("div", { id: "preview-avatar", classe: "perfil-avatar" }, [
      criarAvatar(usuario, "avatar-grande"),
    ]),
    criarCampo(
      "Foto de perfil",
      criarElemento("input", { type: "file", id: "input-avatar", name: "avatar", accept: "image/*" })
    ),
    criarCampoComErro(
      "Nome",
      criarElemento("input", { type: "text", name: "nome", maxlength: "40" }),
      "nome"
    ),
    criarElemento("p", { classe: "campo-info" }, [
      criarElemento("span", { texto: "E-mail: " }),
      criarElemento("span", { id: "perfil-email" }),
    ]),
    criarElemento("div", { classe: "modal-acoes" }, [
      criarElemento("button", {
        id: "btn-sair-perfil",
        classe: "botao",
        type: "button",
        texto: "Sair da conta",
      }),
      criarElemento("button", {
        classe: "botao botao-primario",
        type: "submit",
        texto: "Salvar perfil",
      }),
    ]),
  ]);

  return criarElemento("dialog", { id: "modal-perfil", "aria-labelledby": "perfil-titulo" }, [
    formulario,
  ]);
}

export function abrirModalPerfil(usuario) {
  const form = document.querySelector("#form-perfil");
  limparErrosCampos(form);
  form.elements.nome.value = usuario.nome;
  form.elements.avatar.value = "";
  document.querySelector("#perfil-email").textContent = usuario.email;
  document.querySelector("#preview-avatar").replaceChildren(criarAvatar(usuario, "avatar-grande"));
  document.querySelector("#modal-perfil").showModal();
}

export function fecharModalPerfil() {
  document.querySelector("#modal-perfil").close();
}

// Chamada quando o usuário escolhe um novo arquivo de foto (antes de salvar).
export function atualizarPreviewAvatar(dataUrl) {
  document
    .querySelector("#preview-avatar")
    .replaceChildren(
      criarElemento("img", { classe: "avatar-grande", src: dataUrl, alt: "Pré-visualização da foto" })
    );
}

/* ==================================================================== */
/* QUADRO KANBAN                                                         */
/* ==================================================================== */

function criarBarraFerramentas() {
  const busca = criarElemento("input", {
    id: "filtro-busca",
    type: "search",
    placeholder: "Título ou descrição",
    autocomplete: "off",
  });

  const categoria = criarSelect({ id: "filtro-categoria" }, [
    ["todas", "Todas"],
    ...categorias.map((c) => [c.id, c.nome]),
  ]);
  const prioridade = criarSelect({ id: "filtro-prioridade" }, [
    ["todas", "Todas"],
    ...prioridades.map((p) => [p.id, p.titulo]),
  ]);
  // As opções de tag entram depois, em renderizarFiltroTags() (a lista pode crescer).
  const tag = criarSelect({ id: "filtro-tag" }, [["todas", "Todas"]]);
  const ordem = criarSelect(
    { id: "filtro-ordem" },
    ordens.map((o) => [o.id, o.titulo])
  );

  return criarElemento("section", { classe: "ferramentas", "aria-label": "Busca e filtros" }, [
    criarCampo("Buscar", busca),
    criarCampo("Categoria", categoria),
    criarCampo("Prioridade", prioridade),
    criarCampo("Tag", tag),
    criarCampo("Ordenar por", ordem),
    criarElemento("button", {
      id: "btn-limpar",
      classe: "botao",
      type: "button",
      texto: "Limpar filtros",
    }),
  ]);
}

function criarResumoCategorias() {
  return criarElemento("section", { classe: "resumo" }, [
    criarElemento("p", { classe: "resumo-rotulo", texto: "Tarefas por categoria" }),
    criarElemento("ul", { id: "resumo-categorias", classe: "resumo-lista" }),
  ]);
}

function criarQuadro() {
  const quadro = criarElemento("main", { id: "quadro", classe: "quadro" });

  colunas.forEach((coluna) => {
    quadro.append(
      criarElemento("section", { classe: "coluna", dataset: { status: coluna.id } }, [
        criarElemento("header", { classe: "coluna-topo" }, [
          criarElemento("h2", { texto: coluna.titulo }),
          criarElemento("span", { classe: "contador", texto: "0" }),
        ]),
        criarElemento("div", { classe: "coluna-lista" }),
      ])
    );
  });

  return quadro;
}

// Janela (<dialog>) usada tanto para criar quanto para editar uma tarefa.
function criarModal() {
  // Menu suspenso de tags: <details> abre e fecha sozinho (sem JavaScript).
  // Dentro dele: a lista de tags (checkboxes) e um campo para criar uma tag nova.
  const grupoTags = criarElemento("div", { classe: "campo-menu" }, [
    criarElemento("span", { classe: "rotulo-campo", texto: "Tags" }),
    criarElemento("details", { id: "menu-tags", classe: "menu-tags" }, [
      criarElemento("summary", {}, [
        criarElemento("span", { id: "resumo-tags", texto: "Selecionar tags" }),
      ]),
      criarElemento("div", { classe: "menu-tags-painel" }, [
        criarElemento("div", { id: "lista-tags-menu", classe: "lista-tags-menu" }),
        criarElemento("div", { classe: "nova-tag" }, [
          criarElemento("input", {
            id: "nova-tag",
            type: "text",
            maxlength: "20",
            placeholder: "Nova tag",
            autocomplete: "off",
            "aria-label": "Nome da nova tag",
          }),
          criarElemento("button", {
            id: "btn-criar-tag",
            classe: "botao-pequeno",
            type: "button",
            texto: "Adicionar",
          }),
        ]),
        criarElemento("p", { id: "msg-tag", classe: "msg-tag", role: "status" }),
      ]),
    ]),
  ]);

  const formulario = criarElemento("form", { id: "form-tarefa", novalidate: "" }, [
    criarElemento("h2", { id: "modal-titulo" }),
    criarElemento("input", { type: "hidden", name: "tarefaId" }),
    criarCampoComErro(
      "Título",
      criarElemento("input", { type: "text", name: "titulo", maxlength: "60", autocomplete: "off" }),
      "titulo"
    ),
    criarCampo(
      "Descrição",
      criarElemento("textarea", { name: "descricao", rows: "3", maxlength: "200" })
    ),
    criarElemento("div", { classe: "linha" }, [
      criarCampo(
        "Categoria",
        criarSelect(
          { name: "categoriaId" },
          categorias.map((c) => [c.id, c.nome])
        )
      ),
      criarCampo(
        "Prioridade",
        criarSelect(
          { name: "prioridade" },
          prioridades.map((p) => [p.id, p.titulo])
        )
      ),
      criarCampo(
        "Status",
        criarSelect(
          { name: "status" },
          colunas.map((c) => [c.id, c.titulo])
        )
      ),
    ]),
    grupoTags,
    criarCampoComErro(
      "Imagem (link)",
      criarElemento("input", {
        type: "url",
        name: "imagem",
        placeholder: "https://... (vazio usa uma imagem automática)",
        autocomplete: "off",
      }),
      "imagem"
    ),
    criarElemento("div", { classe: "modal-acoes" }, [
      criarElemento("button", {
        id: "btn-cancelar",
        classe: "botao",
        type: "button",
        texto: "Cancelar",
      }),
      criarElemento("button", {
        classe: "botao botao-primario",
        type: "submit",
        texto: "Salvar tarefa",
      }),
    ]),
  ]);

  return criarElemento("dialog", { id: "modal-tarefa", "aria-labelledby": "modal-titulo" }, [
    formulario,
  ]);
}

/* ------------------------------------------------------------------ */
/* Cartões e colunas                                                    */
/* ------------------------------------------------------------------ */

function criarCartao(tarefa) {
  const categoria = buscarCategoria(tarefa.categoriaId);
  const prioridade = buscarPrioridade(tarefa.prioridade);
  const anterior = statusVizinho(tarefa.status, -1);
  const proximo = statusVizinho(tarefa.status, 1);

  // Imagem: se o link estiver quebrado, a classe "quebrada" esconde o <img>
  // e sobra só a cor da categoria como fundo.
  const imagem = criarElemento("img", {
    src: tarefa.imagem,
    alt: "",
    loading: "lazy",
    draggable: "false",
  });
  imagem.addEventListener("error", () => imagem.classList.add("quebrada"));

  const nomesDasTags = tarefa.tagIds.map(buscarTag).filter(Boolean);

  const corpo = [
    criarElemento("div", { classe: "cartao-meta" }, [
      criarElemento("span", { classe: "chip-categoria", texto: categoria ? categoria.nome : "Sem categoria" }),
      criarElemento("span", { classe: "pilula-prioridade", texto: `Prioridade ${prioridade.titulo.toLowerCase()}` }),
    ]),
    criarElemento("h3", { texto: tarefa.titulo }),
  ];
  if (tarefa.descricao) corpo.push(criarElemento("p", { classe: "descricao", texto: tarefa.descricao }));
  if (nomesDasTags.length > 0) {
    corpo.push(
      criarElemento(
        "ul",
        { classe: "tags" },
        nomesDasTags.map((tag) => criarElemento("li", { texto: `#${tag.nome}` }))
      )
    );
  }

  const criarBotao = (acao, texto, classeExtra = "") =>
    criarElemento("button", {
      type: "button",
      classe: `botao-pequeno ${classeExtra}`.trim(),
      texto,
      dataset: { acao },
    });

  const botaoVoltar = criarBotao("mover-anterior", "Voltar");
  const botaoAvancar = criarBotao("mover-proximo", "Avançar");
  botaoVoltar.disabled = anterior === null;
  botaoAvancar.disabled = proximo === null;

  return criarElemento(
    "article",
    {
      classe: `cartao prioridade-${tarefa.prioridade}`,
      draggable: "true",
      dataset: { id: tarefa.id },
      style: `--cor: ${categoria ? categoria.cor : "#64748b"}`,
    },
    [
      criarElemento("div", { classe: "cartao-imagem" }, [imagem]),
      criarElemento("div", { classe: "cartao-corpo" }, corpo),
      criarElemento("footer", { classe: "cartao-acoes" }, [
        criarElemento("div", { classe: "grupo-acoes" }, [botaoVoltar, botaoAvancar]),
        criarElemento("div", { classe: "grupo-acoes" }, [
          criarBotao("editar", "Editar"),
          criarBotao("excluir", "Excluir", "perigo"),
        ]),
      ]),
    ]
  );
}

function criarMensagemVazia() {
  const texto = existemFiltrosAtivos()
    ? "Nenhuma tarefa corresponde aos filtros."
    : "Nada por aqui ainda. Arraste um cartão para cá ou crie uma tarefa.";
  return criarElemento("p", { classe: "vazio", texto });
}

export function renderizarColunas() {
  const visiveis = obterTarefasVisiveis();
  const contagem = contarPorStatus(visiveis);

  document.querySelectorAll(".coluna").forEach((secao) => {
    const status = secao.dataset.status;
    const tarefasDaColuna = visiveis.filter((t) => t.status === status);

    secao.querySelector(".contador").textContent = contagem[status];

    const lista = secao.querySelector(".coluna-lista");
    if (tarefasDaColuna.length === 0) {
      lista.replaceChildren(criarMensagemVazia());
    } else {
      lista.replaceChildren(...tarefasDaColuna.map(criarCartao));
    }
  });
}

/* ------------------------------------------------------------------ */
/* Contadores e progresso                                              */
/* ------------------------------------------------------------------ */

function renderizarProgresso() {
  const { total, concluidas, percentual } = calcularProgresso();
  document.querySelector("#progresso-texto").textContent =
    total === 0
      ? "Nenhuma tarefa cadastrada."
      : `${concluidas} de ${total} concluídas (${percentual}%)`;
  document.querySelector("#progresso-barra").value = percentual;
}

function renderizarResumoCategorias() {
  const itens = contarPorCategoria().map(({ categoria, total }) =>
    criarElemento("li", { classe: "chip-resumo", style: `--cor: ${categoria.cor}` }, [
      criarElemento("span", { classe: "ponto" }),
      criarElemento("span", { texto: `${categoria.nome}: ${total}` }),
    ])
  );
  document.querySelector("#resumo-categorias").replaceChildren(...itens);
}

// Redesenha tudo que depende dos dados. Chamada depois de QUALQUER alteração.
export function atualizarInterface() {
  renderizarColunas();
  renderizarProgresso();
  renderizarResumoCategorias();
}

// Faz os campos de filtro mostrarem o que está no estado (usado no "Limpar filtros").
export function sincronizarFiltros() {
  const f = estado.filtros;
  document.querySelector("#filtro-busca").value = f.busca;
  document.querySelector("#filtro-categoria").value = f.categoriaId;
  document.querySelector("#filtro-prioridade").value = f.prioridade;
  document.querySelector("#filtro-tag").value = f.tagId;
  document.querySelector("#filtro-ordem").value = f.ordem;
}

/* ------------------------------------------------------------------ */
/* Tags (filtro e menu suspenso do formulário)                         */
/* ------------------------------------------------------------------ */

// Refaz as opções do filtro de tags (chamada no início e quando nasce uma tag nova).
export function renderizarFiltroTags() {
  const select = document.querySelector("#filtro-tag");
  select.replaceChildren(
    criarOpcao("todas", "Todas"),
    ...estado.tags.map((tag) => criarOpcao(tag.id, tag.nome))
  );
  select.value = estado.filtros.tagId; // mantém a escolha atual
}

// Refaz a lista de checkboxes do formulário, preservando o que já estava marcado.
export function renderizarTagsNoModal() {
  const lista = document.querySelector("#lista-tags-menu");
  const marcadas = new Set(
    [...lista.querySelectorAll("input:checked")].map((caixa) => Number(caixa.value))
  );

  lista.replaceChildren(
    ...estado.tags.map((tag) => {
      const caixa = criarElemento("input", {
        type: "checkbox",
        name: "tagIds",
        value: String(tag.id),
      });
      caixa.checked = marcadas.has(tag.id);
      return criarElemento("div", { classe: "opcao-tag" }, [
        criarElemento("label", {}, [caixa, criarElemento("span", { texto: tag.nome })]),
        criarElemento("button", {
          type: "button",
          classe: "botao-excluir-tag",
          "aria-label": `Excluir tag ${tag.nome}`,
          texto: "×",
          dataset: { tagId: tag.id },
        }),
      ]);
    })
  );
  atualizarResumoTags();
}

// Texto do "botão" do menu: quantas tags estão marcadas.
export function atualizarResumoTags() {
  const quantidade = document.querySelectorAll("#lista-tags-menu input:checked").length;
  const resumo = document.querySelector("#resumo-tags");
  if (quantidade === 0) resumo.textContent = "Selecionar tags";
  else if (quantidade === 1) resumo.textContent = "1 tag selecionada";
  else resumo.textContent = `${quantidade} tags selecionadas`;
}

export function marcarTagNoModal(id) {
  const caixa = document.querySelector(`#lista-tags-menu input[value="${id}"]`);
  if (caixa) caixa.checked = true;
  atualizarResumoTags();
}

export function mostrarMensagemTag(mensagem) {
  document.querySelector("#msg-tag").textContent = mensagem;
}

/* ------------------------------------------------------------------ */
/* Modal de tarefa (criar / editar)                                     */
/* ------------------------------------------------------------------ */

export function abrirModal(tarefa = null) {
  const form = document.querySelector("#form-tarefa");
  form.reset();
  limparErrosCampos(form);

  document.querySelector("#modal-titulo").textContent = tarefa ? "Editar tarefa" : "Nova tarefa";
  form.elements.tarefaId.value = tarefa ? tarefa.id : "";

  if (tarefa) {
    form.elements.titulo.value = tarefa.titulo;
    form.elements.descricao.value = tarefa.descricao;
    form.elements.categoriaId.value = tarefa.categoriaId;
    form.elements.prioridade.value = tarefa.prioridade;
    form.elements.status.value = tarefa.status;
    form.elements.imagem.value = tarefa.imagem;
    form.querySelectorAll('input[name="tagIds"]').forEach((caixa) => {
      caixa.checked = tarefa.tagIds.includes(Number(caixa.value));
    });
  } else {
    form.elements.prioridade.value = "media";
    form.elements.status.value = "a-fazer";
  }

  atualizarResumoTags();
  document.querySelector("#menu-tags").open = false;
  mostrarMensagemTag("");

  document.querySelector("#modal-tarefa").showModal();
  form.elements.titulo.focus();
}

export function fecharModal() {
  document.querySelector("#modal-tarefa").close();
}

// Lê o formulário e devolve um objeto com os tipos certos (números como number).
export function lerFormulario() {
  const dados = new FormData(document.querySelector("#form-tarefa"));
  const id = dados.get("tarefaId");

  return {
    id: id ? Number(id) : null,
    titulo: dados.get("titulo"),
    descricao: dados.get("descricao"),
    categoriaId: Number(dados.get("categoriaId")),
    prioridade: dados.get("prioridade"),
    status: dados.get("status"),
    tagIds: dados.getAll("tagIds").map(Number),
    imagem: dados.get("imagem"),
  };
}

/* ==================================================================== */
/* Ponto de entrada do quadro (chamado só quando há um usuário logado)  */
/* ==================================================================== */

export function montarQuadro(usuario) {
  carregarTarefas();
  carregarTags();

  document
    .querySelector("#app")
    .replaceChildren(
      criarCabecalho(usuario),
      criarBarraFerramentas(),
      criarResumoCategorias(),
      criarQuadro(),
      criarModal(),
      criarModalPerfil(usuario)
    );

  renderizarFiltroTags();
  renderizarTagsNoModal();
  sincronizarFiltros();
  atualizarInterface();
}
