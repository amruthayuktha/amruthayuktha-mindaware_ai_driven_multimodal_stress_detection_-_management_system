/**
 * Bubble Shooter - Relaxing Game
 * A calming bubble shooter game for stress relief
 */

class BubbleShooter {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('gameOverlay');
        this.startBtn = document.getElementById('startGameBtn');
        this.resetBtn = document.getElementById('resetGameBtn');
        this.scoreDisplay = document.getElementById('gameScore');

        // Game settings
        this.bubbleRadius = 20;
        this.rows = 8;
        this.cols = 10;
        this.colors = [
            '#14b8a6', // Teal
            '#a855f7', // Purple
            '#f43f5e', // Rose
            '#3b82f6', // Blue
            '#10b981', // Green
            '#f59e0b'  // Amber
        ];

        // Game state
        this.bubbles = [];
        this.shooter = null;
        this.nextBubble = null;
        this.score = 0;
        this.isPlaying = false;
        this.animationId = null;

        // Mouse/touch position
        this.aimAngle = -Math.PI / 2;

        this.init();
    }

    init() {
        // Set up event listeners
        this.startBtn.addEventListener('click', () => this.start());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Mouse movement for aiming
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Touch support
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Initial draw
        this.drawBackground();
    }

    start() {
        this.isPlaying = true;
        this.score = 0;
        this.updateScore();
        this.overlay.classList.add('hidden');

        // Initialize bubbles
        this.initBubbles();

        // Create shooter bubble
        this.createShooterBubble();
        this.createNextBubble();

        // Start game loop
        this.gameLoop();
    }

    reset() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.bubbles = [];
        this.shooter = null;
        this.nextBubble = null;
        this.score = 0;
        this.updateScore();
        this.overlay.classList.remove('hidden');
        this.drawBackground();
    }

    initBubbles() {
        this.bubbles = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // Offset every other row
                const offset = row % 2 === 0 ? 0 : this.bubbleRadius;
                const x = col * (this.bubbleRadius * 2) + this.bubbleRadius + offset;
                const y = row * (this.bubbleRadius * 1.7) + this.bubbleRadius;

                // Only add bubbles for top portion
                if (row < 5) {
                    this.bubbles.push({
                        x,
                        y,
                        color: this.getRandomColor(),
                        row,
                        col,
                        popping: false,
                        popProgress: 0
                    });
                }
            }
        }
    }

    createShooterBubble() {
        this.shooter = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 40,
            color: this.nextBubble ? this.nextBubble.color : this.getRandomColor(),
            vx: 0,
            vy: 0,
            moving: false
        };
    }

    createNextBubble() {
        this.nextBubble = {
            x: 50,
            y: this.canvas.height - 40,
            color: this.getRandomColor()
        };
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    handleMouseMove(e) {
        if (!this.isPlaying || this.shooter.moving) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.updateAim(x, y);
    }

    handleTouchMove(e) {
        if (!this.isPlaying || this.shooter.moving) return;
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.updateAim(x, y);
    }

    updateAim(x, y) {
        const dx = x - this.shooter.x;
        const dy = y - this.shooter.y;
        this.aimAngle = Math.atan2(dy, dx);

        // Limit angle to shooting upward only
        if (this.aimAngle > -0.1) this.aimAngle = -0.1;
        if (this.aimAngle < -Math.PI + 0.1) this.aimAngle = -Math.PI + 0.1;
    }

    handleClick(e) {
        if (!this.isPlaying || this.shooter.moving) return;
        this.shoot();
    }

    handleTouchEnd(e) {
        if (!this.isPlaying || this.shooter.moving) return;
        e.preventDefault();
        this.shoot();
    }

    shoot() {
        const speed = 12;
        this.shooter.vx = Math.cos(this.aimAngle) * speed;
        this.shooter.vy = Math.sin(this.aimAngle) * speed;
        this.shooter.moving = true;
    }

    gameLoop() {
        this.update();
        this.draw();

        if (this.isPlaying) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        if (!this.shooter.moving) return;

        // Move shooter bubble
        this.shooter.x += this.shooter.vx;
        this.shooter.y += this.shooter.vy;

        // Bounce off walls
        if (this.shooter.x < this.bubbleRadius || this.shooter.x > this.canvas.width - this.bubbleRadius) {
            this.shooter.vx *= -1;
            this.shooter.x = Math.max(this.bubbleRadius, Math.min(this.canvas.width - this.bubbleRadius, this.shooter.x));
        }

        // Check ceiling collision
        if (this.shooter.y < this.bubbleRadius) {
            this.snapBubble();
            return;
        }

        // Check bubble collision
        for (const bubble of this.bubbles) {
            if (bubble.popping) continue;

            const dx = this.shooter.x - bubble.x;
            const dy = this.shooter.y - bubble.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.bubbleRadius * 2) {
                this.snapBubble();
                return;
            }
        }

        // Update popping bubbles
        this.bubbles = this.bubbles.filter(bubble => {
            if (bubble.popping) {
                bubble.popProgress += 0.1;
                return bubble.popProgress < 1;
            }
            return true;
        });
    }

    snapBubble() {
        // Find nearest grid position
        const row = Math.round((this.shooter.y - this.bubbleRadius) / (this.bubbleRadius * 1.7));
        const offset = row % 2 === 0 ? 0 : this.bubbleRadius;
        const col = Math.round((this.shooter.x - this.bubbleRadius - offset) / (this.bubbleRadius * 2));

        const snapX = col * (this.bubbleRadius * 2) + this.bubbleRadius + offset;
        const snapY = row * (this.bubbleRadius * 1.7) + this.bubbleRadius;

        // Add bubble to grid
        const newBubble = {
            x: Math.max(this.bubbleRadius, Math.min(this.canvas.width - this.bubbleRadius, snapX)),
            y: Math.max(this.bubbleRadius, snapY),
            color: this.shooter.color,
            row,
            col,
            popping: false,
            popProgress: 0
        };

        this.bubbles.push(newBubble);

        // Check for matches
        const matches = this.findMatches(newBubble);
        if (matches.length >= 3) {
            this.popBubbles(matches);
            this.score += matches.length * 10;
            this.updateScore();

            // Check for floating bubbles
            setTimeout(() => {
                const floating = this.findFloatingBubbles();
                if (floating.length > 0) {
                    this.popBubbles(floating);
                    this.score += floating.length * 5;
                    this.updateScore();
                }
            }, 200);
        }

        // Create new shooter
        this.createShooterBubble();
        this.createNextBubble();

        // Check game over
        const lowestBubble = Math.max(...this.bubbles.filter(b => !b.popping).map(b => b.y));
        if (lowestBubble > this.canvas.height - 100) {
            this.gameOver();
        }
    }

    findMatches(startBubble) {
        const matches = [startBubble];
        const visited = new Set();
        const queue = [startBubble];

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${Math.round(current.x)},${Math.round(current.y)}`;

            if (visited.has(key)) continue;
            visited.add(key);

            // Find neighbors
            for (const bubble of this.bubbles) {
                if (bubble.popping) continue;
                if (bubble === current) continue;

                const dx = bubble.x - current.x;
                const dy = bubble.y - current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Check if neighbor and same color
                if (dist < this.bubbleRadius * 2.5 && bubble.color === startBubble.color) {
                    const bubbleKey = `${Math.round(bubble.x)},${Math.round(bubble.y)}`;
                    if (!visited.has(bubbleKey)) {
                        matches.push(bubble);
                        queue.push(bubble);
                    }
                }
            }
        }

        return matches;
    }

    findFloatingBubbles() {
        // Find all bubbles connected to top
        const connected = new Set();
        const queue = [];

        // Start with bubbles in top row
        for (const bubble of this.bubbles) {
            if (bubble.popping) continue;
            if (bubble.y < this.bubbleRadius * 2) {
                queue.push(bubble);
                connected.add(bubble);
            }
        }

        // Find all connected bubbles
        while (queue.length > 0) {
            const current = queue.shift();

            for (const bubble of this.bubbles) {
                if (bubble.popping) continue;
                if (connected.has(bubble)) continue;

                const dx = bubble.x - current.x;
                const dy = bubble.y - current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.bubbleRadius * 2.5) {
                    connected.add(bubble);
                    queue.push(bubble);
                }
            }
        }

        // Return bubbles not connected
        return this.bubbles.filter(b => !b.popping && !connected.has(b));
    }

    popBubbles(bubbles) {
        for (const bubble of bubbles) {
            bubble.popping = true;
            bubble.popProgress = 0;
        }
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
    }

    gameOver() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Show overlay with final score
        this.startBtn.innerHTML = '<span>▶</span> Play Again';
        this.overlay.classList.remove('hidden');
    }

    drawBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Add subtle stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    draw() {
        // Clear and draw background
        this.drawBackground();

        // Draw bubbles
        for (const bubble of this.bubbles) {
            this.drawBubble(bubble);
        }

        // Draw aim line
        if (!this.shooter.moving) {
            this.drawAimLine();
        }

        // Draw shooter bubble
        if (this.shooter) {
            this.drawBubble(this.shooter);
        }

        // Draw next bubble
        if (this.nextBubble) {
            this.ctx.globalAlpha = 0.6;
            this.drawBubble(this.nextBubble);
            this.ctx.globalAlpha = 1;

            // "Next" label
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Next', this.nextBubble.x, this.nextBubble.y + 35);
        }
    }

    drawBubble(bubble) {
        const radius = bubble.popping
            ? this.bubbleRadius * (1 + bubble.popProgress * 0.5)
            : this.bubbleRadius;
        const alpha = bubble.popping ? 1 - bubble.popProgress : 1;

        this.ctx.globalAlpha = alpha;

        // Main bubble
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);

        // Gradient fill
        const gradient = this.ctx.createRadialGradient(
            bubble.x - radius * 0.3,
            bubble.y - radius * 0.3,
            0,
            bubble.x,
            bubble.y,
            radius
        );
        gradient.addColorStop(0, this.lightenColor(bubble.color, 30));
        gradient.addColorStop(0.7, bubble.color);
        gradient.addColorStop(1, this.darkenColor(bubble.color, 20));

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Shine effect
        this.ctx.beginPath();
        this.ctx.arc(bubble.x - radius * 0.3, bubble.y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fill();

        this.ctx.globalAlpha = 1;
    }

    drawAimLine() {
        const startX = this.shooter.x;
        const startY = this.shooter.y;
        const length = 100;
        const endX = startX + Math.cos(this.aimAngle) * length;
        const endY = startY + Math.sin(this.aimAngle) * length;

        // Dashed line
        this.ctx.setLineDash([5, 10]);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Arrow head
        const arrowSize = 10;
        const arrowAngle = Math.PI / 6;

        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(this.aimAngle - arrowAngle),
            endY - arrowSize * Math.sin(this.aimAngle - arrowAngle)
        );
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(this.aimAngle + arrowAngle),
            endY - arrowSize * Math.sin(this.aimAngle + arrowAngle)
        );
        this.ctx.stroke();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        return this.lightenColor(color, -percent);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new BubbleShooter('bubbleCanvas');
});
