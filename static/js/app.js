/**
 * Serenity - Stress Relief Application
 * Main Application JavaScript with Facial Expression Recognition
 */

// Initialize Socket.io connection
const socket = io({
    transports: ['websocket', 'polling']
});

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const emotionBtns = document.querySelectorAll('.emotion-btn');
const navTabs = document.querySelectorAll('.nav-tab');
const sections = document.querySelectorAll('.section');
const themeToggle = document.getElementById('themeToggle');
const videoModal = document.getElementById('videoModal');
const closeVideoModal = document.getElementById('closeVideoModal');
const videoContainer = document.getElementById('videoContainer');
const playGameMusic = document.getElementById('playGameMusic');

// Emotion Detection Elements
const startCameraBtn = document.getElementById('startCameraBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const emotionVideo = document.getElementById('emotionVideo');
const emotionCanvas = document.getElementById('emotionCanvas');
const cameraOverlay = document.getElementById('cameraOverlay');
const cameraStatus = document.getElementById('cameraStatus');
const modelLoading = document.getElementById('modelLoading');
const detectedEmoji = document.getElementById('detectedEmoji');
const emotionName = document.getElementById('emotionName');
const emotionConfidence = document.getElementById('emotionConfidence');
const getEmotionRecsBtn = document.getElementById('getEmotionRecsBtn');
const emotionRecommendations = document.getElementById('emotionRecommendations');
const detectedEmotionBadge = document.getElementById('detectedEmotionBadge');
const quickScanBtn = document.getElementById('quickScanBtn');

// State
let selectedEmotion = null;
let isConnected = false;
let emotionDetector = null;
let detectedEmotionFromCamera = null;

// =====================================================
// SOCKET.IO EVENT HANDLERS
// =====================================================

socket.on('connect', () => {
    console.log('Connected to server');
    isConnected = true;
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
});

socket.on('connected', (data) => {
    console.log('Server message:', data.message);
});

socket.on('typing', (data) => {
    if (data.status) {
        typingIndicator.classList.add('visible');
        scrollToBottom();
    } else {
        typingIndicator.classList.remove('visible');
    }
});

socket.on('bot_message', (data) => {
    addBotMessage(data.message, data.recommendations);
    scrollToBottom();
});

socket.on('emotion_set', (data) => {
    console.log('Emotion set to:', data.emotion);
});

// =====================================================
// FACIAL EXPRESSION RECOGNITION
// =====================================================

async function initEmotionDetector() {
    if (!window.EmotionDetector) {
        console.error('EmotionDetector not loaded');
        return false;
    }

    emotionDetector = new EmotionDetector();

    // Set callback for emotion detection
    emotionDetector.onEmotionDetected = handleEmotionDetected;

    return true;
}

async function startCamera() {
    if (!emotionDetector) {
        await initEmotionDetector();
    }

    // Show loading
    modelLoading.classList.add('visible');
    cameraStatus.classList.add('loading');
    cameraStatus.querySelector('.status-text').textContent = 'Loading...';

    try {
        // Initialize models
        const modelsLoaded = await emotionDetector.init();
        if (!modelsLoaded) {
            throw new Error('Failed to load AI models');
        }

        modelLoading.classList.remove('visible');

        // Start camera
        const cameraStarted = await emotionDetector.startCamera(emotionVideo, emotionCanvas);
        if (!cameraStarted) {
            throw new Error('Failed to access camera');
        }

        // Update UI
        cameraOverlay.classList.add('hidden');
        cameraStatus.classList.remove('loading');
        cameraStatus.classList.add('active');
        cameraStatus.querySelector('.status-text').textContent = 'Detecting...';

        startCameraBtn.disabled = true;
        stopCameraBtn.disabled = false;

    } catch (error) {
        console.error('Camera error:', error);
        modelLoading.classList.remove('visible');
        cameraStatus.classList.remove('loading');
        cameraStatus.querySelector('.status-text').textContent = 'Error';
        alert('Could not access camera. Please ensure camera permissions are granted.');
    }
}

function stopCamera() {
    if (emotionDetector) {
        emotionDetector.stopCamera();
    }

    cameraOverlay.classList.remove('hidden');
    cameraStatus.classList.remove('active');
    cameraStatus.querySelector('.status-text').textContent = 'Stopped';

    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
}

function handleEmotionDetected(data) {
    // Update display
    detectedEmoji.textContent = data.emoji;
    emotionName.textContent = data.emotion;
    emotionConfidence.textContent = `Confidence: ${Math.round(data.confidence * 100)}%`;

    // Update expression bars
    updateExpressionBars(data.allExpressions);

    // Store detected emotion
    detectedEmotionFromCamera = data;

    // Update badge in chat section
    if (detectedEmotionBadge) {
        detectedEmotionBadge.textContent = `${data.emoji} ${data.emotion} detected`;
    }

    // Auto-select the corresponding emotion button
    selectEmotionFromCamera(data.stressType);
}

function updateExpressionBars(expressions) {
    const emotions = ['happy', 'sad', 'angry', 'fearful', 'surprised', 'neutral'];

    emotions.forEach(emotion => {
        const bar = document.getElementById(`bar-${emotion}`);
        const val = document.getElementById(`val-${emotion}`);

        if (bar && val && expressions[emotion] !== undefined) {
            const percentage = Math.round(expressions[emotion] * 100);
            bar.style.width = `${percentage}%`;
            val.textContent = `${percentage}%`;
        }
    });
}

function selectEmotionFromCamera(stressType) {
    // Map camera emotion to our emotion buttons
    const emotionMap = {
        'anxiety': 'anxious',
        'sadness': 'sad',
        'anger': 'angry',
        'overwhelmed': 'overwhelmed',
        'neutral': 'neutral'
    };

    const mappedEmotion = emotionMap[stressType] || stressType;

    // Find and select the button
    emotionBtns.forEach(btn => {
        if (btn.dataset.emotion === mappedEmotion) {
            btn.classList.add('selected');
            selectedEmotion = mappedEmotion;
            socket.emit('set_emotion', { emotion: selectedEmotion });
        } else {
            btn.classList.remove('selected');
        }
    });
}

async function getEmotionBasedRecommendations() {
    if (!detectedEmotionFromCamera) {
        alert('Please start the camera and let it detect your emotion first.');
        return;
    }

    const stressType = detectedEmotionFromCamera.stressType;

    // Show loading
    getEmotionRecsBtn.disabled = true;
    getEmotionRecsBtn.innerHTML = '<span>⏳</span> Loading...';

    try {
        // Fetch recommendations based on detected emotion
        const [videosRes, musicRes, articlesRes] = await Promise.all([
            fetch(`/api/scrape/videos?q=${stressType} relief techniques`),
            fetch(`/api/scrape/music?q=${stressType} calming music`),
            fetch(`/api/scrape/articles?q=${stressType} stress management`)
        ]);

        const videos = await videosRes.json();
        const music = await musicRes.json();
        const articles = await articlesRes.json();

        // Render recommendations
        renderEmotionRecommendations(videos.videos, music.music, articles.articles);

        // Show recommendations section
        emotionRecommendations.classList.add('visible');

    } catch (error) {
        console.error('Error fetching recommendations:', error);
        alert('Error fetching recommendations. Please try again.');
    }

    // Reset button
    getEmotionRecsBtn.disabled = false;
    getEmotionRecsBtn.innerHTML = '<span>🎯</span> Get Personalized Recommendations';
}

function renderEmotionRecommendations(videos, music, articles) {
    // Render videos
    const videoContainer = document.getElementById('emotionVideoCards');
    if (videoContainer && videos) {
        videoContainer.innerHTML = videos.map(video => `
            <div class="video-card" data-embed-url="${video.embed_url}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy">
                    <div class="video-play-overlay">
                        <div class="play-icon">▶</div>
                    </div>
                    <span class="video-duration">${video.duration}</span>
                </div>
                <div class="video-info">
                    <div class="video-title">${escapeHtml(video.title)}</div>
                    <div class="video-meta">${video.views || 'YouTube'}</div>
                </div>
            </div>
        `).join('');

        videoContainer.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => openVideoModal(card.dataset.embedUrl));
        });
    }

    // Render music
    const musicContainer = document.getElementById('emotionMusicCards');
    if (musicContainer && music) {
        musicContainer.innerHTML = music.map(track => `
            <div class="music-card">
                <img src="${track.thumbnail}" alt="${escapeHtml(track.title)}" class="music-thumbnail" loading="lazy">
                <div class="music-info">
                    <div class="music-title">${escapeHtml(track.title)}</div>
                    <div class="music-artist">${escapeHtml(track.artist || 'Various Artists')}</div>
                </div>
                <button class="music-play-btn" data-embed-url="${track.embed_url}">▶</button>
            </div>
        `).join('');

        musicContainer.querySelectorAll('.music-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openVideoModal(btn.dataset.embedUrl);
            });
        });
    }

    // Render articles
    const articleContainer = document.getElementById('emotionArticleCards');
    if (articleContainer && articles) {
        articleContainer.innerHTML = articles.map(article => `
            <div class="article-card">
                <div class="article-title">${escapeHtml(article.title)}</div>
                <div class="article-snippet">${escapeHtml(article.snippet)}</div>
                <a href="${article.url}" target="_blank" rel="noopener" class="article-link">
                    Read more →
                </a>
            </div>
        `).join('');
    }
}

