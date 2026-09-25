import "./style.css";
import { iniciarSessao, usuarioLogado } from "./auth.js";
import { montarTelaAuth, montarQuadro } from "./dom.js";
import { registrarEventosAuth, registrarEventosApp } from "./eventos.js";

// Decide, a cada chamada, se mostra a tela de login/cadastro ou o quadro.
// É chamada de novo depois de: login, criar conta, salvar perfil e logout —
// por isso o logout realmente "leva de volta" para a tela de entrada.
function renderizarApp() {
  const usuario = usuarioLogado();
  if (usuario) {
    montarQuadro(usuario);
    registrarEventosApp(renderizarApp);
  } else {
    montarTelaAuth();
    registrarEventosAuth(renderizarApp);
  }
}

iniciarSessao();
renderizarApp();
