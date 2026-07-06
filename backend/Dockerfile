FROM node:22-alpine

WORKDIR /workspace

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 8000

CMD ["node", "app/main.js"]
