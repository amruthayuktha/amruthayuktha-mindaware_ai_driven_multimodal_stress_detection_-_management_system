/**
 * Journal Module
 * Handles journal entry creation, editing, and display
 */

class JournalManager {
    constructor() {
        this.entries = [];
        this.currentEntryId = null;

        this.init();
    }

    init() {
        this.setCurrentDate();
        this.bindEvents();
        this.loadEntries();
    }

    setCurrentDate() {
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('journalForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveEntry(e));
        }

        // Word count
        const textarea = document.getElementById('journalContent');
        if (textarea) {
            textarea.addEventListener('input', () => this.updateWordCount());
        }

        // Clear button
        const clearBtn = document.getElementById('clearJournalBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearForm());
        }

        // Prompts
        document.querySelectorAll('.prompt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.usePrompt(e.target.dataset.prompt));
        });

        // Search
        const searchInput = document.getElementById('searchEntries');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchEntries(e.target.value));
        }

        // Modal close
        const closeModal = document.getElementById('closeEntryModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        // Delete/Edit buttons
        const deleteBtn = document.getElementById('deleteEntryBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteEntry());
        }
    }

    updateWordCount() {
        const textarea = document.getElementById('journalContent');
        const countEl = document.getElementById('wordCount');

        if (textarea && countEl) {
            const words = textarea.value.trim().split(/\s+/).filter(w => w.length > 0);
            countEl.textContent = words.length;
        }
    }

    usePrompt(prompt) {
        const textarea = document.getElementById('journalContent');
        if (textarea) {
            textarea.value = prompt + '\n\n';
            textarea.focus();
            this.updateWordCount();
        }
    }

    clearForm() {
        document.getElementById('journalTitle').value = '';
        document.getElementById('journalContent').value = '';
        document.getElementById('wordCount').textContent = '0';
        this.currentEntryId = null;
        document.getElementById('saveJournalBtn').innerHTML = '<span>💾</span> Save Entry';
    }

    async saveEntry(e) {
        e.preventDefault();

        const title = document.getElementById('journalTitle').value;
        const content = document.getElementById('journalContent').value;

        if (!content.trim()) {
            alert('Please write something in your journal entry');
            return;
        }

        try {
            const url = this.currentEntryId ? `/api/journal/${this.currentEntryId}` : '/api/journal';
            const method = this.currentEntryId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess();
                this.clearForm();
                this.loadEntries();
            }
        } catch (error) {
            console.error('Error saving journal entry:', error);
            alert('Failed to save entry. Please try again.');
        }
    }

    showSuccess() {
        const btn = document.getElementById('saveJournalBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Saved!';
        btn.classList.add('success');

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('success');
        }, 2000);
    }

    async loadEntries() {
        try {
            const response = await fetch('/api/journal');
            const data = await response.json();

            this.entries = data.entries;
            this.renderEntries(this.entries);
            this.renderTags(data.tags);
            this.renderInsights(data);
        } catch (error) {
            console.error('Error loading journal entries:', error);
        }
    }

    renderEntries(entries) {
        const container = document.getElementById('entriesList');
        if (!container) return;

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-entries">
                    <span class="empty-icon">📝</span>
                    <p>No journal entries yet.</p>
                    <p class="empty-subtitle">Start writing to capture your thoughts!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(entry => `
            <div class="journal-entry-card" data-id="${entry.id}">
                <div class="entry-header">
                    <h4>${entry.title}</h4>
                    <span class="entry-timestamp">${this.formatDate(entry.timestamp)}</span>
                </div>
                <p class="entry-preview">${entry.content.substring(0, 150)}${entry.content.length > 150 ? '...' : ''}</p>
                <div class="entry-meta">
                    <span class="word-count">${entry.word_count} words</span>
                    <div class="entry-tags">
                        ${entry.tags.map(tag => `<span class="tag-chip">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.journal-entry-card').forEach(card => {
            card.addEventListener('click', () => this.openEntry(parseInt(card.dataset.id)));
        });
    }

    renderTags(tags) {
        const container = document.getElementById('tagsCloud');
        if (!container || Object.keys(tags).length === 0) {
            if (container) container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = Object.entries(tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => `
                <button class="cloud-tag" data-tag="${tag}">
                    ${tag} <span class="tag-count">${count}</span>
                </button>
            `).join('');

        container.querySelectorAll('.cloud-tag').forEach(btn => {
            btn.addEventListener('click', () => this.filterByTag(btn.dataset.tag));
        });
    }

    renderInsights(data) {
        const container = document.getElementById('journalInsights');
        if (!container || data.total === 0) return;

        container.style.display = 'block';
        document.getElementById('totalEntriesCount').textContent = data.total;
        document.getElementById('avgWordsCount').textContent = data.avg_words;

        // Calculate streak (simplified)
        document.getElementById('currentStreakCount').textContent = Math.min(data.total, 7);
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) { // Less than 24 hours
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diff < 604800000) { // Less than 7 days
            return date.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    openEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        this.currentEntryId = id;

        document.getElementById('modalEntryTitle').textContent = entry.title;
        document.getElementById('modalEntryDate').textContent = new Date(entry.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('modalEntryContent').innerHTML = entry.content.replace(/\n/g, '<br>');
        document.getElementById('modalEntryTags').innerHTML = entry.tags.map(t => `<span class="tag-chip">${t}</span>`).join('');

        document.getElementById('entryModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('entryModal').style.display = 'none';
        this.currentEntryId = null;
    }

    async deleteEntry() {
        if (!this.currentEntryId) return;

        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            const response = await fetch(`/api/journal/${this.currentEntryId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.closeModal();
                this.loadEntries();
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    }

    searchEntries(query) {
        if (!query.trim()) {
            this.renderEntries(this.entries);
            return;
        }

        const filtered = this.entries.filter(entry =>
            entry.title.toLowerCase().includes(query.toLowerCase()) ||
            entry.content.toLowerCase().includes(query.toLowerCase()) ||
            entry.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderEntries(filtered);
    }

    filterByTag(tag) {
        const filtered = this.entries.filter(entry => entry.tags.includes(tag));
        this.renderEntries(filtered);

        // Update search input to show filter
        const searchInput = document.getElementById('searchEntries');
        if (searchInput) {
            searchInput.value = `#${tag}`;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new JournalManager();
});
