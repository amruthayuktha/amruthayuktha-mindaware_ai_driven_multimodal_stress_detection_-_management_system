/**
 * Mini Games Module
 * Color Flow and Zen Stars calming mini-games
 */

// Color Flow - Mesmerizing color animation
class ColorFlow {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.isPaused = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.startAnimation();
    }

    bindEvents() {
        const toggleBtn = document.getElementById('toggleColorFlow');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }

    startAnimation() {
        const blobs = this.container.querySelectorAll('.color-blob');
        blobs.forEach((blob, index) => {
            blob.style.animation = `colorFlow ${10 + index * 2}s ease-in-out infinite`;
            blob.style.animationDelay = `${index * -3}s`;
        });
    }

    toggle() {
        this.isPaused = !this.isPaused;

        const blobs = this.container.querySelectorAll('.color-blob');
        blobs.forEach(blob => {
            blob.style.animationPlayState = this.isPaused ? 'paused' : 'running';
        });

        const btn = document.getElementById('toggleColorFlow');
        if (btn) {
            btn.textContent = this.isPaused ? '▶ Play' : '⏸ Pause';
        }
    }
}

// Zen Stars - Click to create calming stars
class ZenStars {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.stars = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.addInitialStars();
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => this.addStar(e));

        const clearBtn = document.getElementById('clearStarsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearStars());
        }
    }

    addInitialStars() {
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 80 + 10;
            const y = Math.random() * 80 + 10;
            this.createStar(x, y);
        }
    }

    addStar(e) {
        const rect = this.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        this.createStar(x, y);
        this.playStarSound();
    }

    createStar(x, y) {
        const star = document.createElement('div');
        star.className = 'zen-star';
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;

        // Random size
        const size = 10 + Math.random() * 20;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        // Random color
        const hue = Math.random() * 60 + 200; // Blue to purple range
        star.style.background = `radial-gradient(circle, hsla(${hue}, 80%, 70%, 1) 0%, hsla(${hue}, 80%, 70%, 0) 70%)`;

        // Random animation
        const duration = 3 + Math.random() * 4;
        star.style.animation = `starTwinkle ${duration}s ease-in-out infinite`;
        star.style.animationDelay = `${Math.random() * 2}s`;

        this.container.appendChild(star);
        this.stars.push(star);

        // Limit stars
        if (this.stars.length > 50) {
            const oldStar = this.stars.shift();
            oldStar.remove();
        }
    }

    playStarSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Random high pitch for sparkle effect
            oscillator.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio not supported
        }
    }

    clearStars() {
        this.stars.forEach(star => star.remove());
        this.stars = [];
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ColorFlow('colorFlowContainer');
    new ZenStars('zenStarsContainer');
});

// Add CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes colorFlow {
        0%, 100% {
            transform: translate(0, 0) scale(1);
            filter: hue-rotate(0deg);
        }
        25% {
            transform: translate(30px, -30px) scale(1.2);
            filter: hue-rotate(45deg);
        }
        50% {
            transform: translate(-20px, 20px) scale(0.9);
            filter: hue-rotate(90deg);
        }
        75% {
            transform: translate(-30px, -10px) scale(1.1);
            filter: hue-rotate(135deg);
        }
    }
    
    @keyframes starTwinkle {
        0%, 100% {
            opacity: 0.3;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.2);
        }
    }
    
    .color-blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(40px);
        mix-blend-mode: screen;
    }
    
    .color-blob:nth-child(1) {
        width: 200px;
        height: 200px;
        background: rgba(147, 197, 253, 0.7);
        top: 20%;
        left: 20%;
    }
    
    .color-blob:nth-child(2) {
        width: 180px;
        height: 180px;
        background: rgba(196, 181, 253, 0.7);
        top: 40%;
        right: 20%;
    }
    
    .color-blob:nth-child(3) {
        width: 160px;
        height: 160px;
        background: rgba(167, 243, 208, 0.7);
        bottom: 20%;
        left: 40%;
    }
    
    .zen-star {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
    }
    
    .color-flow-container {
        position: relative;
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
        border-radius: 12px;
        overflow: hidden;
    }
    
    .zen-stars-container {
        position: relative;
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
        border-radius: 12px;
        overflow: hidden;
        cursor: crosshair;
    }
`;
document.head.appendChild(style);
