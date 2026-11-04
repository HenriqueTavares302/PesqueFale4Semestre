import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/*
 * Title, description e canonical por página (aula de SEO).
 *
 * O projeto é uma aplicação de página única: existe um só index.html e o
 * React Router troca a tela sem recarregar. Sem este componente, todas as
 * rotas compartilham o mesmo <title> "Pesque & Fale" e a mesma description.
 * Nos resultados de busca isso aparece como várias entradas idênticas, e o
 * buscador trata as páginas como duplicadas.
 *
 * Uma ressalva honesta sobre o alcance disto: o Google executa JavaScript,
 * então ele enxerga as tags que este componente injeta. Os robôs de prévia
 * de link do WhatsApp, Telegram e Facebook não executam JavaScript — eles
 * leem apenas o HTML que vem do servidor. É por isso que as tags Open Graph
 * de uso geral estão escritas em public/index.html, e não só aqui. Para que
 * cada evento tenha a própria prévia ao ser compartilhado, seria preciso
 * renderizar no servidor, o que está fora do escopo deste semestre.
 *
 * Uso:
 *   <Seo titulo="Entrar" descricao="Acesse sua conta no Pesque & Fale." />
 */

const NOME_SITE = "Pesque & Fale";
const URL_BASE = (
  process.env.REACT_APP_URL_SITE || "https://pesqueefaledb.web.app"
).replace(/\/+$/, "");

const DESCRICAO_PADRAO =
  "Conectando pescadores, compartilhando experiências e os melhores pontos de pesca.";

/* Cria a tag se ela não existir, ou atualiza a que já está no HTML. */
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
  /* titulo recebe só o nome da tela: "Entrar" vira
   * "Entrar | Pesque & Fale". */
  titulo,
  /* tituloBruto substitui o título inteiro, sem acrescentar o nome do site.
   * É o caso da página inicial, cujo título já traz as palavras que
   * interessam ao buscador e não deve ganhar sufixo repetido. */
  tituloBruto,
  descricao = DESCRICAO_PADRAO,
  /* noindex nas telas que não fazem sentido em resultado de busca: o feed
   * exige login, e a página de edição de perfil é particular. */
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

    /* Diz ao buscador qual é o endereço oficial desta página, para que
     * /home e /home?utm_source=x não contem como duas. */
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

    /* Open Graph: usado na prévia ao compartilhar o link. */
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
