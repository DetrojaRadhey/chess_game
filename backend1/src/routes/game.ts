import express, { RequestHandler } from 'express';
import { User } from '../models/User';
import { GameRequest } from '../models/GameRequest';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const sendrequest: RequestHandler = async (req: any, res: any) => {
    const { from, to } = req.body;

    try {
        const userTo = await User.findOne({ email: to });

        if (!userTo) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!userTo.friend_requests.includes(from)) {
            userTo.friend_requests.push(from);
            await userTo.save();
        }

        res.status(200).json({ message: 'Friend request sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const handleFriendRequest: RequestHandler = async (req: any, res: any) => {
    const { userEmail, friendEmail, action } = req.body;

    try {
        const user = await User.findOne({ email: userEmail });
        const friend = await User.findOne({ email: friendEmail });

        if (!user || !friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.friend_requests = user.friend_requests.filter(email => email !== friendEmail);

        if (action === 'accept') {
            if (!user.friend_list.includes(friendEmail)) {
                user.friend_list.push(friendEmail);
            }
            if (!friend.friend_list.includes(userEmail)) {
                friend.friend_list.push(userEmail);
            }
        }

        await user.save();
        await friend.save();

        res.status(200).json({ 
            message: `Friend request ${action}ed`,
            updatedUser: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const sendGameRequest = async (req: any, res: any) => {
    const { from, to } = req.body;
    
    try {
        // Check if users exist
        const fromUser = await User.findOne({ email: from });
        const toUser = await User.findOne({ email: to });
        
        if (!fromUser || !toUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const gameId = uuidv4();
        const gameRequest = await GameRequest.create({
            from,
            to,
            gameId,
            status: 'pending'
        });
        
        res.status(200).json({ 
            message: 'Game request sent',
            gameId: gameRequest.gameId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const handleGameRequest = async (req: any, res: any) => {
    const { to, from, gameId, action } = req.body;
    try {
        // Find the user and update their game requests
        const user = await User.findOne({ email: to });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove the game request from the user's game_requests array
        user.game_requests = user.game_requests.filter(
            request => !(request.from === from && request.gameId === gameId)
        );
        await user.save();

        res.status(200).json({
            message: `Game request ${action}ed`,
            gameId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

router.post('/sendfriendrequest', sendrequest);
router.post('/handlefriendrequest', handleFriendRequest);
router.post('/sendgamerequest', sendGameRequest);
router.post('/handlegamerequest', handleGameRequest);

export default router;