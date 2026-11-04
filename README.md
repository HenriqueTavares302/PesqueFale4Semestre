# 🎣 Pesque & Fale — 4º Semestre

![Status](https://img.shields.io/badge/status-4º%20semestre%20em%20desenvolvimento-062A6C)
![Site](https://img.shields.io/badge/site-online-success)

## 🔗 Acesse o projeto

🌐 **[pesqueefaledb.web.app](https://pesqueefaledb.web.app/)**

> Projeto do 4º semestre, construído a partir da base desenvolvida no 3º.

## 🌊 Sobre o Projeto

O **Pesque & Fale** é uma plataforma web inspirada em redes sociais, criada para conectar pescadores e facilitar o compartilhamento de experiências, avaliações e recomendações de locais de pesca.

A proposta é centralizar informações úteis e ajudar usuários a encontrarem os melhores ambientes para pesca, promovendo o lazer, o trabalho decente e a pesca sustentável.

## 🆕 O que o 4º semestre acrescentou

- **API REST própria** em Node.js + Express + MySQL para o catálogo público
- **Autenticação da API** com JWT e permissão por perfil
- **Containerização** com Docker e Docker Compose
- **Nginx** como servidor de estáticos e proxy reverso
- **SEO**: meta tags por rota, Open Graph, JSON-LD, robots.txt e sitemap
- **Google Analytics 4** com eventos nomeados
- **Página de rota não encontrada**

O Firebase continua responsável por autenticação, publicações, chat, notificações e perfis. A API cuida apenas do catálogo público — eventos e pesqueiros — que antes estava escrito à mão dentro do `Home.jsx`.

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

**Back-end**

- Node.js com Express 5
- MySQL 8 com o driver mysql2
- bcryptjs para hash de senha · jsonwebtoken para autenticação

**Infraestrutura**

- Docker e Docker Compose
- Nginx como servidor de estáticos e proxy reverso

---

## 🧱 Estrutura do Projeto

```
.
├── src/                      Front-end React
│   ├── pages/                Telas principais
│   ├── components/           Componentes reutilizáveis
│   │   ├── Seo/              Title e meta tags por rota
│   │   └── Analytics/        page_view a cada troca de rota
│   ├── routes/               Gerenciamento de rotas
│   ├── hooks/useCatalogo.js  Busca o catálogo na API
│   ├── services/api.js       Todas as chamadas à API
│   ├── data/                 Conteúdo de reserva do catálogo
│   ├── analytics.js          Camada sobre o Google Analytics
│   └── firebase.js           Config do Firebase (não versionado)
│
├── server/                   API Node/Express + MySQL
│   └── src/
│       ├── routes/index.js   Caminhos e permissões
│       ├── controllers/      Recebem a requisição e validam
│       ├── models/           Acesso ao banco, onde fica o SQL
│       ├── middlewares/      autenticar e autorizar
│       └── database/         Conexão, tabelas e carga inicial
│
├── nginx/nginx.conf          try_files, gzip, cache e proxy
├── Dockerfile                Front em duas etapas (build → Nginx)
├── server/Dockerfile         API
└── docker-compose.yml        MySQL + API + Nginx
```

---

## 🚀 Como rodar o projeto

### Pré-requisito: o `src/firebase.js`

Esse arquivo está no `.gitignore` e não vem no repositório. Sem ele o projeto não compila.

```bash
cp src/firebase.js.example src/firebase.js
```

Preencha com os dados do seu projeto, em console.firebase.google.com → Configurações do projeto → Seus aplicativos.

---

### Opção 1 — só o front-end

Suficiente para mexer nas telas. O carrossel da Home mostra o conteúdo de reserva enquanto a API não estiver no ar.

```bash
npm install
cp .env.example .env
npm start
```

Acesse **http://localhost:3000**

---

### Opção 2 — tudo em containers

Sobe MySQL, API e Nginx de uma vez. Requer o Docker Desktop aberto.

```bash
# 1. Variáveis de ambiente
cp .env.docker.example .env

# 2. Gere o JWT_SEGREDO e cole no .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Suba tudo
docker compose up -d --build

# 4. Carga inicial do banco, uma única vez
docker compose exec api npm run seed
```

Acesse **http://localhost**

No `.env` é obrigatório preencher `DB_ROOT_PASSWORD`, `JWT_SEGREDO` e `CODIGO_ADMIN`. Sem o `JWT_SEGREDO` o compose se recusa a subir.

Comandos do dia a dia:

```bash
docker compose ps          # estado dos containers
docker compose logs -f     # acompanhar os registros
docker compose logs api    # registros só da API
docker compose down        # derrubar (os dados do banco são preservados)
docker compose up -d       # subir de novo, em segundos
```

Portas usadas: **80** para o site e **3308** para o banco. Se alguma estiver ocupada, troque `PORTA_WEB` ou `PORTA_BANCO` no `.env`.

---

### Opção 3 — front e API no VS Code, com MySQL local

```bash
# 1. Crie o banco no MySQL
#    CREATE DATABASE pesque_fale
#      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Configure a API
cd server
npm install
cp .env.example .env        # preencha DB_PASSWORD e JWT_SEGREDO
npm run seed

# 3. Suba a API
npm run dev                 # http://localhost:3001

# 4. Em outro terminal, o front
cd ..
npm start                   # http://localhost:3000
```

---

## 🔌 API

Com o Docker, tudo passa pelo Nginx em **http://localhost**. Rodando a API direto no VS Code, a base é **http://localhost:3001**.

### Endpoints

| Método | Caminho                 | Acesso                     |
| ------ | ----------------------- | -------------------------- |
| GET    | `/health`               | aberto                     |
| POST   | `/api/auth/registrar`   | aberto                     |
| POST   | `/api/auth/entrar`      | aberto                     |
| GET    | `/api/auth/eu`          | exige token                |
| GET    | `/api/eventos`          | aberto                     |
| GET    | `/api/eventos/:id`      | aberto (aceita id ou slug) |
| POST   | `/api/eventos`          | exige token                |
| PUT    | `/api/eventos/:id`      | exige token                |
| DELETE | `/api/eventos/:id`      | só admin                   |
| GET    | `/sitemap-catalogo.xml` | aberto                     |

Os mesmos cinco de eventos existem para `/api/pesqueiros`.

A leitura é aberta porque é conteúdo que precisa ser indexado pelo Google. A escrita exige o cabeçalho `Authorization: Bearer <token>`, e o token vale 8 horas.

### Conta de demonstração

Criada pelo `npm run seed`:

| E-mail                   | Senha         | Perfil |
| ------------------------ | ------------- | ------ |
| admin@pesquefale.local   | admin123456   | admin  |

Senha simples de propósito: é conta de teste e não deve existir fora de desenvolvimento.

### Testando pelo terminal

No PowerShell, use `curl.exe` — o `curl` sem extensão é apelido do `Invoke-WebRequest` e se comporta diferente.

```bash
curl.exe http://localhost/health
curl.exe http://localhost/api/eventos
curl.exe http://localhost/api/pesqueiros
```

Login, guardando o token:

```bash
curl.exe -X POST http://localhost/api/auth/entrar -H "Content-Type: application/json" -d "{\"email\":\"admin@pesquefale.local\",\"senha\":\"admin123456\"}"
```

Criar um evento com o token recebido:

```bash
curl.exe -X POST http://localhost/api/eventos -H "Content-Type: application/json" -H "Authorization: Bearer SEU_TOKEN" -d "{\"titulo\":\"Torneio de Verao\",\"data_evento\":\"2027-01-15\",\"local\":\"Lago Azul\"}"
```

### Olhando o banco

Pelo MySQL Workbench: `localhost`, porta **3308**, usuário `root`, com a senha do `DB_ROOT_PASSWORD`.

Ou direto pelo container:

```bash
docker compose exec banco mysql -u root -p pesque_fale
```

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

## 🚧 Status do Projeto

- [x] Levantamento de requisitos funcionais e não funcionais
- [x] Identidade visual definida (paleta, tipografia, logotipo)
- [x] Front-end estruturado em React
- [x] Sistema de autenticação funcional (Firebase)
- [x] Telas principais implementadas
- [x] Deploy em produção ([pesqueefaledb.web.app](https://pesqueefaledb.web.app/))
- [x] API REST própria (Node/Express + MySQL)
- [x] Autenticação da API com JWT e permissão por perfil
- [x] Containerização com Docker e Docker Compose
- [x] Nginx como proxy reverso, com cache e compressão
- [x] SEO e Google Analytics 4
- [ ] Páginas públicas de evento e pesqueiro
- [ ] Migração do Create React App para o Vite

---

## 📄 Licença

📘 Projeto acadêmico — uso educacional.
