import json
import logging
import threading
import select
import time
import os
import psycopg2
from flask_sock import Sock
from sqlalchemy import event, text

logger = logging.getLogger("websocket")
sock = Sock()
active_clients = set()
_listener_started = False

def broadcast_map_update(payload=None):
    """Transmite una notificacion de actualizacion del mapa a todos los clientes WebSocket conectados."""
    if not active_clients:
        return

    message = json.dumps({
        'type': 'map_updated',
        'data': payload or {},
        'timestamp': time.time()
    })

    dead_clients = set()
    for client in list(active_clients):
        try:
            client.send(message)
        except Exception:
            dead_clients.add(client)

    if dead_clients:
        active_clients.difference_update(dead_clients)
        logger.info(f"[WebSocket] Eliminados {len(dead_clients)} clientes inactivos. Activos restantes: {len(active_clients)}")

def register_websocket_routes(app):
    """Registra la ruta de WebSocket /ws/map en la aplicacion Flask."""
    sock.init_app(app)

    @sock.route('/ws/map')
    def map_websocket(ws):
        active_clients.add(ws)
        logger.info(f"[WebSocket] Cliente conectado al mapa en tiempo real. Total clientes: {len(active_clients)}")
        try:
            # Mensaje de bienvenida inicial
            ws.send(json.dumps({
                'type': 'connected',
                'message': 'Suscrito a actualizaciones geoespaciales en tiempo real del SIG Cementerio'
            }))

            while True:
                # Keepalive timeout de 25 segundos
                msg = ws.receive(timeout=25)
                if msg is not None:
                    # Responder a pings del cliente
                    ws.send(json.dumps({'type': 'pong'}))
                else:
                    # Enviar ping de comprobacion
                    ws.send(json.dumps({'type': 'ping'}))
        except Exception:
            pass
        finally:
            active_clients.discard(ws)
            logger.info(f"[WebSocket] Cliente desconectado. Total clientes restantes: {len(active_clients)}")

def register_model_events():
    """Registra listeners de SQLAlchemy para detectar creacion, modificacion y eliminacion de datos del mapa."""
    from models.sepultura import Sepultura
    from models.patio import Patio
    from models.mausoleo import MausoleoHistorico

    def on_change(mapper, connection, target):
        model_name = getattr(target, '__tablename__', 'desconocido')
        record_id = getattr(target, 'id', None)
        logger.info(f"[WebSocket] Evento detectado en {model_name} (ID: {record_id}). Notificando...")

        # 1. Transmitir localmente a clientes de esta instancia
        broadcast_map_update({'model': model_name, 'id': record_id})

        # 2. Emitir NOTIFY en PostgreSQL para sincronizar con otras VMs (VM 1 <-> VM 2)
        try:
            connection.execute(text("NOTIFY sig_map_updates, 'changed';"))
        except Exception as e:
            logger.debug(f"[WebSocket] No se pudo emitir NOTIFY (normal en SQLite dev): {e}")

    for model in (Sepultura, Patio, MausoleoHistorico):
        event.listen(model, 'after_insert', on_change)
        event.listen(model, 'after_update', on_change)
        event.listen(model, 'after_delete', on_change)

def start_postgres_listener():
    """Hilo secundario que escucha NOTIFY de PostgreSQL en Cloud SQL para sincronizar entre vm-stack1 y vm-stack2."""
    global _listener_started
    if _listener_started:
        return

    host = os.getenv("DB_HOST")
    if not host or host in ("localhost", "127.0.0.1"):
        return

    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")
    dbname = os.getenv("DB_NAME", "cementerio_db")
    port = int(os.getenv("DB_PORT", "5432"))

    def listener_thread():
        while True:
            try:
                conn = psycopg2.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=password,
                    dbname=dbname,
                    connect_timeout=10,
                    sslmode="prefer"
                )
                conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
                cur = conn.cursor()
                cur.execute("LISTEN sig_map_updates;")
                logger.info("[WebSocket] Escuchando eventos distribuidos de PostgreSQL (Cloud SQL)...")

                while True:
                    if select.select([conn], [], [], 15) == ([], [], []):
                        # Timeout de sondeo, comprobar conexion viva
                        cur.execute("SELECT 1;")
                    else:
                        conn.poll()
                        while conn.notifies:
                            notify = conn.notifies.pop(0)
                            broadcast_map_update({'source': 'cross_vm_postgres', 'payload': notify.payload})
            except Exception as e:
                logger.debug(f"[WebSocket] Reintentando conexion LISTEN con Cloud SQL en 5s: {e}")
                time.sleep(5)

    _listener_started = True
    t = threading.Thread(target=listener_thread, daemon=True, name="PG_Notify_Listener")
    t.start()
