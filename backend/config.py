import os
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "cementerio-los-angeles-secret-key-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cementerio-jwt-super-secret-key-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    
    # Support PostgreSQL / PostGIS in Docker / GCP, with SQLite local dev fallback
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), 'instance', 'cementerio.db'))}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }
