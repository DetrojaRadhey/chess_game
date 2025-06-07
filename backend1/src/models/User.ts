import mongoose from 'mongoose';
const schema = mongoose.Schema;

interface GameRequest {
    from: string;
    gameId: string;
}

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

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    friend_requests: string[];
    friend_list: string[];
    game_requests: GameRequest[];
}

export const User = mongoose.model<IUser>('User', userSchema);