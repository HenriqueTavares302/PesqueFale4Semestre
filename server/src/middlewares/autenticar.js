const jwt = require("jsonwebtoken");

/*
 * Confere o token enviado no cabeçalho Authorization: Bearer <token>.
 *
 * Se o token for válido, anexa os dados do usuário em req.usuario e deixa a
 * requisição seguir. Caso contrário devolve 401 e a requisição para aqui,
 * sem chegar ao controller.
 */
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
