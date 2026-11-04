const { pool } = require("./conexao");

/*
 * Criação das tabelas.
 *
 * Todas usam utf8mb4 para que acento e cedilha sejam gravados corretamente —
 * "Tucunaré" e "Avaliação" quebram em latin1.
 *
 * Observação importante sobre o escopo: estas tabelas guardam apenas o
 * catálogo público (eventos e pesqueiros) e as contas que administram esse
 * catálogo. Usuários do aplicativo, publicações, chat e notificações
 * continuam no Firebase, que já cuida disso.
 */

const USUARIOS = `
CREATE TABLE IF NOT EXISTS usuarios (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(120)  NOT NULL,
  email     VARCHAR(160)  NOT NULL UNIQUE,
  senha     VARCHAR(255)  NOT NULL,
  papel     ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  criado_em TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const PESQUEIROS = `
CREATE TABLE IF NOT EXISTS pesqueiros (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(160)  NOT NULL,
  cidade      VARCHAR(120)  NOT NULL,
  estado      CHAR(2)       NOT NULL DEFAULT 'SP',
  descricao   TEXT,
  imagem      VARCHAR(255),
  avaliacao   DECIMAL(2,1)  NOT NULL DEFAULT 0.0,
  avaliacoes  INT           NOT NULL DEFAULT 0,
  slug        VARCHAR(180)  NOT NULL UNIQUE,
  criado_em   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pesqueiros_cidade (cidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const EVENTOS = `
CREATE TABLE IF NOT EXISTS eventos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  titulo       VARCHAR(180)  NOT NULL,
  descricao    TEXT,
  data_evento  DATE          NOT NULL,
  local        VARCHAR(180)  NOT NULL,
  imagem       VARCHAR(255),
  slug         VARCHAR(200)  NOT NULL UNIQUE,
  pesqueiro_id INT NULL,
  criado_em    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_eventos_data (data_evento),
  CONSTRAINT fk_eventos_pesqueiro
    FOREIGN KEY (pesqueiro_id) REFERENCES pesqueiros(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function criarTabelas() {
  /* A ordem importa: eventos tem chave estrangeira para pesqueiros. */
  await pool.query(USUARIOS);
  await pool.query(PESQUEIROS);
  await pool.query(EVENTOS);
}

module.exports = { criarTabelas };
