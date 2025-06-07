import React, { useState } from 'react';
import { Button } from './Button';
import { useAuth } from '../hooks/useAuth';

interface FriendRequestsPopupProps {
    onClose: () => void;
}

const FriendRequestsPopup: React.FC<FriendRequestsPopupProps> = ({ onClose }) => {
    const { userdetails, checkAuth } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRequests = userdetails?.user?.friend_requests.filter((email: string) => 
        email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleFriendRequest = async (email: string, action: 'accept' | 'reject') => {
        if (!userdetails?.user?.email) return;

        try {
            const response = await fetch('http://localhost:3000/game/handlefriendrequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    userEmail: userdetails.user.email,
                    friendEmail: email,
                    action
                })
            });

            if (response.ok) {
                // Refresh user data to update the UI
                checkAuth();
            } else {
                console.error('Failed to handle friend request');
            }
        } catch (error) {
            console.error('Error handling friend request:', error);
        }
    };

    return (
        <div className="fixed bg-black bg-opacity-60 top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="w-[400px] max-w-full bg-white rounded-xl p-4 flex flex-col relative" onClick={(event) => event.stopPropagation()}>
                <h1 className="text-xl font-bold mb-4">Friend Requests</h1>
                <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4 p-2 border rounded"
                />
                <div className="flex flex-col gap-2">
                    {filteredRequests.map((email: string, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                            <span>{email}</span>
                            <div className="flex gap-2">
                                <button 
                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                    onClick={() => handleFriendRequest(email, 'accept')}
                                >
                                    Accept
                                </button>
                                <button 
                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    onClick={() => handleFriendRequest(email, 'reject')}
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

export default FriendRequestsPopup;
