import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');
import { Room } from './models/Room.js';
import { registerRoomHandlers } from './socket/roomHandler.js';
import { registerPlaybackHandlers } from './socket/playbackHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// Middlewares
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Serve static frontend build if it exists
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// In-Memory Storage for Active Rooms
const rooms = new Map(); // roomId -> Room instance

// HTTP Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// REST API: Create or verify a room
app.post('/api/rooms', (req, res) => {
  const { roomId, videoId } = req.body;
  const cleanRoomId = (roomId || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();

  if (!rooms.has(cleanRoomId)) {
    rooms.set(cleanRoomId, new Room(cleanRoomId, videoId || 'jfKfPfyJRdk'));
  }

  res.json({ success: true, roomId: cleanRoomId });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const cleanRoomId = req.params.roomId.trim().toLowerCase();
  const room = rooms.get(cleanRoomId);

  if (!room) {
    return res.status(404).json({ error: 'Room does not exist' });
  }

  res.json({ success: true, room: room.getState() });
});

// Setup HTTP Server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Socket connection lifecycle
io.on('connection', (socket) => {
  console.log(`[CONNECT] User connected: ${socket.id}`);

  // Register feature handlers
  registerRoomHandlers(io, socket, rooms);
  registerPlaybackHandlers(io, socket, rooms);

  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] User disconnected: ${socket.id}`);
  });
});

// SPA fallback: Serve index.html for frontend routes when dist is built
if (fs.existsSync(clientDistPath)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Watch Party WebSocket Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
