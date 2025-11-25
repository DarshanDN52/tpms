from flask import Flask
import datetime

def create_app():
    app = Flask(__name__)

    @app.context_processor
    def inject_timestamp():
        return dict(timestamp=datetime.datetime.utcnow().timestamp())

    from . import routes
    app.register_blueprint(routes.bp)

    return app
