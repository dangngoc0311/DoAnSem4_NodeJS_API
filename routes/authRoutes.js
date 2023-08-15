const router = require("express").Router();
const multer = require("multer");
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const uploadFile = require("../file");
const upload = multer({ dest: 'uploads/' });

//REGISTER
router.post("/register", async (req, res) => {
    try {
        //generate new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        //create new user
        const newUser = new User({
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            password: hashedPassword,
            phone:"",
            about:"",
        });
        //save user and respond
        const user = await newUser.save();
        console.log(user);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
        console.error("Error saving user:", err);
    }
});

//LOGIN
router.post("/login", async (req, res) => {
    console.log("ac");
    console.log(req.body.password);
    try {
        const user = await User.findOne({ email: req.body.email });
        !user && res.status(404).json({ error: "User not found" });

        const validPassword = await bcrypt.compareSync(req.body.password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Wrong password" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
        console.error("Error find user:", err);
    }
});
router.post('/setprofilepic', (req, res) => {
    const { email, profilepic } = req.body;
    User.findOne({ email: email })
        .then((savedUser) => {
            if (!savedUser) {
                return res.status(422).json({ error: "Invalid Credentials" })
            }
            savedUser.profilepic = profilepic;
            savedUser.save()
                .then(user => {
                    res.json({ message: "Profile picture updated successfully" })
                })
                .catch(err => {
                    console.log(err);
                })
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/users/:userId', async (req, res) => {
    try {
        const requestedUserId = req.params.userId;
        const loggedInUserId = req.query.loggedInUserId; 
        console.log("djhfjd" +loggedInUserId);

        const user = await User.findById(requestedUserId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isFollowedByLoggedInUser = user.followers.includes(loggedInUserId);
        const userDataWithFollowStatus = {
            ...user.toObject(),
            followed: isFollowedByLoggedInUser,
            Id: user._id,
        };

        res.status(200).json(userDataWithFollowStatus);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/users/posts/:id', async (req, res) => {
    try {
        console.log(req.body.userId);
        const list = [];
        const posts = await Post.find({ userId: req.params.id }).sort({ createdAt: 'desc' });
        const currentUser = await User.findById(req.body.userId);
        for (const postData of posts) { 
            const {
                userId,
                post: postContent,
                postImg,
                likes,
                comments,
                createdAt,
            } = postData; 

            const user = await User.findById(userId);

            if (!user) {
                continue;
            }

            const userName = `${user.fname} ${user.lname}`;
            const liked = postData.likes.includes(currentUser._id);
            list.push({
                id: postData._id, 
                userId,
                userName,
                userImg: `${user.userImg}`,
                postTime: `${postData.createdAt}`,
                post: postContent,
                postImg,
                liked: liked,
                likes,
                comments,
            });
        }
        res.status(200).json(list);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});
router.put('/users/:id', async (req, res) => {
    console.log(req.body);
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        const postsWithMatchingComments = await Post.find({ 'comments.userId': req.params.id });
        postsWithMatchingComments.forEach(async (post) => {
            post.comments.forEach((comment) => {
                if (comment.userId === req.params.id) {
                    comment.userAvatar = updatedUser.userImg;
                }
            });

            await post.save();
        });
        res.json(updatedUser);
        console.log(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// follow user
router.post('/users/:id/follow', async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {

            return res.status(404).json({ error: 'User not found' });
        }
        const loggedInUserId = req.query.loggedInUserId; 

        if (!user.followers.includes(loggedInUserId)) {
            user.followers.push(loggedInUserId);
            await user.save();

            const loggedInUser = await User.findById(loggedInUserId);
            if (loggedInUser) {
                loggedInUser.followings.push(userId);
                await loggedInUser.save();
            }
        } else {
            const index = user.followers.indexOf(loggedInUserId);
            if (index !== -1) {
                user.followers.splice(index, 1);
                await user.save();
            }

            const loggedInUser = await User.findById(loggedInUserId);
            if (loggedInUser) {
                const followingIndex = loggedInUser.followings.indexOf(userId);
                if (followingIndex !== -1) {
                    loggedInUser.followings.splice(followingIndex, 1);
                    await loggedInUser.save();
                }
            }
        }

        const updatedUser = await User.findById(userId);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            followed: user.followers.includes(loggedInUserId),
            followers: updatedUser.followers,
            followings: updatedUser.followings,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to follow/unfollow user' + error });
    }
});

router.post('/upload', uploadFile.single('media'), (req, res) => {
    try {
        const file = req.file;
        console.log(file);
        if (!file) {
            return res.status(400).json({ error: 'No image file received' });
        }
        res.status(200).json({
            message: 'Image uploaded successfully',
            filename: file.filename,
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// lấy danh sách những người followers
router.get('/users/followers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followers = await User.find({ _id: { $in: user.followers } }, '_id fname lname userImg');
        return res.status(200).json(followers);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
});
router.get('/users/followerings/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followers = await User.find({ _id: { $in: user.followings } }, '_id fname lname userImg');
        return res.status(200).json(followers);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
});
module.exports = router;