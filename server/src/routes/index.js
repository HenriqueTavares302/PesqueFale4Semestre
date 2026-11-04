const { Router } = require("express");

const AuthController = require("../controllers/AuthController");
const EventoController = require("../controllers/EventoController");
const PesqueiroController = require("../controllers/PesqueiroController");
const SitemapController = require("../controllers/SitemapController");

const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = Router();

/*
 * Toda a política de acesso da API cabe neste arquivo.
 *
 * Cada rota declara os middlewares que a protegem, então dá para ler a
 * permissão de todos os endpoints de uma vez, sem abrir os controllers.
 */

/* ── Autenticação ───────────────────────────────────────────────── */
router.post("/api/auth/registrar", AuthController.registrar);
router.post("/api/auth/entrar", AuthController.entrar);
router.get("/api/auth/eu", autenticar, AuthController.eu);

/* ── Eventos ────────────────────────────────────────────────────────
 * Leitura aberta de propósito: é conteúdo que o Google precisa indexar.
 * Escrita exige token; apagar exige admin.
 */
router.get("/api/eventos", EventoController.listar);
router.get("/api/eventos/:id", EventoController.buscar);
router.post("/api/eventos", autenticar, EventoController.criar);
router.put("/api/eventos/:id", autenticar, EventoController.atualizar);
router.delete(
  "/api/eventos/:id",
  autenticar,
  autorizar("admin"),
  EventoController.apagar,
);

/* ── Pesqueiros ─────────────────────────────────────────────────── */
router.get("/api/pesqueiros", PesqueiroController.listar);
router.get("/api/pesqueiros/:id", PesqueiroController.buscar);
router.post("/api/pesqueiros", autenticar, PesqueiroController.criar);
router.put("/api/pesqueiros/:id", autenticar, PesqueiroController.atualizar);
router.delete(
  "/api/pesqueiros/:id",
  autenticar,
  autorizar("admin"),
  PesqueiroController.apagar,
);

/* ── SEO ────────────────────────────────────────────────────────── */
router.get("/sitemap-catalogo.xml", SitemapController.gerar);

module.exports = router;
