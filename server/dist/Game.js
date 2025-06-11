"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const messages_1 = require("./messages");
class Game {
    constructor(player1, player2, gameId) {
        this.moveCount = 0;
        this.timerInterval = null;
        this.timeLeft = 60;
        this.player1 = player1;
        this.player2 = player2;
        this.board = new chess_js_1.Chess();
        this.startTime = new Date();
        this.isYourTurn = true;
        this.gameId = gameId || Math.random().toString(36).substring(7);
        // Initialize game for both players
        this.initializeGame();
        this.startTimer();
    }
    initializeGame() {
        // Send initial game state to both players
        this.player1.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            isYourTurn: true,
            payload: {
                color: "white",
                gameId: this.gameId,
                opponent: this.player2.userEmail
            }
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            isYourTurn: false,
            payload: {
                color: "black",
                gameId: this.gameId,
                opponent: this.player1.userEmail
            }
        }));
    }
    makeMove(socket, move) {
        // validate the type of move using zod
        if (this.moveCount % 2 === 0 && socket !== this.player1) {
            return;
        }
        if (this.moveCount % 2 === 1 && socket !== this.player2) {
            return;
        }
        try {
            this.board.move(move);
        }
        catch (e) {
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
            type: messages_1.MOVE,
            isYourTurn: this.isYourTurn,
            payload: move
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.MOVE,
            isYourTurn: !this.isYourTurn,
            payload: move
        }));
        this.moveCount++;
    }
    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timeLeft = 60;
        this.startTimer();
    }
    startTimer() {
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
    sendGameOver() {
        const currentPlayer = this.board.turn() === 'w' ? 'white' : 'black';
        let winner;
        let message;
        if (this.board.isStalemate() || this.board.isDraw()) {
            winner = 'No one win';
            message = "It's a draw!";
        }
        else {
            winner = currentPlayer === 'white' ? 'Player-2(Black)' : 'Player-1(White)';
        }
        // Send the same message to both players
        this.player1.send(JSON.stringify({
            type: messages_1.GAME_OVER,
            payload: {
                winner: winner,
                msg: message ? message : winner === 'Player-1(White)' ? 'You win' : 'You lose'
            }
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.GAME_OVER,
            payload: {
                winner: winner,
                msg: message ? message : winner === 'Player-2(Black)' ? 'You win' : 'You lose'
            }
        }));
    }
}
exports.Game = Game;
