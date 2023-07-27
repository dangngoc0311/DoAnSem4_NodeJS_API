const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


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
    comments: { type: Array, default: [], }
}, {
    timestamps: true
})


const Post = mongoose.model("Post", PostSchema);
module.exports = Post;

