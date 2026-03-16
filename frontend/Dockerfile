FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY index.js ./
COPY index.html ./
COPY logs.html ./
COPY config.js ./
EXPOSE 8080
CMD ["node", "index.js"]
