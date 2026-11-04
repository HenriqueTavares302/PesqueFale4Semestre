const EventoModel = require("../models/EventoModel");
const PesqueiroModel = require("../models/PesqueiroModel");

function escaparXml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatarData(valor) {
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime())
    ? new Date().toISOString().slice(0, 10)
    : data.toISOString().slice(0, 10);
}

const SitemapController = {
  async gerar(_req, res) {
    const base = (process.env.URL_SITE || "https://pesqueefaledb.web.app")
      .replace(/\/+$/, "");

    try {
      const [eventos, pesqueiros] = await Promise.all([
        EventoModel.listar(),
        PesqueiroModel.listar(),
      ]);

      const urls = [
        { loc: `${base}/`, prioridade: "1.0", frequencia: "daily" },
        { loc: `${base}/login`, prioridade: "0.5", frequencia: "monthly" },
        ...pesqueiros.map((p) => ({
          loc: `${base}/pesqueiro/${p.slug}`,
          lastmod: formatarData(p.criado_em),
          prioridade: "0.8",
          frequencia: "weekly",
        })),
        ...eventos.map((e) => ({
          loc: `${base}/evento/${e.slug}`,
          lastmod: formatarData(e.criado_em),
          prioridade: "0.7",
          frequencia: "weekly",
        })),
      ];

      const corpo = urls
        .map((url) => {
          const partes = [`    <loc>${escaparXml(url.loc)}</loc>`];
          if (url.lastmod) partes.push(`    <lastmod>${url.lastmod}</lastmod>`);
          partes.push(`    <changefreq>${url.frequencia}</changefreq>`);
          partes.push(`    <priority>${url.prioridade}</priority>`);
          return `  <url>\n${partes.join("\n")}\n  </url>`;
        })
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corpo}
</urlset>
`;

      res.type("application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      return res.send(xml);
    } catch (erro) {
      console.error("Erro ao gerar sitemap:", erro.message);
      return res.status(500).type("text/plain").send("Erro ao gerar sitemap.");
    }
  },
};

module.exports = SitemapController;
