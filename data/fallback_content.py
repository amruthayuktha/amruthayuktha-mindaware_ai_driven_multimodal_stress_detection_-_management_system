"""
Fallback Content
Curated stress-relief content organized by stress type for precise recommendations
"""

# Pre-curated YouTube videos organized by stress category
FALLBACK_VIDEOS = [
    # Exam/Study related
    {
        'id': 'inpok4MKVLM',
        'title': '5-Minute Meditation You Can Do Anywhere',
        'thumbnail': 'https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=inpok4MKVLM',
        'embed_url': 'https://www.youtube.com/embed/inpok4MKVLM',
        'duration': '5:31',
        'views': '20M+ views',
        'source': 'YouTube',
        'category': 'general'
    },
    {
        'id': 'ZToicYcHIOU',
        'title': '10-Minute Guided Meditation for Anxiety',
        'thumbnail': 'https://img.youtube.com/vi/ZToicYcHIOU/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=ZToicYcHIOU',
        'embed_url': 'https://www.youtube.com/embed/ZToicYcHIOU',
        'duration': '10:02',
        'views': '15M+ views',
        'source': 'YouTube',
        'category': 'anxiety'
    },
    {
        'id': 'tEmt1Znux58',
        'title': 'Breathing Exercises for Stress Relief',
        'thumbnail': 'https://img.youtube.com/vi/tEmt1Znux58/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=tEmt1Znux58',
        'embed_url': 'https://www.youtube.com/embed/tEmt1Znux58',
        'duration': '6:45',
        'views': '8M+ views',
        'source': 'YouTube',
        'category': 'anxiety'
    },
    {
        'id': 'O-6f5wQXSu8',
        'title': 'Progressive Muscle Relaxation for Deep Calm',
        'thumbnail': 'https://img.youtube.com/vi/O-6f5wQXSu8/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=O-6f5wQXSu8',
        'embed_url': 'https://www.youtube.com/embed/O-6f5wQXSu8',
        'duration': '15:00',
        'views': '5M+ views',
        'source': 'YouTube',
        'category': 'sleep'
    },
    {
        'id': 'DbDoBzGY3vo',
        'title': 'Quick Stress Relief - 3 Minute Technique',
        'thumbnail': 'https://img.youtube.com/vi/DbDoBzGY3vo/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=DbDoBzGY3vo',
        'embed_url': 'https://www.youtube.com/embed/DbDoBzGY3vo',
        'duration': '3:22',
        'views': '3M+ views',
        'source': 'YouTube',
        'category': 'overwhelmed'
    },
    {
        'id': 'sYWocLhPpFQ',
        'title': 'Study Focus Music - Concentration Boost',
        'thumbnail': 'https://img.youtube.com/vi/sYWocLhPpFQ/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=sYWocLhPpFQ',
        'embed_url': 'https://www.youtube.com/embed/sYWocLhPpFQ',
        'duration': '1:00:00',
        'views': '12M+ views',
        'source': 'YouTube',
        'category': 'exams'
    },
    {
        'id': 'jPpUNAFHgxM',
        'title': 'Guided Sleep Meditation for Insomnia',
        'thumbnail': 'https://img.youtube.com/vi/jPpUNAFHgxM/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=jPpUNAFHgxM',
        'embed_url': 'https://www.youtube.com/embed/jPpUNAFHgxM',
        'duration': '20:00',
        'views': '10M+ views',
        'source': 'YouTube',
        'category': 'sleep'
    },
    {
        'id': 'Jyy0ra2WcQQ',
        'title': 'Work Stress Relief - Office Meditation',
        'thumbnail': 'https://img.youtube.com/vi/Jyy0ra2WcQQ/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=Jyy0ra2WcQQ',
        'embed_url': 'https://www.youtube.com/embed/Jyy0ra2WcQQ',
        'duration': '8:00',
        'views': '2M+ views',
        'source': 'YouTube',
        'category': 'work'
    }
]

