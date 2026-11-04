/*
 * Gera o slug usado na URL a partir do título.
 * "Torneio de Tucunaré" vira "torneio-de-tucunare".
 *
 * NFD separa a letra do acento e o replace seguinte remove o acento,
 * porque acento em URL vira escape ilegível (%C3%A9) e prejudica o SEO.
 */
function gerarSlug(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

/*
 * Valida o id recebido na URL antes de chegar ao banco.
 *
 * Sem isso, GET /api/eventos/ID devolve 500 com erro do MySQL
 * (ER_TRUNCATED_WRONG_VALUE) em vez de um 400 claro — o erro vem do banco,
 * quando devia ser barrado na entrada.
 */
function idValido(valor) {
  return /^[0-9]+$/.test(String(valor)) && Number(valor) > 0;
}

/* Converte "" em null para não gravar string vazia em coluna opcional. */
function ouNulo(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

module.exports = { gerarSlug, idValido, ouNulo };
