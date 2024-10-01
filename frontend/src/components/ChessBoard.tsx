import { Color, PieceSymbol, Square } from "chess.js";
import { useState, useEffect, useCallback } from "react";
import { MOVE } from "../screens/Game";
import PromotionPopup from "./PromotionPopup";

export const ChessBoard = ({ chess, board, socket, setBoard, playerColor, selectedSquare, setSelectedSquare, isYourTurn }: {
    chess: any;
    setBoard: any;
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket;
    playerColor: "white" | "black" | null;
    selectedSquare: Square | null;
    setSelectedSquare: (square: Square | null) => void;
    isYourTurn: boolean;
}) => {
    const [from, setFrom] = useState<Square | null>(null);
    const [promotionMove, setPromotionMove] = useState<{ from: Square, to: Square } | null>(null);
    
    const reversedBoard = playerColor === "black" ? [...board].reverse().map(row => [...row].reverse()) : board;

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.chess-board')) {
                setSelectedSquare(null);
                setFrom(null);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [setSelectedSquare]);

    const handleSquareClick = useCallback((squareRepresentation: Square) => {
        if (!isYourTurn) return;

        setSelectedSquare(squareRepresentation);

        if (!from) {
            setFrom(squareRepresentation);
        } else {
            if (from === squareRepresentation) {
                setFrom(null);
            } else {
                const move = {
                    from,
                    to: squareRepresentation
                };

                try {
                    // Check if the move is a pawn promotion
                    const piece = chess.get(from);
                    const isPromotion = piece && piece.type === 'p' && (squareRepresentation[1] === '8' || squareRepresentation[1] === '1');

                    if (isPromotion) {
                        // Set the promotion move and wait for user selection
                        setPromotionMove(move);
                    } else {
                        const chessMove = chess.move(move);
                        if (chessMove) {
                            socket.send(JSON.stringify({
                                type: MOVE,
                                payload: {
                                    move: move
                                }
                            }));
                            setFrom(null);
                            setBoard(chess.board());
                            setSelectedSquare(null);
                        } else {
                            setFrom(squareRepresentation);
                        }
                    }
                } catch (error) {
                    console.error("Error making move:", error);
                    setFrom(null);
                    setSelectedSquare(null);
                }
            }
        }
    }, [from, isYourTurn, chess, socket, setBoard, setSelectedSquare]);

    const handlePromotion = useCallback((promotionPiece: 'q' | 'r' | 'b' | 'n') => {
        if (promotionMove) {
            const move = { ...promotionMove, promotion: promotionPiece };
            const chessMove = chess.move(move);
            if (chessMove) {
                socket.send(JSON.stringify({
                    type: MOVE,
                    payload: {
                        move: move
                    }
                }));
                setBoard(chess.board());
            }
            setPromotionMove(null);
            setFrom(null);
            setSelectedSquare(null);
        }
    }, [chess, promotionMove, setBoard, socket]);

    const closePromotionPopup = useCallback(() => {
        setPromotionMove(null);
        setFrom(null);
        setSelectedSquare(null);
    }, [setSelectedSquare]);

    return (
        <div className="chess-board text-white-200 w-full relative">
            {reversedBoard.map((row, i) => {
                return <div key={i} className="flex">
                    {row.map((square, j) => {
                        const file = playerColor === "black" ? 7 - j : j;
                        const rank = playerColor === "black" ? i : 7 - i;
                        const squareRepresentation = String.fromCharCode(97 + file) + (rank + 1) as Square;

                        return <div key={j} onClick={() => handleSquareClick(squareRepresentation)} 
                        className={`w-20 h-20 ${
                            selectedSquare === squareRepresentation
                                ? 'bg-yellow-200'
                                : (i+j) % 2 == 0 ? 'bg-green-500' : 'bg-white'
                        } ${!isYourTurn ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="w-full justify-center flex h-full">
                                <div className="h-full justify-center flex flex-col">
                                    {square ? <img className="w-12" src={`/${square?.color === "b" ?
                                        square?.type: `${square?.type?.toUpperCase()} copy`}.png`} /> : 
                                    null}
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            })}
            {promotionMove && (
                <PromotionPopup
                    onSelect={handlePromotion}
                    onClose={closePromotionPopup}
                />
            )}
        </div>
    );
}