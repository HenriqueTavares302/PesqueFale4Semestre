const ID_MEDICAO = process.env.REACT_APP_GA_ID || "";
const EM_PRODUCAO = process.env.NODE_ENV === "production";

export const ANALYTICS_ATIVO = Boolean(ID_MEDICAO) && EM_PRODUCAO;

export const EVENTOS = {
  LOGIN: "login",
  CADASTRO: "sign_up",
  ONBOARDING_CONCLUIDO: "onboarding_concluido",
  PUBLICACAO_CRIADA: "publicacao_criada",
  BUSCA_REALIZADA: "search",
  LOCAL_ABERTO: "local_aberto",
  ABA_FEED: "selecionar_aba_feed",
};

export function registrarEvento(nome, parametros = {}) {
  if (!nome) return;

  if (!ANALYTICS_ATIVO) {
    if (!EM_PRODUCAO) {
      console.debug("[analytics]", nome, parametros);
    }
    return;
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  const limpos = {};
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === null) continue;
    limpos[String(chave).slice(0, 40)] =
      typeof valor === "string" ? valor.slice(0, 100) : valor;
  }

  try {
    window.gtag("event", nome, limpos);
  } catch (erro) {
    console.debug("[analytics] evento não enviado:", erro.message);
  }
}

export function registrarPagina(caminho, titulo) {
  if (!ANALYTICS_ATIVO) {
    if (!EM_PRODUCAO) console.debug("[analytics] page_view", caminho);
    return;
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  try {
    window.gtag("event", "page_view", {
      page_path: caminho,
      page_title: titulo || document.title,
      page_location: window.location.href,
    });
  } catch (erro) {
    console.debug("[analytics] page_view não enviado:", erro.message);
  }
}

const analytics = { registrarEvento, registrarPagina, EVENTOS, ANALYTICS_ATIVO };

export default analytics;
