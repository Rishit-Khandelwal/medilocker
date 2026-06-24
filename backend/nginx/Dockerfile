# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install deps separately for layer cache
COPY frontend/package*.json ./
RUN npm ci --silent

# Build production bundle
COPY frontend/ .
RUN npm run build

# ── Stage 2: Nginx ────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine

# React build output → nginx html root
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Nginx config
COPY backend/nginx/nginx.conf /etc/nginx/conf.d/default.conf
# Remove the default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]