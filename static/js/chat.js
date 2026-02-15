/**
 * Chat Module
 * Handles Socket.IO chat with emotion selection and recommendations
 */

// Initialize Socket.io connection
const socket = io({
    transports: ['websocket', 'polling']
});

class ChatManager {
    constructor() {
        this.selectedEmotion = null;
        this.isTyping = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.bindSocketEvents();
    }

    bindEvents() {
        // Emotion buttons
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectEmotion(e.target.closest('.emotion-btn')));
        });

        // Send message
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');

        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
            chatInput.focus();
        }

        // Face scan button
        const quickScanBtn = document.getElementById('quickScanBtn');
        if (quickScanBtn) {
            quickScanBtn.addEventListener('click', () => this.openFaceScan());
        }

        // Face scan modal
        const closeFaceScan = document.getElementById('closeFaceScan');
        if (closeFaceScan) {
            closeFaceScan.addEventListener('click', () => this.closeFaceScan());
        }

        // Video modal
        const closeVideoModal = document.getElementById('closeVideoModal');
        const videoModal = document.getElementById('videoModal');

        if (closeVideoModal) {
            closeVideoModal.addEventListener('click', () => this.closeVideoModal());
        }
        if (videoModal) {
            videoModal.addEventListener('click', (e) => {
                if (e.target === videoModal) this.closeVideoModal();
            });
        }

        // Use detected emotion
        const useEmotionBtn = document.getElementById('useEmotionBtn');
        if (useEmotionBtn) {
            useEmotionBtn.addEventListener('click', () => this.useDetectedEmotion());
        }
    }

    bindSocketEvents() {
        socket.on('connect', () => {
            console.log('Connected to chat server');
        });

        socket.on('connected', (data) => {
            console.log(data.message);
        });

        socket.on('typing', (data) => {
            this.isTyping = data.status;
            this.updateTypingIndicator();
        });

        socket.on('bot_message', (data) => {
            this.addBotMessage(data.message, data.recommendations);
            this.scrollToBottom();
        });

        socket.on('emotion_set', (data) => {
            console.log('Emotion set to:', data.emotion);
        });
    }

    selectEmotion(btn) {
        // Remove selection from all
        document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));

        // Select this one
        btn.classList.add('selected');
        this.selectedEmotion = btn.dataset.emotion;

        // Send to server
        socket.emit('set_emotion', { emotion: this.selectedEmotion });
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to chat
        this.addUserMessage(message);

        // Send to server
        socket.emit('send_message', { message: message });

        // Clear input
        input.value = '';

        this.scrollToBottom();
    }

    addUserMessage(text) {
        const messagesDiv = document.getElementById('chatMessages');

        const messageHtml = `
            <div class="message user-message">
                <div class="message-content">
                    <p>${this.escapeHtml(text)}</p>
                </div>
                <div class="message-avatar">👤</div>
            </div>
        `;

        messagesDiv.insertAdjacentHTML('beforeend', messageHtml);
    }

    addBotMessage(text, recommendations = null) {
        const messagesDiv = document.getElementById('chatMessages');

        let messageHtml = `
            <div class="message bot-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <p>${text}</p>
        `;

        if (recommendations) {
            messageHtml += this.createRecommendationsHtml(recommendations);
        }

        messageHtml += `
                </div>
            </div>
        `;

        messagesDiv.insertAdjacentHTML('beforeend', messageHtml);

        // Hide typing indicator
        this.isTyping = false;
        this.updateTypingIndicator();
    }

    createRecommendationsHtml(recommendations) {
        let html = '<div class="recommendations">';

        // Videos
        if (recommendations.videos && recommendations.videos.length > 0) {
            html += '<div class="rec-section"><h4>📹 Videos</h4><div class="rec-cards">';
            recommendations.videos.slice(0, 3).forEach(video => {
                html += `
                    <div class="rec-card video-card" data-url="${video.embed_url || video.url}">
                        <img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}" onerror="this.src='https://via.placeholder.com/120x68?text=Video'">
                        <div class="rec-info">
                            <span class="rec-title">${this.escapeHtml(video.title)}</span>
                            <span class="rec-channel">${this.escapeHtml(video.channel || '')}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div></div>';
        }

        // Music
        if (recommendations.music && recommendations.music.length > 0) {
            html += '<div class="rec-section"><h4>🎵 Music</h4><div class="rec-cards">';
            recommendations.music.slice(0, 3).forEach(track => {
                html += `
                    <a href="${track.url}" target="_blank" class="rec-card music-card">
                        <span class="music-icon">🎵</span>
                        <div class="rec-info">
                            <span class="rec-title">${this.escapeHtml(track.title)}</span>
                            <span class="rec-artist">${this.escapeHtml(track.artist || '')}</span>
                        </div>
                    </a>
                `;
            });
            html += '</div></div>';
        }

        // Articles
        if (recommendations.articles && recommendations.articles.length > 0) {
            html += '<div class="rec-section"><h4>📖 Articles</h4><div class="rec-cards">';
            recommendations.articles.slice(0, 2).forEach(article => {
                html += `
                    <a href="${article.url}" target="_blank" class="rec-card article-card">
                        <span class="article-icon">📄</span>
                        <div class="rec-info">
                            <span class="rec-title">${this.escapeHtml(article.title)}</span>
                            <span class="rec-source">${this.escapeHtml(article.source || '')}</span>
                        </div>
                    </a>
                `;
            });
            html += '</div></div>';
        }

        html += '</div>';

        // Add click handlers for video cards after a short delay
        setTimeout(() => {
            document.querySelectorAll('.video-card').forEach(card => {
                card.onclick = () => this.openVideoModal(card.dataset.url);
            });
        }, 100);

        return html;
    }

    updateTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = this.isTyping ? 'flex' : 'none';
        }
    }

    scrollToBottom() {
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openFaceScan() {
        const modal = document.getElementById('faceScanModal');
        if (modal) modal.style.display = 'flex';
    }

    closeFaceScan() {
        const modal = document.getElementById('faceScanModal');
        if (modal) modal.style.display = 'none';

        // Stop camera if running
        if (window.emotionDetector) {
            window.emotionDetector.stop();
        }
    }

    useDetectedEmotion() {
        const emotionName = document.getElementById('emotionName');
        if (emotionName) {
            const emotion = emotionName.textContent.toLowerCase();

            // Map face-api emotions to our emotion buttons
            const emotionMap = {
                'happy': 'neutral',
                'sad': 'sad',
                'angry': 'angry',
                'fearful': 'anxious',
                'surprised': 'overwhelmed',
                'disgusted': 'stressed',
                'neutral': 'neutral'
            };

            const mappedEmotion = emotionMap[emotion] || 'neutral';

            // Select the corresponding button
            const btn = document.querySelector(`.emotion-btn[data-emotion="${mappedEmotion}"]`);
            if (btn) {
                this.selectEmotion(btn);
            }

            // Update badge
            const badge = document.getElementById('detectedEmotionBadge');
            if (badge) {
                badge.textContent = `AI: ${emotion}`;
                badge.style.display = 'inline-block';
            }
        }

        this.closeFaceScan();
    }

    openVideoModal(embedUrl) {
        const modal = document.getElementById('videoModal');
        const container = document.getElementById('videoContainer');

        if (modal && container) {
            container.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
            modal.style.display = 'flex';
        }
    }

    closeVideoModal() {
        const modal = document.getElementById('videoModal');
        const container = document.getElementById('videoContainer');

        if (modal) modal.style.display = 'none';
        if (container) container.innerHTML = '';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatManager();
});
