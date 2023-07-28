const express = require('express');
const port = 3000;
const app = express();
const bodyParser = require('body-parser');
require('./connect');
require('./models/User');
require('./models/Message');
require('./models/Post');
const authRoutes = require('./routes/authRoutes');
const uploadMediaRoutes = require('./routes/uploadMediaRoute');
const messageRoutes = require('./routes/messageRoute');
const postRoutes = require('./routes/postRoutes');
//requireToken skipped


//.......18
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();


const io = new Server(httpServer, { /* options */ });


//


app.use(bodyParser.json());
app.use(authRoutes);
app.use(postRoutes);
app.use(uploadMediaRoutes);
app.use(messageRoutes);

app.get('/', (req, res) => {
    res.send("Hello World");
})

app.use('/public/uploads', express.static('public/uploads'));

io.on("connection", (socket) => {

    console.log("USER CONNECTED - ", socket.id);

    socket.on("disconnect", () => {
        console.log("USER DISCONNECTED - ", socket.id);
    });

    socket.on("join_room", (data) => {
        console.log("USER WITH ID - ", socket.id, "JOIN ROOM - ", data.roomid);
        socket.join(data);
    });

    socket.on("send_message", (data) => {
        console.log("MESSAGE RECEIVED - ", data);
        io.emit("receive_message", data);
    });
});


httpServer.listen(3001);

// ...
app.listen(port, () => {
    console.log("Server is running on port " + port);
})



// 6353f0c6a52cde6dafae64d2634c1d60f09a4f3ff40be517
// 6353f0c6a52cde6dafae64d2634c1d60f09a4f3ff40be517