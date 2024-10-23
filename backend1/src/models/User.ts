import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    friend_requests: [{
        type: String  // email addresses
    }],
    game_requests: [{
        type: String  // email addresses
    }],
    friend_list: [{
        type: String  // email addresses
    }]
});

export const User = mongoose.model('User', userSchema);

