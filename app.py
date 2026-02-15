"""
Stress Management Web Application - Flask Backend
Real-time chat with intelligent web scraping for stress-relief recommendations
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from datetime import datetime, date
import logging
import uuid
import re

from services.keyword_extractor import KeywordExtractor
from services.youtube_scraper import YouTubeScraper
from services.music_scraper import MusicScraper
from services.wellness_scraper import WellnessScraper
from services.cache import RecommendationCache
from services.chatbot import StressChatbot
from services.stress_detector import get_detector
from models import db, User, MoodEntry, JournalEntry, UserStreak, BreatheSession, init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')
app.config['SECRET_KEY'] = 'stress-relief-secret-key-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///serenity.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
init_db(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth_login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Enable CORS and SocketIO
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Initialize services
keyword_extractor = KeywordExtractor()
youtube_scraper = YouTubeScraper()
music_scraper = MusicScraper()
wellness_scraper = WellnessScraper()
cache = RecommendationCache()
chatbot = StressChatbot()

# Store user sessions
user_sessions = {}

def get_session_id():
    """Get or create a session ID for anonymous users"""
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    return session['session_id']

def get_or_create_streak():
    """Get or create streak for current user/session"""
    if current_user.is_authenticated:
        streak = UserStreak.query.filter_by(user_id=current_user.id).first()
        if not streak:
            streak = UserStreak(user_id=current_user.id)
            db.session.add(streak)
            db.session.commit()
    else:
        session_id = get_session_id()
        streak = UserStreak.query.filter_by(session_id=session_id).first()
        if not streak:
            streak = UserStreak(session_id=session_id)
            db.session.add(streak)
            db.session.commit()
    return streak


# ================================================
# PAGE ROUTES
# ================================================

@app.route('/')
def home():
    """Home dashboard"""
    streak = get_or_create_streak()
    
    # Get today's mood
    today = date.today()
    today_mood = None
    mood_entries = 0
    journal_entries = 0
    breathe_sessions = 0
    
    if current_user.is_authenticated:
        today_mood_entry = MoodEntry.query.filter_by(user_id=current_user.id).filter(
            db.func.date(MoodEntry.timestamp) == today
        ).first()
        mood_entries = MoodEntry.query.filter_by(user_id=current_user.id).filter(
            MoodEntry.timestamp >= datetime.now().replace(day=datetime.now().day-7)
        ).count()
        journal_entries = JournalEntry.query.filter_by(user_id=current_user.id).filter(
            JournalEntry.timestamp >= datetime.now().replace(day=datetime.now().day-7)
        ).count()
        breathe_sessions = BreatheSession.query.filter_by(user_id=current_user.id).filter(
            BreatheSession.timestamp >= datetime.now().replace(day=datetime.now().day-7)
        ).count()
    else:
        session_id = get_session_id()
        today_mood_entry = MoodEntry.query.filter_by(session_id=session_id).filter(
            db.func.date(MoodEntry.timestamp) == today
        ).first()
        mood_entries = MoodEntry.query.filter_by(session_id=session_id).count()
        journal_entries = JournalEntry.query.filter_by(session_id=session_id).count()
        breathe_sessions = BreatheSession.query.filter_by(session_id=session_id).count()
    
    if today_mood_entry:
        today_mood = {
            'emoji': today_mood_entry.mood_emoji,
            'level': today_mood_entry.mood_level,
            'notes': today_mood_entry.notes
        }
    
    return render_template('home.html', 
                          active_page='home',
                          streak=streak.current_streak if streak else 0,
                          today_mood=today_mood,
                          mood_entries=mood_entries,
                          journal_entries=journal_entries,
                          breathe_sessions=breathe_sessions)

@app.route('/chat')
def chat():
    """Chat page"""
    return render_template('chat.html', active_page='chat')

@app.route('/mood')
def mood():
    """Mood tracking page"""
    return render_template('mood.html', active_page='mood')

@app.route('/journal')
def journal():
    """Journal page"""
    return render_template('journal.html', active_page='journal')

@app.route('/breathe')
def breathe():
    """Breathing exercises page"""
    return render_template('breathe.html', active_page='breathe')

@app.route('/games')
def games():
    """Games page"""
    return render_template('games.html', active_page='games')

@app.route('/music')
def music():
    """Music player page"""
    return render_template('music.html', active_page='music')

@app.route('/privacy')
def privacy():
    """Privacy policy page"""
    return render_template('privacy.html', active_page='privacy')

@app.route('/about')
def about():
    """About page"""
    return render_template('about.html', active_page='about')

@app.route('/stress-scan')
def stress_scan():
    """Real-time stress scanner with facial emotion detection"""
    return render_template('stress_scan.html', active_page='stress-scan')


# ================================================
# STRESS DETECTION API (Transformer-Based)
# ================================================

@app.route('/api/stress-detect', methods=['POST'])
def stress_detect():
    """
    Analyze webcam frame for stress using transformer-based emotion detection.
    Uses ViT (Vision Transformer) model for facial expression recognition.
    """
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Get the detector instance
        detector = get_detector()
        
        # Analyze the frame
        result = detector.analyze_frame(data['image'])
        
        if 'error' in result:
            return jsonify(result), 400
        
        # Add music recommendations based on stress level
        stress_level = result.get('stress', {}).get('level', 'moderate')
        result['music_recommendations'] = detector.get_music_recommendations(stress_level)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Stress detection error: {str(e)}")
        return jsonify({'error': 'Stress detection failed', 'details': str(e)}), 500


@app.route('/api/stress-detect/reset', methods=['POST'])
def stress_detect_reset():
    """Reset the stress detector history"""
    try:
        detector = get_detector()
        detector.reset()
        return jsonify({'success': True, 'message': 'Stress detector reset'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ================================================
# AUTHENTICATION ROUTES
# ================================================

@app.route('/auth/login', methods=['GET', 'POST'])
def auth_login():
    """Login page"""
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            if request.is_json:
                return jsonify({'success': True, 'message': 'Logged in successfully'})
            return redirect(url_for('home'))
        
        if request.is_json:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        return render_template('auth/login.html', error='Invalid email or password')
    
    return render_template('auth/login.html', active_page='login')

@app.route('/auth/register', methods=['GET', 'POST'])
def auth_register():
    """Registration page"""
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validation
        if User.query.filter_by(email=email).first():
            error = 'Email already registered'
            if request.is_json:
                return jsonify({'success': False, 'message': error}), 400
            return render_template('auth/register.html', error=error)
        
        if User.query.filter_by(username=username).first():
            error = 'Username already taken'
            if request.is_json:
                return jsonify({'success': False, 'message': error}), 400
            return render_template('auth/register.html', error=error)
        
        # Create user
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        if request.is_json:
            return jsonify({'success': True, 'message': 'Account created successfully'})
        return redirect(url_for('home'))
    
    return render_template('auth/register.html', active_page='register')

@app.route('/auth/logout')
def auth_logout():
    """Logout"""
    logout_user()
    return redirect(url_for('home'))


# ================================================
# MOOD API ROUTES
# ================================================

@app.route('/api/mood', methods=['GET', 'POST'])
def api_mood():
    """Mood CRUD API"""
    if request.method == 'POST':
        data = request.get_json()
        
        entry = MoodEntry(
            user_id=current_user.id if current_user.is_authenticated else None,
            session_id=get_session_id() if not current_user.is_authenticated else None,
            mood_level=data.get('mood_level'),
            mood_emoji=data.get('mood_emoji'),
            feelings=','.join(data.get('feelings', [])),
            notes=data.get('notes')
        )
        db.session.add(entry)
        
        # Update streak
        streak = get_or_create_streak()
        streak.update_streak()
        db.session.commit()
        
        return jsonify({'success': True, 'entry': entry.to_dict(), 'streak': streak.current_streak})
    
    # GET - retrieve mood history
    days = request.args.get('days', 7, type=int)
    
    if current_user.is_authenticated:
        entries = MoodEntry.query.filter_by(user_id=current_user.id).order_by(
            MoodEntry.timestamp.desc()
        ).limit(days * 3).all()
    else:
        entries = MoodEntry.query.filter_by(session_id=get_session_id()).order_by(
            MoodEntry.timestamp.desc()
        ).limit(days * 3).all()
    
    return jsonify({
        'entries': [e.to_dict() for e in entries],
        'insights': generate_mood_insights(entries)
    })

def generate_mood_insights(entries):
    """Generate insights from mood entries"""
    if not entries:
        return {'message': 'Start logging your mood to see insights!'}
    
    levels = [e.mood_level for e in entries]
    avg = sum(levels) / len(levels)
    
    all_feelings = []
    for e in entries:
        if e.feelings:
            all_feelings.extend(e.feelings.split(','))
    
    feeling_counts = {}
    for f in all_feelings:
        feeling_counts[f] = feeling_counts.get(f, 0) + 1
    
    top_feelings = sorted(feeling_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    
    return {
        'average_mood': round(avg, 1),
        'total_entries': len(entries),
        'top_feelings': [{'feeling': f, 'count': c} for f, c in top_feelings],
        'trend': 'improving' if len(levels) > 1 and levels[0] > levels[-1] else 'stable'
    }


# ================================================
# JOURNAL API ROUTES
# ================================================

@app.route('/api/journal', methods=['GET', 'POST'])
def api_journal():
    """Journal CRUD API"""
    if request.method == 'POST':
        data = request.get_json()
        content = data.get('content', '')
        
        # Extract tags from content
        tags = extract_journal_tags(content)
        
        entry = JournalEntry(
            user_id=current_user.id if current_user.is_authenticated else None,
            session_id=get_session_id() if not current_user.is_authenticated else None,
            title=data.get('title'),
            content=content,
            tags=','.join(tags),
            word_count=len(content.split())
        )
        db.session.add(entry)
        
        # Update streak
        streak = get_or_create_streak()
        streak.update_streak()
        db.session.commit()
        
        return jsonify({'success': True, 'entry': entry.to_dict()})
    
    # GET - retrieve journal entries
    if current_user.is_authenticated:
        entries = JournalEntry.query.filter_by(user_id=current_user.id).order_by(
            JournalEntry.timestamp.desc()
        ).all()
    else:
        entries = JournalEntry.query.filter_by(session_id=get_session_id()).order_by(
            JournalEntry.timestamp.desc()
        ).all()
    
    # Get all tags
    all_tags = {}
    for e in entries:
        if e.tags:
            for tag in e.tags.split(','):
                all_tags[tag] = all_tags.get(tag, 0) + 1
    
    return jsonify({
        'entries': [e.to_dict() for e in entries],
        'tags': all_tags,
        'total': len(entries),
        'avg_words': sum(e.word_count for e in entries) // len(entries) if entries else 0
    })

@app.route('/api/journal/<int:entry_id>', methods=['GET', 'PUT', 'DELETE'])
def api_journal_entry(entry_id):
    """Single journal entry operations"""
    entry = JournalEntry.query.get_or_404(entry_id)
    
    if request.method == 'DELETE':
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'PUT':
        data = request.get_json()
        entry.title = data.get('title', entry.title)
        entry.content = data.get('content', entry.content)
        entry.tags = ','.join(extract_journal_tags(entry.content))
        entry.word_count = len(entry.content.split())
        db.session.commit()
        return jsonify({'success': True, 'entry': entry.to_dict()})
    
    return jsonify(entry.to_dict())

def extract_journal_tags(content):
    """Extract keyword tags from journal content"""
    keywords = {
        'study': ['study', 'exam', 'test', 'homework', 'class', 'school', 'university'],
        'sleep': ['sleep', 'tired', 'insomnia', 'rest', 'nap', 'exhausted'],
        'social': ['friend', 'family', 'relationship', 'people', 'lonely', 'social'],
        'work': ['work', 'job', 'boss', 'deadline', 'project', 'career'],
        'health': ['health', 'sick', 'exercise', 'gym', 'doctor', 'pain'],
        'anxiety': ['anxious', 'worry', 'nervous', 'panic', 'fear'],
        'happy': ['happy', 'joy', 'excited', 'grateful', 'proud'],
        'sad': ['sad', 'depressed', 'down', 'upset', 'crying']
    }
    
    content_lower = content.lower()
    tags = []
    
    for tag, words in keywords.items():
        for word in words:
            if word in content_lower:
                tags.append(tag)
                break
    
    return list(set(tags))


# ================================================
# BREATHE API ROUTES
# ================================================

@app.route('/api/breathe/session', methods=['POST'])
def api_breathe_session():
    """Log a breathing session"""
    data = request.get_json()
    
    session_entry = BreatheSession(
        user_id=current_user.id if current_user.is_authenticated else None,
        session_id=get_session_id() if not current_user.is_authenticated else None,
        pattern=data.get('pattern'),
        cycles_completed=data.get('cycles', 0),
        duration_seconds=data.get('duration', 0)
    )
    db.session.add(session_entry)
    
    # Update streak
    streak = get_or_create_streak()
    streak.update_streak()
    db.session.commit()
    
    return jsonify({'success': True, 'streak': streak.current_streak})


# ================================================
# EXISTING ROUTES (CHAT/SCRAPING)
# ================================================

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Stress Relief API is running'})

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    user_sessions[request.sid] = {
        'messages': [],
        'emotion': None,
        'keywords': []
    }
    emit('connected', {'message': 'Connected to Stress Relief Assistant'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")
    if request.sid in user_sessions:
        del user_sessions[request.sid]

@socketio.on('set_emotion')
def handle_emotion(data):
    """Handle emotion selection from user"""
    emotion = data.get('emotion', 'neutral')
    if request.sid in user_sessions:
        user_sessions[request.sid]['emotion'] = emotion
        logger.info(f"User {request.sid} set emotion to: {emotion}")
    emit('emotion_set', {'emotion': emotion})

@socketio.on('send_message')
def handle_message(data):
    """Handle incoming chat message and generate recommendations"""
    message = data.get('message', '').strip()
    if not message:
        return
    
    session_data = user_sessions.get(request.sid, {'messages': [], 'emotion': None, 'keywords': []})
    session_data['messages'].append({'role': 'user', 'content': message})
    
    # Send typing indicator
    emit('typing', {'status': True})
    
    try:
        # Extract keywords from message
        keywords = keyword_extractor.extract(message, session_data.get('emotion'))
        session_data['keywords'].extend(keywords)
        
        # Generate chatbot response
        bot_response = chatbot.get_response(message, session_data.get('emotion'), keywords)
        
        # Check cache first
        cache_key = '_'.join(sorted(set(keywords[:3]))) if keywords else 'general_stress'
        cached_recommendations = cache.get(cache_key)
        
        if cached_recommendations:
            recommendations = cached_recommendations
            logger.info(f"Using cached recommendations for: {cache_key}")
        else:
            # Scrape fresh recommendations
            logger.info(f"Scraping recommendations for keywords: {keywords}")
            
            # Build optimized search queries for each content type
            video_query = keyword_extractor.build_search_query(keywords)
            music_query = keyword_extractor.get_music_query(keywords)
            
            # Scrape from different sources with optimized queries
            videos = youtube_scraper.scrape(video_query)
            music_results = music_scraper.scrape(music_query)
            articles = wellness_scraper.scrape(video_query)
            
            recommendations = {
                'videos': videos,
                'music': music_results,
                'articles': articles
            }
            
            # Cache the results
            cache.set(cache_key, recommendations)
        
        # Stop typing indicator
        emit('typing', {'status': False})
        
        # Send bot response
        emit('bot_message', {
            'message': bot_response,
            'recommendations': recommendations,
            'keywords': keywords
        })
        
        session_data['messages'].append({'role': 'bot', 'content': bot_response})
        user_sessions[request.sid] = session_data
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        emit('typing', {'status': False})
        emit('bot_message', {
            'message': "I understand you're going through a tough time. Let me share some resources that might help.",
            'recommendations': get_fallback_recommendations(),
            'keywords': []
        })

def get_fallback_recommendations():
    """Return fallback recommendations if scraping fails"""
    from data.fallback_content import FALLBACK_VIDEOS, FALLBACK_MUSIC, FALLBACK_ARTICLES
    return {
        'videos': FALLBACK_VIDEOS[:3],
        'music': FALLBACK_MUSIC[:3],
        'articles': FALLBACK_ARTICLES[:1]
    }

@app.route('/api/scrape/videos')
def scrape_videos():
    """Manual video scraping endpoint"""
    query = request.args.get('q', 'stress relief')
    videos = youtube_scraper.scrape(query)
    return jsonify({'videos': videos})

@app.route('/api/scrape/music')
def scrape_music_api():
    """Manual music scraping endpoint"""
    query = request.args.get('q', 'relaxing music')
    music_results = music_scraper.scrape(query)
    return jsonify({'music': music_results})

@app.route('/api/scrape/articles')
def scrape_articles():
    """Manual article scraping endpoint"""
    query = request.args.get('q', 'stress management')
    articles = wellness_scraper.scrape(query)
    return jsonify({'articles': articles})

@app.route('/api/emotion-recommendations')
def emotion_recommendations():
    """Get recommendations based on detected facial expression"""
    emotion = request.args.get('emotion', 'neutral')
    
    # Map facial expression emotions to search queries
    emotion_queries = {
        'happy': 'maintain positive mood mindfulness',
        'sad': 'mood boost uplifting meditation',
        'angry': 'anger management calm techniques',
        'fearful': 'anxiety relief calming exercises',
        'surprised': 'stress relief relaxation',
        'disgusted': 'emotional reset mindfulness',
        'neutral': 'general wellness relaxation'
    }
    
    query = emotion_queries.get(emotion, 'stress relief meditation')
    
    # Get recommendations
    videos = youtube_scraper.scrape(query)
    music_results = music_scraper.scrape(f"{emotion} calming music")
    articles = wellness_scraper.scrape(query)
    
    return jsonify({
        'emotion': emotion,
        'videos': videos,
        'music': music_results,
        'articles': articles
    })

@app.route('/api/streak')
def get_streak():
    """Get current user streak"""
    streak = get_or_create_streak()
    return jsonify(streak.to_dict())


if __name__ == '__main__':
    logger.info("Starting Stress Relief Server on http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
