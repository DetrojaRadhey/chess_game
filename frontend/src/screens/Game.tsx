import { useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { useSocket } from "../hooks/useSocket"
import { Chess, Square } from "chess.js";
import { GameOverPopup } from "../components/GameOverPopup";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";

export const Game = () => {
    const socket = useSocket();
    const navigate = useNavigate();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null);
    const [isYourTurn, setIsYourTurn] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [gameOver, setGameOver] = useState<{ winner: string; msg: string } | null>(null);

    // Add this new function
    const handleSquareClick = (square: Square | null) => {
        if (square === null) {
            // Clicked outside the board
            setSelectedSquare(null);
        } else if (selectedSquare === square) {
            // Clicked on the same square again
            setSelectedSquare(null);
        } else {
            // Clicked on a different square
            setSelectedSquare(square);
        }
    };

    useEffect(() => {
        if(!socket) return;
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);
            setIsYourTurn(message.isYourTurn);
            switch (message.type) {
                case INIT_GAME:
                    setBoard(chess.board());
                    setStarted(true);
                    setPlayerColor(message.payload.color);
                    console.log("Game initialized, playing as", message.payload.color);
                    break;
                case MOVE:
                    const move = message.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    console.log("Move made");
                    break;
                case GAME_OVER:
                    setGameOver(message.payload); // Ensure this is set correctly
                    // socket.close();
                    break;
            }
        }
    }, [socket, isYourTurn]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isYourTurn && started && !gameOver) {
            // Reset timeLeft to 60 seconds whenever it's the player's turn
            setTimeLeft(60);
            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(timer);
                        socket?.send(JSON.stringify({
                            type: GAME_OVER,
                            payload: {
                                winner: playerColor === 'white' ? 'black' : 'white',
                                msg: `${playerColor === 'white' ? 'Player2' : 'Player1'} WIN`
                            }
                        }));
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isYourTurn, started, gameOver, playerColor, socket]);

    if (!socket) return <div>Connecting...</div>

    return <div className="justify-center flex">
        <div className="pt-8 max-w-screen-lg w-full">
            <div className="grid grid-cols-6 gap-4 w-full">
                <div className="col-span-4 w-full">
                    <ChessBoard 
                        chess={chess} 
                        setBoard={setBoard} 
                        socket={socket} 
                        board={board} 
                        playerColor={playerColor} 
                        selectedSquare={selectedSquare}
                        setSelectedSquare={handleSquareClick}  // Update this line
                        isYourTurn={isYourTurn} // Pass isYourTurn prop
                    />
                </div>
                <div className="col-span-2 bg-slate-900 w-full flex justify-center">
                    <div className="pt-8">
                        {!started && <Button onClick={() => {
                            socket.send(JSON.stringify({
                                type: INIT_GAME
                            }))
                        }}>
                            Play
                        </Button>}
                        {started && playerColor && (
                            <div className={`w-16 h-16 rounded-full ${playerColor === 'white' ? 'bg-white' : 'bg-black'} ${playerColor === 'white' ? 'text-black' : 'text-white'} flex items-center justify-center ${isYourTurn ? 'border-4 border-green-500' : 'border-4 border-yellow-500'} p-2`}>
                                <span>{playerColor}</span>
                            </div>
                        )}
                        {started && (
                            <div className="mt-4 text-white text-center">
                                Time left: {timeLeft}s
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        {gameOver && ( // Ensure this condition is correct
            <GameOverPopup 
                winner={gameOver.winner} 
                message={gameOver.msg} 
                onclose={() => navigate('/')} 
            />
        )}
    </div>
}