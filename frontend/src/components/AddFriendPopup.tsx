import React, { useState } from 'react';
import { Button } from './Button';
import { useAuth } from '../hooks/useAuth';

interface AddFriendPopupProps {
    emails: string[];
    onClose: () => void;
}

const AddFriendPopup: React.FC<AddFriendPopupProps> = ({ emails, onClose }) => {
    const { userdetails } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmails = emails.filter(email => 
        email.toLowerCase().includes(searchTerm.toLowerCase()) && email != userdetails?.user?.email
    );

    const handleAddFriend = async (email: string) => {
        if (!userdetails) return;

        const requestData = {
            from: userdetails.user.email,
            to: email
        };

        try {
            const response = await fetch('http://localhost:3000/game/sendfriendrequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                console.log('Friend request sent successfully');
            } else {
                console.error('Failed to send friend request');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    return (
        <div className="fixed bg-black bg-opacity-60 top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="w-[400px] max-w-full bg-white rounded-xl p-4 flex flex-col relative" onClick={(event) => event.stopPropagation()}>
                <h1 className="text-xl font-bold mb-4">Add Friends</h1>
                <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4 p-2 border rounded"
                />
                <div className="flex flex-col">
                    {filteredEmails.map((email, index) => (
                        <div key={index} className="flex justify-between items-center mb-2">
                            <span>{email}</span>
                            <Button onClick={() => handleAddFriend(email)}>+</Button>
                        </div>
                    ))}
                </div>
                <Button onClick={onClose}>Close</Button>
            </div>
        </div>
    );
};

export default AddFriendPopup; 