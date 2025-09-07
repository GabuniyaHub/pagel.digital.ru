FROM node:20-alpine
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup
WORKDIR /app

# Копируем из корня (теперь это возможно)
COPY package*.json ./
RUN npm ci --only=production

# Копируем серверный код
COPY server/ ./

RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]