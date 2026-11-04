const EventoModel = require("../models/EventoModel");
const { gerarSlug, idValido, ouNulo } = require("../utils/texto");

/* Aceita 2025-05-10 e devolve o mesmo formato, que é o que o MySQL grava. */
function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return null;
  const data = new Date(`${valor}T00:00:00Z`);
  return Number.isNaN(data.getTime()) ? null : valor;
}

function validarCorpo(corpo) {
  const { titulo, data_evento, local } = corpo || {};

  if (!titulo || !String(titulo).trim()) return "Informe o título do evento.";
  if (!local || !String(local).trim()) return "Informe o local do evento.";
  if (!dataValida(data_evento)) {
    return "Informe a data no formato AAAA-MM-DD.";
  }
  return null;
}

const EventoController = {
  /* Rota pública. ?futuros=1 traz só os que ainda vão acontecer. */
  async listar(req, res) {
    try {
      const eventos =
        req.query.futuros === "1"
          ? await EventoModel.listarFuturos()
          : await EventoModel.listar();
      return res.json(eventos);
    } catch (erro) {
      console.error("Erro ao listar eventos:", erro.message);
      return res.status(500).json({ erro: "Não foi possível listar." });
    }
  },

  /* Aceita id numérico ou slug, para que a URL possa ser legível. */
  async buscar(req, res) {
    const { id } = req.params;

    try {
      const evento = idValido(id)
        ? await EventoModel.buscarPorId(id)
        : await EventoModel.buscarPorSlug(id);

      if (!evento) {
        return res.status(404).json({ erro: "Evento não encontrado." });
      }
      return res.json(evento);
    } catch (erro) {
      console.error("Erro ao buscar evento:", erro.message);
      return res.status(500).json({ erro: "Não foi possível consultar." });
    }
  },

  async criar(req, res) {
    const problema = validarCorpo(req.body);
    if (problema) return res.status(400).json({ erro: problema });

    const { titulo, descricao, data_evento, local, imagem, pesqueiro_id } =
      req.body;

    try {
      const evento = await EventoModel.criar({
        titulo: String(titulo).trim(),
        descricao: ouNulo(descricao),
        data_evento,
        local: String(local).trim(),
        imagem: ouNulo(imagem),
        slug: gerarSlug(`${titulo}-${data_evento}`),
        pesqueiro_id: idValido(pesqueiro_id) ? Number(pesqueiro_id) : null,
      });
      return res.status(201).json(evento);
    } catch (erro) {
      if (erro.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ erro: "Já existe um evento com esse título nessa data." });
      }
      console.error("Erro ao criar evento:", erro.message);
      return res.status(500).json({ erro: "Não foi possível criar." });
    }
  },

  async atualizar(req, res) {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ erro: "Id inválido." });

    const problema = validarCorpo(req.body);
    if (problema) return res.status(400).json({ erro: problema });

    const { titulo, descricao, data_evento, local, imagem, pesqueiro_id } =
      req.body;

    try {
      if (!(await EventoModel.buscarPorId(id))) {
        return res.status(404).json({ erro: "Evento não encontrado." });
      }

      const evento = await EventoModel.atualizar(id, {
        titulo: String(titulo).trim(),
        descricao: ouNulo(descricao),
        data_evento,
        local: String(local).trim(),
        imagem: ouNulo(imagem),
        slug: gerarSlug(`${titulo}-${data_evento}`),
        pesqueiro_id: idValido(pesqueiro_id) ? Number(pesqueiro_id) : null,
      });
      return res.json(evento);
    } catch (erro) {
      console.error("Erro ao atualizar evento:", erro.message);
      return res.status(500).json({ erro: "Não foi possível atualizar." });
    }
  },

  async apagar(req, res) {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ erro: "Id inválido." });

    try {
      const apagou = await EventoModel.apagar(id);
      if (!apagou) {
        return res.status(404).json({ erro: "Evento não encontrado." });
      }
      return res.status(204).send();
    } catch (erro) {
      console.error("Erro ao apagar evento:", erro.message);
      return res.status(500).json({ erro: "Não foi possível apagar." });
    }
  },
};

module.exports = EventoController;
