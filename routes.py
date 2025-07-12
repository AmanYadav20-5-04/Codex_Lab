# routes.py
# This file defines the API endpoints (routes) for the application.

from flask import Blueprint, request, jsonify
# CORRECTED: Changed from ".models" to "models" to fix the ImportError
from models import db, User, Skill, Swap

# Create a Blueprint. A blueprint is a way to organize a group of related views
# and other code. Rather than registering views and other code directly with an
# application, they are registered with a blueprint. Then the blueprint is
# registered with the application when it is available in a factory function.
api = Blueprint('api', __name__)

# --- Helper Functions ---
def error_response(message, status_code):
    """Creates a standardized JSON error response."""
    return jsonify({'error': message}), status_code

# --- User Routes ---

@api.route('/users/register', methods=['POST'])
def register_user():
    """Endpoint for new user registration."""
    data = request.get_json()
    if not data or not 'username' in data or not 'email' in data or not 'password' in data:
        return error_response('Missing data for registration', 400)

    if User.query.filter_by(username=data['username']).first():
        return error_response('Username already exists', 409)
    if User.query.filter_by(email=data['email']).first():
        return error_response('Email address already in use', 409)

    new_user = User(
        username=data['username'],
        email=data['email'],
        location=data.get('location', '')
    )
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()

    return jsonify(new_user.to_dict()), 201

@api.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Endpoint to retrieve a single user's profile."""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@api.route('/users', methods=['GET'])
def get_all_users():
    """Endpoint to retrieve all users."""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

# --- Skill Routes ---

@api.route('/skills', methods=['POST'])
def create_skill():
    """Endpoint to add a new skill to the database."""
    data = request.get_json()
    if not data or not 'name' in data or not 'category' in data:
        return error_response('Missing skill name or category', 400)
    
    if Skill.query.filter_by(name=data['name']).first():
        return error_response('Skill already exists', 409)

    new_skill = Skill(name=data['name'], category=data['category'])
    db.session.add(new_skill)
    db.session.commit()

    return jsonify(new_skill.to_dict()), 201

@api.route('/skills', methods=['GET'])
def get_skills():
    """Endpoint to retrieve all available skills."""
    skills = Skill.query.all()
    return jsonify([skill.to_dict() for skill in skills])

# --- Swap Routes ---

@api.route('/swaps/propose', methods=['POST'])
def propose_swap():
    """Endpoint to propose a new skill swap."""
    data = request.get_json()
    required_fields = ['proposer_id', 'receiver_id', 'offered_skill_id', 'requested_skill_id']
    if not all(field in data for field in required_fields):
        return error_response('Missing data for swap proposal', 400)

    # Basic validation to ensure users and skills exist
    if not User.query.get(data['proposer_id']) or not User.query.get(data['receiver_id']):
        return error_response('Invalid user ID', 404)
    if not Skill.query.get(data['offered_skill_id']) or not Skill.query.get(data['requested_skill_id']):
        return error_response('Invalid skill ID', 404)

    new_swap = Swap(
        proposer_id=data['proposer_id'],
        receiver_id=data['receiver_id'],
        offered_skill_id=data['offered_skill_id'],
        requested_skill_id=data['requested_skill_id'],
        message=data.get('message', '')
    )
    db.session.add(new_swap)
    db.session.commit()

    return jsonify(new_swap.to_dict()), 201

@api.route('/users/<int:user_id>/swaps', methods=['GET'])
def get_user_swaps(user_id):
    """Endpoint to get all swaps involving a specific user."""
    user = User.query.get_or_404(user_id)
    proposed = user.proposed_swaps
    received = user.received_swaps
    all_swaps = proposed + received
    # Sort swaps by timestamp, newest first
    all_swaps.sort(key=lambda x: x.timestamp, reverse=True)
    
    return jsonify([swap.to_dict() for swap in all_swaps])

@api.route('/swaps/<int:swap_id>/respond', methods=['POST'])
def respond_to_swap(swap_id):
    """Endpoint for a receiver to accept or reject a swap."""
    swap = Swap.query.get_or_404(swap_id)
    data = request.get_json()
    
    if not data or 'status' not in data:
        return error_response('Missing status in request body', 400)
        
    new_status = data['status']
    if new_status not in ['accepted', 'rejected']:
        return error_response("Invalid status. Must be 'accepted' or 'rejected'", 400)
    
    # Here you would typically add authentication to ensure
    # only the receiver can change the status.
    # For now, we'll allow it.
    
    swap.status = new_status
    db.session.commit()
    
    return jsonify(swap.to_dict())
