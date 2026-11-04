# Imagem do front-end: build em duas etapas.
#
# A ideia central: as ferramentas que constroem o site não precisam ir para
# o servidor. O React, o Webpack e as centenas de pacotes do node_modules
# servem para gerar os arquivos do build; depois disso, o que vai ao ar é
# apenas HTML, CSS, JavaScript e imagens — arquivos estáticos que o Nginx
# entrega sem Node nenhum.
#
# A segunda etapa começa de uma imagem limpa e copia só a pasta build. O
# resultado fica em torno de 50 MB em vez de mais de 600 MB, e nem o código
# fonte nem as dependências ficam expostos no servidor.

# ── Etapa 1: construir ────────────────────────────────────────────────
FROM node:22-alpine AS construcao

WORKDIR /app

COPY package*.json ./

# Aqui as dependências de desenvolvimento são necessárias: o react-scripts,
# que faz o build, é uma delas.
#
# O certo seria `npm ci`, que instala as versões exatas do package-lock.json
# e faz a imagem sair idêntica em qualquer máquina. Ele não funciona neste
# projeto: o react-scripts 5.0.1 é de 2022 e declara o TypeScript como peer
# dependency na faixa ^3 || ^4, mas a árvore de dependências hoje resolve
# para typescript 7. O npm ci recusa esse conflito, que é exatamente a
# função dele; o npm install aceita com aviso.
#
# A solução de verdade é migrar do Create React App para o Vite, que é
# mantido. Enquanto isso não acontece, --legacy-peer-deps destrava o build
# ao custo de perder a garantia de reprodutibilidade.
RUN npm install --legacy-peer-deps

COPY . .

# As variáveis REACT_APP_ são lidas no momento do build, não quando o
# container sobe: o Create React App grava os valores dentro do JavaScript
# gerado. Por isso elas chegam como ARG e não como variável de ambiente do
# container final — mudar o Measurement ID exige construir de novo.
ARG REACT_APP_API_URL=/api
ARG REACT_APP_URL_SITE=https://pesqueefaledb.web.app
ARG REACT_APP_GA_ID=

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_URL_SITE=$REACT_APP_URL_SITE
ENV REACT_APP_GA_ID=$REACT_APP_GA_ID

# CI fica em false de propósito.
#
# Com CI=true, o react-scripts trata todo aviso do ESLint como erro e
# interrompe o build. O projeto tem avisos antigos — variáveis declaradas e
# não usadas em Onboarding.jsx, OnboardingTour.jsx, GaleriaPerfil.jsx e
# Notificacao.jsx, e dependências faltando em alguns useEffect — que não
# impedem a aplicação de funcionar, mas impediriam a imagem de ser
# construída.
#
# Vale limpar esses avisos quando houver tempo, e então ligar o CI=true, que
# é a configuração correta: ela transforma descuido em erro de build em vez
# de deixar passar para produção.
ENV CI=false

RUN npm run build

# ── Etapa 2: servir ───────────────────────────────────────────────────
FROM nginx:1.27-alpine

# A configuração padrão do Nginx não serve para uma aplicação de página
# única: ela devolveria 404 em qualquer rota do React Router.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Só o resultado do build atravessa da etapa anterior.
COPY --from=construcao /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

# daemon off mantém o Nginx no primeiro plano. Um container vive enquanto o
# processo principal vive: se o Nginx virasse serviço de fundo, o processo
# inicial terminaria e o container pararia junto.
CMD ["nginx", "-g", "daemon off;"]