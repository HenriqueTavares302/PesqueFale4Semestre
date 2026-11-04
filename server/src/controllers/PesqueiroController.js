const PesqueiroModel = require("../models/PesqueiroModel");
const { gerarSlug, idValido, ouNulo } = require("../utils/texto");

function validarCorpo(corpo) {
  const { nome, cidade, avaliacao } = corpo || {};

  if (!nome || !String(nome).trim()) return "Informe o nome do pesqueiro.";
  if (!cidade || !String(cidade).trim()) return "Informe a cidade.";

  if (avaliacao !== undefined && avaliacao !== null && avaliacao !== "") {
    const nota = Number(avaliacao);
    if (Number.isNaN(nota) || nota < 0 || nota > 5) {
      return "A avaliação deve ser um número entre 0 e 5.";
    }
  }
  return null;
}

function normalizar(corpo) {
  return {
    nome: String(corpo.nome).trim(),
    cidade: String(corpo.cidade).trim(),
    estado: (corpo.estado || "SP").toUpperCase().slice(0, 2),
    descricao: ouNulo(corpo.descricao),
    imagem: ouNulo(corpo.imagem),
    avaliacao: Number(corpo.avaliacao) || 0,
    avaliacoes: Number.parseInt(corpo.avaliacoes, 10) || 0,
    slug: gerarSlug(`${corpo.nome}-${corpo.cidade}`),
  };
}

const PesqueiroController = {
  async listar(_req, res) {
    try {
      return res.json(await PesqueiroModel.listar());
    } catch (erro) {
      console.error("Erro ao listar pesqueiros:", erro.message);
      return res.status(500).json({ erro: "Não foi possível listar." });
    }
  },

  async buscar(req, res) {
    const { id } = req.params;

    try {
      const pesqueiro = idValido(id)
        ? await PesqueiroModel.buscarPorId(id)
        : await PesqueiroModel.buscarPorSlug(id);

      if (!pesqueiro) {
        return res.status(404).json({ erro: "Pesqueiro não encontrado." });
      }
      return res.json(pesqueiro);
    } catch (erro) {
      console.error("Erro ao buscar pesqueiro:", erro.message);
      return res.status(500).json({ erro: "Não foi possível consultar." });
    }
  },

  async criar(req, res) {
    const problema = validarCorpo(req.body);
    if (problema) return res.status(400).json({ erro: problema });

    try {
      const pesqueiro = await PesqueiroModel.criar(normalizar(req.body));
      return res.status(201).json(pesqueiro);
    } catch (erro) {
      if (erro.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ erro: "Este pesqueiro já está cadastrado nessa cidade." });
      }
      console.error("Erro ao criar pesqueiro:", erro.message);
      return res.status(500).json({ erro: "Não foi possível criar." });
    }
  },

  async atualizar(req, res) {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ erro: "Id inválido." });

    const problema = validarCorpo(req.body);
    if (problema) return res.status(400).json({ erro: problema });

    try {
      if (!(await PesqueiroModel.buscarPorId(id))) {
        return res.status(404).json({ erro: "Pesqueiro não encontrado." });
      }
      const pesqueiro = await PesqueiroModel.atualizar(id, normalizar(req.body));
      return res.json(pesqueiro);
    } catch (erro) {
      console.error("Erro ao atualizar pesqueiro:", erro.message);
      return res.status(500).json({ erro: "Não foi possível atualizar." });
    }
  },

  async apagar(req, res) {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ erro: "Id inválido." });

    try {
      const apagou = await PesqueiroModel.apagar(id);
      if (!apagou) {
        return res.status(404).json({ erro: "Pesqueiro não encontrado." });
      }
      return res.status(204).send();
    } catch (erro) {
      console.error("Erro ao apagar pesqueiro:", erro.message);
      return res.status(500).json({ erro: "Não foi possível apagar." });
    }
  },
};

module.exports = PesqueiroController;
