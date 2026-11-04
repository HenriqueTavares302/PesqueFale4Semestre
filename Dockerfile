FROM node:22-alpine AS construcao

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

ARG REACT_APP_API_URL=/api
ARG REACT_APP_URL_SITE=https://pesqueefaledb.web.app
ARG REACT_APP_GA_ID=

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_URL_SITE=$REACT_APP_URL_SITE
ENV REACT_APP_GA_ID=$REACT_APP_GA_ID

ENV CI=false

RUN npm run build

FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=construcao /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
