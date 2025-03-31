# Chat Application with OpenAI Integration

This is a full-stack chat application with OpenAI integration, featuring a React frontend and Flask backend.

## Project Structure

- `frontend/`: Next.js/React frontend application
- `backend/`: Flask backend API with OpenAI integration
- `.env`: Environment variables for configuration

## Setup Instructions

### Prerequisites

- Node.js 16+ for the frontend
- Python 3.8+ for the backend
- OpenAI API key

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Configure environment variables by editing the `.env` file:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. Run the backend server:
   ```bash
   python run.py
   ```

   The server will start at http://localhost:5000

### Frontend Setup

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the frontend development server:
   ```bash
   npm run dev
   ```

   The application will be available at http://localhost:3000

## Features

- Real-time chat interface
- Integration with OpenAI's GPT-3.5 model
- Message history (requires authentication)
- Responsive design

## API Endpoints

- `/chat/message` (POST): Send a message to the AI assistant
- `/api/chat/history` (GET): Get chat history (requires authentication)
- `/api/chat/message/:id` (DELETE): Delete a message (requires authentication)
- `/api/auth/register` (POST): Register a new user
- `/api/auth/login` (POST): Log in a user
- `/api/auth/logout` (POST): Log out the current user
- `/api/auth/user` (GET): Get current user information

## Authentication

The application supports user authentication, but it's not required for basic chat functionality. Authenticated users can access chat history.