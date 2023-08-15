const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { GroupChat } = require('../models/GroupChat');
const { Message } = require('../models/Message');
const User = require('../models/User');
// Thêm tin nhắn
// Gửi tin nhắn từ người gửi đến người nhận
// API để kiểm tra xem hai người dùng đã nhắn tin cho nhau chưa và gửi tin nhắn trong group chat
router.post('/send_message', async (req, res) => {
    try {
        const { userId1, userId2, content } = req.body;

        // Kiểm tra xem có group chat nào giữa hai người dùng hay không
        const groupChat = await GroupChat.findOne({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 },
            ],
        });
        console.log("Group chat : " + groupChat);
        // Nếu chưa tồn tại group chat, tạo group chat mới
        if (!groupChat) {
            const newGroupChat = new GroupChat({
                sender: userId1,
                receiver: userId2,
            });
            const savedGroupChat = await newGroupChat.save();
            console.log("group chat : " + newGroupChat);
            // Gửi tin nhắn trong group chat mới tạo
            const newMessage = new Message({
                groupChat: savedGroupChat._id,
                senderId: userId1,
                receiverId: userId2,
                content: content,
            });
            console.log("new :"+newMessage);
            try {
                const savedMessage = await newMessage.save();
                return res.status(200).json(savedMessage);

            } catch (error) {
                console.log(error)
            }

        } else {
            // Nếu đã tồn tại group chat, gửi tin nhắn trong group chat đó
            const newMessage = new Message({
                groupChat: groupChat._id,
                senderId: userId1,
                receiverId: userId2,
                content: content,
            });
            const savedMessage = await newMessage.save();

            return res.status(200).json(savedMessage);
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

// API để lấy ra danh sách tin nhắn trong group chat của 2 người dùng
router.get('/group_chat_messages', async (req, res) => {
    try {
        const { userId1, userId2 } = req.query;

        // Kiểm tra xem có group chat nào giữa hai người dùng hay không
        const groupChat = await GroupChat.findOne({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 },
            ],
        });

        if (!groupChat) {
            return res.status(404).json({ message: 'Không tìm thấy group chat' });
        }

        // Lấy danh sách tin nhắn trong group chat
        const messages = await Message.find({ groupChat: groupChat._id })
            .populate('senderId', 'username') // Populate thông tin người gửi (có thể thêm các trường thông tin khác)
            .populate('receiverId', 'username') // Populate thông tin người nhận (có thể thêm các trường thông tin khác)
            .sort({ createdAt: 1 }); // Sắp xếp tin nhắn theo thời gian tạo

        return res.status(200).json(messages);
    } catch (error) {
        res.status(500).json(error);
    }
});

// Thêm reaction vào tin nhắn
router.put('/messages/add_reaction/:id', async (req, res) => {
    try {
        const messageId = req.params.id;
        const { user, type_emotion } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
        }

        // Kiểm tra xem người dùng đã thêm reaction cho tin nhắn này chưa
        const existingReaction = message.reactionMess.find((reaction) => reaction.user.toString() === user);
        if (existingReaction) {
            // Nếu đã tồn tại reaction từ người dùng, chỉ cập nhật lại type_emotion
            existingReaction.type_emotion = type_emotion;
        } else {
            // Nếu chưa có reaction từ người dùng, thêm mới reaction vào mảng reactionMess
            message.reactionMess.push({ user, type_emotion });
        }

        await message.save();
        return res.status(200).json(message);
    } catch (error) {
        return res.status(500).json(error);
    }
});

// Xoá tin nhắn
router.delete('/messages/:id', async (req, res) => {
    try {
        const messageId = req.params.id;
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
        }
        // Xoá tin nhắn từ database
        await message.remove();
        return res.status(200).json({ message: 'Xoá tin nhắn thành công' });
    } catch (error) {
        return res.status(500).json(error);
    }
});

