# Medical Chat Assistant

A full-stack application for medical chat assistance, featuring a React frontend and Flask backend with OpenAI integration.

## Project Structure

The project consists of two main parts:

- **Backend**: Flask API with OpenAI integration and user authentication
- **Frontend**: React/Next.js application with a responsive chat interface

## Setup Instructions

### Prerequisites

- Python 3.8+ for the backend
- Node.js 16+ for the frontend
- OpenAI API key

### Backend Setup

1. Create and activate a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (macOS/Linux)
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Set up environment variables:

Copy the `.env.example` file to `.env` and fill in your OpenAI API key:

```
# Flask configuration
FLASK_ENV=development
SECRET_KEY=your_secret_key_here

# Database configuration
DATABASE_URL=sqlite:///medical_chatbot.db

# OpenAI configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

4. Run the backend server:

```bash
python run.py
```

The backend server will start at http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `POST /api/auth/logout` - Log out a user
- `GET /api/auth/user` - Get current user information

### Chat

- `POST /api/chat/message` - Send a message to the chatbot
- `GET /api/chat/history` - Get chat history for the current user
- `DELETE /api/chat/message/:id` - Delete a message from chat history

### Health Check

- `GET /api/health` - Health check endpoint

## Features

- Responsive chat interface
- OpenAI integration with GPT-3.5/4
- User authentication and session management
- Persistent chat history
- Offline detection and handling
- Error handling and retry logic

## Tech Stack

- **Backend**: Flask, SQLAlchemy, Flask-Login
- **Frontend**: React, Next.js, TypeScript
- **API**: OpenAI ChatCompletion
- **Styling**: Tailwind CSS

## License

This project is licensed under the MIT License - see the LICENSE file for details.