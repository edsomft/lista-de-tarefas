import "./style.css";
import { iniciarSessao, usuarioLogado } from "./auth.js";
import { montarTelaAuth, montarQuadro, renderizarAvisos } from "./dom.js";
import { registrarEventosAuth, registrarEventosApp } from "./eventos.js";
import { buscarAvisos } from "./api.js";

// Decide, a cada chamada, se mostra a tela de login/cadastro ou o quadro.
// É chamada de novo depois de: login, criar conta, salvar perfil e logout —
// por isso o logout realmente "leva de volta" para a tela de entrada.
function renderizarApp() {
  const usuario = usuarioLogado();
  if (usuario) {
    montarQuadro(usuario);
    registrarEventosApp(renderizarApp);
    carregarAvisos();
  } else {
    montarTelaAuth();
    registrarEventosAuth(renderizarApp);
  }
}

// Única função assíncrona do app: busca os avisos no JSON Server (api.js)
// e manda o resultado para o dom.js desenhar. try/catch cobre a rede fora
// do ar; response.ok (dentro de api.js) cobre erro HTTP.
async function carregarAvisos() {
  try {
    const avisos = await buscarAvisos();
    renderizarAvisos({ avisos });
  } catch (erro) {
    console.error(erro);
    renderizarAvisos({ erro: "Não foi possível carregar os avisos (o JSON Server está rodando?)." });
  }
}

iniciarSessao();
renderizarApp();
