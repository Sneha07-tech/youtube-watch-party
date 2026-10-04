# 🎬 SyncWatch - YouTube Watch Party System

A real-time YouTube Watch Party web application that allows multiple users to watch YouTube videos together with synchronized playback (play/pause/seek/video change) and role-based access control (Host, Moderator, Participant).

---

## 🌟 Features

- **Real-Time Video Synchronization**: Host / Moderator playback actions (Play, Pause, Seek, and Change Video) update in real-time for all connected participants via WebSockets.
- **Room-Based Architecture**: Anyone can create a new watch party or join an existing one using a unique room code.
- **Role-Based Access Control (RBAC)**:
  - **👑 Host**: Full control over playback, can assign roles (promote participants to Moderator), and remove/kick disruptive participants.
  - **🛡️ Moderator**: Play, pause, seek, and change video.
  - **👤 Participant (Viewer)**: Syncs playback automatically with the host; cannot alter video playback directly.
- **Echo / Anti-Loop Protection**: Prevents infinite socket event loops when receiving programmatic playback updates from the server.
- **Integrated Live Chat**: Real-time room chat with user role badges and timestamps.
- **YouTube IFrame Player Integration**: Supports full YouTube URLs, short URLs (`youtu.be`), Shorts, and raw Video IDs.
- **Modern Responsive UI**: Built with React, Tailwind CSS, and Lucide icons with a sleek dark-slate aesthetic.

---

## 🏗️ Architecture & WebSocket Flow

```text
[Host Browser]                         [Server (Node + Socket.IO)]              [Viewer Browser]
      │                                             │                                  │
      ├─── 1. socket.emit('play', { time }) ───────►│                                  │
      │                                             ├── 2. Validate Role (Host/Mod)    │
      │                                             ├── 3. Update Room State           │
      │                                             ├── 4. socket.to(roomId).emit ────►│
      │                                             │                                  ├── 5. Set isRemoteAction = true
      │                                             │                                  ├── 6. player.playVideo()
      │                                             │                                  └── 7. Synced!
```

### WebSocket Events Specification

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_room` | Client ➔ Server | `{ roomId, username }` | User joins a room. First user becomes Host, subsequent join as Participants. |
| `leave_room` | Client ➔ Server | `{ roomId }` | User leaves the room; server notifies others. |
| `sync_state` | Server ➔ Client | `{ roomId, videoId, currentTime, isPlaying, participants }` | Transmits current video state to a newly connected client. |
| `play` | Client ➔ Server | `{ roomId, currentTime }` | Play action triggered by Host/Mod; server broadcasts to room. |
| `pause` | Client ➔ Server | `{ roomId, currentTime }` | Pause action triggered by Host/Mod; server broadcasts to room. |
| `seek` | Client ➔ Server | `{ roomId, currentTime }` | Timeline seek by Host/Mod; server synchronizes everyone's timestamp. |
| `change_video` | Client ➔ Server | `{ roomId, videoId }` | Host/Mod loads a new YouTube video; server updates and broadcasts. |
| `assign_role` | Client ➔ Server | `{ roomId, targetUserId, newRole }` | Host promotes/demotes a participant. |
| `remove_participant` | Client ➔ Server | `{ roomId, targetUserId }` | Host kicks a user from the room. |
| `send_chat` | Client ➔ Server | `{ roomId, message }` | Broadcasts real-time text chat message to room members. |

---

## 📁 Project Structure

```text
youtube-watch-party/
├── server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Participant.js     # Participant class (OOP model)
│   │   │   └── Room.js            # Room class with RBAC and state logic
│   │   ├── socket/
│   │   │   ├── roomHandler.js     # Room joining, roles, chat, and kick logic
│   │   │   └── playbackHandler.js # Play, pause, seek, and change_video handlers
│   │   └── server.js              # Express app & Socket.IO server initialization
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Lobby.jsx          # Welcome, create & join room page
│   │   │   ├── RoomHeader.jsx     # Room code, copy button, role badge & leave
│   │   │   ├── VideoPlayer.jsx    # YouTube IFrame wrapper & sync controls
│   │   │   ├── ParticipantList.jsx# Participant roster & Host action buttons
│   │   │   └── Chat.jsx           # Live room chat component
│   │   ├── utils/
│   │   │   └── youtube.js         # URL parser & timestamp formatter
│   │   ├── App.jsx                # Main application state & socket coordinator
│   │   ├── main.jsx
│   │   └── index.css              # Tailwind CSS styles
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Quick Start (Single Command - Recommended)
From the root `youtube-watch-party/` directory:
```bash
# Start both Backend & Frontend simultaneously:
npm run dev
```
- Backend starts at: `http://localhost:5000`
- Frontend starts at: `http://localhost:5173`

---

### Alternative: Run Separately (Two Terminals)

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

---

## 🧪 Testing Synchronization Locally

1. Open **Google Chrome** at `http://localhost:5173`.
   - Enter your name: **Alice**.
   - Click **"Create New Watch Party"**.
   - Notice you are assigned the **👑 Host** role.
   - Copy the room code (e.g., `party-123`).

2. Open **Incognito Window** or **Microsoft Edge** at `http://localhost:5173`.
   - Enter your name: **Bob**.
   - Paste the room code and click **"Join Room"**.
   - Notice Bob is assigned the **👤 Viewer** role.

3. **Verify Synchronization**:
   - In Alice's browser, click **Play** or **Pause** ➔ Bob's player plays/pauses automatically.
   - In Alice's browser, scrub the timeline ➔ Bob's player jumps to the exact timestamp.
   - In Alice's browser, paste a new YouTube link and click **"Load Video"** ➔ Both screens switch videos together.
   - In Alice's browser, click the **Promote to Moderator** icon next to Bob ➔ Bob can now also control playback!

---

## 🌐 Public Deployment Guide

### Deploying the Backend on Render
1. Create a free account on [Render.com](https://render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `server`.
5. Build Command: `npm install`
6. Start Command: `npm start`
7. In **Environment Variables**, set:
   - `PORT`: `5000`
   - `CLIENT_ORIGIN`: `*` (or your deployed frontend URL)
8. Copy your Render service URL (e.g., `https://syncwatch-api.onrender.com`).

### Deploying the Frontend on Vercel
1. Create a free account on [Vercel.com](https://vercel.com).
2. Import the GitHub repository.
3. Set the **Root Directory** to `client`.
4. In **Environment Variables**, add:
   - `VITE_BACKEND_URL`: `https://your-render-backend-url.onrender.com`
5. Click **Deploy**.
