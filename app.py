# app.py
# This is the main entry point of the SkillSwap backend application.
# It uses the application factory pattern to create the Flask app.

import os
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS

# Import the configuration, models, and routes
from config import Config
from models import db
from routes import api as api_blueprint

def create_app(config_class=Config):
    """
    Application factory function. Creates and configures the Flask app.
    """
    app = Flask(__name__)
    
    # --- Configuration ---
    # Load configuration from the 'config.py' file
    app.config.from_object(config_class)
    
    # Ensure the instance folder exists. Flask-SQLAlchemy with SQLite needs this.
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # --- Extensions ---
    # Initialize extensions with the app instance
    db.init_app(app)
    Migrate(app, db)
    CORS(app) # Enable Cross-Origin Resource Sharing for the entire app

    # --- Blueprints ---
    # Register the blueprint that contains all our API routes.
    # All routes in the blueprint will be prefixed with '/api'.
    app.register_blueprint(api_blueprint, url_prefix='/api')

    # --- Shell Context ---
    # This makes it easier to work with the database in the Flask shell.
    # By running `flask shell`, you can access `db` and the models directly.
    @app.shell_context_processor
    def make_shell_context():
        from models import User, Skill, Swap
        return {'db': db, 'User': User, 'Skill': Skill, 'Swap': Swap}

    # --- Default Route ---
    # A simple route to confirm the API is running.
    @app.route('/')
    def index():
        return "<h1>SkillSwap API</h1><p>Welcome! The API is up and running.</p>"

    return app

# The following block is not strictly necessary when using `flask run`,
# but it's good practice to have it for alternative run methods.
# The actual app instance is now created by the `create_app` factory.
if __name__ == '__main__':
    app = create_app()
    # Note: `flask run` is the recommended way to start the dev server.
    # It automatically handles `debug=True` in development.
    app.run(host='0.0.0.0', port=5000)

