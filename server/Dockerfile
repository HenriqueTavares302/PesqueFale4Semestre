# Imagem da API do catálogo.

# Alpine em vez da imagem completa: o node:22 traz um Debian com
# compiladores, Python e Git, que esta API não usa. Na atividade anterior a
# diferença medida foi de 241 MB contra 1,62 GB.
FROM node:22-alpine

WORKDIR /app

# Os manifestos são copiados antes do código de propósito.
# O Docker guarda cada etapa em cache e só refaz a partir da primeira que
# mudou. Como o package.json muda muito menos que o código, o npm ci só
# roda de novo quando uma dependência realmente muda; alterar um controller
# reaproveita a instalação.
COPY package*.json ./

# ci em vez de install: instala exatamente as versões do package-lock.json,
# então a imagem sai igual aqui e no servidor.
# --omit=dev deixa fora o que só serve para desenvolver.
RUN npm ci --omit=dev

COPY . .

# Roda como usuário comum, não como root.
# Se alguém explorar uma falha na aplicação, fica limitado a este usuário em
# vez de ter controle do container.
USER node

# Documenta a porta. Não publica nada: isso é trabalho do -p no docker run
# ou do mapeamento de portas no compose.
EXPOSE 3001

# Verificação de saúde pelo próprio Docker: o container aparece como
# "unhealthy" no docker ps se a API parar de responder.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3001/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]
