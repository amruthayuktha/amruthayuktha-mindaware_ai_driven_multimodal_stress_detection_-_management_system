/**
 * Bubble Pop Game
 * Simple relaxing bubble popping game for stress relief
 */

class BubblePop {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.bubbles = [];
        this.popCount = 0;
        this.animationId = null;

        // Calming colors
        this.colors = [
            { fill: 'rgba(147, 197, 253, 0.8)', stroke: 'rgba(59, 130, 246, 0.6)' },
            { fill: 'rgba(167, 243, 208, 0.8)', stroke: 'rgba(16, 185, 129, 0.6)' },
            { fill: 'rgba(253, 186, 116, 0.8)', stroke: 'rgba(245, 158, 11, 0.6)' },
            { fill: 'rgba(196, 181, 253, 0.8)', stroke: 'rgba(139, 92, 246, 0.6)' },
            { fill: 'rgba(252, 165, 165, 0.8)', stroke: 'rgba(239, 68, 68, 0.6)' },
            { fill: 'rgba(253, 224, 71, 0.8)', stroke: 'rgba(234, 179, 8, 0.6)' }
        ];

        this.init();
    }

    init() {
        this.createBubbles();
        this.bindEvents();
        this.animate();
    }

    createBubbles(count = 15) {
        this.bubbles = [];

        for (let i = 0; i < count; i++) {
            this.addBubble();
        }
    }

    addBubble() {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const radius = 20 + Math.random() * 30;

        this.bubbles.push({
            x: radius + Math.random() * (this.canvas.width - radius * 2),
            y: radius + Math.random() * (this.canvas.height - radius * 2),
            radius: radius,
            color: color,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02,
            popping: false,
            popProgress: 0
        });
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick(e.touches[0]);
        });

        const resetBtn = document.getElementById('resetPopBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if click is on any bubble
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            if (bubble.popping) continue;

            const distance = Math.sqrt(
                Math.pow(x - bubble.x, 2) + Math.pow(y - bubble.y, 2)
            );

            if (distance < bubble.radius) {
                this.popBubble(i);
                break;
            }
        }
    }

    popBubble(index) {
        const bubble = this.bubbles[index];
        bubble.popping = true;

        // Play pop sound
        this.playPopSound();

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }

        // Update count
        this.popCount++;
        const countEl = document.getElementById('popCount');
        if (countEl) countEl.textContent = this.popCount;

        // Add new bubble after a delay
        setTimeout(() => {
            this.addBubble();
        }, 500);
    }

    playPopSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported
        }
    }

    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update() {
        this.bubbles = this.bubbles.filter(bubble => {
            if (bubble.popping) {
                bubble.popProgress += 0.1;
                bubble.radius *= 1.1;
                return bubble.popProgress < 1;
            }

            // Move bubble
            bubble.x += bubble.vx;
            bubble.y += bubble.vy;

            // Wobble
            bubble.wobble += bubble.wobbleSpeed;

            // Bounce off walls
            if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > this.canvas.width) {
                bubble.vx *= -1;
            }
            if (bubble.y - bubble.radius < 0 || bubble.y + bubble.radius > this.canvas.height) {
                bubble.vy *= -1;
            }

            // Keep in bounds
            bubble.x = Math.max(bubble.radius, Math.min(this.canvas.width - bubble.radius, bubble.x));
            bubble.y = Math.max(bubble.radius, Math.min(this.canvas.height - bubble.radius, bubble.y));

            return true;
        });
    }

    draw() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#e0f2fe');
        gradient.addColorStop(1, '#f0fdf4');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw bubbles
        this.bubbles.forEach(bubble => this.drawBubble(bubble));
    }

    drawBubble(bubble) {
        const ctx = this.ctx;
        const wobbleOffset = Math.sin(bubble.wobble) * 2;

        ctx.save();

        if (bubble.popping) {
            ctx.globalAlpha = 1 - bubble.popProgress;
        }

        // Main bubble
        ctx.beginPath();
        ctx.arc(bubble.x + wobbleOffset, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = bubble.color.fill;
        ctx.fill();
        ctx.strokeStyle = bubble.color.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(
            bubble.x + wobbleOffset - bubble.radius * 0.3,
            bubble.y - bubble.radius * 0.3,
            bubble.radius * 0.2,
            0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
    }

    reset() {
        this.popCount = 0;
        const countEl = document.getElementById('popCount');
        if (countEl) countEl.textContent = '0';
        this.createBubbles();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BubblePop('bubblePopCanvas');
});
