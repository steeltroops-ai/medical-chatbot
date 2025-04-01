import os
import time
import requests
from urllib.parse import urlparse
from flask import current_app, abort
import openai

def get_openai_response(user_message):
    """
    Get a response from OpenAI API based on the user's message.

    Args:
        user_message (str): The message from the user

    Returns:
        str: The response from OpenAI API
    """
    max_retries = 3
    initial_retry_delay = 1  # seconds
    max_retry_delay = 8  # seconds

    try:
        # Initialize OpenAI client
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        if not openai.api_key:
            return "Error: OpenAI API key not found. Please check your configuration."
        
        # Get the API key from environment or config
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key and current_app:
            api_key = current_app.config.get('OPENAI_API_KEY')
        
        if not api_key:
            error_msg = "OpenAI API key is not set in environment variables or application config"
            current_app.logger.error(error_msg)
            return "I'm having trouble connecting to my knowledge service. Please try again later or contact support."
        
        # Set OpenAI API key
        openai.api_key = api_key
        
        last_error = None
        for attempt in range(max_retries):
            try:
                # Create a system message to guide the model's behavior
                system_message = {
                    "role": "system",
                    "content": "You are a helpful assistant. Provide accurate information while being concise and friendly."
                }

                # Create a user message
                user_prompt = {"role": "user", "content": user_message}

                # Get response from OpenAI API
                response = openai.ChatCompletion.create(
                    model=os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo'),
                    messages=[system_message, user_prompt],
                    temperature=0.7,
                    max_tokens=500,
                    top_p=1.0,
                    frequency_penalty=0.0,
                    presence_penalty=0.0
                )

                # Check if we have a valid response
                if not response.choices:
                    return "I'm having trouble generating a response right now. Please try asking your question again."

                return response.choices[0].message.content.strip()

            except Exception as e:
                last_error = e
                error_msg = str(e).lower()
                current_app.logger.warning(f"Error on attempt {attempt + 1}/{max_retries}: {error_msg}")

                # Handle different error types
                if "exceeded your current quota" in error_msg:
                    current_app.logger.error("API quota exceeded error")
                    return "I'm currently experiencing high demand. Please try again later."
                    
                elif "rate limit" in error_msg:
                    current_app.logger.warning("Rate limit error, attempting retry")
                    if attempt < max_retries - 1:
                        wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                        current_app.logger.info(f"Waiting {wait_time} seconds before retry...")
                        time.sleep(wait_time)
                        continue
                    return "I'm currently experiencing high demand. Please try again in a minute."
                    
                elif "connection" in error_msg or "timeout" in error_msg:
                    current_app.logger.warning(f"Network error: {error_msg}")
                    if attempt < max_retries - 1:
                        wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                        current_app.logger.info(f"Waiting {wait_time} seconds before retry...")
                        time.sleep(wait_time)
                        continue
                    return "I'm having trouble connecting to my knowledge service. Please check your internet connection and try again."
                else:
                    current_app.logger.error(f"Unexpected error in OpenAI API call: {error_msg}")
                    if attempt < max_retries - 1:
                        wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                        current_app.logger.info(f"Waiting {wait_time} seconds before retry...")
                        time.sleep(wait_time)
                        continue
                    return "I'm temporarily unavailable. Please try again in a few moments."

        # If we've exhausted all retries
        current_app.logger.error(f"All retries failed: {str(last_error)}")
        return "I apologize, but I'm having trouble generating a response right now. Please try again later."

    except Exception as e:
        current_app.logger.error(f"OpenAI API error: {str(e)}")
        return "Sorry, I'm having trouble connecting to the AI service. Please try again."