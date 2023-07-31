const mongoose = require('mongoose');

const groupChatSchema = new mongoose.Schema(
    {
        id: {
            type: mongoose.Schema.ObjectId
        },
        sender: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

const GroupChat = mongoose.model('GroupChat', groupChatSchema);

module.exports = { GroupChat };
