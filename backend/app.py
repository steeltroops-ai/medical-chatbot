from flask import Flask
from . import create_app

# Create the Flask application
app = create_app()

# This allows the app to be run directly with 'python app.py'
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)