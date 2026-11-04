# 🎣 Pesque & Fale

![Status](https://img.shields.io/badge/status-3º%20semestre%20concluído-success)
![Site](https://img.shields.io/badge/site-online-062A6C)

## 🔗 Acesse o projeto

🌐 **[pesqueefaledb.web.app](https://pesqueefaledb.web.app/)**

> Branch de referência deste README: `3-semestre`

## 🌊 Sobre o Projeto

O **Pesque & Fale** é uma plataforma web inspirada em redes sociais, criada para conectar pescadores e facilitar o compartilhamento de experiências, avaliações e recomendações de locais de pesca.

A proposta é centralizar informações úteis e ajudar usuários a encontrarem os melhores ambientes para pesca, promovendo o lazer, o trabalho decente e a pesca sustentável.

## 🎯 Objetivos

- 🎣 Conectar pescadores
- 📍 Ajudar na descoberta de novos pontos de pesca
- ⭐ Permitir avaliações de locais
- 💬 Compartilhar experiências
- 🌱 Incentivar práticas sustentáveis

## ❗ Problema

Encontrar bons locais para pesca nem sempre é fácil. Falta informação centralizada, confiável e acessível para pescadores iniciantes e experientes.

## 💡 Solução

Uma plataforma onde usuários possam:

- ✔ Avaliar locais
- ✔ Publicar experiências
- ✔ Interagir com outros pescadores
- ✔ Descobrir novos pontos recomendados

---

## ⚙️ Funcionalidades

### 🔹 Principais
- 🔐 Cadastro e Login
- 🔎 Pesquisa de locais de pesca
- ⭐ Avaliação de pontos
- 🔔 Sistema de notificações
- 👤 Perfil do usuário
- 📰 Feed de publicações e eventos

### 🔹 Extras
- 🌙 Modo Dark
- 📱 Responsividade (Mobile + Desktop)
- 🧭 Navegação intuitiva

> ℹ️ O RF 03 (recomendações baseadas em localização) não foi implementado nesta fase do projeto.

---

## 🖥️ Tecnologias

**Front-end**

- React 19 · React Router 7
- JavaScript · HTML5 · CSS3
- Firebase (Authentication, Firestore e Hosting)

**Back-end — API do catálogo**

- Node.js com Express 5
- MySQL 8 com o driver mysql2
- bcryptjs para hash de senha · jsonwebtoken para autenticação

**Infraestrutura**

- Docker e Docker Compose
- Nginx como servidor de estáticos e proxy reverso

**SEO e métricas**

- Meta tags por rota, Open Graph, JSON-LD, robots.txt e sitemap
- Google Analytics 4 com eventos nomeados

> A API **não substitui o Firebase**. Autenticação, publicações, chat e
> notificações continuam no Firebase. A API cuida do catálogo público —
> eventos e pesqueiros — que antes estava escrito à mão dentro do
> `Home.jsx`. Os detalhes estão em [`AULAS-APLICADAS.md`](AULAS-APLICADAS.md).

---

## 🧱 Estrutura do Projeto

```
.
├── src/                      # Front-end React
│   ├── pages/                # Telas principais
│   ├── components/           # Componentes reutilizáveis
│   │   ├── Seo/              # Title e meta tags por rota
│   │   └── Analytics/        # page_view a cada troca de rota
│   ├── routes/               # Gerenciamento de rotas
│   ├── hooks/useCatalogo.js  # Busca o catálogo na API
│   ├── services/api.js       # Todas as chamadas à API
│   ├── data/                 # Conteúdo de reserva do catálogo
│   ├── analytics.js          # Camada sobre o Google Analytics
│   └── firebase.js           # Config do Firebase (não versionado)
│
├── server/                   # API Node/Express + MySQL
│   └── src/
│       ├── routes/index.js   # Caminhos e permissões, em um arquivo
│       ├── controllers/      # Recebem a requisição e validam
│       ├── models/           # Acesso ao banco, onde fica o SQL
│       ├── middlewares/      # autenticar e autorizar
│       └── database/         # Conexão, tabelas e carga inicial
│
├── nginx/nginx.conf          # try_files, gzip, cache e proxy
├── Dockerfile                # Front em duas etapas (build → Nginx)
├── server/Dockerfile         # API
└── docker-compose.yml        # MySQL + API + Nginx
```

✔ Estrutura organizada · ✔ Escalável · ✔ Ideal para trabalho em equipe

---

## 📱 Telas

📌 Sobre o Projeto · 🏠 Home · 🔐 Login / Cadastro · 👤 Perfil · 🔎 Pesquisa · 📍 Locais Avaliados · 🔔 Notificações · ℹ️ Sobre Nós

---

## 🎨 Design

- 🎯 Foco em simplicidade e usabilidade
- 🌊 Identidade visual baseada no universo da pesca
- 🔵 Cor principal: Azul escuro `#062A6C`
- ⚪ Branco `#FFFFFF` para contraste e legibilidade
- ⚫ Preto `#000000` como cor secundária
- ✍️ Tipografia: Open Sans, Anton, Anton Didone
- 📐 Interface limpa e intuitiva

---

## 👥 Equipe

| Nome | Função |
|---|---|
| Danilo | Testes / Front-End |
| Henrique | Back-End / Documentação |
| João Pedro | Front-End |
| Lucas | Designer / Back-End |
| Vinicius | Designer / Front-End |
| Rebeca | Documentação |

---

## 🚧 Status do Projeto (3º Semestre)

- [x] Levantamento de requisitos funcionais e não funcionais
- [x] Identidade visual definida (paleta, tipografia, logotipo)
- [x] Front-end estruturado em React
- [x] Sistema de autenticação funcional (Firebase)
- [x] Telas principais implementadas
- [x] Deploy em produção ([pesqueefaledb.web.app](https://pesqueefaledb.web.app/))
- [x] API REST própria para o catálogo (Node/Express + MySQL)
- [x] Autenticação da API com JWT e permissão por perfil
- [x] Containerização com Docker e Docker Compose
- [x] Nginx como proxy reverso, com cache e compressão
- [x] SEO: meta tags por rota, Open Graph, robots.txt e sitemap
- [x] Google Analytics 4 com eventos nomeados
- [x] Página de rota não encontrada

---

## 🚀 Como rodar o projeto

### Opção 1 — só o front-end

É o suficiente para mexer nas telas. A Home mostra o catálogo de reserva
quando a API não está no ar.

```bash
# Clone o repositório
git clone https://github.com/daniykt/Pesque-Fale
cd Pesque-Fale

# Instale as dependências
npm install

# Configure o Firebase
# O src/firebase.js não vem no repositório, por estar no .gitignore.
cp src/firebase.js.example src/firebase.js
# Preencha com os dados do console do Firebase.

# Configure as variáveis do front
cp .env.example .env

# Rode
npm start                      # http://localhost:3000
```

### Opção 2 — front-end e API juntos

```bash
# 1. Crie o banco no MySQL
#    CREATE DATABASE pesque_fale
#      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Configure a API
cd server
npm install
cp .env.example .env           # preencha DB_PASSWORD e JWT_SEGREDO

# 3. Crie as tabelas e a carga inicial
npm run seed

# 4. Suba a API
npm run dev                    # http://localhost:3001

# 5. Em outro terminal, o front
cd ..
npm start                      # http://localhost:3000
```

Para gerar o `JWT_SEGREDO`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Opção 3 — tudo em containers

Sobe MySQL, API e Nginx de uma vez. É preciso ter o Docker instalado.

```bash
cp .env.docker.example .env    # preencha JWT_SEGREDO
docker compose up -d --build

# Carga inicial do banco, uma única vez
docker compose exec api npm run seed
```

O site fica em http://localhost e a verificação de saúde em
http://localhost/health

```bash
docker compose ps        # estado dos containers
docker compose logs -f   # acompanhar os registros
docker compose down      # derrubar (os dados do banco são preservados)
```

---

## 🔌 Endpoints da API

Base local: `http://localhost:3001` · Em produção, atrás do Nginx: `/api`

| Método | Caminho                | Acesso                     |
| ------ | ---------------------- | -------------------------- |
| GET    | `/health`              | aberto (monitoramento)     |
| POST   | `/api/auth/registrar`  | aberto                     |
| POST   | `/api/auth/entrar`     | aberto                     |
| GET    | `/api/auth/eu`         | exige token                |
| GET    | `/api/eventos`         | **aberto** (para o Google) |
| GET    | `/api/eventos/:id`     | aberto (aceita id ou slug) |
| POST   | `/api/eventos`         | exige token                |
| PUT    | `/api/eventos/:id`     | exige token                |
| DELETE | `/api/eventos/:id`     | só admin                   |
| GET    | `/sitemap-catalogo.xml`| aberto                     |

Os mesmos cinco de eventos existem para `/api/pesqueiros`.

A leitura é aberta de propósito: é conteúdo que precisa ser indexado. A
escrita exige o cabeçalho `Authorization: Bearer <token>`, e o token vale
8 horas.

**Conta de demonstração**, criada pelo seed:
`admin@pesquefale.local` / `admin123456`. Senha simples de propósito — é
conta de teste e não deve existir fora de desenvolvimento.

---

## 📄 Licença

📘 Projeto acadêmico — uso educacional.
