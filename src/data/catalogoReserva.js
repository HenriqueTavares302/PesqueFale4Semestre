import imgEvento1 from "../assets/image/eventos/evento1.jpg";
import imgEvento2 from "../assets/image/eventos/evento2.jpg";
import imgEvento3 from "../assets/image/eventos/evento3.jpg";
import imgPesqueiro311 from "../assets/image/eventos/pesqueiro_311.jpg";
import imgRecantoPescador from "../assets/image/eventos/recanto_pescador.jpg";

export const IMAGENS_CATALOGO = {
  "evento1.jpg": imgEvento1,
  "evento2.jpg": imgEvento2,
  "evento3.jpg": imgEvento3,
  "pesqueiro_311.jpg": imgPesqueiro311,
  "recanto_pescador.jpg": imgRecantoPescador,
};

export const IMAGEM_PADRAO = imgPesqueiro311;

export function resolverImagem(nome) {
  if (!nome) return IMAGEM_PADRAO;
  return IMAGENS_CATALOGO[nome] || IMAGEM_PADRAO;
}

export const EVENTOS_RESERVA = [
  {
    titulo: "Torneio de Tucunaré",
    data: "10/05/2025",
    local: "Recanto do Pescador",
    imagem: imgEvento1,
    descricao: "Participe do maior torneio do estado!",
  },
  {
    titulo: "Pesca de Praia",
    data: "20/05/2025",
    local: "Pesqueiro Rota do Peixe",
    imagem: imgEvento2,
    descricao: "Competição de pesca na orla.",
  },
  {
    titulo: "Campeonato de Caiaque",
    data: "05/06/2025",
    local: "Pesqueiro 311",
    imagem: imgEvento3,
    descricao: "Pesca esportiva de caiaque.",
  },
];

export const LOCAIS_RESERVA = [
  {
    nome: "Lago Azul",
    cidade: "Matão - SP",
    avaliacao: 4.8,
    avaliacoes: 124,
    imagem: imgPesqueiro311,
  },
  {
    nome: "Recanto do Pescador",
    cidade: "Matão - SP",
    avaliacao: 4.6,
    avaliacoes: 89,
    imagem: imgRecantoPescador,
  },
  {
    nome: "Pesqueiro 311",
    cidade: "Araraquara - SP",
    avaliacao: 4.7,
    avaliacoes: 156,
    imagem: imgPesqueiro311,
  },
];
