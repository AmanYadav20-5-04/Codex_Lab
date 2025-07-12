# models.py
# This file defines the database schema using SQLAlchemy ORM.

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import datetime

# Create a SQLAlchemy instance. This will be initialized in the main app.py file.
db = SQLAlchemy()

# --- Association Tables for Many-to-Many Relationships ---

# Association table for users and the skills they offer
user_skills_offered = db.Table('user_skills_offered',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skill.id'), primary_key=True)
)

# Association table for users and the skills they are seeking
user_skills_seeking = db.Table('user_skills_seeking',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skill.id'), primary_key=True)
)


# --- Main Models ---

class User(db.Model):
    """
    User model for storing user information.
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    location = db.Column(db.String(120))
    bio = db.Column(db.Text)
    
    # --- Relationships ---
    # Many-to-many relationship with skills offered by the user
    skills_offered = db.relationship('Skill', secondary=user_skills_offered, lazy='subquery',
        backref=db.backref('users_offering', lazy=True))

    # Many-to-many relationship with skills sought by the user
    skills_seeking = db.relationship('Skill', secondary=user_skills_seeking, lazy='subquery',
        backref=db.backref('users_seeking', lazy=True))

    def set_password(self, password):
        """Hashes the password and stores it."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Checks if the provided password matches the stored hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Serializes the User object to a dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'location': self.location,
            'bio': self.bio,
            'skills_offered': [skill.to_dict() for skill in self.skills_offered],
            'skills_seeking': [skill.to_dict() for skill in self.skills_seeking]
        }


class Skill(db.Model):
    """
    Skill model for storing different skills available on the platform.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        """Serializes the Skill object to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category
        }


class Swap(db.Model):
    """
    Swap model for managing skill exchange proposals between users.
    """
    id = db.Column(db.Integer, primary_key=True)
    proposer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    offered_skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    requested_skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    
    # Status can be: 'pending', 'accepted', 'rejected', 'completed', 'cancelled'
    status = db.Column(db.String(50), nullable=False, default='pending')
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # --- Relationships ---
    proposer = db.relationship('User', foreign_keys=[proposer_id], backref='proposed_swaps')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_swaps')
    offered_skill = db.relationship('Skill', foreign_keys=[offered_skill_id])
    requested_skill = db.relationship('Skill', foreign_keys=[requested_skill_id])

    def to_dict(self):
        """Serializes the Swap object to a dictionary."""
        return {
            'id': self.id,
            'status': self.status,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'proposer': self.proposer.to_dict(),
            'receiver': self.receiver.to_dict(),
            'offered_skill': self.offered_skill.to_dict(),
            'requested_skill': self.requested_skill.to_dict()
        }
