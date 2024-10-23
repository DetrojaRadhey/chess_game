"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authCheck = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).json({ message: "No token found" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = yield User_1.User.findOne({ email: decoded.email });
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
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
});
const googleAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name } = req.body;
    try {
        let user = yield User_1.User.findOne({ email });
        if (!user) {
            user = yield User_1.User.create({
                email,
                name,
                friend_requests: [],
                game_requests: [],
                friend_list: []
            });
        }
        const token = jsonwebtoken_1.default.sign({ email }, JWT_SECRET, { expiresIn: '2d' });
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 2 * 24 * 60 * 60 * 1000 // 2 days
        });
        return res.json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
});
router.get('/auth/check', authCheck);
router.post('/auth/google', googleAuth);
exports.default = router;
