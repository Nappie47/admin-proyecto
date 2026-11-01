import os
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

_DEVELOPMENT_SECRET_KEY = "cementerio-los-angeles-secret-key-2026"
_DEVELOPMENT_JWT_SECRET_KEY = "cementerio-jwt-super-secret-key-2026"

class Config:
    APP_ENV = os.getenv("APP_ENV", "development").lower()
    SECRET_KEY = os.getenv("SECRET_KEY", _DEVELOPMENT_SECRET_KEY)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", _DEVELOPMENT_JWT_SECRET_KEY)
    CORS_ORIGINS = tuple(
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    )
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

def validate_security_config(config):
    environment = config.get("APP_ENV", "development")
    if not isinstance(environment, str) or environment.lower() not in ("production", "staging"):
        return

    secret_keys = {
        "SECRET_KEY": _DEVELOPMENT_SECRET_KEY,
        "JWT_SECRET_KEY": _DEVELOPMENT_JWT_SECRET_KEY,
    }
    for key, development_fallback in secret_keys.items():
        value = config.get(key)
        if not isinstance(value, str) or len(value) < 32 or value == development_fallback:
            raise ValueError(f"{key} must be set to a unique secret of at least 32 characters.")

    origins = config.get("CORS_ORIGINS", ())
    if isinstance(origins, str):
        origins = (origins,)
    if not origins or any(
        not isinstance(origin, str) or not origin.startswith("https://") or origin == "*"
        for origin in origins
    ):
        raise ValueError("CORS_ORIGINS must list the exact trusted origins in production.")
