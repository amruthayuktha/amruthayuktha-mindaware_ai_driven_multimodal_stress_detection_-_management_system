"""
Enhanced Stress Relief Chatbot Service
Generates precise, context-aware empathetic responses based on user messages
"""

import re
from typing import List, Optional, Dict

class StressChatbot:
    """Context-aware empathetic chatbot for stress relief conversations"""
    
    # Precise responses for different stress contexts
    CONTEXT_RESPONSES = {
        # Exam-related stress
        'exams': {
            'keywords': ['exam', 'test', 'study', 'finals', 'midterm', 'quiz', 'grade', 'gpa'],
            'responses': [
                "I can see you're dealing with exam stress. That's completely normal - your brain is under pressure to perform. Here are some proven techniques that have helped millions of students.",
                "Exam anxiety is something many people face. The good news is there are specific breathing and focus techniques designed exactly for test situations.",
                "Studying for exams can feel overwhelming. Let me share some resources that combine quick stress relief with focus-enhancing techniques."
            ],
            'tips': [
                "Try the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8.",
                "Take a 5-minute break every 25 minutes (Pomodoro technique).",
                "Your brain consolidates information during rest - short breaks actually help!"
            ]
        },
        
        # Work stress
        'work': {
            'keywords': ['work', 'job', 'boss', 'office', 'deadline', 'meeting', 'coworker', 'project', 'presentation'],
            'responses': [
                "Work pressure can really build up. Whether it's deadlines, difficult colleagues, or presentations - these feelings are valid. Let me find some quick relief techniques you can use even at your desk.",
                "I understand workplace stress is challenging. Here are some discrete relaxation techniques you can do during work hours.",
                "Professional life can be demanding. These resources are specifically designed for busy professionals who need quick stress relief."
            ],
            'tips': [
                "Take micro-breaks: just 60 seconds of deep breathing can reset your stress response.",
                "Try desk stretches to release physical tension.",
                "Step outside for a 5-minute walk if possible - natural light helps regulate stress hormones."
            ]
        },
        
        # Sleep issues
        'sleep': {
            'keywords': ['sleep', 'insomnia', 'cant sleep', "can't sleep", 'awake', 'tired', 'exhausted', 'nightmare', 'restless'],
            'responses': [
                "Sleep issues and stress create a difficult cycle - stress keeps you awake, and lack of sleep increases stress. Let me share some calming techniques specifically designed to help you wind down.",
                "I hear you're struggling with sleep. These guided sleep meditations and calming sounds have helped many people find rest.",
                "Not being able to sleep is frustrating. Here are some evidence-based relaxation techniques for better sleep."
            ],
            'tips': [
                "Try progressive muscle relaxation - tense and release each muscle group.",
                "Avoid screens 30 minutes before bed, or use night mode.",
                "Keep your room cool (around 65-68°F/18-20°C) for optimal sleep."
            ]
        },
        
        # Anxiety
        'anxiety': {
            'keywords': ['anxious', 'anxiety', 'panic', 'worried', 'worry', 'nervous', 'fear', 'scared', 'overthinking'],
            'responses': [
                "Anxiety can feel overwhelming, but there are proven techniques to help calm your nervous system. I'm here to help you through this.",
                "When anxiety hits, your body's fight-or-flight response activates. These breathing exercises can help bring you back to calm.",
                "I understand that anxious feeling. Let me share some grounding techniques and calming resources that can help right now."
            ],
            'tips': [
                "Try grounding: name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.",
                "Box breathing: inhale 4 seconds, hold 4, exhale 4, hold 4. Repeat.",
                "Remember: anxiety peaks and then passes. This feeling is temporary."
            ]
        },
        
        # Overwhelm
        'overwhelmed': {
            'keywords': ['overwhelmed', 'too much', 'cant cope', "can't cope", 'breaking down', 'falling apart', 'stressed out'],
            'responses': [
                "When everything feels like too much, it's important to take things one small step at a time. Let me help you find some immediate relief.",
                "Feeling overwhelmed is your mind's signal that it needs a break. These quick techniques can help you reset.",
                "I can hear that you're dealing with a lot right now. Let's start with something simple to help ease that pressure."
            ],
            'tips': [
                "Focus on just one thing at a time - everything else can wait.",
                "Write down everything on your mind, then pick just ONE thing to address.",
                "It's okay to ask for help. You don't have to handle everything alone."
            ]
        },
        
        # Focus issues
        'focus': {
            'keywords': ['focus', 'concentrate', 'distracted', 'attention', 'productive', 'procrastinate', 'motivation', 'unmotivated'],
            'responses': [
                "Difficulty focusing often comes from underlying stress. These focus-enhancing techniques combine stress relief with concentration boosters.",
                "When the mind wanders, it's usually trying to protect itself from overwhelm. Here are some gentle ways to improve focus.",
                "Procrastination and focus issues are often linked to anxiety about the task. Let me share some techniques to break through."
            ],
            'tips': [
                "Break tasks into 25-minute focused sessions with 5-minute breaks.",
                "Listen to ambient sounds or lo-fi music while working.",
                "Start with the easiest task first to build momentum."
            ]
        },
        
        # Relationship stress
        'relationships': {
            'keywords': ['relationship', 'partner', 'boyfriend', 'girlfriend', 'friend', 'family', 'argument', 'fight', 'breakup', 'lonely', 'alone'],
            'responses': [
                "Relationship challenges can be emotionally draining. Whether it's conflict, loneliness, or change - your feelings are completely valid.",
                "I understand relationship stress affects us deeply. Here are some resources for emotional processing and self-care.",
                "Navigating relationships - whether romantic, family, or friendships - is one of life's biggest challenges. Let me help you find some comfort."
            ],
            'tips': [
                "It's okay to feel hurt. Allow yourself to process these emotions.",
                "Journaling can help organize thoughts and feelings.",
                "Consider reaching out to someone you trust to talk about how you feel."
            ]
        },
        
        # Sadness/depression
        'sadness': {
            'keywords': ['sad', 'depressed', 'depression', 'hopeless', 'crying', 'unhappy', 'miserable', 'down'],
            'responses': [
                "I'm sorry you're feeling this way. Sadness is a valid emotion, and you don't have to face it alone. Let me share some gentle resources.",
                "When we're feeling down, even small acts of self-care can help. Here are some soothing resources for you.",
                "I hear that you're going through a difficult time. These calming resources may help bring a moment of peace."
            ],
            'tips': [
                "Be gentle with yourself - you're doing the best you can.",
                "Sometimes fresh air and gentle movement can lift your mood slightly.",
                "If these feelings persist, please consider talking to a mental health professional. You deserve support."
            ]
        },
        
        # Anger
        'anger': {
            'keywords': ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed', 'rage'],
            'responses': [
                "Anger is a natural emotion - it's your mind telling you something needs attention. Let me share some healthy ways to process and release it.",
                "I can sense you're frustrated. These techniques can help you channel that energy and find calm.",
                "It's okay to feel angry. Here are some constructive ways to work through these intense feelings."
            ],
            'tips': [
                "Physical activity is one of the best ways to release anger - even a brisk walk helps.",
                "Try counting to 10 slowly while taking deep breaths.",
                "Write down what you're angry about - sometimes seeing it on paper provides perspective."
            ]
        }
    }
    
    # Default responses for general stress
    DEFAULT_RESPONSES = [
        "I'm here to help you feel better. Based on what you've shared, I've found some resources that may help.",
        "Thank you for opening up. Here are some personalized recommendations to help ease your stress.",
        "I understand you're going through a tough time. Let me share some helpful resources tailored to your situation."
    ]
    
    # Greeting responses
    GREETINGS = [
        "Hello! 🌟 I'm here to help you find calm and peace. How are you feeling today? Select an emotion above or tell me what's on your mind.",
        "Hi there! 💚 Welcome to your stress relief companion. What's been weighing on you lately?",
        "Hey! I'm glad you're here. 🌿 Remember, it's brave to seek support. What would you like to talk about?"
    ]
    
    def __init__(self):
        """Initialize the chatbot"""
        self.conversation_history = []
    
    def get_response(self, message: str, emotion: Optional[str] = None, keywords: List[str] = None) -> str:
        """
        Generate a precise, context-aware response
        
        Args:
            message: User's message
            emotion: User's selected emotion
            keywords: Detected stress keywords
            
        Returns:
            Precise chatbot response string
        """
        message_lower = message.lower()
        
        # Check for greetings
        if self._is_greeting(message):
            return self._get_random(self.GREETINGS)
        
        # Find the best matching context
        best_context = self._find_best_context(message_lower, emotion, keywords)
        
        # Build precise response
        response = self._build_response(best_context, message_lower, emotion)
        
        return response
    
    def _find_best_context(self, message: str, emotion: Optional[str], keywords: List[str]) -> Dict:
        """Find the most relevant context based on message content"""
        scores = {}
        
        for context_name, context_data in self.CONTEXT_RESPONSES.items():
            score = 0
            for keyword in context_data['keywords']:
                if keyword in message:
                    score += 2
                if keywords and keyword in [k.lower() for k in keywords]:
                    score += 1
            
            # Boost score if emotion matches context
            if emotion:
                if emotion == 'anxious' and context_name == 'anxiety':
                    score += 3
                elif emotion == 'stressed' and context_name in ['work', 'overwhelmed']:
                    score += 2
                elif emotion == 'tired' and context_name == 'sleep':
                    score += 3
                elif emotion == 'sad' and context_name == 'sadness':
                    score += 3
                elif emotion == 'angry' and context_name == 'anger':
                    score += 3
            
            scores[context_name] = score
        
        # Get best matching context
        if scores:
            best_context_name = max(scores.keys(), key=lambda k: scores[k])
            if scores[best_context_name] > 0:
                return self.CONTEXT_RESPONSES[best_context_name]
        
        return None
    
    def _build_response(self, context: Optional[Dict], message: str, emotion: Optional[str]) -> str:
        """Build a precise, contextual response"""
        parts = []
        
        if context:
            # Add main contextual response
            parts.append(self._get_random(context['responses']))
            
            # Add a relevant tip
            tip = self._get_random(context['tips'])
            parts.append(f"\n\n💡 **Quick tip:** {tip}")
        else:
            # Use default response
            parts.append(self._get_random(self.DEFAULT_RESPONSES))
            
            # Add emotion-specific acknowledgment
            if emotion:
                emotion_ack = self._get_emotion_acknowledgment(emotion)
                if emotion_ack:
                    parts.insert(0, emotion_ack + " ")
        
        # Add recommendation intro
        parts.append("\n\n📚 Here are some resources I found for you:")
        
        return ''.join(parts)
    
    def _get_emotion_acknowledgment(self, emotion: str) -> str:
        """Get acknowledgment for specific emotion"""
        acks = {
            'anxious': "I can sense you're feeling anxious.",
            'stressed': "I understand you're under a lot of stress.",
            'sad': "I'm sorry you're feeling down.",
            'tired': "I can hear that you're exhausted.",
            'angry': "I understand you're feeling frustrated.",
            'overwhelmed': "I can tell you're feeling overwhelmed.",
            'neutral': ""
        }
        return acks.get(emotion, "")
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting"""
        greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 
                     'good evening', 'hi there', 'hello there', 'howdy', 'sup', "what's up"]
        message_lower = message.lower().strip()
        # Only treat as greeting if it's a short message
        if len(message_lower.split()) <= 3:
            return any(message_lower.startswith(g) or message_lower == g for g in greetings)
        return False
    
    def _get_random(self, items: list) -> str:
        """Get a random item from list"""
        import random
        return random.choice(items)
    
    def get_closing_message(self) -> str:
        """Get a supportive closing message"""
        closings = [
            "Remember, it's okay to not be okay. Take care of yourself. 💚",
            "You're doing great by taking steps to feel better. 🌟",
            "I'm always here if you need to talk more. 🌿",
            "Take your time with these resources. There's no rush. 💙",
            "You've got this. One step at a time. 💪"
        ]
        return self._get_random(closings)
