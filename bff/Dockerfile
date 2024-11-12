FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src/

RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]
