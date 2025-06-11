import mongoose from 'mongoose';
const schema = mongoose.Schema;

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

export const GameRequest = mongoose.model('GameRequest', gameRequestSchema);
