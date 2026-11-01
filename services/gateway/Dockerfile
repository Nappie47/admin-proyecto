# ==============================================================================
# Dockerfile: Ingress / API Gateway (Nginx Unprivileged)
# Proyecto Integrador - SIG Cementerio General de Los Ángeles
# ==============================================================================

FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL maintainer="Bryan Ahumada & Johan Muñoz"
LABEL version="2.0.0"
LABEL description="API Gateway / Ingress Reverse Proxy para Arquitectura de Microservicios"

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/gateway-health || exit 1

USER 101

CMD ["nginx", "-g", "daemon off;"]
