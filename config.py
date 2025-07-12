# config.py
# This file contains the configuration variables for the Flask application.

import os

# Get the absolute path of the directory where this file is located.
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """
    Base configuration class. Contains default configuration settings
    and settings that are common across all environments.
    """
    # Secret key is used for session management, CSRF protection, and other security features.
    # It's important to keep this value secret in a production environment.
    # For development, a simple string is fine. In production, use a long, random string.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-very-secret-and-hard-to-guess-key'

    # --- Database Configuration ---
    # This configures the database URI. We are using SQLite for simplicity.
    # The database file will be named 'skillswap.db' and will be located in the 'instance' folder
    # at the root of the project. Flask creates this folder automatically.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'instance', 'skillswap.db')

    # This disables a feature of Flask-SQLAlchemy that tracks modifications of objects and
    # emits signals. It's not needed for our purposes and adds overhead.
    SQLALCHEMY_TRACK_MODIFICATIONS = False

