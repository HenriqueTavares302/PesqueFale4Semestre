const { Router } = require("express");

const AuthController = require("../controllers/AuthController");
const EventoController = require("../controllers/EventoController");
const PesqueiroController = require("../controllers/PesqueiroController");
const SitemapController = require("../controllers/SitemapController");

const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = Router();

router.post("/api/auth/registrar", AuthController.registrar);
router.post("/api/auth/entrar", AuthController.entrar);
router.get("/api/auth/eu", autenticar, AuthController.eu);

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

router.get("/sitemap-catalogo.xml", SitemapController.gerar);

module.exports = router;
