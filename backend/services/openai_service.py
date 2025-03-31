import os
import time
import openai
from openai.error import InvalidRequestError, RateLimitError, APIError
from flask import current_app

def get_openai_response(user_message):
    """
    Get a response from OpenAI API based on the user's message.

    Args:
        user_message (str): The message from the user

    Returns:
        str: The response from OpenAI API
    """
    max_retries = 5  # Increased retries
    initial_retry_delay = 1  # seconds
    max_retry_delay = 16  # seconds

    try:
        # Set OpenAI API key from environment variables if not already set
        if not openai.api_key:
            openai.api_key = os.getenv('OPENAI_API_KEY')
            if not openai.api_key and current_app:
                openai.api_key = current_app.config.get('OPENAI_API_KEY')
        
        if not openai.api_key:
            print("OpenAI API key is not set in environment variables or application config")
            return "Service configuration error. Please check API key configuration."

        last_error = None
        for attempt in range(max_retries):
            try:
                # Create a system message to guide the model's behavior
                system_message = {
                    "role": "system",
                    "content": "You are a knowledgeable medical assistant. Provide accurate, evidence-based medical information while being clear that you are an AI assistant and not a replacement for professional medical advice. Always encourage users to consult healthcare professionals for specific medical concerns."
                }

                # Create a user message
                user_prompt = {"role": "user", "content": user_message}

                # Get response from OpenAI API
                response = openai.ChatCompletion.create(
                    model=os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo'),
                    messages=[system_message, user_prompt],
                    temperature=0.7,
                    max_tokens=1000,
                    top_p=1.0,
                    frequency_penalty=0.0,
                    presence_penalty=0.0
                )

                if not response.choices:
                    return "I apologize, but I couldn't generate a response. Please try again."

                return response.choices[0].message.content.strip()

            except (openai.error.RateLimitError, RateLimitError) as e:
                last_error = e
                print(f"Rate limit error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                return "The service is experiencing high demand. Please try again in a minute."

            except (openai.error.InvalidRequestError, InvalidRequestError) as e:
                print(f"Invalid request to OpenAI API: {str(e)}")
                return "I apologize, but I couldn't understand your request. Could you please rephrase it?"

            except openai.error.AuthenticationError as e:
                print(f"Authentication error with OpenAI API: {str(e)}")
                return "Service authentication error. Please contact support."

            except openai.error.APIConnectionError as e:
                last_error = e
                print(f"Connection error with OpenAI API: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                return "The service is temporarily unavailable. Please try again in a few moments."

            except (openai.error.APIError, APIError) as e:
                last_error = e
                print(f"OpenAI API error: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                return "The service is temporarily unavailable. Please try again in a few moments."

            except Exception as e:
                last_error = e
                print(f"Unexpected error in OpenAI API call: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                return "I apologize, but I'm having trouble processing your request. Please try again."

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return "An unexpected error occurred. Please try again later."