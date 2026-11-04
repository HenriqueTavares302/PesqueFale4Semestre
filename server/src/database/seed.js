require("dotenv").config();

const bcrypt = require("bcryptjs");

const { pool } = require("./conexao");
const { criarTabelas } = require("./criarTabelas");
const { gerarSlug } = require("../utils/texto");

const UsuarioModel = require("../models/UsuarioModel");
const EventoModel = require("../models/EventoModel");
const PesqueiroModel = require("../models/PesqueiroModel");

/*
 * Carga inicial do banco.
 *
 * Os dados abaixo são exatamente os que estavam escritos à mão dentro de
 * Home.jsx, sob o comentário "Dados estáticos". Saem do componente e passam
 * a viver no MySQL, de onde o front os busca pela API.
 *
 * Rodar de novo não duplica nada: cada bloco só insere se a tabela estiver
 * vazia.
 */

const PESQUEIROS = [
  {
    nome: "Lago Azul",
    cidade: "Matão",
    estado: "SP",
    descricao:
      "Represa com boa infraestrutura para pesca de tilápia e pacu, com quiosques e área de camping.",
    imagem: "pesqueiro_311.jpg",
    avaliacao: 4.8,
    avaliacoes: 124,
  },
  {
    nome: "Recanto do Pescador",
    cidade: "Matão",
    estado: "SP",
    descricao:
      "Pesqueiro tradicional da região, conhecido pelos tanques de tucunaré e pelo restaurante.",
    imagem: "recanto_pescador.jpg",
    avaliacao: 4.6,
    avaliacoes: 89,
  },
  {
    nome: "Pesqueiro 311",
    cidade: "Araraquara",
    estado: "SP",
    descricao:
      "Lago amplo para pesca esportiva, com estrutura para competições e aluguel de caiaque.",
    imagem: "pesqueiro_311.jpg",
    avaliacao: 4.7,
    avaliacoes: 156,
  },
];

const EVENTOS = [
  {
    titulo: "Torneio de Tucunaré",
    data_evento: "2025-05-10",
    local: "Recanto do Pescador",
    imagem: "evento1.jpg",
    descricao: "Participe do maior torneio do estado!",
  },
  {
    titulo: "Pesca de Praia",
    data_evento: "2025-05-20",
    local: "Pesqueiro Rota do Peixe",
    imagem: "evento2.jpg",
    descricao: "Competição de pesca na orla.",
  },
  {
    titulo: "Campeonato de Caiaque",
    data_evento: "2025-06-05",
    local: "Pesqueiro 311",
    imagem: "evento3.jpg",
    descricao: "Pesca esportiva de caiaque.",
  },
];

/* Conta de demonstração, para a API poder ser avaliada sem cadastro manual.
 * Senha simples de propósito: não deve existir fora de desenvolvimento. */
const CONTA_DEMO = {
  nome: "Administrador de Demonstração",
  email: "admin@pesquefale.local",
  senha: "admin123456",
  papel: "admin",
};

async function semearPesqueiros() {
  if ((await PesqueiroModel.contar()) > 0) {
    console.log("Pesqueiros: tabela já tem dados, nada inserido.");
    return;
  }

  for (const p of PESQUEIROS) {
    await PesqueiroModel.criar({
      ...p,
      slug: gerarSlug(`${p.nome}-${p.cidade}`),
    });
  }
  console.log(`Pesqueiros: ${PESQUEIROS.length} inseridos.`);
}

async function semearEventos() {
  if ((await EventoModel.contar()) > 0) {
    console.log("Eventos: tabela já tem dados, nada inserido.");
    return;
  }

  /* Liga cada evento ao pesqueiro de mesmo nome, quando existir. */
  const pesqueiros = await PesqueiroModel.listar();

  for (const e of EVENTOS) {
    const relacionado = pesqueiros.find((p) => p.nome === e.local);
    await EventoModel.criar({
      ...e,
      slug: gerarSlug(`${e.titulo}-${e.data_evento}`),
      pesqueiro_id: relacionado ? relacionado.id : null,
    });
  }
  console.log(`Eventos: ${EVENTOS.length} inseridos.`);
}

async function semearUsuario() {
  if ((await UsuarioModel.contar()) > 0) {
    console.log("Usuários: tabela já tem dados, nada inserido.");
    return;
  }

  await UsuarioModel.criar({
    nome: CONTA_DEMO.nome,
    email: CONTA_DEMO.email,
    senha: await bcrypt.hash(CONTA_DEMO.senha, 10),
    papel: CONTA_DEMO.papel,
  });

  console.log("Usuários: conta de demonstração criada.");
  console.log(`  e-mail: ${CONTA_DEMO.email}`);
  console.log(`  senha:  ${CONTA_DEMO.senha}`);
}

async function executar() {
  try {
    await criarTabelas();
    console.log("Tabelas criadas ou já existentes.\n");

    await semearPesqueiros();
    await semearEventos();
    await semearUsuario();

    console.log("\nCarga inicial concluída.");
  } catch (erro) {
    console.error("\nFalha na carga inicial:", erro.message);
    if (erro.code === "ER_BAD_DB_ERROR") {
      console.error(
        "O banco não existe. Crie com:\n" +
          "  CREATE DATABASE pesque_fale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
      );
    }
    if (erro.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Usuário ou senha do MySQL incorretos. Confira o .env.");
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

executar();
