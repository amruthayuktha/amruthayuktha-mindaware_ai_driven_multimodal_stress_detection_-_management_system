/**
 * Breathing Exercises Module
 * Controls animated breathing circle and session tracking
 */

class BreathingExercise {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentPhase = 'ready';
        this.timer = null;
        this.cycleCount = 0;
        this.sessionStartTime = null;
        this.sessionTimer = null;

        // Default pattern (4-7-8)
        this.pattern = {
            name: '478',
            inhale: 4,
            hold: 7,
            exhale: 8,
            hold2: 0
        };

        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Pattern selection
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectPattern(e.target.closest('.pattern-btn')));
        });

        // Control buttons
        const startBtn = document.getElementById('startBreatheBtn');
        const pauseBtn = document.getElementById('pauseBreatheBtn');
        const resetBtn = document.getElementById('resetBreatheBtn');

        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    }

    selectPattern(btn) {
        // Update UI
        document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Set pattern
        this.pattern = {
            name: btn.dataset.pattern,
            inhale: parseInt(btn.dataset.inhale),
            hold: parseInt(btn.dataset.hold),
            exhale: parseInt(btn.dataset.exhale),
            hold2: parseInt(btn.dataset.hold2) || 0
        };

        // Reset if currently running
        if (this.isRunning) {
            this.reset();
        }
    }

    start() {
        if (this.isPaused) {
            this.isPaused = false;
            this.runCycle();
        } else {
            this.isRunning = true;
            this.sessionStartTime = Date.now();
            this.startSessionTimer();
            this.runCycle();
        }

        // Update UI
        document.getElementById('startBreatheBtn').style.display = 'none';
        document.getElementById('pauseBreatheBtn').style.display = 'inline-flex';
    }

    pause() {
        this.isPaused = true;
        clearTimeout(this.timer);
        clearInterval(this.sessionTimer);

        // Update UI
        document.getElementById('startBreatheBtn').style.display = 'inline-flex';
        document.getElementById('pauseBreatheBtn').style.display = 'none';
        document.getElementById('breathPhase').textContent = 'Paused';
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.cycleCount = 0;
        this.currentPhase = 'ready';

        clearTimeout(this.timer);
        clearInterval(this.sessionTimer);

        // Save session if cycles completed
        if (this.cycleCount > 0) {
            this.saveSession();
        }

        // Reset UI
        document.getElementById('startBreatheBtn').style.display = 'inline-flex';
        document.getElementById('pauseBreatheBtn').style.display = 'none';
        document.getElementById('breathPhase').textContent = 'Ready';
        document.getElementById('breathTimer').textContent = '0';
        document.getElementById('cycleCount').textContent = '0';
        document.getElementById('sessionDuration').textContent = '0:00';

        // Reset circle
        const circle = document.getElementById('breathingCircle');
        circle.classList.remove('inhale', 'hold', 'exhale');
    }

    runCycle() {
        if (!this.isRunning || this.isPaused) return;

        // Check target cycles
        const targetCycles = parseInt(document.getElementById('targetCycles').value);
        if (targetCycles > 0 && this.cycleCount >= targetCycles) {
            this.complete();
            return;
        }

        this.runPhase('inhale', this.pattern.inhale, () => {
            if (this.pattern.hold > 0) {
                this.runPhase('hold', this.pattern.hold, () => {
                    this.runPhase('exhale', this.pattern.exhale, () => {
                        if (this.pattern.hold2 > 0) {
                            this.runPhase('hold', this.pattern.hold2, () => {
                                this.cycleComplete();
                            });
                        } else {
                            this.cycleComplete();
                        }
                    });
                });
            } else {
                this.runPhase('exhale', this.pattern.exhale, () => {
                    this.cycleComplete();
                });
            }
        });
    }

    runPhase(phase, duration, callback) {
        if (!this.isRunning || this.isPaused) return;

        this.currentPhase = phase;
        const circle = document.getElementById('breathingCircle');
        const phaseText = document.getElementById('breathPhase');
        const timerText = document.getElementById('breathTimer');

        // Update circle animation
        circle.classList.remove('inhale', 'hold', 'exhale');
        circle.classList.add(phase);

        // Update phase text
        const phaseLabels = {
            'inhale': 'Breathe In',
            'hold': 'Hold',
            'exhale': 'Breathe Out'
        };
        phaseText.textContent = phaseLabels[phase];

        // Play sound if enabled
        if (document.getElementById('soundToggle').checked) {
            this.playSound(phase);
        }

        // Vibrate if enabled
        if (document.getElementById('vibrationToggle').checked && navigator.vibrate) {
            navigator.vibrate(100);
        }

        // Countdown timer
        let remaining = duration;
        timerText.textContent = remaining;

        const countdownInterval = setInterval(() => {
            if (!this.isRunning || this.isPaused) {
                clearInterval(countdownInterval);
                return;
            }

            remaining--;
            timerText.textContent = remaining;

            if (remaining <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);

        // Schedule next phase
        this.timer = setTimeout(() => {
            clearInterval(countdownInterval);
            callback();
        }, duration * 1000);
    }

    cycleComplete() {
        this.cycleCount++;
        document.getElementById('cycleCount').textContent = this.cycleCount;

        // Continue to next cycle
        this.runCycle();
    }

    complete() {
        this.isRunning = false;
        clearInterval(this.sessionTimer);

        // Save session
        this.saveSession();

        // Show completion
        document.getElementById('breathPhase').textContent = 'Complete! 🎉';
        document.getElementById('startBreatheBtn').style.display = 'inline-flex';
        document.getElementById('pauseBreatheBtn').style.display = 'none';

        // Reset circle
        const circle = document.getElementById('breathingCircle');
        circle.classList.remove('inhale', 'hold', 'exhale');
    }

    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('sessionDuration').textContent =
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    async saveSession() {
        if (this.cycleCount === 0) return;

        const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);

        try {
            await fetch('/api/breathe/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pattern: this.pattern.name,
                    cycles: this.cycleCount,
                    duration: duration
                })
            });
        } catch (error) {
            console.error('Error saving breathing session:', error);
        }
    }

    playSound(phase) {
        // Simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different tones for different phases
            const frequencies = {
                'inhale': 440,   // A4
                'hold': 523,     // C5
                'exhale': 392    // G4
            };

            oscillator.frequency.value = frequencies[phase] || 440;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio not supported or failed
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BreathingExercise();
});
