# Node.js公式イメージを利用したReact+Vite用Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
