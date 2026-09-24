// storage.js — único arquivo que conversa com o localStorage.
// O localStorage só guarda texto, então convertemos com JSON.stringify / JSON.parse.

export function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    // Pode falhar se o armazenamento estiver cheio ou bloqueado pelo navegador.
    console.error(`Não foi possível salvar "${chave}":`, erro);
  }
}

export function carregar(chave, valorPadrao) {
  try {
    const texto = localStorage.getItem(chave);
    return texto === null ? valorPadrao : JSON.parse(texto);
  } catch (erro) {
    // JSON corrompido ou localStorage indisponível: volta para o valor padrão.
    console.error(`Não foi possível carregar "${chave}":`, erro);
    return valorPadrao;
  }
}

export function remover(chave) {
  try {
    localStorage.removeItem(chave);
  } catch (erro) {
    console.error(`Não foi possível remover "${chave}":`, erro);
  }
}
