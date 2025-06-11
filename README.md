# Chess Game

A modern, real-time multiplayer chess application built with React, TypeScript, and WebSocket technology.

## 🎮 Features

- Real-time multiplayer chess gameplay
- User authentication with Auth0 and Google OAuth
- Interactive chess board with legal move highlighting
- Game state persistence
- Responsive design with Tailwind CSS
- WebSocket-based real-time communication
- Secure JWT-based authentication
- MongoDB database integration

## 🪟 Images
![Screenshot 2025-06-11 162652](https://github.com/user-attachments/assets/d83a7a17-cada-4870-8066-c13a5b9b1a47)
![Screenshot 2025-06-11 162819](https://github.com/user-attachments/assets/f8fa2d8c-c055-4972-b957-504e280c4657)
![Screenshot 2025-06-11 162922](https://github.com/user-attachments/assets/8299d688-c502-44e2-8b0d-291f58122435)

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Chess.js for chess logic
- Auth0 & Google OAuth for authentication

### Backend
- Node.js
- Express.js
- WebSocket (ws)
- MongoDB with Mongoose
- JWT for authentication
- TypeScript

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Auth0 account (for authentication)
- Google Cloud Console account (for OAuth)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd chess
```

2. Install frontend dependencies
```bash
cd client
npm install
```

3. Install backend dependencies
```bash
cd ../server
npm install
```

4. Environment Setup

Create a `.env` file in the server directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Create a `.env` file in the client directory:
```env
VITE_AUTH0_DOMAIN=your_auth0_domain
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=http://localhost:3000
```

### Running the Application

1. Start the backend server
```bash
cd server
npm run dev
```

2. Start the frontend development server
```bash
cd client
npm run dev
```

The application should now be running at `http://localhost:5173`

## 🎯 Game Rules

- Standard chess rules apply
- Players take turns making moves
- Illegal moves are prevented
- Game state is synchronized in real-time between players
- Games are saved and can be resumed

## 🔒 Security Features

- JWT-based authentication
- Secure WebSocket connections
- Protected API endpoints
- OAuth 2.0 integration
- Environment variable protection
