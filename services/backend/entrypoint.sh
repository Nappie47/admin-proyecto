#!/bin/sh
set -e

echo "[INFO] Verificando conexion con PostgreSQL / Cloud SQL..."

python << 'EOF'
import os
import sys
import time
import psycopg2

user = os.getenv("DB_USER", "postgres")
password = os.getenv("DB_PASSWORD", "")
host = os.getenv("DB_HOST", "10.238.240.3")
port = int(os.getenv("DB_PORT", "5432"))
dbname = os.getenv("DB_NAME", "cementerio_db")
database_url = os.getenv("DATABASE_URL")

max_retries = 15
retry_interval = 2

for attempt in range(1, max_retries + 1):
    try:
        # Intento de conexion directa usando parametros individuales (evita problemas de escape en passwords)
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=dbname,
            connect_timeout=5,
            sslmode="prefer"
        )
        conn.close()
        print(f"[OK] Conexion exitosa con Cloud SQL en {host}:{port}/{dbname} (intento {attempt}).")
        sys.exit(0)
    except Exception as e:
        print(f"[ESPERANDO] Error conectando a {host}:{port} ({e}). Reintentando en {retry_interval}s... ({attempt}/{max_retries})")
        time.sleep(retry_interval)

print("[ERROR] No se pudo conectar a la base de datos tras multiples intentos.")
sys.exit(1)
EOF

RUN_SEED="${RUN_SEED:-true}"
if [ "$RUN_SEED" = "true" ]; then
    echo "[INFO] Ejecutando poblamiento inicial de tablas y datos (seed)..."
    python -m seeds.seed_data || echo "[WARN] Seed ya poblado o no requerido."
else
    echo "[INFO] Omitiendo seed en este nodo secundario."
fi

echo "[INFO] Iniciando servidor Gunicorn WSGI en puerto 5000..."
exec gunicorn --bind 0.0.0.0:5000 --workers 3 --timeout 120 "app:create_app()"
