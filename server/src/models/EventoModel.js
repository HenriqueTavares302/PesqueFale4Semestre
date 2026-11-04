const { pool } = require("../database/conexao");

/*
 * O LEFT JOIN traz o nome do pesqueiro junto com o evento, para o front não
 * precisar de uma segunda requisição por evento (o problema de N+1 consultas
 * que a aula de escalabilidade levanta).
 */
const SELECT_BASE = `
  SELECT e.*, p.nome AS pesqueiro_nome, p.slug AS pesqueiro_slug
    FROM eventos e
    LEFT JOIN pesqueiros p ON p.id = e.pesqueiro_id
`;

const EventoModel = {
  async listar() {
    const [linhas] = await pool.query(
      `${SELECT_BASE} ORDER BY e.data_evento ASC`,
    );
    return linhas;
  },

  /* Só os que ainda não aconteceram: é o que a Home mostra no carrossel. */
  async listarFuturos() {
    const [linhas] = await pool.query(
      `${SELECT_BASE} WHERE e.data_evento >= CURDATE() ORDER BY e.data_evento ASC`,
    );
    return linhas;
  },

  async buscarPorId(id) {
    const [linhas] = await pool.query(`${SELECT_BASE} WHERE e.id = ? LIMIT 1`, [
      id,
    ]);
    return linhas[0] || null;
  },

  async buscarPorSlug(slug) {
    const [linhas] = await pool.query(
      `${SELECT_BASE} WHERE e.slug = ? LIMIT 1`,
      [slug],
    );
    return linhas[0] || null;
  },

  async criar(dados) {
    const [resultado] = await pool.query(
      `INSERT INTO eventos
         (titulo, descricao, data_evento, local, imagem, slug, pesqueiro_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dados.titulo,
        dados.descricao,
        dados.data_evento,
        dados.local,
        dados.imagem,
        dados.slug,
        dados.pesqueiro_id,
      ],
    );
    return this.buscarPorId(resultado.insertId);
  },

  async atualizar(id, dados) {
    await pool.query(
      `UPDATE eventos
          SET titulo = ?, descricao = ?, data_evento = ?, local = ?,
              imagem = ?, slug = ?, pesqueiro_id = ?
        WHERE id = ?`,
      [
        dados.titulo,
        dados.descricao,
        dados.data_evento,
        dados.local,
        dados.imagem,
        dados.slug,
        dados.pesqueiro_id,
        id,
      ],
    );
    return this.buscarPorId(id);
  },

  async apagar(id) {
    const [resultado] = await pool.query("DELETE FROM eventos WHERE id = ?", [
      id,
    ]);
    return resultado.affectedRows > 0;
  },

  async contar() {
    const [linhas] = await pool.query("SELECT COUNT(*) AS total FROM eventos");
    return linhas[0].total;
  },
};

module.exports = EventoModel;
