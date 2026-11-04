const { pool } = require("../database/conexao");

/*
 * Todo o SQL fica nos models. Os controllers não sabem qual banco está por
 * trás: se um dia o MySQL for trocado, só este arquivo muda.
 */
const UsuarioModel = {
  async criar({ nome, email, senha, papel }) {
    const [resultado] = await pool.query(
      "INSERT INTO usuarios (nome, email, senha, papel) VALUES (?, ?, ?, ?)",
      [nome, email, senha, papel],
    );
    return this.buscarPorId(resultado.insertId);
  },

  async buscarPorEmail(email) {
    const [linhas] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );
    return linhas[0] || null;
  },

  /* Sem a coluna senha: este retorno vai para o navegador. */
  async buscarPorId(id) {
    const [linhas] = await pool.query(
      "SELECT id, nome, email, papel, criado_em FROM usuarios WHERE id = ? LIMIT 1",
      [id],
    );
    return linhas[0] || null;
  },

  async contar() {
    const [linhas] = await pool.query("SELECT COUNT(*) AS total FROM usuarios");
    return linhas[0].total;
  },
};

module.exports = UsuarioModel;
