const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const [esquema, token] = cabecalho.split(" ");

  if (esquema !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token não enviado." });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SEGREDO);
    req.usuario = { id: dados.id, nome: dados.nome, papel: dados.papel };
    return next();
  } catch (erro) {
    if (erro.name === "TokenExpiredError") {
      return res.status(401).json({ erro: "Token expirado. Entre novamente." });
    }
    return res.status(401).json({ erro: "Token inválido." });
  }
}

module.exports = autenticar;
