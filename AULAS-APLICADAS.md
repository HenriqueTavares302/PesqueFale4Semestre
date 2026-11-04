# O que foi aplicado no projeto

Mapa entre o conteúdo das aulas de Laboratório de Desenvolvimento Web
(prof. Marivaldo Alcantara) e os pontos do Pesque & Fale onde ele aparece.

Henrique Tavares Andrade — Fatec Matão

---

## Resumo

| Conteúdo | Situação | Onde está |
| --- | --- | --- |
| React, componentização, rotas | **já existia** | `src/pages`, `src/components`, `src/routes` |
| Autenticação | **já existia** (Firebase) | `src/auth.js` |
| Banco de dados | **já existia** (Firestore) | posts, chat, perfis, locais |
| Hospedagem | **já existia** (Firebase Hosting) | `firebase.json` |
| API REST própria | adicionado | `server/` |
| MySQL com SQL isolado em models | adicionado | `server/src/models/` |
| JWT e permissão por perfil | adicionado | `server/src/middlewares/` |
| Docker | adicionado | `Dockerfile`, `server/Dockerfile` |
| Docker Compose | adicionado | `docker-compose.yml` |
| Nginx e proxy reverso | adicionado | `nginx/nginx.conf` |
| Verificação de saúde | adicionado | `GET /health` |
| SEO | adicionado | `public/index.html`, `src/components/Seo/` |
| Google Analytics 4 | adicionado | `src/analytics.js` |

---

## O que já estava pronto e não foi mexido

O pedido era aplicar o que faltava sem desfazer o que funciona. Estes
pontos das aulas o projeto já cumpria, então ficaram como estavam:

- **Componentização e props.** As telas já eram componentes separados, com
  partes reutilizáveis em `src/components`.
- **Rotas com React Router.** `src/routes/routes.jsx` já trazia rotas
  públicas e protegidas, com o `ProtectedRoute` conferindo o login.
- **Autenticação.** Login, cadastro e sessão já funcionavam pelo Firebase
  Authentication.
- **Banco de dados.** Perfis, publicações, chat, notificações e locais já
  estavam no Firestore, com atualização em tempo real.
- **Hospedagem com rota de SPA.** O `firebase.json` já tinha o `rewrite`
  que entrega o `index.html` em qualquer caminho — o mesmo papel que o
  `try_files` cumpre no Nginx.
- **Responsividade e identidade visual.** Nada do CSS foi alterado.

---

## Aula de API REST — a decisão mais importante

### O impasse

O Firebase já era o back-end do projeto: ele cuidava de login, perfis,
publicações, chat e notificações. Trocar isso por uma API Node/Express
significaria reescrever o aplicativo inteiro e jogar fora o que já
funcionava.

### A saída

Ao ler o `Home.jsx` apareceu este trecho, na linha 455:

```js
/* ── Dados estáticos ── */
const eventos = [
  { titulo: "Torneio de Tucunaré", data: "10/05/2025", ... },
  ...
];

const locais = [
  { nome: "Lago Azul", cidade: "Matão - SP", avaliacao: 4.8, ... },
  ...
];
```

Os eventos e os pesqueiros em destaque estavam **escritos à mão dentro do
componente**. Para cadastrar um torneio novo era preciso editar código,
construir o projeto e publicar de novo.

Esse é exatamente o problema que uma API resolve. Então a API foi feita
para o catálogo público, que:

- não conflita com o Firebase, porque trata de dados que ele não guardava;
- tem uso real na tela: alimenta o carrossel da Home;
- é conteúdo **público**, que interessa ao buscador — o que liga esta parte
  direto à aula de SEO.

### A estrutura

```
server/src/
├── server.js               sobe o Express, CORS, /health
├── routes/index.js         caminhos e permissões, tudo em um arquivo
├── controllers/            recebem a requisição, validam, respondem
├── models/                 onde fica o SQL
├── middlewares/            autenticar (quem é) e autorizar (o que pode)
├── database/               conexão, tabelas e carga inicial
└── utils/texto.js          slug e validação de id
```

**O SQL fica só nos models.** Os controllers não sabem qual banco está por
trás. Trocar o MySQL por outro banco mexeria apenas nesses arquivos.

**A política de acesso cabe em uma tela.** Cada rota declara os middlewares
que a protegem, então `routes/index.js` mostra a permissão de todos os
endpoints de uma vez:

