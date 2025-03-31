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
        # Set and validate OpenAI API key
        if not openai.api_key:
            openai.api_key = os.getenv('OPENAI_API_KEY')
            if not openai.api_key and current_app:
                openai.api_key = current_app.config.get('OPENAI_API_KEY')
        
        if not openai.api_key:
            error_msg = "OpenAI API key is not set in environment variables or application config"
            print(error_msg)
            from flask import abort
            abort(500, description="Configuration error: OpenAI API key is not set")

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
                    return "I apologize, but I'm having trouble generating a response right now. Please try asking your question again."

                return response.choices[0].message.content.strip()

            except (openai.error.RateLimitError, RateLimitError) as e:
                last_error = e
                print(f"Rate limit error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                if "exceeded your current quota" in str(e):
                    from flask import abort
                    abort(402, description="Service quota exceeded. Please try again later.")
                if attempt < max_retries - 1:
                    wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                from flask import abort
                abort(429, description="Rate limit reached. Please try again in a few minutes.")


            except (openai.error.InvalidRequestError, InvalidRequestError) as e:
                print(f"Invalid request to OpenAI API: {str(e)}")
                from flask import abort
                abort(400, description="Invalid request format. Please try rephrasing your question.")


            except openai.error.AuthenticationError as e:
                print(f"Authentication error with OpenAI API: {str(e)}")
                from flask import abort
                abort(401, description="Authentication error. Please check API credentials.")


            except openai.error.APIConnectionError as e:
                last_error = e
                print(f"Connection error with OpenAI API: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                return "I apologize, but I'm having trouble connecting to our services. Please try again in a moment."

            except (openai.error.APIError, APIError) as e:
                last_error = e
                print(f"OpenAI API error: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                from flask import abort
                abort(503, description="OpenAI API service error. Please try again later.")


            except Exception as e:
                last_error = e
                print(f"Unexpected error in OpenAI API call: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = min(initial_retry_delay * (2 ** attempt), max_retry_delay)
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                return "I apologize, but something unexpected happened. Please try asking your question again."

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return "An unexpected error occurred. Please try again later."