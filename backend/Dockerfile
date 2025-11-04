FROM node:20-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY .env.production .env

RUN npm install

COPY . .

RUN npx prisma generate
RUN npx prisma db push
RUN npm run build

# Create entrypoint script
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'mkdir -p /app/uploads/documents' >> /app/entrypoint.sh && \
    echo 'if [ -f /app/src/Logo.png ]; then' >> /app/entrypoint.sh && \
    echo '  cp /app/src/Logo.png /app/uploads/documents/Logo.png' >> /app/entrypoint.sh && \
    echo '  echo "Logo copied successfully"' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'exec npm start' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

EXPOSE 4040

ENTRYPOINT ["/app/entrypoint.sh"]