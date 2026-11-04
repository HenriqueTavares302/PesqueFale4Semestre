/*
 * Confere o papel do usuário já autenticado.
 *
 * Usado sempre depois de autenticar, porque depende de req.usuario:
 *   router.delete("/:id", autenticar, autorizar("admin"), Controller.apagar)
 *
 * A verificação é feita aqui, no servidor. O front esconder um botão é
 * conveniência de interface: um DELETE enviado direto à API com token de
 * editor recebe 403 do mesmo jeito.
 */
function autorizar(...papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: "Não autenticado." });
    }

    if (!papeisPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({
        erro: "Seu perfil não tem permissão para esta ação.",
      });
    }

    return next();
  };
}

module.exports = autorizar;
