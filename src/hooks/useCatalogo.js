import { useEffect, useState } from "react";

import api from "../services/api";
import {
  EVENTOS_RESERVA,
  LOCAIS_RESERVA,
  resolverImagem,
} from "../data/catalogoReserva";

function formatarData(valor) {
  if (!valor) return "";
  const texto = String(valor).slice(0, 10);
  const [ano, mes, dia] = texto.split("-");
  if (!ano || !mes || !dia) return texto;
  return `${dia}/${mes}/${ano}`;
}

function adaptarEvento(evento) {
  return {
    id: evento.id,
    slug: evento.slug,
    titulo: evento.titulo,
    data: formatarData(evento.data_evento),
    local: evento.pesqueiro_nome || evento.local,
    imagem: resolverImagem(evento.imagem),
    descricao: evento.descricao || "",
  };
}

function adaptarPesqueiro(pesqueiro) {
  return {
    id: pesqueiro.id,
    slug: pesqueiro.slug,
    nome: pesqueiro.nome,
    cidade: `${pesqueiro.cidade} - ${pesqueiro.estado || "SP"}`,
    avaliacao: Number(pesqueiro.avaliacao) || 0,
    avaliacoes: Number(pesqueiro.avaliacoes) || 0,
    imagem: resolverImagem(pesqueiro.imagem),
  };
}

export function useCatalogo() {
  const [eventos, setEventos] = useState(EVENTOS_RESERVA);
  const [pesqueiros, setPesqueiros] = useState(LOCAIS_RESERVA);
  const [carregando, setCarregando] = useState(true);
  const [origem, setOrigem] = useState("reserva");

  useEffect(() => {
    let ativo = true;

    async function buscar() {
      try {
        const [listaEventos, listaPesqueiros] = await Promise.all([
          api.eventos.listar(),
          api.pesqueiros.listar(),
        ]);

        if (!ativo) return;

        if (Array.isArray(listaEventos) && listaEventos.length > 0) {
          setEventos(listaEventos.map(adaptarEvento));
        }
        if (Array.isArray(listaPesqueiros) && listaPesqueiros.length > 0) {
          setPesqueiros(listaPesqueiros.map(adaptarPesqueiro));
        }
        setOrigem("api");
      } catch (erro) {
        if (!ativo) return;
        console.info(
          "Catálogo: API indisponível, usando conteúdo local.",
          erro.message,
        );
        setOrigem("reserva");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscar();

    return () => {
      ativo = false;
    };
  }, []);

  return { eventos, pesqueiros, carregando, origem };
}

export default useCatalogo;