// Event Listeners for Emotion Detection
if (startCameraBtn) {
    startCameraBtn.addEventListener('click', startCamera);
}

if (stopCameraBtn) {
    stopCameraBtn.addEventListener('click', stopCamera);
}

if (getEmotionRecsBtn) {
    getEmotionRecsBtn.addEventListener('click', getEmotionBasedRecommendations);
}

// Quick scan button in chat section
if (quickScanBtn) {
    quickScanBtn.addEventListener('click', () => {
        // Navigate to emotion section
        navTabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        document.querySelector('[data-tab="emotion"]').classList.add('active');
        document.getElementById('emotion-section').classList.add('active');

        // Auto-start camera
        setTimeout(() => startCamera(), 500);
    });
}

// =====================================================
// CHAT FUNCTIONALITY
// =====================================================

function sendMessage() {
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message to chat
    addUserMessage(message);

    // Clear input
    chatInput.value = '';

    // Send to server
    socket.emit('send_message', { message });

    scrollToBottom();
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
}

function addBotMessage(text, recommendations = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';

    let recommendationsHtml = '';

    if (recommendations) {
        recommendationsHtml = createRecommendationsHtml(recommendations);
    }

    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
            ${recommendationsHtml}
        </div>
    `;

    chatMessages.appendChild(messageDiv);

    // Add click handlers for video cards
    messageDiv.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => openVideoModal(card.dataset.embedUrl));
    });

    // Add click handlers for music cards
    messageDiv.querySelectorAll('.music-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openVideoModal(btn.dataset.embedUrl);
        });
    });
}

function createRecommendationsHtml(recommendations) {
    let html = '<div class="recommendations-container">';

    // Videos
    if (recommendations.videos && recommendations.videos.length > 0) {
        html += `
            <div class="recommendations-title">🎬 Recommended Videos</div>
            <div class="recommendations-grid">
                ${recommendations.videos.map(video => `
                    <div class="video-card" data-embed-url="${video.embed_url}">
                        <div class="video-thumbnail">
                            <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy">
                            <div class="video-play-overlay">
                                <div class="play-icon">▶</div>
                            </div>
                            <span class="video-duration">${video.duration}</span>
                        </div>
                        <div class="video-info">
                            <div class="video-title">${escapeHtml(video.title)}</div>
                            <div class="video-meta">${video.views || 'YouTube'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Music
    if (recommendations.music && recommendations.music.length > 0) {
        html += `
            <div class="recommendations-title" style="margin-top: var(--space-md);">🎵 Calming Music</div>
            <div class="recommendations-grid">
                ${recommendations.music.map(track => `
                    <div class="music-card">
                        <img src="${track.thumbnail}" alt="${escapeHtml(track.title)}" class="music-thumbnail" loading="lazy">
                        <div class="music-info">
                            <div class="music-title">${escapeHtml(track.title)}</div>
                            <div class="music-artist">${escapeHtml(track.artist || 'Various Artists')}</div>
                        </div>
                        <button class="music-play-btn" data-embed-url="${track.embed_url}">▶</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Articles
    if (recommendations.articles && recommendations.articles.length > 0) {
        html += `
            <div class="recommendations-title" style="margin-top: var(--space-md);">📖 Helpful Articles</div>
            <div class="recommendations-grid">
                ${recommendations.articles.map(article => `
                    <div class="article-card">
                        <div class="article-title">${escapeHtml(article.title)}</div>
                        <div class="article-snippet">${escapeHtml(article.snippet)}</div>
                        <a href="${article.url}" target="_blank" rel="noopener" class="article-link">
                            Read more →
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =====================================================
// EMOTION SELECTION
// =====================================================

emotionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove selected from all
        emotionBtns.forEach(b => b.classList.remove('selected'));

        // Add selected to clicked
        btn.classList.add('selected');

        // Update state
        selectedEmotion = btn.dataset.emotion;

        // Send to server
        socket.emit('set_emotion', { emotion: selectedEmotion });

        // Optional: Add a quick message
        addBotMessage(`I see you're feeling ${selectedEmotion}. Tell me more about what's going on. I'm here to help! 💚`);
    });
});

// =====================================================
// NAVIGATION
// =====================================================

navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetSection = tab.dataset.tab;

        // Update active tab
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show target section
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${targetSection}-section`) {
                section.classList.add('active');
            }
        });
    });
});

// =====================================================
// THEME TOGGLE
// =====================================================

function initTheme() {
    const savedTheme = localStorage.getItem('serenity-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('serenity-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', toggleTheme);

// =====================================================
// VIDEO MODAL
// =====================================================

function openVideoModal(embedUrl) {
    videoContainer.innerHTML = `
        <iframe 
            src="${embedUrl}?autoplay=1" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    videoModal.classList.add('visible');
}

function closeModal() {
    videoModal.classList.remove('visible');
    videoContainer.innerHTML = '';
}

closeVideoModal.addEventListener('click', closeModal);
videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) {
        closeModal();
    }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// =====================================================
// RESOURCES SECTION
// =====================================================

async function loadResources() {
    try {
        // Load quick relief videos
        const videosResponse = await fetch('/api/scrape/videos?q=quick stress relief');
        const videosData = await videosResponse.json();
        renderResourceCards('quickReliefCards', videosData.videos, 'video');

        // Load calming music
        const musicResponse = await fetch('/api/scrape/music?q=calming relaxation');
        const musicData = await musicResponse.json();
        renderResourceCards('calmingMusicCards', musicData.music, 'music');

        // Load articles
        const articlesResponse = await fetch('/api/scrape/articles?q=stress management tips');
        const articlesData = await articlesResponse.json();
        renderResourceCards('helpfulArticleCards', articlesData.articles, 'article');

    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

function renderResourceCards(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container || !items) return;

    container.innerHTML = items.map(item => {
        if (type === 'video') {
            return `
                <div class="video-card" data-embed-url="${item.embed_url}">
                    <div class="video-thumbnail">
                        <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}" loading="lazy">
                        <div class="video-play-overlay">
                            <div class="play-icon">▶</div>
                        </div>
                        <span class="video-duration">${item.duration}</span>
                    </div>
                    <div class="video-info">
                        <div class="video-title">${escapeHtml(item.title)}</div>
                        <div class="video-meta">${item.views || 'YouTube'}</div>
                    </div>
                </div>
            `;
        } else if (type === 'music') {
            return `
                <div class="music-card">
                    <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}" class="music-thumbnail" loading="lazy">
                    <div class="music-info">
                        <div class="music-title">${escapeHtml(item.title)}</div>
                        <div class="music-artist">${escapeHtml(item.artist || 'Various Artists')}</div>
                    </div>
                    <button class="music-play-btn" data-embed-url="${item.embed_url}">▶</button>
                </div>
            `;
        } else if (type === 'article') {
            return `
                <div class="article-card">
                    <div class="article-title">${escapeHtml(item.title)}</div>
                    <div class="article-snippet">${escapeHtml(item.snippet)}</div>
                    <a href="${item.url}" target="_blank" rel="noopener" class="article-link">
                        Read more →
                    </a>
                </div>
            `;
        }
    }).join('');

    // Add click handlers
    container.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => openVideoModal(card.dataset.embedUrl));
    });

    container.querySelectorAll('.music-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openVideoModal(btn.dataset.embedUrl);
        });
    });
}

// =====================================================
// GAME MUSIC SUGGESTION
// =====================================================

playGameMusic.addEventListener('click', () => {
    // Open a focus music video
    openVideoModal('https://www.youtube.com/embed/5qap5aO4i9A');
});

// =====================================================
// EVENT LISTENERS
// =====================================================

// Send message on button click
sendBtn.addEventListener('click', sendMessage);

// Send message on Enter key
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadResources();
    initEmotionDetector();

    // Focus chat input
    chatInput.focus();
});