```js
router.get("/api/eventos", EventoController.listar);                    // aberto
router.post("/api/eventos", autenticar, EventoController.criar);        // com token
router.delete("/api/eventos/:id", autenticar, autorizar("admin"), ...); // só admin
```

**A verificação acontece no servidor.** Esconder um botão na interface é
conveniência: um `DELETE` enviado direto à API com token de editor recebe
403 do mesmo jeito.

**O papel não é escolhido livremente no cadastro.** Se qualquer um pudesse
se registrar como `admin`, todo o controle de permissão não valeria nada.
Virar admin exige um código que fica no `.env` do servidor e nunca chega ao
navegador.

### Detalhe que veio de um erro anterior

No projeto passado, `GET /api/alunos/ID` devolvia **500** com erro do MySQL
(`ER_TRUNCATED_WRONG_VALUE`), porque o texto ia direto para a consulta. O
erro é do cliente, não do servidor. Aqui o id é validado antes:

```js
function idValido(valor) {
  return /^[0-9]+$/.test(String(valor)) && Number(valor) > 0;
}
```

Agora devolve **400** com mensagem clara.

### A reserva que protege a tela

O `useCatalogo` busca na API, mas se ela não responder devolve o conteúdo
local de `src/data/catalogoReserva.js` — os mesmos dados que estavam no
`Home.jsx`. A Home nunca fica com carrossel vazio: ela só melhora quando a
API responde, e nunca piora em relação ao que era antes.

---

## Aula de Docker

### Imagem da API — `server/Dockerfile`

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 3001
CMD ["npm", "start"]
```

- **`node:22-alpine`** em vez da imagem completa. Na atividade anterior a
  diferença medida foi de 241 MB contra 1,62 GB.
- **Manifestos antes do código.** O Docker guarda cada etapa em cache e só
  refaz a partir da primeira que mudou. Como o `package.json` muda bem menos
  que o código, alterar um controller reaproveita a instalação.
- **`npm ci`** em vez de `install`: usa as versões exatas do
  `package-lock.json`, então a imagem sai igual na minha máquina e no
  servidor.
- **`USER node`.** Sem essa linha o processo roda como root: quem explorasse
  uma falha teria controle do container.
- **`EXPOSE` não publica porta.** É documentação; quem liga a porta é o `-p`
  do `docker run` ou o mapeamento do compose.
- **A API escuta em `0.0.0.0`**, não em `127.0.0.1`. Dentro do container,
  `127.0.0.1` é o próprio container, e as conexões vindas pelo `-p` seriam
  recusadas.

### Imagem do front — `Dockerfile`, em duas etapas

A ideia: **as ferramentas que constroem o site não precisam ir para o
servidor.**

```dockerfile
FROM node:22-alpine AS construcao
RUN npm ci && npm run build          # React, Webpack, node_modules

FROM nginx:1.27-alpine
COPY --from=construcao /app/build /usr/share/nginx/html
```

A segunda etapa começa de uma imagem limpa e copia só a pasta `build`. A
imagem final fica em torno de 50 MB em vez de mais de 600 MB, e nem o
código fonte nem as dependências ficam expostos no servidor.

Um detalhe que só aparece ao fazer: as variáveis `REACT_APP_` são lidas **no
momento do build**, porque o Create React App grava os valores dentro do
JavaScript gerado. Por isso elas entram como `ARG`, e não como variável de
ambiente do container — trocar o Measurement ID exige construir de novo.

### `docker-compose.yml`

Três serviços: `banco` (MySQL 8), `api` e `web` (Nginx).

Dois pontos que custaram atenção:

**Esperar o banco de verdade.** O `depends_on` comum só garante que o
container do MySQL foi criado, não que ele aceita conexão — e o MySQL leva
alguns segundos para subir. A API morria no começo. A solução foi um
`healthcheck` no banco e:

```yaml
depends_on:
  banco:
    condition: service_healthy
```

**Volume nomeado.** Sem ele, `docker compose down` apagaria o banco inteiro.

---

## Aula de arquiteturas escaláveis e Nginx

### A linha indispensável

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

O build gera um único `index.html`. As rotas `/home`, `/perfil` e
`/pesquisar` existem apenas dentro do JavaScript, no React Router — não há
pasta nem arquivo com esses nomes.

Navegando pela interface funciona, porque o React troca a tela sem pedir
nada ao servidor. O problema aparece ao apertar F5 em `/perfil`, ou ao abrir
um link compartilhado: o navegador pede `/perfil` ao Nginx, que procura o
arquivo, não encontra e devolve 404. O site parece quebrado em toda URL que
não seja a raiz.

O `try_files` diz: procure o arquivo, depois a pasta, e se nenhum existir
entregue o `index.html`. O React carrega, lê a URL e mostra a tela certa.

### Proxy reverso

```nginx
upstream api_pesque_fale {
    server api:3001;
    keepalive 32;
}

