const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UsuarioModel = require("../models/UsuarioModel");

const CUSTO_HASH = 10;
const VALIDADE_TOKEN = "8h";

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, papel: usuario.papel },
    process.env.JWT_SEGREDO,
    { expiresIn: VALIDADE_TOKEN },
  );
}

const AuthController = {
  async registrar(req, res) {
    const { nome, email, senha, papel = "editor", codigo } = req.body || {};

    if (!nome || !email || !senha) {
      return res
        .status(400)
        .json({ erro: "Informe nome, e-mail e senha." });
    }

    if (senha.length < 8) {
      return res
        .status(400)
        .json({ erro: "A senha precisa ter ao menos 8 caracteres." });
    }

    if (!["admin", "editor"].includes(papel)) {
      return res.status(400).json({ erro: "Perfil inválido." });
    }

    if (papel === "admin" && codigo !== process.env.CODIGO_ADMIN) {
      return res
        .status(403)
        .json({ erro: "Código de administrador incorreto." });
    }

    try {
      if (await UsuarioModel.buscarPorEmail(email)) {
        return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
      }

      const hash = await bcrypt.hash(senha, CUSTO_HASH);
      const usuario = await UsuarioModel.criar({
        nome,
        email,
        senha: hash,
        papel,
      });

      return res.status(201).json({ usuario, token: gerarToken(usuario) });
    } catch (erro) {
      console.error("Erro ao registrar:", erro.message);
      return res.status(500).json({ erro: "Não foi possível cadastrar." });
    }
  },

  async entrar(req, res) {
    const { email, senha } = req.body || {};

    if (!email || !senha) {
      return res.status(400).json({ erro: "Informe e-mail e senha." });
    }

    try {
      const usuario = await UsuarioModel.buscarPorEmail(email);

      const senhaCorreta =
        usuario && (await bcrypt.compare(senha, usuario.senha));

      if (!senhaCorreta) {
        return res.status(401).json({ erro: "E-mail ou senha incorretos." });
      }

      const seguro = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      };

      return res.json({ usuario: seguro, token: gerarToken(seguro) });
    } catch (erro) {
      console.error("Erro ao entrar:", erro.message);
      return res.status(500).json({ erro: "Não foi possível entrar." });
    }
  },

  async eu(req, res) {
    try {
      const usuario = await UsuarioModel.buscarPorId(req.usuario.id);
      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado." });
      }
      return res.json({ usuario });
    } catch (erro) {
      console.error("Erro ao buscar usuário:", erro.message);
      return res.status(500).json({ erro: "Não foi possível consultar." });
    }
  },
};

module.exports = AuthController;
