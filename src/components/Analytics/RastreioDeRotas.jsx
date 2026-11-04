import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { registrarPagina } from "../../analytics";

/*
 * Dispara page_view a cada troca de rota.
 *
 * A tag do GA4 em index.html registra a primeira visita sozinha. Daí em
 * diante, o React Router troca a tela sem recarregar a página, e o GA4 não
 * tem como perceber. Sem este componente, o relatório mostraria uma única
 * visualização por sessão, sempre na mesma URL, e todo o caminho que o
 * usuário percorre dentro do aplicativo ficaria invisível.
 *
 * Fica dentro do BrowserRouter, acima das rotas, porque useLocation só
 * funciona sob o Router.
 */

/* Não envia o id do usuário ou do post que aparecem na URL: /perfil/abc123
 * viraria um identificador pessoal dentro do relatório. */
function anonimizar(caminho) {
  return caminho
    .replace(/^\/perfil\/[^/]+$/, "/perfil/:id")
    .replace(/^\/post\/[^/]+\/[^/]+$/, "/post/:userId/:postId")
    .replace(/^\/chat\/[^/]+$/, "/chat/:chatId");
}

export function RastreioDeRotas() {
  const { pathname } = useLocation();

  useEffect(() => {
    /* Espera o Seo da página atualizar document.title, para que o relatório
     * não registre o título da tela anterior. */
    const id = setTimeout(() => {
      registrarPagina(anonimizar(pathname), document.title);
    }, 0);

    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}

export default RastreioDeRotas;
