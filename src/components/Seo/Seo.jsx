import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const NOME_SITE = "Pesque & Fale";
const URL_BASE = (
  process.env.REACT_APP_URL_SITE || "https://pesqueefaledb.web.app"
).replace(/\/+$/, "");

const DESCRICAO_PADRAO =
  "Conectando pescadores, compartilhando experiências e os melhores pontos de pesca.";

function definirMeta(seletor, atributo, valor, criar) {
  if (!valor) return;
  let tag = document.head.querySelector(seletor);
  if (!tag) {
    tag = criar();
    document.head.appendChild(tag);
  }
  tag.setAttribute(atributo, valor);
}

export function Seo({
  titulo,
  tituloBruto,
  descricao = DESCRICAO_PADRAO,
  indexar = true,
  imagem,
}) {
  const { pathname } = useLocation();

  useEffect(() => {
    const tituloCompleto =
      tituloBruto || (titulo ? `${titulo} | ${NOME_SITE}` : NOME_SITE);
    const canonica = `${URL_BASE}${pathname}`;

    document.title = tituloCompleto;

    definirMeta('meta[name="description"]', "content", descricao, () => {
      const t = document.createElement("meta");
      t.setAttribute("name", "description");
      return t;
    });

    definirMeta('link[rel="canonical"]', "href", canonica, () => {
      const t = document.createElement("link");
      t.setAttribute("rel", "canonical");
      return t;
    });

    definirMeta(
      'meta[name="robots"]',
      "content",
      indexar ? "index, follow" : "noindex, nofollow",
      () => {
        const t = document.createElement("meta");
        t.setAttribute("name", "robots");
        return t;
      },
    );

    definirMeta('meta[property="og:title"]', "content", tituloCompleto, () => {
      const t = document.createElement("meta");
      t.setAttribute("property", "og:title");
      return t;
    });

    definirMeta('meta[property="og:description"]', "content", descricao, () => {
      const t = document.createElement("meta");
      t.setAttribute("property", "og:description");
      return t;
    });

    definirMeta('meta[property="og:url"]', "content", canonica, () => {
      const t = document.createElement("meta");
      t.setAttribute("property", "og:url");
      return t;
    });

    if (imagem) {
      definirMeta('meta[property="og:image"]', "content", imagem, () => {
        const t = document.createElement("meta");
        t.setAttribute("property", "og:image");
        return t;
      });
    }
  }, [titulo, tituloBruto, descricao, indexar, imagem, pathname]);

  return null;
}

export default Seo;
