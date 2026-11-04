const BASE = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(
  /\/+$/,
  "",
);

const CHAVE_TOKEN = "pf_token_catalogo";

export function guardarToken(token) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token);
  } catch {
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
  }
}

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
