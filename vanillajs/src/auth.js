// auth.js — cadastro, login, sessão e perfil do usuário.
// Assim como storage.js/data.js, tudo fica no localStorage: ainda não existe backend.

import { salvar, carregar, remover } from "./storage.js";

const CHAVE_USUARIOS = "kanban:usuarios";
const CHAVE_SESSAO = "kanban:sessao"; // guarda só o id do usuário logado

export const estadoAuth = {
  usuarios: [],
  sessaoId: null,
};

export function iniciarSessao() {
  estadoAuth.usuarios = carregar(CHAVE_USUARIOS, []);
  estadoAuth.sessaoId = carregar(CHAVE_SESSAO, null);
}

function persistirUsuarios() {
  salvar(CHAVE_USUARIOS, estadoAuth.usuarios);
}

// Hash bem simples, só para não deixar a senha em texto puro no localStorage.
// Isso NÃO é criptografia de verdade (não use essa técnica em um sistema real) —
// aqui serve apenas para o exercício, já que o projeto ainda não tem backend.
function hashSenha(texto) {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash << 5) - hash + texto.charCodeAt(i);
    hash |= 0; // força um inteiro de 32 bits
  }
  return String(hash);
}

export function usuarioLogado() {
  return estadoAuth.usuarios.find((u) => u.id === estadoAuth.sessaoId) || null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------ */
/* Registro                                                             */
/* ------------------------------------------------------------------ */

// Devolve um objeto { campo: mensagem } só com os campos que têm problema.
// Objeto vazio {} significa que passou na validação.
export function validarRegistro({ nome, email, senha, confirmarSenha }) {
  const erros = {};

  if (nome.trim().length < 2) {
    erros.nome = "Informe seu nome (mínimo 2 caracteres).";
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    erros.email = "Informe um e-mail válido.";
  } else if (estadoAuth.usuarios.some((u) => u.email === email.trim().toLowerCase())) {
    erros.email = "Já existe uma conta com esse e-mail.";
  }

  if (senha.length < 4) {
    erros.senha = "A senha precisa ter pelo menos 4 caracteres.";
  }

  if (confirmarSenha !== senha) {
    erros.confirmarSenha = "As senhas não coincidem.";
  }

  return erros;
}

// Só chame depois de validarRegistro() não devolver nenhum erro.
export function registrarUsuario({ nome, email, senha }) {
  const maiorId = estadoAuth.usuarios.reduce((maior, u) => Math.max(maior, u.id), 0);
  const usuario = {
    id: maiorId + 1,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    senhaHash: hashSenha(senha),
    avatar: null,
  };
  estadoAuth.usuarios.push(usuario);
  persistirUsuarios();
  entrar(usuario.id);
  return usuario;
}

/* ------------------------------------------------------------------ */
/* Login                                                                */
/* ------------------------------------------------------------------ */

export function validarLogin({ email, senha }) {
  const erros = {};
  if (!email.trim()) erros.email = "Informe o e-mail.";
  if (!senha) erros.senha = "Informe a senha.";
  return erros;
}

// Devolve { erro: "mensagem" } (credenciais inválidas) ou { usuario }.
// De propósito, a mensagem não diz se foi o e-mail ou a senha que errou.
export function login({ email, senha }) {
  const usuario = estadoAuth.usuarios.find((u) => u.email === email.trim().toLowerCase());
  if (!usuario || usuario.senhaHash !== hashSenha(senha)) {
    return { erro: "E-mail ou senha incorretos." };
  }
  entrar(usuario.id);
  return { usuario };
}

function entrar(id) {
  estadoAuth.sessaoId = id;
  salvar(CHAVE_SESSAO, id);
}

// Limpa a sessão. Quem chama essa função deve, em seguida, mandar a tela
// voltar para a tela de login (é o "redireciona" pedido no desafio).
export function logout() {
  estadoAuth.sessaoId = null;
  remover(CHAVE_SESSAO);
}

/* ------------------------------------------------------------------ */
/* Perfil                                                               */
/* ------------------------------------------------------------------ */

// campos pode ter { nome } e/ou { avatar } (avatar é uma data URL em base64).
export function atualizarPerfil(id, campos) {
  const usuario = estadoAuth.usuarios.find((u) => u.id === id);
  if (!usuario) return null;
  Object.assign(usuario, campos);
  persistirUsuarios();
  return usuario;
}
