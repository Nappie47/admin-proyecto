# ==============================================================================
# Dockerfile: Frontend SPA (React 18 + Vite + Leaflet)
# Proyecto Integrador - SIG Cementerio General de Los Ángeles
# ==============================================================================

# Stage 1: Build stage
FROM node:20-alpine3.20 AS builder

LABEL maintainer="Bryan Ahumada & Johan Muñoz"
LABEL description="Etapa de construcción para Frontend React SPA"

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Argumentos de compilación para variables de entorno Vite
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

# Copiar código fuente y compilar bundle de producción
COPY . .
RUN npm run build

# Stage 2: Production web server (Unprivileged non-root Nginx)
FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL maintainer="Bryan Ahumada & Johan Muñoz"
LABEL version="2.0.0"
LABEL description="Servidor Web Nginx no privilegiado para Frontend SPA"

# Copiar bundle compilado al directorio web
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración optimizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto no-root (8080)
EXPOSE 8080

# Healthcheck para comprobar disponibilidad
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/health || exit 1

# El contenedor corre con el usuario seguro 'nginx' (UID 101) por defecto
USER 101

CMD ["nginx", "-g", "daemon off;"]

