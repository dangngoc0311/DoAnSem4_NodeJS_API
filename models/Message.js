const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        id: { type: mongoose.Types.ObjectId },
        groupChat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GroupChat',
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        // replyMessage: {
        //     id: {
        //         type: mongoose.Schema.Types.ObjectId,
        //         ref: 'Message',
        //     },
        //     content: String,
        //     file: String,
        // },
        // seen: [
        //     {
        //         userId: {
        //             type: mongoose.Schema.Types.ObjectId,
        //             ref: 'User',
        //         },
        //         seenAt: String,
        //     },
        // ],
        // reactionMess: [
        //     {
        //         userId: {
        //             type: mongoose.Schema.Types.ObjectId,
        //             ref: 'User',
        //         },
        //         type_emotion: String,
        //     },
        // ],
        status: {
            type: Number,
            default: 1,
        },
        // file: String,
    },
    { timestamps: true },
);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Message };
