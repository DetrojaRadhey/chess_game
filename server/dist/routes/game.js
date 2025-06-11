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
const GameRequest_1 = require("../models/GameRequest");
const uuid_1 = require("uuid");
const router = express_1.default.Router();
const sendrequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = req.body;
    try {
        const userTo = yield User_1.User.findOne({ email: to });
        if (!userTo) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!userTo.friend_requests.includes(from)) {
            userTo.friend_requests.push(from);
            yield userTo.save();
        }
        res.status(200).json({ message: 'Friend request sent' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
const handleFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userEmail, friendEmail, action } = req.body;
    try {
        const user = yield User_1.User.findOne({ email: userEmail });
        const friend = yield User_1.User.findOne({ email: friendEmail });
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
        yield user.save();
        yield friend.save();
        res.status(200).json({
            message: `Friend request ${action}ed`,
            updatedUser: user
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
const sendGameRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = req.body;
    try {
        // Check if users exist
        const fromUser = yield User_1.User.findOne({ email: from });
        const toUser = yield User_1.User.findOne({ email: to });
        if (!fromUser || !toUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const gameId = (0, uuid_1.v4)();
        const gameRequest = yield GameRequest_1.GameRequest.create({
            from,
            to,
            gameId,
            status: 'pending'
        });
        res.status(200).json({
            message: 'Game request sent',
            gameId: gameRequest.gameId
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
const handleGameRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { to, from, gameId, action } = req.body;
    try {
        // Find the user and update their game requests
        const user = yield User_1.User.findOne({ email: to });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Remove the game request from the user's game_requests array
        user.game_requests = user.game_requests.filter(request => !(request.from === from && request.gameId === gameId));
        yield user.save();
        res.status(200).json({
            message: `Game request ${action}ed`,
            gameId
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/sendfriendrequest', sendrequest);
router.post('/handlefriendrequest', handleFriendRequest);
router.post('/sendgamerequest', sendGameRequest);
router.post('/handlegamerequest', handleGameRequest);
exports.default = router;