# Pre-curated music organized by mood/category
FALLBACK_MUSIC = [
    {
        'id': '5qap5aO4i9A',
        'title': 'Relaxing Piano Music - Stress Relief',
        'artist': 'Soothing Relaxation',
        'thumbnail': 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=5qap5aO4i9A',
        'embed_url': 'https://www.youtube.com/embed/5qap5aO4i9A',
        'duration': '3:00:00',
        'source': 'YouTube Music',
        'type': 'music',
        'category': 'general'
    },
    {
        'id': 'lFcSrYw-ARY',
        'title': 'Deep Sleep Music - Calm Relaxation',
        'artist': 'Yellow Brick Cinema',
        'thumbnail': 'https://img.youtube.com/vi/lFcSrYw-ARY/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=lFcSrYw-ARY',
        'embed_url': 'https://www.youtube.com/embed/lFcSrYw-ARY',
        'duration': '8:00:00',
        'source': 'YouTube Music',
        'type': 'music',
        'category': 'sleep'
    },
    {
        'id': 'hlWiI4xVXKY',
        'title': 'Study Music Alpha Waves - Focus',
        'artist': 'Quiet Quest',
        'thumbnail': 'https://img.youtube.com/vi/hlWiI4xVXKY/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=hlWiI4xVXKY',
        'embed_url': 'https://www.youtube.com/embed/hlWiI4xVXKY',
        'duration': '2:00:00',
        'source': 'YouTube Music',
        'type': 'music',
        'category': 'exams'
    },
    {
        'id': 'DWcJFNfaw9c',
        'title': 'Nature Sounds - Forest Birds',
        'artist': 'Relaxing White Noise',
        'thumbnail': 'https://img.youtube.com/vi/DWcJFNfaw9c/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=DWcJFNfaw9c',
        'embed_url': 'https://www.youtube.com/embed/DWcJFNfaw9c',
        'duration': '10:00:00',
        'source': 'YouTube Music',
        'type': 'music',
        'category': 'anxiety'
    },
    {
        'id': 'lTRiuFIWV54',
        'title': 'Lofi Hip Hop - Beats to Study/Relax',
        'artist': 'ChilledCow',
        'thumbnail': 'https://img.youtube.com/vi/lTRiuFIWV54/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=lTRiuFIWV54',
        'embed_url': 'https://www.youtube.com/embed/lTRiuFIWV54',
        'duration': '1:30:00',
        'source': 'YouTube Music',
        'type': 'music',
        'category': 'focus'
    },
    {
        'id': '77ZozI0rw7w',
        'title': 'Calming Anxiety Relief Music',
        'artist': 'Meditation Sounds',
        'thumbnail': 'https://img.youtube.com/vi/77ZozI0rw7w/hqdefault.jpg',
        'url': 'https://www.youtube.com/watch?v=77ZozI0rw7w',
        'embed_url': 'https://www.youtube.com/embed/77ZozI0rw7w',
        'duration': '1:00:00',
        'source': 'YouTube Music',
        'type': 'music',
        'category': 'anxiety'
    }
]

# Pre-curated wellness articles organized by topic
FALLBACK_ARTICLES = [
    {
        'title': '16 Simple Ways to Relieve Stress and Anxiety',
        'url': 'https://www.healthline.com/nutrition/16-ways-relieve-stress-anxiety',
        'snippet': 'Chronic stress can take a toll on your health. Here are 16 evidence-based ways to relieve stress naturally, from exercise to mindfulness.',
        'source': 'Healthline',
        'type': 'article',
        'category': 'general'
    },
    {
        'title': 'Stress Management: Techniques & Strategies',
        'url': 'https://www.verywellmind.com/stress-management-4157211',
        'snippet': 'Learn effective stress management techniques including relaxation methods, time management, and lifestyle changes that can help you handle pressure.',
        'source': 'Verywell Mind',
        'type': 'article',
        'category': 'work'
    },
    {
        'title': 'How to Deal with Test Anxiety',
        'url': 'https://www.verywellmind.com/tips-on-coping-with-test-anxiety-2795366',
        'snippet': 'Test anxiety can significantly impact your performance. Learn proven strategies to manage exam stress and perform at your best.',
        'source': 'Verywell Mind',
        'type': 'article',
        'category': 'exams'
    },
    {
        'title': 'How to Calm Anxiety: 12 Ways to Quiet Your Mind',
        'url': 'https://www.healthline.com/health/mental-health/how-to-calm-anxiety',
        'snippet': 'Anxiety can feel overwhelming but there are effective ways to find calm. Discover breathing exercises, grounding techniques, and more.',
        'source': 'Healthline',
        'type': 'article',
        'category': 'anxiety'
    },
    {
        'title': 'Sleep and Stress: What\'s the Connection?',
        'url': 'https://www.sleepfoundation.org/mental-health/stress-and-sleep',
        'snippet': 'Understanding the bidirectional relationship between sleep and stress, and practical strategies to improve both for better health.',
        'source': 'Sleep Foundation',
        'type': 'article',
        'category': 'sleep'
    },
    {
        'title': 'Feeling Overwhelmed? 10 Ways to Regain Control',
        'url': 'https://www.psychologytoday.com/us/blog/click-here-happiness/201901/10-ways-stop-feeling-overwhelmed',
        'snippet': 'When life feels like too much, these practical steps can help you break free from overwhelm and regain a sense of control.',
        'source': 'Psychology Today',
        'type': 'article',
        'category': 'overwhelmed'
    }
]

def get_content_by_category(content_list, category, default_count=3):
    """Get content filtered by category with fallback to general content"""
    # First try to find category-specific content
    filtered = [item for item in content_list if item.get('category') == category]
    
    # If not enough, add general content
    if len(filtered) < default_count:
        general = [item for item in content_list if item.get('category') == 'general']
        filtered.extend(general)
    
    # If still not enough, add any remaining
    if len(filtered) < default_count:
        remaining = [item for item in content_list if item not in filtered]
        filtered.extend(remaining)
    
    return filtered[:default_count]