//ok
// API để lấy danh sách các group chat của người đăng nhập
router.get('/user_group_chats/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Lấy danh sách các group chat mà người đăng nhập đang tham gia
        const groupChats = await GroupChat.find({
            $or: [{ sender: userId }, { receiver: userId }],
        });
        
        if (!groupChats || groupChats.length === 0) {
            return res.status(200).json([]);
        }

        const groupChatData = [];

        for (const groupChat of groupChats) {
            let otherUserId;
            if (groupChat.sender.equals(userId)) {
                otherUserId = groupChat.receiver;
            } else {
                otherUserId = groupChat.sender;
            }

            // Lấy thông tin người còn lại trong group
            const otherUser = await User.findById(otherUserId);
            const { _id, fname, lname, userImg } = otherUser;

            // Lấy tin nhắn cuối cùng trong group chat
            const lastMessage = await Message.findOne({ groupChat: groupChat._id })
                .sort({ createdAt: 'desc' })
                .select('createdAt content senderId receiverId'); 

            // Lấy thông tin người gửi tin nhắn
            const sender = await User.findById(lastMessage.senderId);
            const senderInfo = { _id: sender._id, fname: sender.fname, lname: sender.lname, userImage: sender.userImg };

            // Lấy thông tin người nhận tin nhắn
            const receiver = await User.findById(lastMessage.receiverId);
            const receiverInfo = { _id: receiver._id, fname: receiver.fname, lname: receiver.lname, userImage: receiver.userImg };

            groupChatData.push({
                _id: groupChat._id,
                userId: _id,
                fname:fname,
                lname:lname,
                userImage: userImg,
                messageTime: lastMessage.createdAt,
                messageText: lastMessage.content,
                sender: senderInfo,
                receiver: receiverInfo,
                lastMessage: lastMessage,
            });
        }
 console.log(groupChatData);
        return res.status(200).json(groupChatData);
    } catch (error) {
        console.error('Error fetching user group chats:', error);
        res.status(500).json(error);
    }
});

// API để lấy danh sách các tin nhắn của hai người
router.get('/messages/:userId1/:userId2', async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;

        // Truy vấn cơ sở dữ liệu để lấy danh sách các tin nhắn của hai người
        const messages = await Message.find({
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 },
            ],
        }).sort({ createdAt: 'asc' });

        // Nếu không có tin nhắn nào, trả về danh sách rỗng
        if (!messages || messages.length === 0) {
            return res.status(200).json([]);
        }

        // Duyệt qua từng tin nhắn để lấy thông tin người nhắn tin
        const messageData = await Promise.all(
            messages.map(async (message) => {
                let otherUserId;
                if (message.senderId.equals(userId1)) {
                    otherUserId = message.receiverId;
                } else {
                    otherUserId = message.senderId;
                }

                // Lấy thông tin người nhắn tin từ cơ sở dữ liệu
                const otherUser = await User.findById(otherUserId);
                const { _id, fname, lname, userImg } = otherUser;

                // Tạo username từ fname và lname
                const username = fname + lname;

                // Trả về các thông tin của tin nhắn và người nhắn tin
                return {
                    _id: message._id,
                    text: message.content,
                    createdAt: message.createdAt,
                    user: {
                        _id: message.receiverId,
                        name: username,
                        avatar: userImg,
                        senderId: message.senderId
                    },
                };
            })
        );

        return res.status(200).json(messageData);
    } catch (error) {
        res.status(500).json(error);
    }
});

// Route để lấy danh sách người trong danh sách theo dõi và danh sách đang theo dõi của một người dùng cụ thể
router.get('/connections/:userId', async (req, res) => {
    try {
        // const { userId } = req.params;

        // // Tìm người dùng dựa vào userId
        // const user = await User.findById(userId);

        // if (!user) {
        //     return res.status(404).json({ message: 'User not found' });
        // }

        // // Lấy danh sách followers và followings của người dùng
        // const followers = await User.find({ _id: { $in: user.followers } }, '_id fname lname userImg');
        // const followings = await User.find({ _id: { $in: user.followings } }, '_id fname lname userImg');

        // // Kết hợp hai danh sách thành một danh sách duy nhất
        // const connections = followers.concat(followings);
        // console.log(connections);
        // return res.status(200).json(connections);


        const users = await User.find({}, '_id fname lname userImg');
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
});


module.exports = router;
