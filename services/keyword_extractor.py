"""
Enhanced Keyword Extractor Service
Analyzes user messages with improved accuracy for stress trigger detection
"""

import re
from typing import List, Optional, Tuple

class KeywordExtractor:
    """Enhanced keyword extraction with better context analysis"""
    
    # Stress trigger categories with weighted keywords
    STRESS_TRIGGERS = {
        'exams': {
            'high': ['exam', 'finals', 'midterm', 'test anxiety', 'studying', 'gpa'],
            'medium': ['test', 'study', 'quiz', 'grade', 'school', 'college', 'university'],
            'low': ['homework', 'assignment', 'deadline', 'class', 'professor', 'teacher']
        },
        'work': {
            'high': ['work stress', 'boss', 'fired', 'layoff', 'promotion', 'interview'],
            'medium': ['work', 'job', 'office', 'deadline', 'meeting', 'project'],
            'low': ['coworker', 'colleague', 'career', 'workplace', 'professional']
        },
        'relationships': {
            'high': ['breakup', 'divorce', 'fight with', 'argument with', 'lonely', 'heartbreak'],
            'medium': ['relationship', 'partner', 'boyfriend', 'girlfriend', 'spouse', 'husband', 'wife'],
            'low': ['friend', 'family', 'argument', 'conflict', 'communication']
        },
        'sleep': {
            'high': ['insomnia', "can't sleep", 'cant sleep', 'sleepless', 'nightmare'],
            'medium': ['sleep', 'tired', 'exhausted', 'fatigue', 'restless'],
            'low': ['awake', 'rest', 'bed', 'night', 'morning']
        },
        'anxiety': {
            'high': ['panic attack', 'anxiety attack', 'severe anxiety', 'cant breathe', 'heart racing'],
            'medium': ['anxious', 'anxiety', 'panic', 'worried', 'nervous', 'fear'],
            'low': ['scared', 'overthinking', 'uneasy', 'tense', 'on edge']
        },
        'focus': {
            'high': ['cant focus', "can't concentrate", 'adhd', 'brain fog'],
            'medium': ['focus', 'concentrate', 'distracted', 'procrastinate'],
            'low': ['attention', 'productive', 'motivation', 'unmotivated']
        },
        'overwhelmed': {
            'high': ['breaking down', 'falling apart', 'too much', 'cant cope', "can't handle"],
            'medium': ['overwhelmed', 'stressed out', 'burned out', 'burnout'],
            'low': ['pressure', 'demanding', 'exhausting', 'draining']
        },
        'sadness': {
            'high': ['depressed', 'depression', 'hopeless', 'suicidal', 'want to die'],
            'medium': ['sad', 'crying', 'tearful', 'miserable', 'empty'],
            'low': ['down', 'blue', 'unhappy', 'upset', 'disappointed']
        },
        'anger': {
            'high': ['furious', 'rage', 'hate', 'explosive'],
            'medium': ['angry', 'mad', 'frustrated', 'irritated'],
            'low': ['annoyed', 'bothered', 'upset', 'fed up']
        }
    }
    
    # Emotion to category mapping for better context
    EMOTION_MAPPING = {
        'anxious': 'anxiety',
        'stressed': 'overwhelmed',
        'sad': 'sadness',
        'tired': 'sleep',
        'angry': 'anger',
        'overwhelmed': 'overwhelmed',
        'neutral': None
    }
    
    # Search query templates optimized for each category
    SEARCH_QUERIES = {
        'exams': [
            'exam stress relief meditation',
            'study focus techniques anxiety',
            'test anxiety breathing exercises',
            'concentration music for studying'
        ],
        'work': [
            'work stress relief exercises',
            'office relaxation techniques quick',
            'desk meditation for stress',
            'professional burnout recovery'
        ],
        'relationships': [
            'relationship stress coping',
            'heartbreak healing meditation',
            'loneliness self care techniques',
            'emotional healing guided meditation'
        ],
        'sleep': [
            'sleep meditation deep relaxation',
            'insomnia relief calming music',
            'bedtime relaxation techniques',
            'sleep sounds nature peaceful'
        ],
        'anxiety': [
            'anxiety relief breathing exercises',
            'panic attack calm down techniques',
            'grounding exercises anxiety',
            'calming meditation for anxiety'
        ],
        'focus': [
            'focus music concentration',
            'productivity meditation adhd',
            'concentration improvement techniques',
            'ambient sounds for focus'
        ],
        'overwhelmed': [
            'overwhelm relief quick',
            'stress relief 5 minutes',
            'burnout recovery meditation',
            'instant calm techniques'
        ],
        'sadness': [
            'mood lifting meditation',
            'gentle uplifting music',
            'self compassion meditation',
            'healing from sadness guided'
        ],
        'anger': [
            'anger management techniques quick',
            'calming down when angry',
            'release frustration healthy ways',
            'cool down meditation anger'
        ]
    }
    
    def extract(self, message: str, emotion: Optional[str] = None) -> List[str]:
        """
        Extract stress-related keywords with context scoring
        
        Args:
            message: User's chat message
            emotion: User's selected emotion (optional)
            
        Returns:
            List of detected categories sorted by relevance
        """
        message_lower = message.lower()
        category_scores = {}
        
        # Score each category based on keyword matches
        for category, priority_keywords in self.STRESS_TRIGGERS.items():
            score = 0
            
            # Check high priority keywords (weight: 3)
            for keyword in priority_keywords['high']:
                if keyword in message_lower:
                    score += 3
            
            # Check medium priority keywords (weight: 2)
            for keyword in priority_keywords['medium']:
                if keyword in message_lower:
                    score += 2
            
            # Check low priority keywords (weight: 1)
            for keyword in priority_keywords['low']:
                if keyword in message_lower:
                    score += 1
            
            if score > 0:
                category_scores[category] = score
        
        # Boost score for emotion-matched category
        if emotion and emotion in self.EMOTION_MAPPING:
            matched_category = self.EMOTION_MAPPING[emotion]
            if matched_category:
                if matched_category in category_scores:
                    category_scores[matched_category] += 2
                else:
                    category_scores[matched_category] = 2
        
        # Sort categories by score
        if category_scores:
            sorted_categories = sorted(category_scores.keys(), 
                                       key=lambda x: category_scores[x], 
                                       reverse=True)
            return sorted_categories[:3]  # Return top 3 categories
        
        # Default categories based on emotion
        if emotion:
            return [self.EMOTION_MAPPING.get(emotion, 'anxiety')] if self.EMOTION_MAPPING.get(emotion) else ['general_stress']
        
        return ['general_stress']
    
    def build_search_query(self, keywords: List[str]) -> str:
        """
        Build an optimized search query for scraping
        
        Args:
            keywords: List of detected category keywords
            
        Returns:
            Optimized search query string
        """
        if not keywords:
            return 'stress relief techniques meditation'
        
        primary_category = keywords[0]
        
        if primary_category in self.SEARCH_QUERIES:
            return self.SEARCH_QUERIES[primary_category][0]
        
        return f'{primary_category} stress relief techniques'
    
    def get_all_queries(self, keywords: List[str]) -> List[str]:
        """
        Get multiple search queries for comprehensive scraping
        
        Args:
            keywords: List of detected category keywords
            
        Returns:
            List of search query strings for different content types
        """
        queries = []
        
        for keyword in keywords[:2]:  # Top 2 categories
            if keyword in self.SEARCH_QUERIES:
                queries.extend(self.SEARCH_QUERIES[keyword][:2])
        
        # Ensure we have at least some queries
        if not queries:
            queries = ['stress relief meditation', 'relaxation techniques quick']
        
        return list(dict.fromkeys(queries))[:4]  # Remove duplicates, limit to 4
    
    def get_music_query(self, keywords: List[str]) -> str:
        """Get a music-specific search query"""
        if not keywords:
            return 'calming relaxation music'
        
        primary = keywords[0]
        music_queries = {
            'exams': 'study focus music concentration no lyrics',
            'work': 'office relaxation ambient music',
            'sleep': 'deep sleep music relaxing',
            'anxiety': 'calming music anxiety relief',
            'focus': 'focus music productivity ambient',
            'sadness': 'uplifting gentle music mood',
            'anger': 'calming music peace relaxation',
            'overwhelmed': 'stress relief music instant calm',
            'relationships': 'emotional healing music peaceful'
        }
        
        return music_queries.get(primary, 'relaxing stress relief music')
    
    def analyze_sentiment(self, message: str) -> Tuple[str, float]:
        """
        Simple sentiment analysis of the message
        
        Returns:
            Tuple of (sentiment, intensity) where sentiment is 'negative', 'neutral', 'positive'
            and intensity is 0.0-1.0
        """
        message_lower = message.lower()
        
        negative_words = ['stressed', 'anxious', 'worried', 'scared', 'tired', 'exhausted',
                         'sad', 'depressed', 'angry', 'frustrated', 'overwhelmed', 'panic',
                         'cant', "can't", 'unable', 'failing', 'terrible', 'awful', 'hate']
        
        positive_words = ['better', 'good', 'happy', 'calm', 'relaxed', 'peaceful',
                         'hopeful', 'grateful', 'thank', 'helped', 'working']
        
        neg_count = sum(1 for word in negative_words if word in message_lower)
        pos_count = sum(1 for word in positive_words if word in message_lower)
        
        total = neg_count + pos_count
        if total == 0:
            return ('neutral', 0.5)
        
        neg_ratio = neg_count / total
        
        if neg_ratio > 0.6:
            return ('negative', min(1.0, neg_ratio))
        elif neg_ratio < 0.4:
            return ('positive', min(1.0, 1 - neg_ratio))
        else:
            return ('neutral', 0.5)
