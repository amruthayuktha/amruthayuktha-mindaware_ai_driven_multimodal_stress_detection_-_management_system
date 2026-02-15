/**
 * Mood Tracking Module
 * Handles mood check-in, history chart, and insights
 */

class MoodTracker {
    constructor() {
        this.selectedLevel = null;
        this.selectedEmoji = null;
        this.selectedFeelings = [];
        this.chart = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadHistory();
    }

    bindEvents() {
        // Emoji scale buttons
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMood(e.target.closest('.emoji-btn')));
        });

        // Feeling tags
        document.querySelectorAll('.feeling-tag').forEach(tag => {
            tag.addEventListener('click', (e) => this.toggleFeeling(e.target));
        });

        // Form submission
        const form = document.getElementById('moodForm');
        if (form) {
            form.addEventListener('submit', (e) => this.submitMood(e));
        }

        // Time range selector
        document.querySelectorAll('.range-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeRange(e.target));
        });
    }

    selectMood(btn) {
        // Remove selection from all
        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));

        // Select this one
        btn.classList.add('selected');
        this.selectedLevel = parseInt(btn.dataset.level);
        this.selectedEmoji = btn.dataset.emoji;

        // Update hidden inputs
        document.getElementById('moodLevel').value = this.selectedLevel;
        document.getElementById('moodEmoji').value = this.selectedEmoji;

        // Enable submit button
        document.getElementById('submitMoodBtn').disabled = false;
    }

    toggleFeeling(tag) {
        const feeling = tag.dataset.feeling;

        if (tag.classList.contains('selected')) {
            tag.classList.remove('selected');
            this.selectedFeelings = this.selectedFeelings.filter(f => f !== feeling);
        } else {
            tag.classList.add('selected');
            this.selectedFeelings.push(feeling);
        }

        document.getElementById('selectedFeelings').value = this.selectedFeelings.join(',');
    }

    async submitMood(e) {
        e.preventDefault();

        if (!this.selectedLevel) {
            alert('Please select your mood level');
            return;
        }

        const notes = document.getElementById('moodNotes').value;

        try {
            const response = await fetch('/api/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mood_level: this.selectedLevel,
                    mood_emoji: this.selectedEmoji,
                    feelings: this.selectedFeelings,
                    notes: notes
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(data.streak);
                this.resetForm();
                this.loadHistory();
            }
        } catch (error) {
            console.error('Error saving mood:', error);
            alert('Failed to save mood. Please try again.');
        }
    }

    showSuccess(streak) {
        const successHtml = `
            <div class="mood-success">
                <span class="success-icon">✨</span>
                <h3>Mood logged!</h3>
                <p>You're on a ${streak} day streak! Keep it up!</p>
            </div>
        `;

        const card = document.querySelector('.mood-check-card');
        const originalContent = card.innerHTML;
        card.innerHTML = successHtml;

        setTimeout(() => {
            card.innerHTML = originalContent;
            this.init();
        }, 3000);
    }

    resetForm() {
        this.selectedLevel = null;
        this.selectedEmoji = null;
        this.selectedFeelings = [];

        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('.feeling-tag').forEach(t => t.classList.remove('selected'));
        document.getElementById('moodNotes').value = '';
        document.getElementById('submitMoodBtn').disabled = true;
    }

    async loadHistory(days = 7) {
        try {
            const response = await fetch(`/api/mood?days=${days}`);
            const data = await response.json();

            this.renderChart(data.entries);
            this.renderInsights(data.insights);
            this.renderRecentEntries(data.entries);
        } catch (error) {
            console.error('Error loading mood history:', error);
        }
    }

    changeRange(btn) {
        document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const days = parseInt(btn.dataset.range);
        this.loadHistory(days);
    }

    renderChart(entries) {
        const ctx = document.getElementById('moodChart');
        if (!ctx) return;

        // Prepare data
        const sortedEntries = [...entries].reverse();
        const labels = sortedEntries.map(e => {
            const date = new Date(e.timestamp);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const values = sortedEntries.map(e => e.mood_level);

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Create new chart
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mood Level',
                    data: values,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 6,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => {
                                const emojis = ['', '😢', '😕', '😐', '🙂', '😄'];
                                return emojis[value] || '';
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const emojis = ['', 'Very Low', 'Low', 'Okay', 'Good', 'Great'];
                                return `Mood: ${emojis[context.raw]}`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderInsights(insights) {
        const container = document.querySelector('#moodInsights .insights-content');
        if (!container || !insights) return;

        if (insights.message) {
            container.innerHTML = `<p>${insights.message}</p>`;
            return;
        }

        let html = `
            <div class="insight-stats">
                <div class="insight-stat">
                    <span class="stat-value">${insights.average_mood}</span>
                    <span class="stat-label">Avg Mood</span>
                </div>
                <div class="insight-stat">
                    <span class="stat-value">${insights.total_entries}</span>
                    <span class="stat-label">Entries</span>
                </div>
                <div class="insight-stat trend-${insights.trend}">
                    <span class="stat-value">${insights.trend === 'improving' ? '📈' : '➡️'}</span>
                    <span class="stat-label">${insights.trend}</span>
                </div>
            </div>
        `;

        if (insights.top_feelings && insights.top_feelings.length > 0) {
            html += '<div class="top-feelings"><strong>Top feelings:</strong> ';
            html += insights.top_feelings.map(f => `${f.feeling} (${f.count}x)`).join(', ');
            html += '</div>';
        }

        container.innerHTML = html;
    }

    renderRecentEntries(entries) {
        const container = document.getElementById('recentEntriesList');
        if (!container) return;

        if (entries.length === 0) {
            container.innerHTML = '<p class="empty-state">No mood entries yet. Start tracking to see your history!</p>';
            return;
        }

        container.innerHTML = entries.slice(0, 5).map(entry => `
            <div class="mood-entry">
                <span class="entry-emoji">${entry.mood_emoji}</span>
                <div class="entry-info">
                    <span class="entry-date">${new Date(entry.timestamp).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })}</span>
                    ${entry.notes ? `<span class="entry-notes">${entry.notes.substring(0, 50)}${entry.notes.length > 50 ? '...' : ''}</span>` : ''}
                </div>
                <div class="entry-feelings">
                    ${entry.feelings.map(f => `<span class="feeling-chip">${f}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MoodTracker();
});
