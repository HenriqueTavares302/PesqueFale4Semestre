/*
 * Google Analytics 4 (aula de SEO e Web Analytics).
 *
 * A tag do GA4 é carregada em public/index.html e cria a função global
 * gtag. Este arquivo é a camada entre a aplicação e ela, por três razões:
 *
 * 1. Se o Measurement ID não estiver configurado, nada acontece — nenhum
 *    erro no console e nenhuma requisição à toa.
 * 2. Um nome de evento errado não é avisado pelo GA4: ele aceita qualquer
 *    string e o dado se perde numa categoria que ninguém olha. Os nomes
 *    ficam declarados aqui, em um só lugar.
 * 3. Em desenvolvimento, nada é enviado. Testar a aplicação local não deve
 *    sujar o relatório de produção.
 *
 * Os eventos do GA4 medem navegação e uso da interface. Nunca recebem nome,
 * e-mail, texto de publicação ou mensagem de chat — isso é dado pessoal e
 * não tem por que sair do Firebase.
 */

const ID_MEDICAO = process.env.REACT_APP_GA_ID || "";
const EM_PRODUCAO = process.env.NODE_ENV === "production";

export const ANALYTICS_ATIVO = Boolean(ID_MEDICAO) && EM_PRODUCAO;

/*
 * Eventos declarados.
 *
 * O GA4 já traz page_view, scroll e clique em link externo automaticamente.
 * Os de baixo são os que ele não tem como adivinhar, porque dependem do que
 * a aplicação faz.
 */
export const EVENTOS = {
  LOGIN: "login",
  CADASTRO: "sign_up",
  ONBOARDING_CONCLUIDO: "onboarding_concluido",
  PUBLICACAO_CRIADA: "publicacao_criada",
  BUSCA_REALIZADA: "search",
  LOCAL_ABERTO: "local_aberto",
  ABA_FEED: "selecionar_aba_feed",
};

/*
 * Envia um evento nomeado com seus parâmetros.
 *
 * Limites do GA4 que valem respeitar: até 25 parâmetros por evento, nome do
 * parâmetro com até 40 caracteres e valor de texto com até 100. Valor mais
 * longo é cortado em silêncio pelo GA4, então é cortado aqui, de propósito.
 */
export function registrarEvento(nome, parametros = {}) {
  if (!nome) return;

  if (!ANALYTICS_ATIVO) {
    /* Em desenvolvimento, só mostra o que seria enviado. Ajuda a conferir
     * se o evento dispara no momento certo. */
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
    /* Bloqueador de anúncio impede o gtag de carregar. Não é motivo para
     * derrubar a interface. */
    console.debug("[analytics] evento não enviado:", erro.message);
  }
}

/*
 * Registra a troca de página.
 *
 * Em um site de várias páginas, cada navegação carrega um HTML novo e a tag
 * dispara sozinha. Num SPA como este, o React Router troca a tela sem
 * recarregar nada, então o GA4 contaria uma única visita por sessão. É isso
 * que este envio manual corrige.
 */
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

/* Nomeado antes de exportar: o ESLint do Create React App rejeita objeto
 * anônimo em export default. */
const analytics = { registrarEvento, registrarPagina, EVENTOS, ANALYTICS_ATIVO };

export default analytics;
