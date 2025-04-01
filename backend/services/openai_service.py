import os
from openai import OpenAI
from flask import current_app

def get_openai_response(user_message):
    """
    Get a response from OpenAI API based on the user's message.

    Args:
        user_message (str): The message from the user

    Returns:
        str: The response from OpenAI API
    """
    try:
        # Get the API key from environment or config
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key and current_app:
            api_key = current_app.config.get('OPENAI_API_KEY')
        
        if not api_key:
            error_msg = "OpenAI API key is not set in environment variables or application config"
            current_app.logger.error(error_msg)
            return "I'm having trouble connecting to my knowledge service. Please try again later or contact support."
        
        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)
        
        # Create the chat completion with medical context
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful medical assistant. Provide accurate medical information while being concise and professional. Always remind users to consult healthcare professionals for specific medical advice."
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            max_tokens=500,
            temperature=0.7,
            top_p=1.0
        )
        
        # Extract and return the assistant's response
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content.strip()
        else:
            return "I apologize, but I couldn't generate a response. Please try again."
            
    except Exception as e:
        current_app.logger.error(f"Error in OpenAI service: {str(e)}")
        return f"I'm experiencing technical difficulties. Please try again later. Error: {str(e)}"