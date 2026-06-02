FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx vite build

FROM node:24-slim
WORKDIR /app
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
ENV PORT=3000
ENV DB_HOST=mysql
ENV DB_PORT=3306
ENV DB_USER=finance_user
ENV DB_PASSWORD=finance_pass
ENV DB_NAME=simple_finance
CMD ["node", "server/index.js"]
