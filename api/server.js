import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/luma";
await mongoose.connect(MONGO_URL, { dbName: "luma" });

const MessageSchema = new mongoose.Schema({
  text: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);

app.get("/api/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);
app.get("/api/messages", async (req, res) => {
  const ms = await Message.find().sort({ createdAt: -1 }).limit(50);
  res.json(ms);
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("send-message", async (text) => {
    if (!text) return;
    const msg = await Message.create({ text });
    io.emit("new-message", msg);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log("API listening on", PORT));