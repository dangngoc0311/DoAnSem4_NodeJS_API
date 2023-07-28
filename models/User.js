const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    id: { type: mongoose.Types.ObjectId },
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    email: {
        type: String,
        required: true,
        max: 50,
        unique: true,
    }, about: { type: String },
    phone: { type: String },
    password: {
        type: String,
        required: true,
        min: 6,
    },
    userImg: {
        type: String,
        default: "",
    },
    posts: {
        type: Array,
        default: []
    },
    followers: {
        type: Array,
        default: []
    },
    followings: {
        type: Array,
        default: []
    },
    allmessages: {
        type: Array,
        default: []
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
},
    { timestamps: true })

const User = mongoose.model("User", userSchema);
module.exports = User;