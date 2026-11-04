function gerarSlug(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function idValido(valor) {
  return /^[0-9]+$/.test(String(valor)) && Number(valor) > 0;
}

function ouNulo(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

module.exports = { gerarSlug, idValido, ouNulo };
