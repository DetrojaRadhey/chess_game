import React from 'react';

interface PromotionPopupProps {
    onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
    onClose: () => void;
}

const PromotionPopup: React.FC<PromotionPopupProps> = ({ onSelect, onClose }) => {
    return (
        <div className="fixed bg-black bg-opacity-60 top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="w-[400px] max-w-full bg-white rounded-xl p-4 flex flex-col relative" onClick={(event) => event.stopPropagation()}>
                <h1 className="text-xl font-bold mb-4">Promote Your Pawn</h1>
                <div className="flex justify-around">
                    <button className='bg-green-500 hover:bg-green-700 text-white rounded px-4' onClick={() => onSelect('q')}>Queen</button>
                    <button className='bg-green-500 hover:bg-green-700 text-white rounded px-4' onClick={() => onSelect('r')}>Rook</button>
                    <button className='bg-green-500 hover:bg-green-700 text-white rounded px-4' onClick={() => onSelect('b')}>Bishop</button>
                    <button className='bg-green-500 hover:bg-green-700 text-white rounded px-4' onClick={() => onSelect('n')}>Knight</button>
                </div>
            </div>
        </div>
    );
};

export default PromotionPopup;
