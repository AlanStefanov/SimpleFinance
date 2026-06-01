FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production && npm install vite

COPY . .

RUN npx vite build

EXPOSE 3000

ENV PORT=3000
ENV DB_HOST=mysql
ENV DB_PORT=3306
ENV DB_USER=finance_user
ENV DB_PASSWORD=finance_pass
ENV DB_NAME=simple_finance

CMD ["node", "server/index.js"]
