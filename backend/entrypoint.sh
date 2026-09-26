#!/bin/sh
set -e

echo "[INFO] Esperando que la base de datos esté disponible..."

python << 'EOF'
import os
import sys
import time
import psycopg2

database_url = os.getenv("DATABASE_URL")
if not database_url:
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "postgres123")
    host = os.getenv("DB_HOST", "vm-4-haproxy-db")
    port = os.getenv("DB_PORT", "5000")
    dbname = os.getenv("DB_NAME", "cementerio_db")
    database_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

max_retries = 30
retry_interval = 2

for attempt in range(1, max_retries + 1):
    try:
        conn = psycopg2.connect(database_url, connect_timeout=3)
        conn.close()
        print(f"[OK] Conexión exitosa con la Base de Datos (intento {attempt}).")
        sys.exit(0)
    except Exception as e:
        print(f"[ESPERANDO] Base de datos no lista aún ({e}). Reintentando en {retry_interval}s... ({attempt}/{max_retries})")
        time.sleep(retry_interval)

print("[ERROR] No se pudo conectar a la base de datos tras múltiples intentos.")
sys.exit(1)
EOF

echo "[INFO] Ejecutando poblamiento inicial de tablas y datos (seed)..."
python -m seeds.seed_data || echo "[WARN] Seed ya poblado o no requerido."

echo "[INFO] Iniciando servidor Gunicorn WSGI en puerto 5000..."
exec gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 "app:create_app()"
