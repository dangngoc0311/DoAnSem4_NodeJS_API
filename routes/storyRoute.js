// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
const router = require("express").Router();
const fs = require('fs');
const path = require('path');
const Story = require("../models/PostStory");
const User = require("../models/User");
const moment = require('moment'); 
// const app = express();
// app.use(bodyParser.json());

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/your-database-name', { useNewUrlParser: true, useUnifiedTopology: true });

// const User = require('./models/user');
// const Story = require('./models/story');

// // API to create a story for a user
// app.post('/api/story', async (req, res) => {
//     try {
//         const { userId, content } = req.body;
//         const story = new Story({ userId, content });
//         await story.save();

//         const user = await User.findById(userId);
//         user.stories.push(story);
//         await user.save();

//         return res.status(201).json(story);
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Server error' });
//     }
// });

// // API to get stories for a user
// app.get('/api/stories/:userId', async (req, res) => {
//     try {
//         const userId = req.params.userId;
//         const user = await User.findById(userId).populate('stories');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         return res.status(200).json(user.stories);
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Server error' });
//     }
// });

// // Start the server
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

router.post('/postStory', async (req, res) => {
    console.log('da vao day ');
    try {
        const { userId, swipeText, story_image } = req.body;

        console.log(swipeText);
        // Kiểm tra userId hoặc các dữ liệu cần thiết khác nếu cần
        if (!userId) {
            console.log('??')
            return res.status(400).json({ error: 'Missing required data.' });
        }
        console.log("body : " + req.body);
        // Tạo một instance mới của Story
        const newStory = new Story({
            userId,
            swipeText,
            story_image,
        });

        // Lưu story mới vào MongoDB
        const savedStory = await newStory.save();

        res.status(201).json({
            message: 'Story added successfully!',
            storyId: savedStory._id,
            story: savedStory,
        });
    } catch (error) {
        console.error('Error adding story to MongoDB:', error);
        res.status(500).json({ error: 'Failed to add story.' });
    }
});


router.post('/listStory', async (req, res) => {
    try {
        const userId = req.body.userId;
        const listStory = [];
        const listUser = await User.find({ status: true });

        for (const user of listUser) {
            const stories = await Story.find({ userId: user._id, status: 1 })
                .where('createdAt')
                .gte(moment().subtract(24, 'hours')) // Filter stories within the last 24 hours
                .sort({ createdAt: 'desc' });

            if (stories.length > 0) { // Only include users with existing stories
                const parsedStories = stories.map(story => ({
                    story_id: story._id,
                    story_image: story.story_image,
                    swipeText: story.swipeText,
                    onPress: () => console.log(`Story ${story._id} swiped`),
                }));

                const userStory = {
                    user_id: user._id,
                    user_image: user.userImg,
                    user_name: user.fname + ' ' + user.lname,
                    stories: parsedStories,
                };

                listStory.push(userStory);
            }
        }

        const currentUserIndex = listStory.findIndex(userStory => userStory.user_id === userId);
        if (currentUserIndex !== -1) {
            const currentUserStories = listStory.splice(currentUserIndex, 1);
            listStory.unshift(...currentUserStories);
        }

        console.log("List of stories: " + JSON.stringify(listStory));
        res.status(200).json(listStory);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ error: 'Failed to fetch stories' });
    }
});

module.exports = router;