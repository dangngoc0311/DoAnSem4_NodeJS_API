const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const StorySchema = new mongoose.Schema({
    id: { type: mongoose.Types.ObjectId },
    userId: {
        type: String,
        required: true,
    },
    swipeText: {
        type: String,
        max: 500,
    },
    story_image: {
        type:String
    },
    status: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
})

const Story = mongoose.model("Story", StorySchema);
module.exports = Story;

