"""
Transformer-Based Stress Detection Service
Uses Vision Transformer (ViT) for facial emotion recognition
Based on research: https://huggingface.co/trpakov/vit-face-expression
"""

import base64
import io
import logging
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

# Lazy load models to avoid slow startup
_model = None
_processor = None
_device = None


def get_model():
    """Lazy load the ViT model and processor"""
    global _model, _processor, _device
    
    if _model is None:
        try:
            import torch
            from transformers import ViTImageProcessor, ViTForImageClassification
            
            # Use CPU by default, GPU if available
            _device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading ViT model on device: {_device}")
            
            model_name = "trpakov/vit-face-expression"
            _processor = ViTImageProcessor.from_pretrained(model_name)
            _model = ViTForImageClassification.from_pretrained(model_name)
            _model.to(_device)
            _model.eval()
            
            logger.info("ViT face expression model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load ViT model: {e}")
            raise
    
    return _model, _processor, _device


class TransformerStressDetector:
    """
    Stress detection using Vision Transformer for facial expression recognition.
    Implements paper-based approach using transformer attention for emotion classification.
    """
    
    def __init__(self):
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        
        # Stress weights for each emotion (based on psychological research)
        self.stress_weights = {
            'angry': 0.9,
            'disgust': 0.7,
            'fear': 0.85,
            'sad': 0.75,
            'surprise': 0.4,
            'neutral': 0.2,
            'happy': 0.0
        }
        
        # Emotion to emoji mapping
        self.emotion_emoji = {
            'angry': '😠',
            'disgust': '😖',
            'fear': '😨',
            'happy': '😊',
            'neutral': '😐',
            'sad': '😢',
            'surprise': '😲'
        }
        
        # Stress level thresholds
        self.thresholds = {
            'minimal': 0.2,
            'low': 0.3,
            'moderate': 0.5,
            'high': 0.7
        }
        
        self.emotion_history = []
        self.max_history = 30
    
    def decode_base64_image(self, base64_string):
        """Decode base64 image string to PIL Image"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            return image
        except Exception as e:
            logger.error(f"Failed to decode base64 image: {e}")
            return None
    
    def detect_emotion(self, image):
        """
        Detect facial expression using ViT transformer model.
        Returns emotion probabilities for all 7 emotions.
        """
        try:
            import torch
            
            model, processor, device = get_model()
            
            # Preprocess image
            inputs = processor(images=image, return_tensors="pt")
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            # Run inference
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=-1)[0]
            
            # Convert to dictionary
            emotions = {}
            for i, label in enumerate(self.emotion_labels):
                emotions[label] = float(probs[i].cpu().numpy())
            
            return emotions
            
        except Exception as e:
            logger.error(f"Emotion detection failed: {e}")
            return None
    
    def calculate_stress_score(self, emotions):
        """Calculate weighted stress score from emotion probabilities"""
        if not emotions:
            return 0.0
        
        total_score = 0.0
        total_weight = 0.0
        
        for emotion, probability in emotions.items():
            weight = self.stress_weights.get(emotion, 0)
            total_score += weight * probability
            total_weight += probability
        
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def get_dominant_emotion(self, emotions):
        """Get the emotion with highest probability"""
        if not emotions:
            return 'neutral', 0.0
        
        dominant = max(emotions.items(), key=lambda x: x[1])
        return dominant[0], dominant[1]
    
    def get_stress_level(self, score):
        """Convert stress score to level category"""
        if score >= self.thresholds['high']:
            return 'high', '#ef4444', '😰', 'High stress detected. Let\'s take action to help you feel better.'
        elif score >= self.thresholds['moderate']:
            return 'moderate', '#f59e0b', '😕', 'Moderate stress detected. Some relaxation techniques might help.'
        elif score >= self.thresholds['low']:
            return 'low', '#10b981', '🙂', 'Low stress levels. You\'re doing well!'
        else:
            return 'minimal', '#22c55e', '😊', 'You appear calm and relaxed. Great job!'
    
    def add_to_history(self, emotions, stress_score):
        """Add reading to history for trend analysis"""
        import time
        
        dominant_emotion, confidence = self.get_dominant_emotion(emotions)
        
        self.emotion_history.append({
            'emotions': emotions,
            'stress_score': stress_score,
            'dominant_emotion': dominant_emotion,
            'confidence': confidence,
            'timestamp': time.time()
        })
        
        # Keep only recent history
        if len(self.emotion_history) > self.max_history:
            self.emotion_history.pop(0)
    
    def get_trend(self):
        """Analyze stress trend over recent readings"""
        if len(self.emotion_history) < 10:
            return {'trend': 'insufficient_data', 'change': 0, 'message': 'Gathering more data...'}
        
        mid = len(self.emotion_history) // 2
        first_half = self.emotion_history[:mid]
        second_half = self.emotion_history[mid:]
        
        first_avg = sum(r['stress_score'] for r in first_half) / len(first_half)
        second_avg = sum(r['stress_score'] for r in second_half) / len(second_half)
        
        change = second_avg - first_avg
        
        if change > 0.1:
            return {'trend': 'increasing', 'change': change, 'message': 'Stress is increasing'}
        elif change < -0.1:
            return {'trend': 'decreasing', 'change': change, 'message': 'Stress is decreasing - exercises are working!'}
        else:
            return {'trend': 'stable', 'change': change, 'message': 'Stress levels are stable'}
    
    def analyze_frame(self, base64_image):
        """
        Main analysis method - process a webcam frame and return full analysis.
        """
        # Decode image
        image = self.decode_base64_image(base64_image)
        if image is None:
            return {'error': 'Failed to decode image'}
        
        # Detect emotions
        emotions = self.detect_emotion(image)
        if emotions is None:
            return {'error': 'Failed to detect emotions'}
        
        # Calculate stress
        stress_score = self.calculate_stress_score(emotions)
        dominant_emotion, confidence = self.get_dominant_emotion(emotions)
        level, color, emoji, message = self.get_stress_level(stress_score)
        
        # Add to history
        self.add_to_history(emotions, stress_score)
        
        # Get trend
        trend = self.get_trend()
        
        return {
            'success': True,
            'emotions': emotions,
            'dominant_emotion': dominant_emotion,
            'dominant_emoji': self.emotion_emoji.get(dominant_emotion, '😐'),
            'confidence': confidence,
            'stress': {
                'score': stress_score,
                'level': level,
                'color': color,
                'emoji': emoji,
                'message': message
            },
            'trend': trend,
            'reading_count': len(self.emotion_history)
        }
    
    def reset(self):
        """Reset emotion history"""
        self.emotion_history = []
    
    def get_music_recommendations(self, stress_level):
        """Get music recommendations based on stress level"""
        recommendations = {
            'high': [
                {'title': 'Deep Calm - Meditation Music', 'type': 'meditation', 'duration': '10 min'},
                {'title': 'Nature Sounds - Rain Forest', 'type': 'nature', 'duration': '15 min'},
                {'title': 'Binaural Beats - Stress Relief', 'type': 'binaural', 'duration': '20 min'}
            ],
            'moderate': [
                {'title': 'Lo-Fi Chill Beats', 'type': 'lofi', 'duration': '30 min'},
                {'title': 'Acoustic Relaxation', 'type': 'acoustic', 'duration': '15 min'},
                {'title': 'Piano for Focus', 'type': 'piano', 'duration': '20 min'}
            ],
            'low': [
                {'title': 'Uplifting Instrumental', 'type': 'uplifting', 'duration': '20 min'},
                {'title': 'Focus Flow Music', 'type': 'focus', 'duration': '30 min'},
                {'title': 'Ambient Work Music', 'type': 'ambient', 'duration': '45 min'}
            ],
            'minimal': [
                {'title': 'Feel Good Playlist', 'type': 'feel_good', 'duration': '30 min'},
                {'title': 'Energy Boost Mix', 'type': 'energy', 'duration': '20 min'},
                {'title': 'Happy Vibes', 'type': 'happy', 'duration': '25 min'}
            ]
        }
        return recommendations.get(stress_level, recommendations['moderate'])


# Global instance for session persistence
_detector_instance = None


def get_detector():
    """Get or create the stress detector instance"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = TransformerStressDetector()
    return _detector_instance
