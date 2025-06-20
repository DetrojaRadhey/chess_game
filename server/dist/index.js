"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const GameManager_1 = require("./GameManager");
const mongoose_1 = __importDefault(require("mongoose"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const game_1 = __importDefault(require("./routes/game"));
const url_1 = require("url");
const app = (0, express_1.default)();
const wss = new ws_1.WebSocketServer({ port: 8080 });
const gameManager = new GameManager_1.GameManager();
// MongoDB connection
mongoose_1.default.connect('mongodb://localhost:27017/chess_game')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/api', auth_1.default);
app.use('/game', game_1.default);
// WebSocket connection
wss.on('connection', function connection(ws, req) {
    try {
        // Extract user email from query parameters
        const userEmail = new url_1.URL(req.url || '', 'ws://localhost:8080').searchParams.get('email');
        console.log('New connection from user:', userEmail); // Debug log
        if (userEmail) {
            gameManager.addUser(ws, userEmail);
        }
        else {
            console.warn('Connection attempt without email');
            gameManager.addUser(ws);
        }
        ws.on("close", () => {
            console.log('User disconnected:', userEmail); // Debug log
            gameManager.removeUser(ws);
        });
    }
    catch (error) {
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
