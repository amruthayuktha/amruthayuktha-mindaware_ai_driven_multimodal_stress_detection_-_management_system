"""
Database Models for Serenity Stress Management App
Using SQLAlchemy with SQLite for data persistence
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(UserMixin, db.Model):
    """User account model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    mood_entries = db.relationship('MoodEntry', backref='user', lazy='dynamic')
    journal_entries = db.relationship('JournalEntry', backref='user', lazy='dynamic')
    streak = db.relationship('UserStreak', backref='user', uselist=False)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'


class MoodEntry(db.Model):
    """Mood tracking entry"""
    __tablename__ = 'mood_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(100), nullable=True)  # For non-logged-in users
    mood_level = db.Column(db.Integer, nullable=False)  # 1-5 scale
    mood_emoji = db.Column(db.String(10), nullable=False)
    feelings = db.Column(db.String(500), nullable=True)  # Comma-separated feelings
    notes = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'mood_level': self.mood_level,
            'mood_emoji': self.mood_emoji,
            'feelings': self.feelings.split(',') if self.feelings else [],
            'notes': self.notes,
            'timestamp': self.timestamp.isoformat()
        }
    
    def __repr__(self):
        return f'<MoodEntry {self.id} - Level {self.mood_level}>'


class JournalEntry(db.Model):
    """Journal entry model"""
    __tablename__ = 'journal_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(100), nullable=True)
    title = db.Column(db.String(200), nullable=True)
    content = db.Column(db.Text, nullable=False)
    tags = db.Column(db.String(500), nullable=True)  # Comma-separated tags
    word_count = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title or 'Untitled',
            'content': self.content,
            'tags': self.tags.split(',') if self.tags else [],
            'word_count': self.word_count,
            'timestamp': self.timestamp.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<JournalEntry {self.id} - {self.title or "Untitled"}>'


class UserStreak(db.Model):
    """User engagement streak tracking"""
    __tablename__ = 'user_streaks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, unique=True)
    session_id = db.Column(db.String(100), nullable=True)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_interaction = db.Column(db.Date, nullable=True)
    total_interactions = db.Column(db.Integer, default=0)
    
    def update_streak(self):
        """Update streak based on current interaction"""
        from datetime import date
        today = date.today()
        
        if self.last_interaction is None:
            self.current_streak = 1
        elif self.last_interaction == today:
            pass  # Already interacted today
        elif (today - self.last_interaction).days == 1:
            self.current_streak += 1
        else:
            self.current_streak = 1
        
        self.last_interaction = today
        self.total_interactions += 1
        
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
    
    def to_dict(self):
        return {
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'last_interaction': self.last_interaction.isoformat() if self.last_interaction else None,
            'total_interactions': self.total_interactions
        }
    
    def __repr__(self):
        return f'<UserStreak {self.id} - {self.current_streak} days>'


class BreatheSession(db.Model):
    """Breathing exercise session log"""
    __tablename__ = 'breathe_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(100), nullable=True)
    pattern = db.Column(db.String(50), nullable=False)  # e.g., '478', 'box', 'simple'
    cycles_completed = db.Column(db.Integer, default=0)
    duration_seconds = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BreatheSession {self.id} - {self.pattern}>'


def init_db(app):
    """Initialize the database with the Flask app"""
    db.init_app(app)
    with app.app_context():
        db.create_all()
