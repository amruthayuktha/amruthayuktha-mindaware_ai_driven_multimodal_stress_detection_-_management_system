"""
Caching Service
In-memory cache for scraped recommendations with TTL
"""

from cachetools import TTLCache
import logging
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)

class RecommendationCache:
    """Cache for storing scraped recommendations with 24-hour TTL"""
    
    def __init__(self, maxsize: int = 100, ttl: int = 86400):
        """
        Initialize cache
        
        Args:
            maxsize: Maximum number of cached items
            ttl: Time-to-live in seconds (default: 24 hours)
        """
        self.cache = TTLCache(maxsize=maxsize, ttl=ttl)
        logger.info(f"Initialized cache with maxsize={maxsize}, ttl={ttl}s")
    
    def get(self, key: str) -> Optional[Dict]:
        """
        Get cached recommendations
        
        Args:
            key: Cache key (usually derived from keywords)
            
        Returns:
            Cached recommendations or None if not found/expired
        """
        try:
            value = self.cache.get(key)
            if value:
                logger.debug(f"Cache hit for key: {key}")
            else:
                logger.debug(f"Cache miss for key: {key}")
            return value
        except Exception as e:
            logger.error(f"Error getting from cache: {str(e)}")
            return None
    
    def set(self, key: str, value: Dict) -> bool:
        """
        Store recommendations in cache
        
        Args:
            key: Cache key
            value: Recommendations dictionary
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.cache[key] = value
            logger.debug(f"Cached recommendations for key: {key}")
            return True
        except Exception as e:
            logger.error(f"Error setting cache: {str(e)}")
            return False
    
    def clear(self) -> None:
        """Clear all cached items"""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            'size': len(self.cache),
            'maxsize': self.cache.maxsize,
            'ttl': self.cache.ttl
        }
