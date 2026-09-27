const express=require("express");
const path = require("path");
const cors=require("cors")
const {Server}=require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { connection } = require("./config/db");
const { userRoute } = require("./routes/userRoute");
const { bookingRoutes } = require("./routes/bookingRoute");
const { reviewRoute } = require("./routes/reviewRoute");
const { notificationRoute } = require("./routes/notificationRoute");
const { updateRoomStatus } = require("./services/roomStatus");
const { startNotificationCron } = require("./cronNotifications");
const { Bookingmodel } = require("./models/bookingModel");

const app=express();

app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
});

app.use("/user",userRoute)
app.use("/booking",bookingRoutes)
app.use("/reviews",reviewRoute)
app.use("/notifications",notificationRoute)

app.set('view engine','ejs');
app.use(express.static('public'));

const frontendDist = path.join(__dirname, "../realFrontEnd/dist");
app.use(express.static(frontendDist));

app.get("/room/:room",(req,res)=>{
  res.render('room',{roomId: req.params.room, role: req.query.role || 'participant'});
});

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

const roomUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    socket.data.user = jwt.verify(token.replace(/^Bearer\s+/i, ""), process.env.Key);
    next();
  } catch {
    next(new Error("Invalid session"));
  }
});

io.on("connection", (socket) => {
  socket.on('joinRoom', async (roomId) => {
    const { userId, role } = socket.data.user;
    if (typeof roomId !== "string" || !['doctor', 'patient'].includes(role)) {
      socket.emit('roomAccessDenied');
      return;
    }
    const booking = await Bookingmodel.findOne({ roomId }).select("userId doctorId");
    if (!booking || ![String(booking.userId), String(booking.doctorId)].includes(String(userId))) {
      socket.emit('roomAccessDenied');
      return;
    }
    const users = roomUsers.get(roomId) || [];
    if (users.length >= 2 || users.some(user => user.role === role)) {
      socket.emit('roomFull');
      return;
    }
    socket.join(roomId);
    socket.emit('roomUsers', users.map(user => user.socketId));
    users.push({ socketId: socket.id, role });
    roomUsers.set(roomId, users);
    const roomStatus = updateRoomStatus(roomId, users);
    io.to(roomId).emit('roomStatus', roomStatus);
    if (users.length === 2) {
      const existingUser = users[0];
      socket.emit('incomingCall', {
        callerId: existingUser.socketId,
        callerRole: existingUser.role,
      });
      io.to(existingUser.socketId).emit('callWaiting', { participantRole: role });
      io.to(roomId).emit('participantJoined', { participantRole: role, participantCount: users.length });
    }

    socket.on('acceptCall', ({ callerId }) => {
      io.to(callerId).emit('callAccepted', { accepterId: socket.id });
    });

    socket.on('rejectCall', ({ callerId }) => {
      io.to(callerId).emit('callRejected');
      socket.leave(roomId);
      const remaining = (roomUsers.get(roomId) || []).filter(user => user.socketId !== socket.id);
      if (remaining.length) roomUsers.set(roomId, remaining);
      else roomUsers.delete(roomId);
      const roomStatus = updateRoomStatus(roomId, remaining);
      io.to(roomId).emit('roomStatus', roomStatus);
      io.to(callerId).emit('userDisconnected', socket.id);
    });

    socket.on('webrtc-offer', ({ target, offer }) => {
      io.to(target).emit('webrtc-offer', { sender: socket.id, offer });
    });

    socket.on('webrtc-answer', ({ target, answer }) => {
      io.to(target).emit('webrtc-answer', { sender: socket.id, answer });
    });

    socket.on('webrtc-ice-candidate', ({ target, candidate }) => {
      io.to(target).emit('webrtc-ice-candidate', { sender: socket.id, candidate });
    });

    socket.on('chatMessage', ({ message }) => {
      const cleanMessage = String(message || "").trim().slice(0, 1000);
      if (cleanMessage) socket.broadcast.to(roomId).emit('chatMessage', { message: cleanMessage });
    });

    socket.on('disconnect', () => {
      const remaining = (roomUsers.get(roomId) || []).filter(user => user.socketId !== socket.id);
      if (remaining.length) roomUsers.set(roomId, remaining);
      else roomUsers.delete(roomId);
      const roomStatus = updateRoomStatus(roomId, remaining);
      io.to(roomId).emit('roomStatus', roomStatus);
      socket.broadcast.to(roomId).emit('userDisconnected', socket.id);
    });
  });
});

const serverPort = process.env.PORT || process.env.port || 4000;

async function startServer() {
  if (!process.env.mongoDbUrl) {
    throw new Error("Missing mongoDbUrl environment variable.");
  }
  if (!process.env.Key) {
    throw new Error("Missing Key environment variable.");
  }

  await connection;
  console.log("Connected to DB");
  startNotificationCron();

  httpServer.listen(serverPort, () => {
    console.log(`Server is running at port ${serverPort}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start server:", error.message);
  process.exit(1);
});
