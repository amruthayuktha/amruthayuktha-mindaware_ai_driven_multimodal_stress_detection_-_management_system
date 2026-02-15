/**
 * Transformer-Based Emotion Detector Module
 * Uses backend ViT (Vision Transformer) model for facial expression recognition
 * Continuous monitoring with automatic frame capture and analysis
 */

class TransformerEmotionDetector {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.currentEmotion = null;
        this.emotionHistory = [];
        this.detectionInterval = null;
        this.onEmotionDetected = null;
        this.apiEndpoint = '/api/stress-detect';
        
        // Detection settings
        this.detectionIntervalMs = 500; // Analyze every 500ms
        this.autoStart = true;

        // Emotion to stress mapping
        this.emotionMapping = {
            'angry': { stress: 'anger', emoji: '😠', color: '#ef4444' },
            'disgust': { stress: 'overwhelmed', emoji: '😖', color: '#f59e0b' },
            'fear': { stress: 'anxiety', emoji: '😨', color: '#8b5cf6' },
            'happy': { stress: 'neutral', emoji: '😊', color: '#10b981' },
            'neutral': { stress: 'neutral', emoji: '😐', color: '#6b7280' },
            'sad': { stress: 'sadness', emoji: '😢', color: '#3b82f6' },
            'surprise': { stress: 'overwhelmed', emoji: '😲', color: '#ec4899' }
        };
    }

    async init() {
        // No local models to load - using backend transformer model
        console.log('Transformer Emotion Detector initialized (backend mode)');
        return true;
    }

    async startCamera(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            this.video.srcObject = stream;
            await this.video.play();

            // Set canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            this.isRunning = true;
            this.startDetection();

            console.log('Camera started - continuous monitoring active');
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            return false;
        }
    }

    stopCamera() {
        this.isRunning = false;

        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    startDetection() {
        if (!this.isRunning) return;

        this.detectionInterval = setInterval(async () => {
            await this.detectEmotion();
        }, this.detectionIntervalMs);
    }

    captureFrame() {
        // Draw video frame to canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Convert to base64
        return this.canvas.toDataURL('image/jpeg', 0.8);
    }

    async detectEmotion() {
        if (!this.video || !this.isRunning) return;

        try {
            // Capture current frame
            const frameData = this.captureFrame();

            // Send to backend for transformer-based analysis
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: frameData })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Draw face indicator
                this.drawEmotionIndicator(result);

                // Update current emotion
                const dominantEmotion = result.dominant_emotion;
                if (dominantEmotion !== this.currentEmotion) {
                    this.updateEmotion(result);
                }

                // Store in history
                this.emotionHistory.push({
                    emotion: dominantEmotion,
                    expressions: result.emotions,
                    timestamp: Date.now()
                });

                // Keep only last 10 detections
                if (this.emotionHistory.length > 10) {
                    this.emotionHistory.shift();
                }
            }
        } catch (error) {
            console.error('Detection error:', error);
        }
    }

    drawEmotionIndicator(result) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw emotion overlay in corner
        const mapping = this.emotionMapping[result.dominant_emotion] || this.emotionMapping.neutral;
        
        // Draw emotion badge
        const padding = 10;
        const badgeHeight = 40;
        const badgeWidth = 180;
        
        this.ctx.fillStyle = mapping.color;
        this.ctx.fillRect(padding, padding, badgeWidth, badgeHeight);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `${result.dominant_emoji} ${result.dominant_emotion.toUpperCase()}`,
            padding + badgeWidth / 2,
            padding + badgeHeight / 2 + 5
        );

        // Draw confidence bar
        const confWidth = (result.confidence * badgeWidth);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(padding, padding + badgeHeight, badgeWidth, 4);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(padding, padding + badgeHeight, confWidth, 4);
    }

    updateEmotion(result) {
        this.currentEmotion = result.dominant_emotion;

        // Callback to parent with full analysis
        if (this.onEmotionDetected) {
            const mapping = this.emotionMapping[result.dominant_emotion];
            this.onEmotionDetected({
                emotion: result.dominant_emotion,
                stressType: mapping?.stress || 'neutral',
                emoji: result.dominant_emoji,
                confidence: result.confidence,
                allExpressions: result.emotions,
                stressAnalysis: result.stress,
                trend: result.trend,
                musicRecommendations: result.music_recommendations
            });
        }
    }

    getAverageEmotion() {
        if (this.emotionHistory.length === 0) return null;

        // Count occurrences
        const counts = {};
        this.emotionHistory.forEach(entry => {
            counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
        });

        // Find most common
        let maxEmotion = 'neutral';
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                maxEmotion = emotion;
            }
        }

        return maxEmotion;
    }

    getCurrentStressType() {
        if (!this.currentEmotion) return null;
        return this.emotionMapping[this.currentEmotion]?.stress || 'neutral';
    }

    async reset() {
        // Reset backend history
        try {
            await fetch('/api/stress-detect/reset', { method: 'POST' });
        } catch (e) {
            console.error('Failed to reset backend:', e);
        }
        
        this.emotionHistory = [];
        this.currentEmotion = null;
    }
}

// Export for use - maintain compatibility with original EmotionDetector
window.EmotionDetector = TransformerEmotionDetector;
window.TransformerEmotionDetector = TransformerEmotionDetector;
