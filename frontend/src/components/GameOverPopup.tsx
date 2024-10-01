import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface GameOverPopupProps {
    winner: string;
    message: string;
    onclose: () => void; // Add this line
}

export const GameOverPopup: React.FC<GameOverPopupProps> = ({ winner, message, onclose }) => {
    const navigate = useNavigate();
    console.log(winner,message);

    return (
        <div className="fixed bg-black bg-opacity-60 top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center" onClick={onclose}>
            <div className="w-[600px] max-w-full h-[400px] bg-white rounded-xl p-4 flex flex-col relative" onClick={(event)=> event.stopPropagation()}>
                <h1 className="text-2xl font-bold mb-4">Game Over</h1>
                <h2 className="mb-4">Winner: {winner}</h2>
                <h3 className="mb-4">{message}</h3>
                <Button onClick={() => navigate('/')}>
                    Back to Home
                </Button>
            </div>
        </div>
    );
};
