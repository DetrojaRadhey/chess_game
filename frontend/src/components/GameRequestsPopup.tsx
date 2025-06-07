import React from 'react';
import { Button } from './Button';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface GameRequestsPopupProps {
    onClose: () => void;
}

const GameRequestsPopup: React.FC<GameRequestsPopupProps> = ({ onClose }) => {
    const { userdetails, checkAuth } = useAuth();
    const navigate = useNavigate();
    const gameRequests = userdetails?.user?.game_requests || [];

    const handleGameRequest = async (from: string, gameId: string, action: 'accept' | 'reject') => {
        if (!userdetails?.user?.email) return;

        try {
            const response = await fetch('http://localhost:3000/game/handlegamerequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: userdetails.user.email,
                    from,
                    gameId,
                    action
                })
            });

            if (response.ok) {
                checkAuth();
                
                if (action === 'accept') {
                    const ws = new WebSocket(`ws://localhost:8080?email=${userdetails.user.email}`);
                    ws.onopen = () => {
                        ws.send(JSON.stringify({
                            type: 'accept_game_request',
                            payload: {
                                gameId,
                                from,
                                to: userdetails.user.email
                            }
                        }));
                        navigate('/game');
                    };
                }
            } else {
                console.error('Failed to handle game request');
            }
        } catch (error) {
            console.error('Error handling game request:', error);
        }
    };

    return (
        <div className="fixed bg-black bg-opacity-60 top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="w-[400px] max-w-full bg-white rounded-xl p-4 flex flex-col relative" onClick={(e) => e.stopPropagation()}>
                <h1 className="text-xl font-bold mb-4">Game Requests</h1>
                <div className="flex flex-col gap-2">
                    {gameRequests.map((request: { from: string, gameId: string }, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                            <span>{request.from}</span>
                            <div className="flex gap-2">
                                <button 
                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                    onClick={() => handleGameRequest(request.from, request.gameId, 'accept')}
                                >
                                    Accept
                                </button>
                                <button 
                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    onClick={() => handleGameRequest(request.from, request.gameId, 'reject')}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <Button onClick={onClose}>Close</Button>
            </div>
        </div>
    );
};

export default GameRequestsPopup;
