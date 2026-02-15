/**
 * Stress Analysis Module
 * Analyzes facial emotions to predict stress levels and provide recommendations
 */

class StressAnalyzer {
    constructor() {
        this.emotionHistory = [];
        this.maxHistorySize = 30; // 30 readings = ~15 seconds at 500ms intervals
        this.stressThresholds = {
            low: 0.3,
            moderate: 0.5,
            high: 0.7
        };

        // Stress weights for different emotions
        this.stressWeights = {
            angry: 0.9,
            disgusted: 0.7,
            fearful: 0.85,
            sad: 0.75,
            surprised: 0.4,
            neutral: 0.2,
            happy: 0.0
        };

        // Recommendations database
        this.recommendations = {
            immediate: {
                high: [
                    { type: 'breathing', text: 'Try 4-7-8 Breathing', icon: '🌬️', link: '/breathe?pattern=478', duration: '1 min' },
                    { type: 'grounding', text: '5-4-3-2-1 Grounding', icon: '🌍', action: 'showGrounding', duration: '2 min' },
                    { type: 'movement', text: 'Shake it Out', icon: '💃', action: 'showMovement', duration: '30 sec' }
                ],
                moderate: [
                    { type: 'breathing', text: 'Box Breathing', icon: '📦', link: '/breathe?pattern=box', duration: '2 min' },
                    { type: 'music', text: 'Quick Calm Playlist', icon: '🎵', link: '/music?playlist=calm', duration: '5 min' },
                    { type: 'game', text: 'Bubble Pop', icon: '🫧', link: '/games', duration: '3 min' }
                ],
                low: [
                    { type: 'journal', text: 'Quick Journal', icon: '📔', link: '/journal', duration: '5 min' },
                    { type: 'mood', text: 'Log Your Mood', icon: '📊', link: '/mood', duration: '1 min' },
                    { type: 'music', text: 'Focus Music', icon: '🎯', link: '/music?playlist=focus', duration: '15 min' }
                ]
            },
            longTerm: {
                anxious: [
                    'Regular breathing exercises can reduce anxiety by 30%',
                    'Consider a daily 5-minute meditation routine',
                    'Limit caffeine intake in the afternoon'
                ],
                stressed: [
                    'Physical exercise releases natural stress relievers',
                    'Break large tasks into smaller, manageable chunks',
                    'Set boundaries and learn to say no'
                ],
                sad: [
                    'Connect with friends or family today',
                    'Sunlight exposure can boost your mood',
                    'Write 3 things you\'re grateful for'
                ],
                overwhelmed: [
                    'Focus on one thing at a time',
                    'Take regular breaks using the Pomodoro technique',
                    'Delegate tasks when possible'
                ]
            }
        };
    }

    /**
     * Add an emotion reading to the history
     */
    addReading(emotionData) {
        this.emotionHistory.push({
            ...emotionData,
            timestamp: Date.now(),
            stressScore: this.calculateStressScore(emotionData.allExpressions)
        });

        // Keep only recent history
        if (this.emotionHistory.length > this.maxHistorySize) {
            this.emotionHistory.shift();
        }
    }

    /**
     * Calculate stress score from expression probabilities
     */
    calculateStressScore(expressions) {
        if (!expressions) return 0;

        let totalScore = 0;
        let totalWeight = 0;

        for (const [emotion, probability] of Object.entries(expressions)) {
            const weight = this.stressWeights[emotion] || 0;
            totalScore += weight * probability;
            totalWeight += probability;
        }

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    /**
     * Get current stress level with analysis
     */
    analyzeStress() {
        if (this.emotionHistory.length < 3) {
            return {
                level: 'insufficient_data',
                score: 0,
                confidence: 0,
                message: 'Keep looking at the camera for analysis...'
            };
        }

        // Calculate average stress score from recent readings
        const recentReadings = this.emotionHistory.slice(-10);
        const avgStress = recentReadings.reduce((sum, r) => sum + r.stressScore, 0) / recentReadings.length;

        // Calculate confidence based on number of readings and consistency
        const confidence = Math.min(this.emotionHistory.length / this.maxHistorySize, 1);

        // Determine dominant emotions
        const emotionCounts = {};
        recentReadings.forEach(r => {
            emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
        });

        const dominantEmotion = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0];

        // Determine stress level
        let level, color, emoji, message;

        if (avgStress >= this.stressThresholds.high) {
            level = 'high';
            color = '#ef4444';
            emoji = '😰';
            message = 'High stress detected. Let\'s take action to help you feel better.';
        } else if (avgStress >= this.stressThresholds.moderate) {
            level = 'moderate';
            color = '#f59e0b';
            emoji = '😕';
            message = 'Moderate stress detected. Some relaxation techniques might help.';
        } else if (avgStress >= this.stressThresholds.low) {
            level = 'low';
            color = '#10b981';
            emoji = '🙂';
            message = 'Low stress levels. You\'re doing well!';
        } else {
            level = 'minimal';
            color = '#22c55e';
            emoji = '😊';
            message = 'You appear calm and relaxed. Great job!';
        }

        return {
            level,
            score: avgStress,
            confidence,
            color,
            emoji,
            message,
            dominantEmotion: dominantEmotion ? dominantEmotion[0] : 'neutral',
            emotionDistribution: emotionCounts,
            readingCount: this.emotionHistory.length
        };
    }

