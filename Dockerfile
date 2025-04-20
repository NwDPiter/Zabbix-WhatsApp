# Usa uma imagem oficial do Node.js baseada em Debian, com tamanho reduzido
FROM node:22-slim

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependência para o container
COPY package*.json ./

# Instala apenas as dependências de produção (sem dependências de desenvolvimento)
RUN npm install --production

# Copia todo o restante do código para o diretório de trabalho
COPY . .

# Expõe a porta que o app usará (importante para Traefik ou acesso externo)
EXPOSE 3000

# Comando que será executado ao iniciar o container
CMD ["node", "index.js"]
