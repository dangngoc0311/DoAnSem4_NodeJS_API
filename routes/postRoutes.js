const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const fs = require('fs');
const path = require('path');
router.post('/listPost', async (req, res) => {

    try {
        const list = [];
        const posts = await Post.find().sort({ createdAt: 'desc' });
        const currentUser = await User.findById(req.body.userId);
        console.log(req.body.userId);

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
            const liked = postData.likes.includes(currentUser._id); // Check if currentUser._id is in the likes array

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

router.post('/posts', async (req, res) => {
    console.log("post");
    try {
        const { userId, post, postImg } = req.body;
        let newPost;
        if (postImg == "") {
            newPost = new Post({
                userId,
                post,
                postImg: [],
                postTime: new Date(),
                likes: [],
                comments: []
            });
        } else {
            newPost = new Post({
                userId,
                post,
                postImg,
                postTime: new Date(),
                likes: [],
                comments: []
            });
        }
       
        const savedPost = await newPost.save();

        res.json({ message: 'Post Added!', postId: savedPost._id, post: newPost });
    } catch (error) {
        console.error('Something went wrong with adding post to MongoDB.', error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});
// Router - update a post
router.put('/posts/:id', async (req, res) => {
    console.log("put ");
    try {
        const { userId, post, postImg, deletePostImg } = req.body;
        const postId = await Post.findById(req.params.id);
        if (!postId) {
            return res.status(404).json({ error: 'Post not found' });
        }
console.log("ok1 ");
        if (postId.userId !== userId) {
            return res.status(403).json({ error: 'You can update only your post' });
        }
        console.log("ok 2 ");
        console.log("del : " + deletePostImg);
        // Kiểm tra nếu có ảnh muốn xoá từ phía client
        if (deletePostImg) {
            // Xoá ảnh khỏi mảng postImg theo tên ảnh
            // const updatedPostImg = postId.postImg.filter((img) => img !== postImg);
            // postId.postImg = updatedPostImg;
            postId.postImg = [];
        }
        console.log("Post : " + postImg);
        // Kiểm tra nếu có ảnh mới muốn thêm vào phía client
        if (postImg) {
            // Thêm ảnh mới vào mảng postImg
            postId.postImg.push(postImg);
        }

        const updatedFields = {
            post,
            postImg: postId.postImg, 
            updatedAt: new Date(),
        };
        console.log("update : " + updatedFields);

        // Sử dụng findByIdAndUpdate để cập nhật bài viết
        await Post.findByIdAndUpdate(req.params.id, { $set: updatedFields });

        res.status(200).json({ message: 'The post has been updated' });
    } catch (error) {
        console.error('Something went wrong with updating the post in MongoDB.', error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});


//delete a post

router.delete("/posts/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (post.postImg && post.postImg.length > 0) {
            post.postImg.forEach((imageUrl) => {
                const imagePath = path.join(__dirname, '../public/uploads', imageUrl);

                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log(`Image ${imageUrl} has been deleted successfully.`);
                }
            });
        }


        await post.deleteOne();

        res.status(200).json({ message: 'The post and image have been deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' + error });
    }
});
//like / dislike a post
router.put('/posts/:id/like', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const userId = req.body.userId;
        const userIndex = post.likes.indexOf(userId);
        var a = '';
        if (userIndex === -1) {
            post.likes.push(userId);
            a = true;
        } else {
            post.likes.splice(userIndex, 1);
            a = false;
        }
        const updatedPost = await post.save();
        console.log(a);
        res.status(200).json({liked:a});
    } catch (error) {
        res.status(500).json({ error: 'Failed to update post likes' + error });
    }
});

//get a post
router.post("/postDetail/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        console.log("sjdhsgdsad : " + req.params.id);
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const user = await User.findById(post.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const liked = post.likes.includes(req.body.userId);
        const userName = `${user.fname} ${user.lname}`;
        post.comments.sort((a, b) => new Date(b.cmtDate) - new Date(a.cmtDate));
        const postWithUserInfo = {
            id: post._id,
            userId: post.userId,
            userName: userName,
            userImg: user.userImg,
            postTime: post.createdAt,
            post: post.post,
            postImg: post.postImg,
            liked: liked,
            likes: post.likes,
            comments: post.comments,
        };
        console.log(postWithUserInfo);
        res.status(200).json(postWithUserInfo);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch post or user information' });
    }
});

router.post("/posts/cmt/:id", async (req, res) => {
    try {
        const { userId, content } = req.body;
        const postId = req.params.id;
        console.log("sjdhsgdsad : " + req.params.id);
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        console.log(post);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userName = `${user.fname} ${user.lname}`;
        const newComment = {
            userId: userId,
            userAvatar: user.userImg,
            userName: userName,
            content: content,
            cmtDate: new Date(),
        };
        const savedComment = await post.comments.create(newComment);
        post.comments.push(savedComment);

        await post.save();
        
        res.status(201).json({ message: 'Comment added successfully', comment: savedComment });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});
router.delete('/posts/cmt/:postId/:commentId', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const commentIndex = post.comments.findIndex((comment) => comment._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        post.comments.splice(commentIndex, 1);
        await post.save();
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;