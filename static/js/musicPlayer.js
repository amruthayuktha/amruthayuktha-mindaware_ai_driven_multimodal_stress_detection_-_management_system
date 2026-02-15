/**
 * Music Player Module
 * Custom HTML5 audio player with playlist management
 */

class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.currentTrack = null;
        this.currentPlaylist = 'focus';
        this.playlist = [];
        this.trackIndex = 0;
        this.isPlaying = false;

        this.init();
    }

    init() {
        if (!this.audio) return;

        this.bindEvents();
        this.loadPlaylist('focus');

        // Check URL params for specific playlist
        const params = new URLSearchParams(window.location.search);
        const playlistParam = params.get('playlist');
        if (playlistParam) {
            this.switchPlaylist(playlistParam);
        }
    }

    bindEvents() {
        // Playlist tabs
        document.querySelectorAll('.playlist-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPlaylist(tab.dataset.playlist));
        });

        // Track items
        document.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', () => this.playTrack(item));
        });

        // Player controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevTrackBtn');
        const nextBtn = document.getElementById('nextTrackBtn');

        if (playPauseBtn) playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevTrack());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextTrack());

        // Volume
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeIcon = document.getElementById('volumeIcon');

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        }
        if (volumeIcon) {
            volumeIcon.addEventListener('click', () => this.toggleMute());
        }

        // Progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seek(e));
        }

        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    this.audio.currentTime -= 5;
                    break;
                case 'ArrowRight':
                    this.audio.currentTime += 5;
                    break;
            }
        });
    }

    switchPlaylist(playlistName) {
        // Update tabs
        document.querySelectorAll('.playlist-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.playlist === playlistName);
        });

        // Update playlist visibility
        document.querySelectorAll('.playlist').forEach(pl => {
            pl.classList.toggle('active', pl.dataset.playlist === playlistName);
        });

        this.currentPlaylist = playlistName;
        this.loadPlaylist(playlistName);
    }

    loadPlaylist(playlistName) {
        const playlistEl = document.querySelector(`.playlist[data-playlist="${playlistName}"]`);
        if (!playlistEl) return;

        this.playlist = Array.from(playlistEl.querySelectorAll('.track-item')).map(item => ({
            element: item,
            title: item.dataset.title,
            artist: item.dataset.artist,
            src: item.dataset.src,
            duration: item.dataset.duration
        }));

        // Rebind click events
        this.playlist.forEach((track, index) => {
            track.element.onclick = () => this.playTrackByIndex(index);
        });
    }

    playTrack(trackEl) {
        const index = this.playlist.findIndex(t => t.element === trackEl);
        if (index !== -1) {
            this.playTrackByIndex(index);
        }
    }

    playTrackByIndex(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.trackIndex = index;
        this.currentTrack = this.playlist[index];

        // Update audio source
        this.audio.src = this.currentTrack.src;
        this.audio.play();
        this.isPlaying = true;

        // Update UI
        this.updateNowPlaying();
        this.updateTrackHighlight();
        this.updatePlayPauseButton();
    }

    updateNowPlaying() {
        const nowPlayingCard = document.getElementById('nowPlayingCard');
        const titleEl = document.getElementById('nowPlayingTitle');
        const artistEl = document.getElementById('nowPlayingArtist');

        if (nowPlayingCard) nowPlayingCard.style.display = 'flex';
        if (titleEl) titleEl.textContent = this.currentTrack.title;
        if (artistEl) artistEl.textContent = this.currentTrack.artist;

        // Update mini player
        const miniPlayer = document.getElementById('miniPlayer');
        const miniTitle = document.getElementById('miniPlayerTitle');

        if (miniPlayer) miniPlayer.style.display = 'flex';
        if (miniTitle) miniTitle.textContent = this.currentTrack.title;
    }

    updateTrackHighlight() {
        // Remove highlight from all
        document.querySelectorAll('.track-item').forEach(item => {
            item.classList.remove('playing');
        });

        // Add highlight to current
        if (this.currentTrack && this.currentTrack.element) {
            this.currentTrack.element.classList.add('playing');
        }
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            if (!this.audio.src && this.playlist.length > 0) {
                this.playTrackByIndex(0);
            } else {
                this.audio.play();
                this.isPlaying = true;
            }
        }

        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        const miniBtn = document.getElementById('miniPlayerPlayPause');

        if (btn) btn.textContent = this.isPlaying ? '⏸' : '▶';
        if (miniBtn) miniBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }

    prevTrack() {
        let newIndex = this.trackIndex - 1;
        if (newIndex < 0) newIndex = this.playlist.length - 1;
        this.playTrackByIndex(newIndex);
    }

    nextTrack() {
        let newIndex = this.trackIndex + 1;
        if (newIndex >= this.playlist.length) newIndex = 0;
        this.playTrackByIndex(newIndex);
    }

    setVolume(value) {
        this.audio.volume = value / 100;

        const volumeIcon = document.getElementById('volumeIcon');
        if (volumeIcon) {
            if (value == 0) {
                volumeIcon.textContent = '🔇';
            } else if (value < 50) {
                volumeIcon.textContent = '🔉';
            } else {
                volumeIcon.textContent = '🔊';
            }
        }
    }

    toggleMute() {
        const slider = document.getElementById('volumeSlider');
        if (this.audio.volume > 0) {
            this.lastVolume = this.audio.volume;
            this.setVolume(0);
            if (slider) slider.value = 0;
        } else {
            const restoreVolume = (this.lastVolume || 0.8) * 100;
            this.setVolume(restoreVolume);
            if (slider) slider.value = restoreVolume;
        }
    }

    seek(e) {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }

    updateProgress() {
        if (!this.audio.duration) return;

        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        const progressFill = document.getElementById('progressFill');
        const currentTimeEl = document.getElementById('currentTime');
        const miniProgressBar = document.getElementById('miniProgressBar');

        if (progressFill) progressFill.style.width = `${percent}%`;
        if (miniProgressBar) miniProgressBar.style.width = `${percent}%`;
        if (currentTimeEl) currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        const totalTimeEl = document.getElementById('totalTime');
        if (totalTimeEl) {
            totalTimeEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