    /**
     * Get personalized recommendations based on stress analysis
     */
    getRecommendations(analysis) {
        if (analysis.level === 'insufficient_data') {
            return { immediate: [], longTerm: [], tips: [] };
        }

        const level = analysis.score >= this.stressThresholds.high ? 'high' :
            analysis.score >= this.stressThresholds.moderate ? 'moderate' : 'low';

        const immediate = this.recommendations.immediate[level] || [];

        // Get long-term recommendations based on dominant emotion
        const stressType = this.getStressType(analysis.dominantEmotion);
        const longTerm = this.recommendations.longTerm[stressType] || [];

        // Generate contextual tips
        const tips = this.generateTips(analysis);

        return {
            immediate,
            longTerm,
            tips,
            urgency: level
        };
    }

    /**
     * Map emotions to stress types
     */
    getStressType(emotion) {
        const mapping = {
            angry: 'stressed',
            fearful: 'anxious',
            disgusted: 'overwhelmed',
            sad: 'sad',
            surprised: 'overwhelmed',
            neutral: 'stressed',
            happy: 'stressed'
        };
        return mapping[emotion] || 'stressed';
    }

    /**
     * Generate contextual tips based on patterns
     */
    generateTips(analysis) {
        const tips = [];
        const hour = new Date().getHours();

        // Time-based tips
        if (hour >= 22 || hour < 6) {
            tips.push('It\'s late - quality sleep is crucial for managing stress.');
        } else if (hour >= 14 && hour <= 16) {
            tips.push('Afternoon slump? A short walk can boost your energy.');
        }

        // Pattern-based tips
        if (analysis.emotionDistribution.fearful > 3) {
            tips.push('Anxiety patterns detected. Consider speaking with someone you trust.');
        }

        if (analysis.score > 0.6 && this.emotionHistory.length >= this.maxHistorySize) {
            tips.push('Sustained stress detected. Regular breaks are important.');
        }

        return tips;
    }

    /**
     * Get stress trend over time
     */
    getStressTrend() {
        if (this.emotionHistory.length < 10) {
            return { trend: 'insufficient_data', change: 0 };
        }

        const firstHalf = this.emotionHistory.slice(0, Math.floor(this.emotionHistory.length / 2));
        const secondHalf = this.emotionHistory.slice(Math.floor(this.emotionHistory.length / 2));

        const firstAvg = firstHalf.reduce((sum, r) => sum + r.stressScore, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, r) => sum + r.stressScore, 0) / secondHalf.length;

        const change = secondAvg - firstAvg;

        return {
            trend: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable',
            change: change,
            message: change > 0.1 ? 'Stress is increasing' :
                change < -0.1 ? 'Stress is decreasing - exercises are working!' :
                    'Stress levels are stable'
        };
    }

    /**
     * Reset the analyzer
     */
    reset() {
        this.emotionHistory = [];
    }

    /**
     * Export session data for tracking
     */
    exportSession() {
        return {
            readings: this.emotionHistory.length,
            duration: this.emotionHistory.length > 0 ?
                Date.now() - this.emotionHistory[0].timestamp : 0,
            averageStress: this.analyzeStress().score,
            trend: this.getStressTrend()
        };
    }
}

// Export for use
window.StressAnalyzer = StressAnalyzer;
