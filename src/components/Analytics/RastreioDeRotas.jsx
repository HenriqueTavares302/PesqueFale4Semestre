import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { registrarPagina } from "../../analytics";

function anonimizar(caminho) {
  return caminho
    .replace(/^\/perfil\/[^/]+$/, "/perfil/:id")
    .replace(/^\/post\/[^/]+\/[^/]+$/, "/post/:userId/:postId")
    .replace(/^\/chat\/[^/]+$/, "/chat/:chatId");
}

export function RastreioDeRotas() {
  const { pathname } = useLocation();

  useEffect(() => {
    const id = setTimeout(() => {
      registrarPagina(anonimizar(pathname), document.title);
    }, 0);

    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}

export default RastreioDeRotas;
