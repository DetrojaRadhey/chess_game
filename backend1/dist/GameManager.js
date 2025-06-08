"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const messages_1 = require("./messages");
const Game_1 = require("./Game");
const User_1 = require("./models/User");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
        this.friendGames = new Map();
    }
    addUser(socket, userEmail) {
        // If user has an email, remove any existing socket connections for this user
        if (userEmail) {
            // Remove old socket from users array
            const oldSocket = this.users.find(user => user.userEmail === userEmail);
            if (oldSocket) {
                this.removeUser(oldSocket);
            }
            // If the old socket was pending, clear it
            if (this.pendingUser && this.pendingUser.userEmail === userEmail) {
                this.pendingUser = null;
            }
            socket.userEmail = userEmail;
        }
        this.users.push(socket);
        this.addHandler(socket);
    }
    removeUser(socket) {
        // Check if the socket being removed is the pendingUser
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }
        this.users = this.users.filter(user => user !== socket);
        const game = this.findGameBySocket(socket);
        if (game) {
            this.removeGame(game);
        }
    }
    addHandler(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            socket.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
                const message = JSON.parse(data.toString());
                switch (message.type) {
                    case messages_1.INIT_GAME:
                        if (this.pendingUser) {
                            const game = new Game_1.Game(this.pendingUser, socket);
                            this.games.push(game);
                            this.pendingUser = null;
                        }
                        else {
                            this.pendingUser = socket;
                        }
                        break;
                    case messages_1.SEND_GAME_REQUEST:
                        const { to, from, gameId } = message.payload;
                        try {
                            // Store game request in database
                            const toUser = yield User_1.User.findOne({ email: to });
                            if (toUser) {
                                toUser.game_requests.push({ from, gameId });
                                yield toUser.save();
                            }
                            // Send real-time notification
                            const recipientSocket = this.users.find(user => user.userEmail === to);
                            if (recipientSocket) {
                                recipientSocket.send(JSON.stringify({
                                    type: messages_1.SEND_GAME_REQUEST,
                                    payload: { from, gameId }
                                }));
                            }
                        }
                        catch (error) {
                            console.error('Error handling game request:', error);
                        }
                        break;
                    case messages_1.ACCEPT_GAME_REQUEST:
                        try {
                            const { gameId: acceptedGameId, from: acceptedFrom, to: acceptedTo } = message.payload;
                            // Find both players' sockets
                            const player1Socket = this.users.find(user => user.userEmail === acceptedTo);
                            const player2Socket = this.users.find(user => user.userEmail === acceptedFrom);
                            if (!player1Socket || !player2Socket) {
                                console.error('One or both players not found');
                                return;
                            }
                            // Create new game instance
                            const friendGame = new Game_1.Game(player1Socket, player2Socket, acceptedGameId);
                            this.friendGames.set(acceptedGameId, friendGame);
                            // Send game initialization to both players
                            player1Socket.send(JSON.stringify({
                                type: messages_1.INIT_GAME,
                                isYourTurn: true,
                                payload: {
                                    color: "white",
                                    gameId: acceptedGameId,
                                    opponent: acceptedFrom
                                }
                            }));
                            player2Socket.send(JSON.stringify({
                                type: messages_1.INIT_GAME,
                                isYourTurn: false,
                                payload: {
                                    color: "black",
                                    gameId: acceptedGameId,
                                    opponent: acceptedTo
                                }
                            }));
                            // Update user's game_requests in database
                            const user = yield User_1.User.findOne({ email: acceptedTo });
                            if (user) {
                                user.game_requests = user.game_requests.filter(req => !(req.from === acceptedFrom && req.gameId === acceptedGameId));
                                yield user.save();
                            }
                        }
                        catch (error) {
                            console.error('Error handling game acceptance:', error);
                        }
                        break;
                    case messages_1.MOVE:
                        const gameToMove = this.findGameBySocket(socket);
                        if (gameToMove) {
                            gameToMove.makeMove(socket, message.payload.move);
                        }
                        break;
                    case messages_1.GAME_OVER:
                        const gameToEnd = this.findGameBySocket(socket);
                        if (gameToEnd) {
                            this.removeGame(gameToEnd);
                        }
                        break;
                }
            }));
        });
    }
    findGameBySocket(socket) {
        return this.games.find(game => game.player1 === socket || game.player2 === socket) || Array.from(this.friendGames.values()).find(game => game.player1 === socket || game.player2 === socket);
    }
    removeGame(game) {
        this.games = this.games.filter(g => g !== game);
        for (const [gameId, g] of this.friendGames.entries()) {
            if (g === game) {
                this.friendGames.delete(gameId);
                break;
            }
        }
    }
}
exports.GameManager = GameManager;
