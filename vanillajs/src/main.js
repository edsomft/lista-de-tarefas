import "./style.css";
import { renderizarQuadro } from "./dom.js";
import { registrarEventos } from "./eventos.js";

renderizarQuadro(); // monta a tela a partir dos dados
registrarEventos(); // liga os eventos (cliques, busca, formulário, arrastar)
