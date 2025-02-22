const express = require("express"); // Import express
const { createServer } = require("http"); // Import http
const { Server } = require("socket.io"); // Import socket.io
const Redis = require('ioredis');
const bodyParser = require('body-parser');

const app = express(); // Create express app
app.use(bodyParser.json());
const httpServer = createServer(app); // Create http server using express app

const redisCache = new Redis(); // Create Redis client

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
}); // Create socket.io server

io.on("connection", (socket) => {
  console.log("A user connected " + socket.id);
  socket.on("setUserId", (userId) => {
    console.log("Setting user id to connection id", userId, socket.id);
    redisCache.set(userId, socket.id);
  });

  socket.on('getConnectionId', async (userId) => {
    const connId = await redisCache.get(userId);
    console.log("Getting connection id for user id", userId, connId);
    socket.emit('connectionId', connId);
    const everything = await redisCache.keys('*');

    console.log(everything)
  })

});

app.post('/sendPayload', async (req, res) => {
  console.log(req.body);
  const { payload } = req.body;
  console.log('payload', payload);

  if (!payload) {
    return res.status(400).send("Invalid request");
  }
  const socketId = await redisCache.get(payload.userId);
  console.log('socketId', socketId);

  if (socketId) {
    io.to(socketId).emit('submissionPayloadResponse', payload);
    return res.send("Payload sent successfully");
  } else {
    return res.status(404).send("User not connected");

  }

})

httpServer.listen(3001, () => {
  console.log("Server is running on port 3001");
});
