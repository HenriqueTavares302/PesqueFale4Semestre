import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Seo from "../../components/Seo/Seo";
import { registrarEvento } from "../../analytics";
import logo from "../../assets/image/logo/logo.jpg";
import "./naoEncontrada.css";

/*
 * Rota não encontrada.
 *
 * Antes desta página, um caminho inexistente — um link com erro de
 * digitação, um endereço antigo compartilhado — não combinava com nenhuma
 * rota e o React Router não renderizava nada: tela em branco, sem
 * explicação e sem caminho de volta.
 *
 * A página leva noindex: endereço quebrado não deve entrar no índice do
 * Google. O evento no GA4 é o lado útil disso — o relatório mostra quais
 * URLs quebradas as pessoas estão alcançando, e de onde vieram.
 */
function NaoEncontrada() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  /* Dentro do efeito, e não no corpo do componente: no corpo o evento
   * seria enviado de novo a cada nova renderização. */
  useEffect(() => {
    registrarEvento("pagina_nao_encontrada", { caminho: pathname });
  }, [pathname]);

  return (
    <>
      <Seo
        titulo="Página não encontrada"
        descricao="O endereço acessado não existe no Pesque & Fale."
        indexar={false}
      />

      <main className="nf-container">
        <div className="nf-card">
          <img src={logo} alt="Pesque & Fale" className="nf-logo" />

          <p className="nf-codigo">404</p>
          <h1 className="nf-titulo">Esse peixe fugiu da rede</h1>

          <p className="nf-texto">
            O endereço <code className="nf-caminho">{pathname}</code> não
            existe. Pode ter sido um link antigo ou um erro de digitação.
          </p>

          <div className="nf-acoes">
            <Link to="/" className="nf-btn nf-btn-primario">
              Ir para o início
            </Link>
            <button
              type="button"
              className="nf-btn nf-btn-secundario"
              onClick={() => navigate(-1)}
            >
              Voltar
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default NaoEncontrada;
