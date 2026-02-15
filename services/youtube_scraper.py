"""
YouTube Scraper Service
Scrapes YouTube search results for stress-relief videos
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import logging
from typing import List, Dict
from data.fallback_content import FALLBACK_VIDEOS

logger = logging.getLogger(__name__)

class YouTubeScraper:
    """Scrape YouTube for stress-relief video recommendations"""
    
    BASE_URL = "https://www.youtube.com/results"
    
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
    
    def scrape(self, query: str, max_results: int = 3) -> List[Dict]:
        """
        Scrape YouTube search results for videos
        
        Args:
            query: Search query string
            max_results: Maximum number of videos to return
            
        Returns:
            List of video dictionaries with title, thumbnail, url, etc.
        """
        try:
            # Add stress-relief context to query
            search_query = f"{query} stress relief"
            
            logger.info(f"Scraping YouTube for: {search_query}")
            
            # Make request to YouTube
            params = {'search_query': search_query}
            response = requests.get(
                self.BASE_URL, 
                params=params, 
                headers=self.HEADERS,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.warning(f"YouTube returned status {response.status_code}")
                return self._get_fallback_videos(query, max_results)
            
            # Parse the response
            videos = self._parse_youtube_response(response.text, max_results)
            
            if not videos:
                logger.warning("No videos found, using fallback")
                return self._get_fallback_videos(query, max_results)
            
            return videos
            
        except Exception as e:
            logger.error(f"Error scraping YouTube: {str(e)}")
            return self._get_fallback_videos(query, max_results)
    
    def _parse_youtube_response(self, html: str, max_results: int) -> List[Dict]:
        """Parse YouTube HTML response to extract video data"""
        videos = []
        
        try:
            # YouTube embeds video data in JavaScript
            # Look for ytInitialData JSON
            pattern = r'var ytInitialData = ({.*?});'
            match = re.search(pattern, html)
            
            if match:
                data = json.loads(match.group(1))
                contents = data.get('contents', {}).get('twoColumnSearchResultsRenderer', {}).get('primaryContents', {}).get('sectionListRenderer', {}).get('contents', [])
                
                for section in contents:
                    items = section.get('itemSectionRenderer', {}).get('contents', [])
                    for item in items:
                        video_renderer = item.get('videoRenderer', {})
                        if video_renderer:
                            video_id = video_renderer.get('videoId', '')
                            if video_id:
                                title = video_renderer.get('title', {}).get('runs', [{}])[0].get('text', 'Untitled')
                                
                                # Get thumbnail
                                thumbnails = video_renderer.get('thumbnail', {}).get('thumbnails', [])
                                thumbnail = thumbnails[-1]['url'] if thumbnails else f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                                
                                # Get duration
                                duration = video_renderer.get('lengthText', {}).get('simpleText', 'N/A')
                                
                                # Get view count
                                view_count = video_renderer.get('viewCountText', {}).get('simpleText', 'N/A')
                                
                                videos.append({
                                    'id': video_id,
                                    'title': title,
                                    'thumbnail': thumbnail,
                                    'url': f"https://www.youtube.com/watch?v={video_id}",
                                    'embed_url': f"https://www.youtube.com/embed/{video_id}",
                                    'duration': duration,
                                    'views': view_count,
                                    'source': 'YouTube'
                                })
                                
                                if len(videos) >= max_results:
                                    return videos
            
            # Fallback: Try parsing HTML directly
            if not videos:
                soup = BeautifulSoup(html, 'lxml')
                # This is a simplified fallback - YouTube's actual structure is JS-heavy
                video_links = soup.find_all('a', href=re.compile(r'/watch\?v='))
                
                seen_ids = set()
                for link in video_links[:max_results * 3]:
                    href = link.get('href', '')
                    video_id_match = re.search(r'v=([a-zA-Z0-9_-]{11})', href)
                    if video_id_match:
                        video_id = video_id_match.group(1)
                        if video_id not in seen_ids:
                            seen_ids.add(video_id)
                            videos.append({
                                'id': video_id,
                                'title': link.get('title', 'Stress Relief Video'),
                                'thumbnail': f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                                'url': f"https://www.youtube.com/watch?v={video_id}",
                                'embed_url': f"https://www.youtube.com/embed/{video_id}",
                                'duration': 'N/A',
                                'views': 'N/A',
                                'source': 'YouTube'
                            })
                            if len(videos) >= max_results:
                                break
                                
        except Exception as e:
            logger.error(f"Error parsing YouTube response: {str(e)}")
        
        return videos
    
    def _get_fallback_videos(self, query: str, max_results: int) -> List[Dict]:
        """Return curated fallback videos based on query"""
        query_lower = query.lower()
        
        # Match fallback videos to query context
        relevant_videos = []
        for video in FALLBACK_VIDEOS:
            title_lower = video['title'].lower()
            if any(word in title_lower for word in query_lower.split()):
                relevant_videos.append(video)
        
        # If no matches, return general stress relief videos
        if not relevant_videos:
            relevant_videos = FALLBACK_VIDEOS
        
        return relevant_videos[:max_results]
