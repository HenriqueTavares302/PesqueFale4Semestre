/*
 * Todas as chamadas à API do catálogo ficam neste arquivo.
 *
 * Os componentes não montam URL nem leem cabeçalho de resposta: pedem
 * api.eventos.listar() e recebem os dados. Se o endereço da API mudar, só
 * este arquivo muda.
 *
 * Importante: esta API cuida apenas do catálogo público (eventos e
 * pesqueiros). Login do aplicativo, publicações, chat e notificações
 * continuam no Firebase, em src/auth.js e src/firebase.js.
 */

/* Create React App só expõe variáveis que começam com REACT_APP_.
 * Em produção, atrás do Nginx, o valor é "/api" — mesma origem, sem CORS. */
const BASE = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(
  /\/+$/,
  "",
);

const CHAVE_TOKEN = "pf_token_catalogo";

export function guardarToken(token) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token);
  } catch {
    /* navegação privada pode bloquear o localStorage */
  }
}

export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function descartarToken() {
  try {
    localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    /* nada a fazer */
  }
}

/*
 * Requisição com tempo limite.
 *
 * Sem o AbortController, uma API fora do ar deixa a tela carregando para
 * sempre. Oito segundos e o fetch é cancelado, para o componente poder cair
 * no conteúdo de reserva.
 */
async function requisitar(caminho, { metodo = "GET", corpo, token } = {}) {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 8000);

  const cabecalhos = {};
  if (corpo) cabecalhos["Content-Type"] = "application/json";

  const autorizacao = token === undefined ? lerToken() : token;
  if (autorizacao) cabecalhos.Authorization = `Bearer ${autorizacao}`;

  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });

    /* 204 não tem corpo: ler JSON daria erro de parse. */
    if (resposta.status === 204) return null;

    const tipo = resposta.headers.get("content-type") || "";
    const dados = tipo.includes("application/json")
      ? await resposta.json()
      : await resposta.text();

    if (!resposta.ok) {
      const erro = new Error(
        (dados && dados.erro) || `Erro ${resposta.status} na API.`,
      );
      erro.status = resposta.status;
      throw erro;
    }

    return dados;
  } catch (erro) {
    if (erro.name === "AbortError") {
      const tempo = new Error("A API demorou demais para responder.");
      tempo.status = 408;
      throw tempo;
    }
    throw erro;
  } finally {
    clearTimeout(limite);
  }
}

export const api = {
  /* Usado para saber se a API está no ar antes de depender dela. */
  saude: () => requisitar("/health"),

  auth: {
    async entrar(email, senha) {
      const dados = await requisitar("/api/auth/entrar", {
        metodo: "POST",
        corpo: { email, senha },
        token: null,
      });
      if (dados?.token) guardarToken(dados.token);
      return dados;
    },
    async registrar(corpo) {
      const dados = await requisitar("/api/auth/registrar", {
        metodo: "POST",
        corpo,
        token: null,
      });
      if (dados?.token) guardarToken(dados.token);
      return dados;
    },
    eu: () => requisitar("/api/auth/eu"),
    sair: () => descartarToken(),
  },

  eventos: {
    listar: (apenasFuturos = false) =>
      requisitar(`/api/eventos${apenasFuturos ? "?futuros=1" : ""}`),
    buscar: (idOuSlug) => requisitar(`/api/eventos/${idOuSlug}`),
    criar: (corpo) => requisitar("/api/eventos", { metodo: "POST", corpo }),
    atualizar: (id, corpo) =>
      requisitar(`/api/eventos/${id}`, { metodo: "PUT", corpo }),
    apagar: (id) => requisitar(`/api/eventos/${id}`, { metodo: "DELETE" }),
  },

  pesqueiros: {
    listar: () => requisitar("/api/pesqueiros"),
    buscar: (idOuSlug) => requisitar(`/api/pesqueiros/${idOuSlug}`),
    criar: (corpo) => requisitar("/api/pesqueiros", { metodo: "POST", corpo }),
    atualizar: (id, corpo) =>
      requisitar(`/api/pesqueiros/${id}`, { metodo: "PUT", corpo }),
    apagar: (id) => requisitar(`/api/pesqueiros/${id}`, { metodo: "DELETE" }),
  },
};

export default api;
