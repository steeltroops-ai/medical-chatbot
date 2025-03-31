import os
import openai
from flask import current_app

def get_openai_response(user_message):
    """
    Get a response from OpenAI API based on the user's message.
    
    Args:
        user_message (str): The message from the user
        
    Returns:
        str: The response from OpenAI
    """
    # Set OpenAI API key from environment variables if not already set
    if not openai.api_key:
        openai.api_key = os.getenv('OPENAI_API_KEY') or current_app.config.get('OPENAI_API_KEY')
    
    if not openai.api_key:
        raise ValueError("OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.")
    
    try:
        # Create a system message to guide the model's behavior
        system_message = {
            "role": "system",
            "content": "You are a helpful assistant. Provide concise and accurate information."
        }
        
        # Create a user message
        user_prompt = {"role": "user", "content": user_message}
        
        # Get response from OpenAI
        response = openai.ChatCompletion.create(
            model=os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo'),
            messages=[system_message, user_prompt],
            max_tokens=500,
            temperature=0.7
        )
        
        # Extract and return the response text
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        # Log the error (in a production environment, you would use a proper logging system)
        print(f"Error in OpenAI API call: {str(e)}")
        raise Exception(f"Failed to get response from OpenAI: {str(e)}")