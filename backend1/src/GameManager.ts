import WebSocket from "ws";
import { INIT_GAME, MOVE, GAME_OVER, SEND_GAME_REQUEST, ACCEPT_GAME_REQUEST } from "./messages";
import { Game } from "./Game";
import { User } from "./models/User";

interface WebSocketWithUser extends WebSocket {
    userEmail?: string;
}

export class GameManager {
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: WebSocketWithUser[];
    private friendGames: Map<string, Game>;

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
        this.friendGames = new Map();
    }

    addUser(socket: WebSocketWithUser, userEmail?: string) {
        this.users.push(socket);
        if (userEmail) {
            socket.userEmail = userEmail;
        }
        this.addHandler(socket);
    }

    removeUser(socket: WebSocket) {
        this.users = this.users.filter(user => user !== socket);
        const game = this.findGameBySocket(socket);
        if (game) {
            this.removeGame(game);
        }
    }

    private async addHandler(socket: WebSocketWithUser) {
        socket.on("message", async (data) => {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case INIT_GAME:
                    if (this.pendingUser) {
                        const game = new Game(this.pendingUser, socket);
                        this.games.push(game);
                        this.pendingUser = null;
                    } else {
                        this.pendingUser = socket;
                    }
                    break;

                case SEND_GAME_REQUEST:
                    const { to, from, gameId } = message.payload;
                    try {
                        // Store game request in database
                        const toUser = await User.findOne({ email: to });
                        if (toUser) {
                            toUser.game_requests.push({ from, gameId });
                            await toUser.save();
                        }

                        // Send real-time notification
                        const recipientSocket = this.users.find(user => user.userEmail === to);
                        if (recipientSocket) {
                            recipientSocket.send(JSON.stringify({
                                type: SEND_GAME_REQUEST,
                                payload: { from, gameId }
                            }));
                        }
                    } catch (error) {
                        console.error('Error handling game request:', error);
                    }
                    break;

                case ACCEPT_GAME_REQUEST:
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
                        const friendGame = new Game(player1Socket, player2Socket, acceptedGameId);
                        this.friendGames.set(acceptedGameId, friendGame);

                        // Send game initialization to both players
                        player1Socket.send(JSON.stringify({
                            type: INIT_GAME,
                            isYourTurn: true,
                            payload: {
                                color: "white",
                                gameId: acceptedGameId,
                                opponent: acceptedFrom
                            }
                        }));

                        player2Socket.send(JSON.stringify({
                            type: INIT_GAME,
                            isYourTurn: false,
                            payload: {
                                color: "black",
                                gameId: acceptedGameId,
                                opponent: acceptedTo
                            }
                        }));

                        // Update user's game_requests in database
                        const user = await User.findOne({ email: acceptedTo });
                        if (user) {
                            user.game_requests = user.game_requests.filter(
                                req => !(req.from === acceptedFrom && req.gameId === acceptedGameId)
                            );
                            await user.save();
                        }

                    } catch (error) {
                        console.error('Error handling game acceptance:', error);
                    }
                    break;

                case MOVE:
                    const gameToMove = this.findGameBySocket(socket);
                    if (gameToMove) {
                        gameToMove.makeMove(socket, message.payload.move);
                    }
                    break;

                case GAME_OVER:
                    const gameToEnd = this.findGameBySocket(socket);
                    if (gameToEnd) {
                        this.removeGame(gameToEnd);
                    }
                    break;
            }
        });
    }

    private findGameBySocket(socket: WebSocket): Game | undefined {
        return this.games.find(game => 
            game.player1 === socket || game.player2 === socket
        ) || Array.from(this.friendGames.values()).find(game =>
            game.player1 === socket || game.player2 === socket
        );
    }

    removeGame(game: Game) {
        this.games = this.games.filter(g => g !== game);
        for (const [gameId, g] of this.friendGames.entries()) {
            if (g === game) {
                this.friendGames.delete(gameId);
                break;
            }
        }
    }
}