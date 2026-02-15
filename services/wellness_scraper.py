"""
Wellness Article Scraper Service
Scrapes wellness websites for stress-relief articles and tips
"""

import requests
from bs4 import BeautifulSoup
import logging
from typing import List, Dict
from data.fallback_content import FALLBACK_ARTICLES

logger = logging.getLogger(__name__)

class WellnessScraper:
    """Scrape wellness websites for helpful articles"""
    
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    # Wellness article sources (using search engines as proxies)
    SEARCH_URL = "https://html.duckduckgo.com/html/"
    
    def scrape(self, query: str, max_results: int = 2) -> List[Dict]:
        """
        Scrape wellness articles related to stress relief
        
        Args:
            query: Search query or stress type
            max_results: Maximum number of articles to return
            
        Returns:
            List of article dictionaries
        """
        try:
            # Build wellness-specific query
            search_query = f"{query} tips articles site:healthline.com OR site:verywellmind.com OR site:mindful.org"
            
            logger.info(f"Scraping articles for: {query}")
            
            articles = self._scrape_duckduckgo(search_query, max_results)
            
            if articles:
                return articles
            
            return self._get_fallback_articles(query, max_results)
            
        except Exception as e:
            logger.error(f"Error scraping articles: {str(e)}")
            return self._get_fallback_articles(query, max_results)
    
    def _scrape_duckduckgo(self, query: str, max_results: int) -> List[Dict]:
        """Scrape DuckDuckGo search results for articles"""
        articles = []
        
        try:
            data = {'q': query}
            response = requests.post(
                self.SEARCH_URL,
                data=data,
                headers=self.HEADERS,
                timeout=10
            )
            
            if response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Find search result links
            results = soup.find_all('div', class_='result')
            
            for result in results[:max_results]:
                try:
                    # Extract title
                    title_elem = result.find('a', class_='result__a')
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    url = title_elem.get('href', '')
                    
                    # Extract snippet
                    snippet_elem = result.find('a', class_='result__snippet')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ''
                    
                    # Extract source
                    source_elem = result.find('span', class_='result__url')
                    source = source_elem.get_text(strip=True) if source_elem else 'Wellness Article'
                    
                    if title and url:
                        articles.append({
                            'title': title,
                            'url': url,
                            'snippet': snippet[:200] + '...' if len(snippet) > 200 else snippet,
                            'source': source,
                            'type': 'article'
                        })
                        
                except Exception as e:
                    logger.debug(f"Error parsing result: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping DuckDuckGo: {str(e)}")
        
        return articles
    
    def _get_fallback_articles(self, query: str, max_results: int) -> List[Dict]:
        """Return curated fallback articles based on query"""
        query_lower = query.lower()
        
        # Match fallback articles to query context
        relevant_articles = []
        for article in FALLBACK_ARTICLES:
            title_lower = article['title'].lower()
            if any(word in title_lower for word in query_lower.split()):
                relevant_articles.append(article)
        
        # If no matches, return general wellness articles
        if not relevant_articles:
            relevant_articles = FALLBACK_ARTICLES
        
        return relevant_articles[:max_results]
