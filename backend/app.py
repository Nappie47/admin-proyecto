import os
from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, cors
from routes import auth_bp, user_bp, sepultura_bp, patio_bp, mausoleo_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Asegurar existencia de carpeta instance
    os.makedirs(os.path.join(app.root_path, 'instance'), exist_ok=True)

    # Inicializar extensiones
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Registrar blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(sepultura_bp)
    app.register_blueprint(patio_bp)
    app.register_blueprint(mausoleo_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Cementerio General Los Angeles API',
            'version': '1.0.0'
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'error': 'Recurso no encontrado'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500

    # Intentar crear tablas al inicio de forma segura
    try:
        with app.app_context():
            db.create_all()
    except Exception as e:
        print(f"[INFO] Tablas se crearán vía entrypoint/seed: {e}")

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
