import express from 'express';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth';
import gameRouter from './routes/game';
import { URL } from 'url';

const app = express();
const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chess_game')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', authRouter);
app.use('/game', gameRouter);

// WebSocket connection
wss.on('connection', function connection(ws, req) {
    try {
        // Extract user email from query parameters
        const userEmail = new URL(
            req.url || '',
            'ws://localhost:8080'
        ).searchParams.get('email');

        console.log('New connection from user:', userEmail); // Debug log

        if (userEmail) {
            gameManager.addUser(ws, userEmail);
        } else {
            console.warn('Connection attempt without email');
            gameManager.addUser(ws);
        }

        ws.on("close", () => {
            console.log('User disconnected:', userEmail); // Debug log
            gameManager.removeUser(ws);
        });
    } catch (error) {
        console.error('Error handling WebSocket connection:', error);
        gameManager.addUser(ws);
    }
});

// Add error handling for the WebSocket server
wss.on('error', function error(error) {
    console.error('WebSocket Server Error:', error);
});

app.listen(3000, () => {
    console.log('HTTP server running on port 3000');
});
