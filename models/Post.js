const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const commentSchema = new mongoose.Schema(
    {
        id: { type: mongoose.Types.ObjectId },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userName: {
            type: String
        },
        userAvatar: {
            type: String
        },
        content: {
            type: String,
            required: true,
        },
        cmtDate: { type: Date }
    }
);

const PostSchema = new mongoose.Schema({
    id: { type: mongoose.Types.ObjectId },
    userId: {
        type: String,
        required: true,
    },
    post: {
        type: String,
        max: 500,
    },
    postImg: {
        type: Array,
        default: [],
    },
    liked: { type: Boolean },
    likes: {
        type: Array,
        default: [],
    },
    comments: [commentSchema]  ,
}, {
    timestamps: true
})


const Post = mongoose.model("Post", PostSchema);
module.exports = Post;

