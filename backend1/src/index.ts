import express from 'express';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth';

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

// WebSocket connection
wss.on('connection', function connection(ws) {
    gameManager.addUser(ws);
    ws.on("disconnect", () => gameManager.removeUser(ws));
});

app.listen(3000, () => {
    console.log('HTTP server running on port 3000');
});
