"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = mongoose_1.default.Schema;
const userSchema = new schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    friend_requests: [String],
    friend_list: [String],
    game_requests: [{
            from: String,
            gameId: String
        }]
});
exports.User = mongoose_1.default.model('User', userSchema);
