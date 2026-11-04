require("dotenv").config();

const express = require("express");
const cors = require("cors");

const rotas = require("./routes");
const { criarTabelas } = require("./database/criarTabelas");
const { verificarConexao } = require("./database/conexao");

const app = express();
const PORTA = Number(process.env.PORT) || 3001;

app.use(express.json());

app.set("trust proxy", 1);

const origensPermitidas = (process.env.ORIGENS_PERMITIDAS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origem, callback) {
      if (!origem) return callback(null, true);
      if (origensPermitidas.length === 0) return callback(null, true);
      if (origensPermitidas.includes(origem)) return callback(null, true);
      return callback(new Error("Origem não autorizada pelo CORS."));
    },
  }),
);

app.get("/health", async (_req, res) => {
  const inicio = Date.now();
  try {
    await verificarConexao();
    return res.json({
      status: "ok",
      banco: "conectado",
      tempo_resposta_ms: Date.now() - inicio,
      memoria_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      tempo_no_ar_s: Math.round(process.uptime()),
    });
  } catch (erro) {
    console.error("Health check falhou:", erro.message);
    return res.status(503).json({
      status: "indisponivel",
      banco: "sem conexão",
      tempo_resposta_ms: Date.now() - inicio,
    });
  }
});

app.get("/", (_req, res) => {
  res.json({
    api: "Pesque & Fale — catálogo público",
    versao: "1.0.0",
    endpoints: ["/health", "/api/eventos", "/api/pesqueiros", "/api/auth"],
  });
});

app.use(rotas);

app.use((req, res) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.path}` });
});

app.use((erro, _req, res, _next) => {
  console.error("Erro não tratado:", erro.message);
  res.status(500).json({ erro: "Erro interno no servidor." });
});

async function iniciar() {
  try {
    await criarTabelas();
    console.log("Tabelas verificadas.");
  } catch (erro) {
    console.error("Não foi possível preparar o banco:", erro.message);
    console.error("Confira as variáveis DB_* no arquivo .env.");
    process.exit(1);
  }

  app.listen(PORTA, "0.0.0.0", () => {
    console.log(`API no ar em http://localhost:${PORTA}`);
    console.log(`Verificação de saúde: http://localhost:${PORTA}/health`);
  });
}

for (const sinal of ["SIGTERM", "SIGINT"]) {
  process.on(sinal, () => {
    console.log(`\n${sinal} recebido, encerrando.`);
    process.exit(0);
  });
}

iniciar();
