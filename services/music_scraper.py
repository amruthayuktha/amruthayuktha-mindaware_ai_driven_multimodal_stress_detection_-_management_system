"""
Music Scraper Service
Scrapes music platforms for calming playlists and tracks
"""

import requests
from bs4 import BeautifulSoup
import re
import logging
from typing import List, Dict
from data.fallback_content import FALLBACK_MUSIC

logger = logging.getLogger(__name__)

class MusicScraper:
    """Scrape music platforms for relaxation music and playlists"""
    
    YOUTUBE_MUSIC_URL = "https://www.youtube.com/results"
    
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    # Pre-defined calming music queries based on stress type
    MUSIC_QUERIES = {
        'exams': 'study music concentration focus',
        'work': 'office relaxation ambient music',
        'sleep': 'sleep music deep relaxation',
        'anxiety': 'calming music anxiety relief',
        'focus': 'focus music no lyrics ambient',
        'default': 'relaxing music stress relief'
    }
    
    def scrape(self, query: str, max_results: int = 3) -> List[Dict]:
        """
        Scrape for music recommendations
        
        Args:
            query: Search query or stress type
            max_results: Maximum number of tracks to return
            
        Returns:
            List of music track dictionaries
        """
        try:
            # Build music-specific query
            search_query = self._build_music_query(query)
            
            logger.info(f"Scraping music for: {search_query}")
            
            # Try YouTube for music videos
            music = self._scrape_youtube_music(search_query, max_results)
            
            if music:
                return music
            
            # Fallback to curated content
            return self._get_fallback_music(query, max_results)
            
        except Exception as e:
            logger.error(f"Error scraping music: {str(e)}")
            return self._get_fallback_music(query, max_results)
    
    def _build_music_query(self, query: str) -> str:
        """Build a music-optimized search query"""
        query_lower = query.lower()
        
        # Check if query matches a known stress type
        for stress_type, music_query in self.MUSIC_QUERIES.items():
            if stress_type in query_lower:
                return music_query
        
        # Add music context to query
        if 'music' not in query_lower:
            return f"{query} relaxing music"
        
        return query
    
    def _scrape_youtube_music(self, query: str, max_results: int) -> List[Dict]:
        """Scrape YouTube for music videos"""
        music = []
        
        try:
            params = {'search_query': query}
            response = requests.get(
                self.YOUTUBE_MUSIC_URL,
                params=params,
                headers=self.HEADERS,
                timeout=10
            )
            
            if response.status_code != 200:
                return []
            
            # Extract video IDs from response
            video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', response.text)
            video_ids = list(dict.fromkeys(video_ids))[:max_results]  # Remove duplicates
            
            for video_id in video_ids:
                # Try to extract title from response
                title_match = re.search(
                    rf'"videoId":"{video_id}".*?"title":\{{"runs":\[\{{"text":"([^"]+)"',
                    response.text
                )
                title = title_match.group(1) if title_match else "Relaxing Music"
                
                music.append({
                    'id': video_id,
                    'title': title,
                    'artist': 'Various Artists',
                    'thumbnail': f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    'url': f"https://www.youtube.com/watch?v={video_id}",
                    'embed_url': f"https://www.youtube.com/embed/{video_id}",
                    'duration': 'N/A',
                    'source': 'YouTube Music',
                    'type': 'music'
                })
                
        except Exception as e:
            logger.error(f"Error scraping YouTube music: {str(e)}")
        
        return music
    
    def _get_fallback_music(self, query: str, max_results: int) -> List[Dict]:
        """Return curated fallback music based on query"""
        query_lower = query.lower()
        
        # Match fallback music to query context
        relevant_music = []
        for track in FALLBACK_MUSIC:
            title_lower = track['title'].lower()
            if any(word in title_lower for word in query_lower.split()):
                relevant_music.append(track)
        
        # If no matches, return general relaxation music
        if not relevant_music:
            relevant_music = FALLBACK_MUSIC
        
        return relevant_music[:max_results]
