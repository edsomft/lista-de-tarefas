// data.js — dados da aplicação (arrays de objetos), estado e regras do CRUD.
// Aqui NÃO há nenhum código de DOM: só dados e funções que operam sobre eles.

import { salvar, carregar } from "./storage.js";

const CHAVE_TAREFAS = "kanban:tarefas";

/* ------------------------------------------------------------------ */
/* Tabelas fixas (listas de apoio)                                     */
/* ------------------------------------------------------------------ */

// As colunas do kanban. O "status" da tarefa é o id da coluna onde ela está.
export const colunas = [
  { id: "a-fazer", titulo: "A fazer" },
  { id: "em-andamento", titulo: "Em andamento" },
  { id: "concluida", titulo: "Concluída" },
];

export const prioridades = [
  { id: "alta", titulo: "Alta", peso: 3 },
  { id: "media", titulo: "Média", peso: 2 },
  { id: "baixa", titulo: "Baixa", peso: 1 },
];

// Relação 1:N — uma categoria agrupa VÁRIAS tarefas,
// e cada tarefa pertence a UMA categoria (campo tarefa.categoriaId).
export const categorias = [
  { id: 1, nome: "Estudos", cor: "#2563eb" },
  { id: 2, nome: "Projeto", cor: "#0f766e" },
  { id: 3, nome: "Pessoal", cor: "#b45309" },
  { id: 4, nome: "Trabalho", cor: "#7e22ce" },
];

// Relação N:N — uma tarefa tem VÁRIAS tags (campo tarefa.tagIds, um array de ids)
// e uma tag pode estar em VÁRIAS tarefas.
export const tags = [
  { id: 1, nome: "urgente" },
  { id: 2, nome: "prova" },
  { id: 3, nome: "código" },
  { id: 4, nome: "leitura" },
  { id: 5, nome: "em dupla" },
];

export const ordens = [
  { id: "recentes", titulo: "Mais recentes" },
  { id: "prioridade", titulo: "Maior prioridade" },
  { id: "titulo", titulo: "Título (A–Z)" },
];

/* ------------------------------------------------------------------ */
/* Estado da aplicação                                                 */
/* ------------------------------------------------------------------ */

export const filtrosPadrao = {
  busca: "",
  categoriaId: "todas",
  prioridade: "todas",
  tagId: "todas",
  ordem: "recentes",
};

// Único lugar onde os dados "vivem" enquanto a página está aberta.
export const estado = {
  tarefas: [],
  filtros: { ...filtrosPadrao },
};

