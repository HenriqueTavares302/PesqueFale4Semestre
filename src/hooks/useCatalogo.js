import { useEffect, useState } from "react";

import api from "../services/api";
import {
  EVENTOS_RESERVA,
  LOCAIS_RESERVA,
  resolverImagem,
} from "../data/catalogoReserva";

/*
 * Busca eventos e pesqueiros na API do catálogo.
 *
 * A regra central: se a requisição falhar, por qualquer motivo, o hook
 * devolve o conteúdo de reserva em vez de lista vazia. A tela nunca piora
 * em relação ao que era antes da API existir — ela só melhora quando a API
 * responde.
 *
 * Devolve { eventos, pesqueiros, carregando, origem }, em que origem é
 * "api" ou "reserva". Serve para o componente mostrar um aviso discreto, se
 * quiser, e para a conferência durante o desenvolvimento.
 */

/* O banco grava 2025-05-10; a tela mostra 10/05/2025. */
function formatarData(valor) {
  if (!valor) return "";
  const texto = String(valor).slice(0, 10);
  const [ano, mes, dia] = texto.split("-");
  if (!ano || !mes || !dia) return texto;
  return `${dia}/${mes}/${ano}`;
}

/* Adapta o formato da API ao que o carrossel da Home já espera, para que
 * nenhum trecho do JSX precise mudar. */
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
        /* As duas em paralelo: uma não espera a outra. */
        const [listaEventos, listaPesqueiros] = await Promise.all([
          api.eventos.listar(),
          api.pesqueiros.listar(),
        ]);

        if (!ativo) return;

        /* Lista vazia também mantém a reserva: um banco recém-criado não
         * deve deixar a Home sem conteúdo. */
        if (Array.isArray(listaEventos) && listaEventos.length > 0) {
          setEventos(listaEventos.map(adaptarEvento));
        }
        if (Array.isArray(listaPesqueiros) && listaPesqueiros.length > 0) {
          setPesqueiros(listaPesqueiros.map(adaptarPesqueiro));
        }
        setOrigem("api");
      } catch (erro) {
        if (!ativo) return;
        /* Aviso no console, não na tela: o visitante não tem nada a fazer
         * com essa informação, e a reserva já está sendo exibida. */
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

    /* Evita gravar estado depois que o componente saiu da tela. */
    return () => {
      ativo = false;
    };
  }, []);

  return { eventos, pesqueiros, carregando, origem };
}

export default useCatalogo;
