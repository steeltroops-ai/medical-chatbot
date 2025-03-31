import re
from datetime import datetime

def sanitize_input(text):
    """
    Sanitize user input to prevent potential security issues.
    
    Args:
        text (str): The input text to sanitize
        
    Returns:
        str: The sanitized text
    """
    # Remove any potentially harmful HTML/script tags
    text = re.sub(r'<[^>]*>', '', text)
    return text

def format_timestamp(timestamp):
    """
    Format a timestamp into a human-readable string.
    
    Args:
        timestamp (datetime): The timestamp to format
        
    Returns:
        str: The formatted timestamp string
    """
    if not timestamp:
        return ""
    
    now = datetime.utcnow()
    diff = now - timestamp
    
    if diff.days == 0:
        # Today
        if diff.seconds < 60:
            return "just now"
        elif diff.seconds < 3600:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.days == 1:
        # Yesterday
        return "yesterday"
    elif diff.days < 7:
        # This week
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    else:
        # Older
        return timestamp.strftime("%Y-%m-%d %H:%M")