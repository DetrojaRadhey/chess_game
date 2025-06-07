"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRequest = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = mongoose_1.default.Schema;
const gameRequestSchema = new schema({
    from: String,
    to: String,
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    gameId: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 // Automatically delete after 1 hour
    }
});
exports.GameRequest = mongoose_1.default.model('GameRequest', gameRequestSchema);
