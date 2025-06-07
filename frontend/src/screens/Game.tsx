import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { useSocket } from "../hooks/useSocket"
import { Chess, Square } from "chess.js";
import { GameOverPopup } from "../components/GameOverPopup";
import { useAuth } from "../hooks/useAuth";
import GameRequestsPopup from "../components/GameRequestsPopup";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const SEND_GAME_REQUEST = "send_game_request";
export const ACCEPT_GAME_REQUEST = "accept_game_request";

export const Game = () => {
    const navigate = useNavigate();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null);
    const [isYourTurn, setIsYourTurn] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [gameOver, setGameOver] = useState<{ winner: string; msg: string } | null>(null);
    const [showFriendsList, setShowFriendsList] = useState(true);
    const { userdetails } = useAuth();
    const [gameId, setGameId] = useState<string | null>(null);
    const [showGameRequests, setShowGameRequests] = useState(false);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        if (!userdetails?.user?.email) return;

        const ws = new WebSocket(`ws://localhost:8080?email=${userdetails.user.email}`);
        setSocket(ws);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received message:", message);

            switch (message.type) {
                case INIT_GAME:
                    setIsYourTurn(message.isYourTurn);
                    setPlayerColor(message.payload.color);
                    setGameId(message.payload.gameId);
                    setStarted(true);
                    setBoard(chess.board());
                    console.log("Game initialized, playing as", message.payload.color);
                    break;
                case MOVE:
                    setIsYourTurn(message.isYourTurn);
                    const move = message.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    break;
                case GAME_OVER:
                    setGameOver(message.payload);
                    break;
                case ACCEPT_GAME_REQUEST:
                    setStarted(true);
                    setPlayerColor(message.payload.color);
                    setGameId(message.payload.gameId);
                    setBoard(chess.board());
                    break;
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [userdetails?.user?.email]);

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

    const handleFriendGameRequest = async (friendEmail: string) => {
        try {
            const response = await fetch('http://localhost:3000/game/sendgamerequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: userdetails?.user?.email,
                    to: friendEmail
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Send WebSocket message for real-time notification
                socket?.send(JSON.stringify({
                    type: SEND_GAME_REQUEST,
                    payload: {
                        to: friendEmail,
                        from: userdetails?.user?.email,
                        gameId: data.gameId
                    }
                }));
                alert('Game request sent successfully!');
            } else {
                alert('Failed to send game request');
            }
        } catch (error) {
            console.error('Error sending game request:', error);
            alert('Error sending game request');
        }
    };

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

    // Add this useEffect to handle incoming game requests
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === SEND_GAME_REQUEST) {
                const accept = window.confirm(`${data.payload.from} wants to play with you. Accept?`);
                if (accept) {
                    socket.send(JSON.stringify({
                        type: ACCEPT_GAME_REQUEST,
                        payload: {
                            gameId: data.payload.gameId,
                            from: userdetails?.user?.email,
                            to: data.payload.from
                        }
                    }));
                }
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket, userdetails]);

    if (!socket) return <div>Connecting...</div>

    return <div className="h-screen bg-slate-950">
        <div className="container mx-auto h-full">
            <div className="pt-8 max-w-screen-lg w-full">
                <div className="grid grid-cols-6 gap-4 w-full">
                    <div className="col-span-4">
                        <ChessBoard
                            chess={chess} 
                            setBoard={setBoard} 
                            socket={socket} 
                            board={board} 
                            playerColor={playerColor} 
                            selectedSquare={selectedSquare}
                            setSelectedSquare={handleSquareClick}  
                            isYourTurn={isYourTurn} 
                        />
                    </div>
                    <div className="col-span-2 bg-slate-900 w-full flex justify-center">
                        <div className="pt-8">
                            {!started && (
                                <Button onClick={() => {
                                    socket?.send(JSON.stringify({
                                        type: INIT_GAME
                                    }))
                                }}>
                                    Play
                                </Button>
                            )}
                            {started && playerColor && (
                                <div className="text-white text-center">
                                    Playing as {playerColor}
                                </div>
                            )}
                            {started && (
                                <div className="mt-4 text-white text-center">
                                    Time left: {timeLeft}s
                                </div>
                            )}
                            {!started && showFriendsList && (
                                <div className="mt-4 text-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold">Friends to Play With:</h3>
                                        <button 
                                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                            onClick={() => setShowGameRequests(true)}
                                        >
                                            Game Requests
                                        </button>
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <div className="bg-gray-800 rounded-md p-2">
                                            {userdetails?.user?.friend_list?.map((friend: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <span className="text-white">{friend}</span>
                                                    <button 
                                                        className="bg-green-500 w-8 m-2 hover:bg-green-600 text-white rounded-md"
                                                        onClick={() => handleFriendGameRequest(friend)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {gameOver && (
            <GameOverPopup 
                winner={gameOver.winner} 
                message={gameOver.msg} 
                onclose={() => navigate('/')} 
            />
        )}
        {showGameRequests && (
            <GameRequestsPopup onClose={() => setShowGameRequests(false)} />
        )}
    </div>
}