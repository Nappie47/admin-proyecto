FROM alpine:3.19

# Instalar cliente PostgreSQL 16, bash, gzip, tzdata y curl
RUN apk add --no-cache \
    postgresql16-client \
    bash \
    gzip \
    tzdata \
    curl

ENV TZ=America/Santiago

WORKDIR /scripts

COPY backup.sh /scripts/backup.sh
RUN chmod +x /scripts/backup.sh

# Script de inicio que ejecuta un respaldo al iniciar y programa un bucle continuo
RUN echo '#!/bin/bash' > /scripts/entrypoint.sh && \
    echo 'echo "[INFO] Servidor de respaldos iniciado."' >> /scripts/entrypoint.sh && \
    echo 'echo "[INFO] Esperando 15s para dar tiempo a la inicialización de la BD..."' >> /scripts/entrypoint.sh && \
    echo 'sleep 15' >> /scripts/entrypoint.sh && \
    echo '/scripts/backup.sh' >> /scripts/entrypoint.sh && \
    echo 'echo "[INFO] Programando respaldos periódicos cada ${BACKUP_INTERVAL_MINUTES:-60} minutos..."' >> /scripts/entrypoint.sh && \
    echo 'while true; do' >> /scripts/entrypoint.sh && \
    echo '  sleep $((${BACKUP_INTERVAL_MINUTES:-60} * 60))' >> /scripts/entrypoint.sh && \
    echo '  /scripts/backup.sh' >> /scripts/entrypoint.sh && \
    echo 'done' >> /scripts/entrypoint.sh && \
    chmod +x /scripts/entrypoint.sh

VOLUME ["/backups"]

ENTRYPOINT ["/scripts/entrypoint.sh"]
