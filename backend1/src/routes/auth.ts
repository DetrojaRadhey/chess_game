import express, { RequestHandler } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authCheck: RequestHandler = async (req: any, res: any) => {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.status(401).json({ message: "No token found" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
        const user = await User.findOne({ email: decoded.email });
        
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        return res.json({ 
            isAuthenticated: true, 
            user: { 
                email: user.email, 
                name: user.name 
            } 
        });
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

const googleAuth: RequestHandler = async (req: any, res: any) => {
    const { email, name } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                email,
                name,
                friend_requests: [],
                game_requests: [],
                friend_list: []
            });
        }

        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '2d' });
        
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 2 * 24 * 60 * 60 * 1000 // 2 days
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

router.get('/auth/check', authCheck);
router.post('/auth/google', googleAuth);

export default router;