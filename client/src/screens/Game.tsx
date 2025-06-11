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
    const [isWaiting, setIsWaiting] = useState(() => {
        return localStorage.getItem('isWaiting') === 'true';
    });

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
                    setIsWaiting(false);
                    localStorage.removeItem('isWaiting');
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
                // Fix: Handle game request acceptance properly
                case SEND_GAME_REQUEST:
                    const accept = window.confirm(`${message.payload.from} wants to play with you. Accept?`);
                    if (accept) {
                        ws.send(JSON.stringify({
                            type: ACCEPT_GAME_REQUEST,
                            payload: {
                                gameId: message.payload.gameId,
                                from: message.payload.from,
                                to: userdetails.user.email
                            }
                        }));
                    }
                    break;
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [userdetails?.user?.email]);

    useEffect(() => {
        return () => {
            if (!started) {
                localStorage.removeItem('isWaiting');
            }
        };
    }, [started]);

    const handleSquareClick = (square: Square | null) => {
        if (square === null) {
            setSelectedSquare(null);
        } else if (selectedSquare === square) {
            setSelectedSquare(null);
        } else {
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

    if (!socket) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <div className="text-white text-lg">Connecting to game server...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => navigate('/')}
                                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                <span className="text-white font-bold text-lg sm:text-xl">♔</span>
                            </button>
                            <h1 className="text-lg sm:text-2xl font-bold text-white">ChessMaster</h1>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {started && playerColor && (
                                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3">
                                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                                        playerColor === 'white' 
                                            ? 'bg-white text-slate-900' 
                                            : 'bg-slate-900 text-white border border-slate-600'
                                    }`}>
                                        {playerColor}
                                    </div>
                                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                                        isYourTurn 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-slate-600 text-slate-300'
                                    }`}>
                                        {isYourTurn ? 'Your Turn' : 'Opponent'}
                                    </div>
                                </div>
                            )}
                            <div className="text-emerald-400 font-medium text-sm sm:text-base hidden sm:block">
                                {userdetails?.user?.name}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8 max-w-7xl mx-auto">
                    {/* Chess Board */}
                    <div className="lg:col-span-3 flex justify-center">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 sm:p-6 border border-slate-700/50 shadow-2xl">
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
                    </div>

                    {/* Game Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-4 sm:p-6">
                            {/* Timer */}
                            {started && (
                                <div className="mb-6">
                                    <div className="text-center">
                                        <div className="text-slate-400 text-sm mb-2">Time Remaining</div>
                                        <div className={`text-2xl sm:text-3xl font-bold ${
                                            timeLeft <= 10 ? 'text-red-400' : 'text-emerald-400'
                                        }`}>
                                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                        </div>
                                        {timeLeft <= 10 && (
                                            <div className="text-red-400 text-sm animate-pulse">Hurry up!</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Game Controls */}
                            {!started && (
                                <div className="space-y-4">
                                    {isWaiting ? (
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                                            <div className="text-white font-medium">Waiting for opponent...</div>
                                            <div className="text-slate-400 text-sm mt-2">Finding the perfect match</div>
                                        </div>
                                    ) : (
                                        <Button 
                                            onClick={() => {
                                                socket?.send(JSON.stringify({
                                                    type: INIT_GAME
                                                }));
                                                setIsWaiting(true);
                                                localStorage.setItem('isWaiting', 'true');
                                            }}
                                            className="w-full"
                                            size="lg"
                                        >
                                            🎮 Quick Match
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Friends List */}
                            {!started && showFriendsList && (
                                <div className="mt-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
                                        <h3 className="text-lg font-semibold text-white">Friends</h3>
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowGameRequests(true)}
                                        >
                                            📨 Requests
                                            {userdetails?.user?.game_requests?.length > 0 && (
                                                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                                    {userdetails.user.game_requests.length}
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                                        {userdetails?.user?.friend_list?.length > 0 ? (
                                            userdetails.user.friend_list.map((friend: string, index: number) => (
                                                <div key={index} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-semibold text-xs sm:text-sm">
                                                                {friend.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="text-white text-sm truncate">{friend}</span>
                                                    </div>
                                                    <Button 
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleFriendGameRequest(friend)}
                                                    >
                                                        ⚔️
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="text-slate-400 text-sm">No friends yet</div>
                                                <Button 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate('/')}
                                                    className="mt-2"
                                                >
                                                    Add Friends
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popups */}
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
    );
}