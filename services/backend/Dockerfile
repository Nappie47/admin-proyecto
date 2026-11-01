# ==============================================================================
# Dockerfile: Backend Core API (Flask + SQLAlchemy + PostGIS + Gunicorn)
# Proyecto Integrador - SIG Cementerio General de Los Ángeles
# ==============================================================================

FROM python:3.11-slim

LABEL maintainer="Bryan Ahumada & Johan Muñoz"
LABEL version="2.0.0"
LABEL description="API REST Core y Microservicio de Gestión Catastral para SIG Cementerio General"

WORKDIR /app

# Instalar dependencias del sistema y limpiar cache de apt para optimizar imagen
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario seguro no privilegiado
RUN useradd -m -u 10001 -s /bin/bash appuser

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación y asignar permisos al usuario no root
COPY --chown=appuser:appuser . .

# Permisos de ejecución para el script de entrada
RUN chmod +x entrypoint.sh

# Crear y asignar permisos a carpeta instance para SQLite/fallback
RUN mkdir -p /app/instance && chown -R appuser:appuser /app/instance

# Cambiar al usuario no privilegiado
USER appuser

EXPOSE 5000

# Healthcheck para validar disponibilidad de la API REST
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://127.0.0.1:5000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
