const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createServer } = require("http");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const httpServer = createServer(app);
const io = require("socket.io")(httpServer);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // frontend

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- AI Chat Endpoint ---
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are AskBot, a friendly and intelligent AI tutor. 
Help students understand topics clearly with examples and summaries.`,
        },
        { role: "user", content: userMessage },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ reply: "⚠️ AI service unavailable." });
  }
});

// --- SOCKET.IO CHAT FEATURE ---
let socketsConnected = new Set();

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);
  socketsConnected.add(socket.id);
  io.emit("clients-total", socketsConnected.size);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    socketsConnected.delete(socket.id);
    io.emit("clients-total", socketsConnected.size);
  });

  socket.on("message", (data) => {
    socket.broadcast.emit("chat-message", data);
  });

  socket.on("feedback", (data) => {
    socket.broadcast.emit("feedback", data);
  });
});
const validUsers = {
  admin: "1234",
  demo: "demo123",
  user: "password"
};


httpServer.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