// Imagem de cada tarefa: guardamos só a URL (string).
// O picsum devolve sempre a mesma foto para a mesma "seed".
export function imagemPadrao(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/480/240`;
}

// Tarefas usadas na primeira vez que a página abre (quando o localStorage está vazio).
const tarefasIniciais = [
  {
    id: 1,
    titulo: "Criar repositório no GitHub",
    descricao: "Repositório privado com o professor adicionado.",
    categoriaId: 2,
    prioridade: "alta",
    status: "concluida",
    tagIds: [5],
    imagem: imagemPadrao("semente-1"),
  },
  {
    id: 2,
    titulo: "Exibir array de tarefas no DOM",
    descricao: "Checkpoint 2: lista de objetos renderizada na tela.",
    categoriaId: 2,
    prioridade: "alta",
    status: "concluida",
    tagIds: [3, 5],
    imagem: imagemPadrao("semente-2"),
  },
  {
    id: 3,
    titulo: "Implementar o CRUD completo",
    descricao: "Criar, listar, editar e remover tarefas.",
    categoriaId: 2,
    prioridade: "alta",
    status: "em-andamento",
    tagIds: [1, 3, 5],
    imagem: imagemPadrao("semente-3"),
  },
  {
    id: 4,
    titulo: "Estudar eventos com addEventListener",
    descricao: "Revisar delegação de eventos e o objeto event.",
    categoriaId: 1,
    prioridade: "media",
    status: "em-andamento",
    tagIds: [3, 4],
    imagem: imagemPadrao("semente-4"),
  },
  {
    id: 5,
    titulo: "Revisar para a prova",
    descricao: "Resumir os tópicos e resolver os exercícios.",
    categoriaId: 1,
    prioridade: "alta",
    status: "a-fazer",
    tagIds: [1, 2],
    imagem: imagemPadrao("semente-5"),
  },
  {
    id: 6,
    titulo: "Ler sobre fetch e async/await",
    descricao: "Preparação para o checkpoint 4.",
    categoriaId: 1,
    prioridade: "baixa",
    status: "a-fazer",
    tagIds: [4],
    imagem: imagemPadrao("semente-6"),
  },
  {
    id: 7,
    titulo: "Escrever o README",
    descricao: "Tema, objetivo e instruções de execução.",
    categoriaId: 2,
    prioridade: "media",
    status: "a-fazer",
    tagIds: [5],
    imagem: imagemPadrao("semente-7"),
  },
  {
    id: 8,
    titulo: "Fazer a compra da semana",
    descricao: "Frutas, café e material de limpeza.",
    categoriaId: 3,
    prioridade: "baixa",
    status: "a-fazer",
    tagIds: [],
    imagem: imagemPadrao("semente-8"),
  },
  {
    id: 9,
    titulo: "Responder e-mails pendentes",
    descricao: "Começar pelos que têm prazo esta semana.",
    categoriaId: 4,
    prioridade: "media",
    status: "a-fazer",
    tagIds: [1],
    imagem: imagemPadrao("semente-9"),
  },
];

/* ------------------------------------------------------------------ */
/* Persistência                                                        */
/* ------------------------------------------------------------------ */

function persistir() {
  salvar(CHAVE_TAREFAS, estado.tarefas);
}

// "Carregar lista de registros em memória": lê do localStorage;
// se não houver nada salvo, usa as tarefas iniciais.
export function carregarTarefas() {
  const salvas = carregar(CHAVE_TAREFAS, null);
  if (Array.isArray(salvas)) {
    estado.tarefas = salvas;
  } else {
    estado.tarefas = structuredClone(tarefasIniciais);
    persistir();
  }
}

/* ------------------------------------------------------------------ */
/* Buscas simples (find)                                               */
/* ------------------------------------------------------------------ */

export const buscarTarefa = (id) => estado.tarefas.find((t) => t.id === id);
export const buscarCategoria = (id) => categorias.find((c) => c.id === id);
export const buscarTag = (id) => tags.find((t) => t.id === id);
export const buscarPrioridade = (id) => prioridades.find((p) => p.id === id);

/* ------------------------------------------------------------------ */
/* CRUD                                                                */
/* ------------------------------------------------------------------ */

function gerarId() {
  const maiorId = estado.tarefas.reduce((maior, t) => Math.max(maior, t.id), 0);
  return maiorId + 1;
}

// Remove espaços extras e garante uma imagem (se o campo vier vazio, usa a padrão).
function limparCampos(campos, id) {
  const limpos = { ...campos };
  if (typeof limpos.titulo === "string") limpos.titulo = limpos.titulo.trim();
  if (typeof limpos.descricao === "string") limpos.descricao = limpos.descricao.trim();
  if (typeof limpos.imagem === "string") {
    limpos.imagem = limpos.imagem.trim() || imagemPadrao(`tarefa-${id}`);
  }
  return limpos;
}

// Devolve uma mensagem de erro (string) ou "" quando os dados estão válidos.
export function validarTarefa(dados) {
  if (dados.titulo.trim().length < 3) {
    return "Informe um título com pelo menos 3 caracteres.";
  }
  const imagem = dados.imagem.trim();
  if (imagem) {
    try {
      const url = new URL(imagem);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch {
      return "A imagem precisa ser um link que comece com http:// ou https://.";
    }
  }
  return "";
}

// CREATE
export function criarTarefa(dados) {
  const id = gerarId();
  const tarefa = { id, ...limparCampos(dados, id) };
  estado.tarefas.push(tarefa);
  persistir();
  return tarefa;
}

// UPDATE — atualiza só os campos que forem enviados (ex.: { status: "concluida" }).
export function atualizarTarefa(id, campos) {
  const tarefa = buscarTarefa(id);
  if (!tarefa) return null;
  Object.assign(tarefa, limparCampos(campos, id));
  persistir();
  return tarefa;
}

// DELETE
export function removerTarefa(id) {
  estado.tarefas = estado.tarefas.filter((t) => t.id !== id);
  persistir();
}

// Atualização de um campo específico (status) — usada pelos botões e pelo arrastar/soltar.
export function moverTarefa(id, novoStatus) {
  return atualizarTarefa(id, { status: novoStatus });
}

// Descobre a coluna vizinha: direcao = -1 (anterior) ou +1 (próxima). Devolve null nas pontas.
export function statusVizinho(status, direcao) {
  const posicao = colunas.findIndex((c) => c.id === status);
  const vizinha = colunas[posicao + direcao];
  return vizinha ? vizinha.id : null;
}

/* ------------------------------------------------------------------ */
/* Busca, filtro e ordenação                                           */
/* ------------------------------------------------------------------ */

export function existemFiltrosAtivos() {
  const { busca, categoriaId, prioridade, tagId } = estado.filtros;
  return (
    busca.trim() !== "" ||
    categoriaId !== "todas" ||
    prioridade !== "todas" ||
    tagId !== "todas"
  );
}

function ordenar(tarefas, ordem) {
  if (ordem === "prioridade") {
    return tarefas.sort(
      (a, b) => buscarPrioridade(b.prioridade).peso - buscarPrioridade(a.prioridade).peso
    );
  }
  if (ordem === "titulo") {
    return tarefas.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  }
  // "recentes": ids maiores foram criados depois
  return tarefas.sort((a, b) => b.id - a.id);
}

// Aplica busca + filtros + ordenação e devolve um NOVO array (o estado não é alterado).
export function obterTarefasVisiveis() {
  const { busca, categoriaId, prioridade, tagId, ordem } = estado.filtros;
  const termo = busca.trim().toLowerCase();

  const filtradas = estado.tarefas.filter((t) => {
    const passaBusca =
      termo === "" ||
      t.titulo.toLowerCase().includes(termo) ||
      t.descricao.toLowerCase().includes(termo);
    const passaCategoria = categoriaId === "todas" || t.categoriaId === Number(categoriaId);
    const passaPrioridade = prioridade === "todas" || t.prioridade === prioridade;
    const passaTag = tagId === "todas" || t.tagIds.includes(Number(tagId));
    return passaBusca && passaCategoria && passaPrioridade && passaTag;
  });

  return ordenar(filtradas, ordem);
}

/* ------------------------------------------------------------------ */
/* Contadores e estatísticas                                           */
/* ------------------------------------------------------------------ */

// { "a-fazer": 4, "em-andamento": 2, "concluida": 3 }
export function contarPorStatus(tarefas) {
  return colunas.reduce((contagem, coluna) => {
    contagem[coluna.id] = tarefas.filter((t) => t.status === coluna.id).length;
    return contagem;
  }, {});
}

// [{ categoria: {...}, total: 3 }, ...]
export function contarPorCategoria() {
  return categorias.map((categoria) => ({
    categoria,
    total: estado.tarefas.filter((t) => t.categoriaId === categoria.id).length,
  }));
}

export function calcularProgresso() {
  const total = estado.tarefas.length;
  const concluidas = estado.tarefas.filter((t) => t.status === "concluida").length;
  const percentual = total === 0 ? 0 : Math.round((concluidas / total) * 100);
  return { total, concluidas, percentual };
}
