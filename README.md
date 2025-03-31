# Medical Chatbot

A web-based medical chatbot application built with Flask and OpenAI API.

## Project Structure

This project follows a structured approach with separate backend and frontend components:

- **Backend**: Flask application with OpenAI API integration
- **Frontend**: Next.js application with Tailwind CSS

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Create a virtual environment:

   ```
   python -m venv venv
   ```

3. Activate the virtual environment:

   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

5. Set up environment variables:

   - Create a `.env` file in the backend directory
   - Add your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`

6. Run the Flask application:
   ```
   flask run
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   - Create a `.env.local` file in the frontend directory
   - Add the backend API URL: `NEXT_PUBLIC_API_URL=http://localhost:5000`

4. Run the development server:
   ```
   npm run dev
   ```

## Features

- User authentication (register, login, logout)
- Interactive chat interface
- Medical information retrieval via OpenAI
- Chat history storage

## Technologies Used

### Backend

- Flask (Python web framework)
- OpenAI API
- SQLite (database)
- Flask-Login (authentication)

### Frontend

- Next.js (React framework)
- Tailwind CSS (styling)
- Axios (API requests)
- React Context API (state management)
