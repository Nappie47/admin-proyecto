"""
Script para vaciar tablas geograficas (sepulturas, mausoleos y patios)
manteniendo la tabla de usuarios (roles y logins) intacta.
"""
from app import create_app
from extensions import db
from sqlalchemy import text

def clean_map():
    app = create_app()
    with app.app_context():
        print("[INFO] Vaciando tablas del mapa: sepulturas, mausoleos_historicos, patios...")
        try:
            # TRUNCATE con CASCADE borra sepulturas, mausoleos y patios respetando foreign keys
            db.session.execute(text("TRUNCATE TABLE sepulturas, mausoleos_historicos, patios RESTART IDENTITY CASCADE;"))
            db.session.commit()
            print("[OK] Tablas del mapa vaciadas exitosamente. El mapa quedo limpio para nuevos registros.")
            
            # Verificacion de usuarios
            res = db.session.execute(text("SELECT COUNT(*) FROM usuarios;")).scalar()
            print(f"[OK] Usuarios conservados intactos: {res} usuario(s) registrados.")
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error al vaciar tablas: {e}")

if __name__ == '__main__':
    clean_map()
