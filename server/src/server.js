require("dotenv").config();

const express = require("express");
const cors = require("cors");

const rotas = require("./routes");
const { criarTabelas } = require("./database/criarTabelas");
const { verificarConexao } = require("./database/conexao");

const app = express();
const PORTA = Number(process.env.PORT) || 3001;

app.use(express.json());

/* Confia no cabeçalho X-Forwarded-For do Nginx, para que req.ip traga o IP
 * real do visitante e não o do proxy. */
app.set("trust proxy", 1);

/*
 * CORS com lista de origens.
 *
 * Em desenvolvimento o front roda em localhost:3000 e a API em 3001: portas
 * diferentes são origens diferentes para o navegador, e sem CORS o fetch é
 * bloqueado. A lista evita liberar para qualquer site.
 */
const origensPermitidas = (process.env.ORIGENS_PERMITIDAS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origem, callback) {
      /* Sem origem: Postman, curl ou o próprio servidor. */
      if (!origem) return callback(null, true);
      if (origensPermitidas.length === 0) return callback(null, true);
      if (origensPermitidas.includes(origem)) return callback(null, true);
      return callback(new Error("Origem não autorizada pelo CORS."));
    },
  }),
);

/*
 * Verificação de saúde (aula de arquiteturas escaláveis).
 *
 * É o endereço que um balanceador de carga consulta para decidir se este
 * servidor ainda pode receber requisições. Não basta responder 200: se o
 * banco caiu, a aplicação está no ar mas não serve para nada, então o
 * status vira 503 e o balanceador tira esta instância da rotação.
 */
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

/* Qualquer caminho não declarado acima. */
app.use((req, res) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.path}` });
});

/* Captura de erro em último lugar: sem isso uma exceção derruba o processo
 * e o container reinicia a cada requisição ruim. */
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

  /*
   * Escuta em 0.0.0.0, e não em 127.0.0.1.
   *
   * Dentro de um container, 127.0.0.1 é o próprio container: o servidor
   * recusaria as conexões que chegam pelo -p do docker run. Em 0.0.0.0 ele
   * aceita conexão por qualquer interface de rede do container.
   */
  app.listen(PORTA, "0.0.0.0", () => {
    console.log(`API no ar em http://localhost:${PORTA}`);
    console.log(`Verificação de saúde: http://localhost:${PORTA}/health`);
  });
}

/*
 * Encerramento ordenado.
 *
 * O Docker manda SIGTERM no docker stop e espera 10 segundos antes do
 * SIGKILL. Fechar o servidor nesse intervalo deixa as requisições em
 * andamento terminarem em vez de serem cortadas no meio.
 */
for (const sinal of ["SIGTERM", "SIGINT"]) {
  process.on(sinal, () => {
    console.log(`\n${sinal} recebido, encerrando.`);
    process.exit(0);
  });
}

iniciar();
