import { WebSocket } from "ws";
import { Chess } from 'chess.js'
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";

export class Game {
    public player1: WebSocket
    public player2: WebSocket
    private board: Chess
    private isYourTurn: boolean
    private startTime: Date
    private moveCount = 0;
    private timerInterval: NodeJS.Timeout | null = null;
    private timeLeft = 60;
    public gameId: string;

    constructor(player1: WebSocket, player2: WebSocket, gameId?: string) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Chess();
        this.startTime = new Date();
        this.isYourTurn = true;
        this.gameId = gameId || Math.random().toString(36).substring(7);

        // Initialize game for both players
        this.initializeGame();
        this.startTimer();
    }

    private initializeGame() {
        // Send initial game state to both players
        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            isYourTurn: true,
            payload: {
                color: "white",
                gameId: this.gameId,
                opponent: (this.player2 as any).userEmail
            }
        }));

        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            isYourTurn: false,
            payload: {
                color: "black",
                gameId: this.gameId,
                opponent: (this.player1 as any).userEmail
            }
        }));
    }

    makeMove(socket: WebSocket, move: {
        from: string;
        to: string;
    }) {
        // validate the type of move using zod

        if (this.moveCount % 2 === 0 && socket !== this.player1) {
            return;
        }
        if (this.moveCount % 2 === 1 && socket !== this.player2) {
            return;
        }

        try {
            this.board.move(move);
        } catch (e) {
            console.log(e);
            return;
        }

        // Reset the timer for the next player
        this.resetTimer();

        if (this.board.isGameOver()) {
            this.sendGameOver();
            return;
        }

        // send the updated board to both the players
        this.isYourTurn = !this.isYourTurn;
        this.player1.send(JSON.stringify({
            type: MOVE,
            isYourTurn: this.isYourTurn,
            payload: move
        }));
        this.player2.send(JSON.stringify({
            type: MOVE,
            isYourTurn: !this.isYourTurn,
            payload: move
        }));

        this.moveCount++;
    }

    private resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timeLeft = 60;
        this.startTimer();
    }

    private startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.sendGameOver();
                if (this.timerInterval !== null) {
                    clearInterval(this.timerInterval);
                }
            }
        }, 1000);
    }

    private sendGameOver() {
        const currentPlayer = this.board.turn() === 'w' ? 'white' : 'black';
        let winner;
        let message;

        if (this.board.isStalemate() || this.board.isDraw()) {
            winner = 'No one win';
            message = "It's a draw!";
        } else {
            winner = currentPlayer === 'white' ? 'Player-2(Black)' : 'Player-1(White)';
        }

        // Send the same message to both players
        this.player1.send(JSON.stringify({
            type: GAME_OVER,
            payload: {
                winner: winner,
                msg: message ? message : winner === 'Player-1(White)' ? 'You win' : 'You lose'
            }
        }));
        this.player2.send(JSON.stringify({
            type: GAME_OVER,
            payload: {
                winner: winner,
                msg: message ? message : winner === 'Player-2(Black)' ? 'You win' : 'You lose'
            }
        }));
    }
}