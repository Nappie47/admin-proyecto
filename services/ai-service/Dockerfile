# ==============================================================================
# MICROSERVICIO DE IA Y RECONOCIMIENTO FACIAL BIOMÉTRICO (Unidad 2 HA)
# Plataforma Web y SIG - Cementerio General Comuna de Los Ángeles
# ==============================================================================

FROM python:3.11-slim-bookworm

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    AI_DATA_DIR=/app/data/faces \
    PORT=5001

# Crear usuario sin privilegios por seguridad
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Dependencias mínimas del sistema para procesamiento de imágenes con OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente, datos pre-enrolados y modelos biométricos
COPY models ./models
COPY data ./data
COPY face_engine.py app.py ./
RUN mkdir -p /app/data/faces && \
    chown -R appuser:appgroup /app

# Cambiar a usuario no privilegiado
USER appuser

EXPOSE 5001

# Healthcheck interno del contenedor
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://127.0.0.1:5001/health || exit 1

# Ejecutar con Gunicorn para alta concurrencia
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--threads", "2", "--timeout", "60", "app:app"]

