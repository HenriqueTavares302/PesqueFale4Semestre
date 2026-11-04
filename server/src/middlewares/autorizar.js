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
