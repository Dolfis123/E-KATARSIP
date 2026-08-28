FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Folder penyimpanan salinan digital arsip (sebaiknya di-mount sebagai volume)
RUN mkdir -p /app/src/uploads/arsip

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]
