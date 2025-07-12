SkillSwap Backend (Python/Flask)This is the complete backend for the SkillSwap application, built with Python, Flask, and SQLAlchemy. It provides a full REST API for managing users, skills, and swap proposals.FeaturesRESTful API: A complete set of endpoints for all application features.Database Integration: Uses Flask-SQLAlchemy with a SQLite database for easy setup.Database Migrations: Powered by Flask-Migrate to handle changes to your database schema over time.Modular Structure: The code is organized into blueprints for better maintainability (Users, Skills, Swaps).CORS Enabled: Cross-Origin Resource Sharing is configured to allow your frontend application to make requests to this API.Secure Password Handling: User passwords are not stored directly; they are hashed using modern security practices.Project Structure.
├── instance/
│   └── skillswap.db      # SQLite database file (created after running)
├── migrations/             # Database migration scripts (created by Flask-Migrate)
├── .gitignore              # Files to be ignored by Git
├── app.py                  # Main application factory and entry point
├── config.py               # Configuration settings
├── models.py               # Database models (schema)
├── routes.py               # API route definitions (blueprints)
├── requirements.txt        # Project dependencies
└── README.md               # This file
Setup and InstallationPrerequisitesPython 3.8 or higherpip for installing packagesInstallation StepsClone the repository (or set up your project with these files).Create and activate a virtual environment (highly recommended):On macOS and Linux:python3 -m venv venv
source venv/bin/activate
On Windows:python -m venv venv
.\venv\Scripts\activate
Install the required packages:pip install -r requirements.txt
Set up the Database:You need to initialize the database and apply the initial schema. Run these commands in order:# Set the Flask app environment variable
# On macOS/Linux:
export FLASK_APP=app.py
# On Windows:
set FLASK_APP=app.py

# Now, run the database commands
flask db init    # Run this only once to initialize migrations
flask db migrate -m "Initial migration with all models." # Creates the migration script
flask db upgrade # Applies the migration to the database
After these commands, you will see a skillswap.db file inside an instance folder.Running the ApplicationTo start the development server, simply run:flask run
The backend will be running on http://127.0.0.1:5000. Your frontend application can now make API calls to this address.