location /api/ {
    proxy_pass http://api_pesque_fale/api/;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Com `/api` servido pelo mesmo domínio, o navegador vê uma só origem e o
**CORS deixa de existir** no caminho. O front chama `/api/eventos` sem
precisar saber onde a API roda.

O `X-Forwarded-For` importa: sem ele a API veria todas as requisições
vindas do IP do container do Nginx, e o registro perderia o IP real do
visitante.

### Escalar na horizontal

Para distribuir a carga, bastaria subir mais instâncias e listá-las:

```nginx
upstream api_pesque_fale {
    server api_1:3001;
    server api_2:3001;
}
```

Sem diretiva, o Nginx usa **round robin**. As outras opções vistas em aula:

| Método | Quando usar |
| --- | --- |
| round robin | padrão, requisições parecidas entre si |
| `least_conn` | requisições com durações desiguais |
| `ip_hash` | quando a sessão fica na memória do processo |

Esta API **não precisa de `ip_hash`**: a sessão está no token JWT, que o
cliente carrega em cada requisição. Qualquer instância atende qualquer
chamada — é o que torna a API escalável na horizontal.

### Verificação de saúde

```js
app.get("/health", async (_req, res) => {
  try {
    await verificarConexao();
    return res.json({ status: "ok", banco: "conectado", ... });
  } catch {
    return res.status(503).json({ status: "indisponivel" });
  }
});
```

Não basta responder 200. Se o banco caiu, a aplicação está no ar mas não
serve para nada: o status vira **503** e o balanceador tira esta instância
da rotação, em vez de continuar mandando visitantes para ela.

### Cache e compressão

| Arquivo | Política | Por quê |
| --- | --- | --- |
| `/static/*` | 1 ano, `immutable` | o nome traz um hash do conteúdo: `main.a1b2c3d4.js`. Conteúdo novo gera nome novo. |
| imagens e fontes | 30 dias | mudam pouco |
| `index.html` | **nunca** | é o arquivo que aponta para os demais. Em cache, o visitante nunca veria uma versão nova do site. |

O gzip cobre só texto. JPEG e PNG já são comprimidos — passar gzip neles
gastaria processador sem reduzir nada.

---

## Aula de SEO e Web Analytics

### Dois bugs que apareceram no caminho

O `public/index.html` apontava para arquivos que não existem:

```html
<link rel="icon" href="%PUBLIC_URL%/Favicon.ico" />              <!-- é favicon.ico -->
<link rel="icon" href="%PUBLIC_URL%/logofavicon-32x32.png" />    <!-- é favicon-32x32.png -->
```

O navegador recebia 404 nos dois e caía no ícone genérico.

O `public/manifest.json` nunca tinha sido editado: ainda dizia
`"Create React App Sample"` e apontava para `logo192.png` e `logo512.png`,
que também não existem. Quem adicionasse o site à tela inicial do celular
veria o nome errado e nenhum ícone.

Os dois foram corrigidos.

### O que foi acrescentado no HTML

| Tag | Função |
| --- | --- |
| `title` descritivo | o que aparece como link azul no resultado de busca |
| `description` | não muda a posição, mas decide se a pessoa clica |
| `canonical` | sem ele, `/` e `/?utm_source=x` contam como páginas duplicadas |
| `robots` | diz o que indexar |
| Open Graph | prévia do link no WhatsApp, Facebook e LinkedIn |
| Twitter Card | o mesmo para o X |
| JSON-LD | descreve o site em vocabulário que o buscador entende |
| `theme-color` | cor da barra do navegador no celular |

### Title por rota

Uma aplicação de página única tem um só `index.html`. Sem tratamento, todas
as rotas dividem o mesmo título, e o buscador vê várias páginas idênticas.
O componente `src/components/Seo/Seo.jsx` reescreve `title`, `description`
e `canonical` a cada tela.

**Uma ressalva honesta:** o Google executa JavaScript e enxerga essas tags.
Os robôs de prévia de link do WhatsApp e do Facebook **não executam
JavaScript** — leem apenas o HTML entregue pelo servidor. É por isso que as
tags Open Graph de uso geral estão escritas no `index.html`, e não só no
componente. Para cada evento ter a própria prévia ao ser compartilhado,
seria preciso renderizar no servidor, o que está fora do escopo deste
semestre.

### robots.txt e sitemap

O `robots.txt` bloqueia as rotas que exigem login:

```
Disallow: /perfil
Disallow: /chat
Disallow: /publicar
```

Pedir ao Google que indexe uma página que ele não consegue abrir gera erro
de cobertura no Search Console, e a tela de carregamento é o que ele veria.

São dois sitemaps:

- `public/sitemap.xml` — fixo, com as páginas públicas do site.
- `/sitemap-catalogo.xml` — **gerado pela API a partir do banco**. Um
  sitemap escrito à mão envelhece: cada evento novo exigiria editar o
  arquivo. Como os eventos estão no MySQL, o XML é montado na hora.

É aqui que a aula de API e a de SEO se encontram: o catálogo estar no banco
é o que permite o sitemap ser automático.

### Google Analytics 4

A tag fica no `index.html` e os envios em `src/analytics.js`. Quatro
decisões:

**O `send_page_view` da tag está desligado.** Num SPA, o React Router troca
a tela sem recarregar, e o GA4 contaria uma visita por sessão. Quem conta as
páginas é o `RastreioDeRotas`, a cada troca de rota. Deixar os dois ligados
contaria a primeira visita duas vezes.

**Nada é enviado em desenvolvimento.** Testar na máquina local não deve
sujar o relatório de produção.

**Sem o Measurement ID, nada é carregado.** Nenhum erro no console e nenhuma
requisição à toa.

**Nenhum dado pessoal sai.** Os eventos medem navegação e uso da interface:

| Evento | Quando | O que leva |
| --- | --- | --- |
| `login` | entrada confirmada | só o método |
| `sign_up` | conta criada | só o método |
| `publicacao_criada` | publicação enviada | se tem foto, quantas tags |
| `search` | 1s após parar de digitar | o termo buscado |
| `selecionar_aba_feed` | troca de aba | qual aba |
| `pagina_nao_encontrada` | rota inexistente | o caminho |

Nome, e-mail, texto de publicação e mensagem de chat **não são enviados** —
isso é dado pessoal e não tem por que sair do Firebase. Na URL, os
identificadores são trocados antes do envio: `/perfil/abc123` vira
`/perfil/:id`.

A busca merece nota: a filtragem é reativa, letra por letra. Enviar um
evento a cada tecla registraria `t`, `tu`, `tuc` e inundaria o relatório. O
atraso de um segundo faz com que só o termo final seja enviado.

---

## Outras correções

**Página de rota não encontrada.** Não havia rota `*`: um link com erro de
digitação não combinava com nada e o React Router não renderizava nada —
tela em branco, sem explicação e sem caminho de volta. Agora existe
`src/pages/NaoEncontrada/`, com `noindex` e um evento no GA4 que mostra
quais URLs quebradas as pessoas estão alcançando.

**`src/firebase.js.example`.** O arquivo real está no `.gitignore`, então
não vem no repositório — e sem ele o projeto nem compila. Quem clona o
projeto agora tem um modelo para copiar.

---

## O que ficou de fora, e por quê

**O Firebase não foi substituído.** Seria reescrever o aplicativo inteiro
para chegar ao mesmo lugar, desfazendo o que já funciona. A API entrou onde
havia uma lacuna real.

**Não há página pública de evento ou pesqueiro.** O sitemap da API lista
`/evento/<slug>` e `/pesqueiro/<slug>`, mas essas rotas ainda não existem no
front — é o próximo passo natural, e aí os endereços passam a valer no
buscador. Até lá, o sitemap do catálogo aponta para rotas que ainda vão
nascer.

**`CI=true` está desligado no Dockerfile do front.** Com ele, todo aviso do
ESLint vira erro e interrompe o build. O projeto tem avisos antigos —
variáveis declaradas e não usadas em `Onboarding.jsx`, `OnboardingTour.jsx`,
`GaleriaPerfil.jsx` e `Notificacao.jsx`, e dependências faltando em alguns
`useEffect`. Não impedem a aplicação de funcionar, mas impediriam a imagem
de ser construída. Limpar esses avisos e então ligar o `CI=true` é a
configuração correta: ela transforma descuido em erro de build em vez de
deixar passar para produção.

**Renderização no servidor.** Resolveria a prévia de link por página e a
indexação sem depender de JavaScript, mas exigiria trocar o Create React App
por Next.js ou equivalente — projeto de outro porte.
