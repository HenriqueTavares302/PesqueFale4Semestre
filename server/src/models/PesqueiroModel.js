const { pool } = require("../database/conexao");

const PesqueiroModel = {
  async listar() {
    const [linhas] = await pool.query(
      "SELECT * FROM pesqueiros ORDER BY avaliacao DESC, nome ASC",
    );
    return linhas;
  },

  async buscarPorId(id) {
    const [linhas] = await pool.query(
      "SELECT * FROM pesqueiros WHERE id = ? LIMIT 1",
      [id],
    );
    return linhas[0] || null;
  },

  async buscarPorSlug(slug) {
    const [linhas] = await pool.query(
      "SELECT * FROM pesqueiros WHERE slug = ? LIMIT 1",
      [slug],
    );
    return linhas[0] || null;
  },

  async criar(dados) {
    const [resultado] = await pool.query(
      `INSERT INTO pesqueiros
         (nome, cidade, estado, descricao, imagem, avaliacao, avaliacoes, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dados.nome,
        dados.cidade,
        dados.estado,
        dados.descricao,
        dados.imagem,
        dados.avaliacao,
        dados.avaliacoes,
        dados.slug,
      ],
    );
    return this.buscarPorId(resultado.insertId);
  },

  async atualizar(id, dados) {
    await pool.query(
      `UPDATE pesqueiros
          SET nome = ?, cidade = ?, estado = ?, descricao = ?,
              imagem = ?, avaliacao = ?, avaliacoes = ?, slug = ?
        WHERE id = ?`,
      [
        dados.nome,
        dados.cidade,
        dados.estado,
        dados.descricao,
        dados.imagem,
        dados.avaliacao,
        dados.avaliacoes,
        dados.slug,
        id,
      ],
    );
    return this.buscarPorId(id);
  },

  async apagar(id) {
    const [resultado] = await pool.query(
      "DELETE FROM pesqueiros WHERE id = ?",
      [id],
    );
    return resultado.affectedRows > 0;
  },

  async contar() {
    const [linhas] = await pool.query(
      "SELECT COUNT(*) AS total FROM pesqueiros",
    );
    return linhas[0].total;
  },
};

module.exports = PesqueiroModel;
