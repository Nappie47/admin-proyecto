# ==============================================================================
# Dockerfile: Ingress / API Gateway (HAProxy L7)
# Proyecto Integrador - SIG Cementerio General de Los Ángeles
# ==============================================================================

FROM haproxy:2.8-alpine

LABEL maintainer="Bryan Ahumada & Johan Muñoz"
LABEL version="2.0.0"
LABEL description="HAProxy Ingress Gateway L7 para Balanceo y Enrutamiento de Microservicios"

COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

EXPOSE 80 8404

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8404/ || exit 1
