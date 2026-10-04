# 🎬 SyncWatch - YouTube Watch Party System

A real-time YouTube Watch Party web application that allows multiple users to watch YouTube videos together with synchronized playback (play/pause/seek/video change) and role-based access control (Host, Moderator, Participant).

> 🚀 **Live Demo URL**: [https://your-app.onrender.com](https://your-app.onrender.com) *(Update this link once your deployment is live)*

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

This project can be deployed either as a **Single Full-Stack App on Render** (matching the assignment instructions: `https://your-app.onrender.com`), or separately with **Render (Backend) + Vercel (Frontend)**.

### Option 1: Full-Stack Deployment on Render (Recommended)
This deploys both the backend WebSocket server and the React frontend in a single Web Service under one URL with zero CORS configuration.

1. Create a free account on [Render.com](https://render.com) and log in.
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository (`Sneha07-tech/youtube-watch-party`).
4. Configure the service settings:
   - **Name**: `youtube-watch-party` (or your choice)
   - **Region**: Any close region (e.g. *Singapore* or *Frankfurt*)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty / root)*
   - **Runtime**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**.
6. When deployment finishes, Render provides your live URL: `https://<your-service-name>.onrender.com`.
7. Test the health check at `https://<your-service-name>.onrender.com/health` and open the root URL in your browser to start your watch party!

---

### Option 2: Render (Backend) + Vercel (Frontend)

If you prefer hosting the frontend on Vercel's global CDN:

#### Step 1: Deploy Backend on Render
1. In [Render.com](https://render.com), click **New +** ➔ **Web Service**.
2. Select your repository.
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: `5000`
     - `CLIENT_ORIGIN`: `*`
4. Click **Deploy Web Service** and copy your backend URL (e.g., `https://syncwatch-api.onrender.com`).

#### Step 2: Deploy Frontend on Vercel
1. Log in to [Vercel.com](https://vercel.com) and click **Add New...** ➔ **Project**.
2. Import `youtube-watch-party`.
3. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Environment Variables**:
     - `VITE_BACKEND_URL`: `https://syncwatch-api.onrender.com` (from Step 1)
4. Click **Deploy**.

---

## 💡 Code Understanding & Architecture Readiness

Be prepared to discuss these key technical decisions during evaluation:

### 1. How WebSockets Enable Real-Time Synchronization
- Traditional HTTP polling requires repeated requests, introducing latency and server overhead.
- WebSockets provide a persistent, bi-directional, full-duplex TCP connection between clients and the server via **Socket.IO**.
- When a Host pauses, seeks, or loads a new video, an event is emitted to the server with timestamp data. The server updates the central room state and immediately broadcasts (`socket.to(roomId).emit(...)`) to all other room members with minimal latency (<50ms).

### 2. Echo / Anti-Loop Protection
- When Bob's player receives a programmatic `pause` from Alice via the server, triggering `player.pauseVideo()` natively fires YouTube's `onStateChange` event.
- Without protection, Bob's client would detect this event and emit another `pause` back to the server, creating an infinite echo loop.
- **Solution**: A temporary flag `isRemoteAction.current = true` is set before invoking programmatic player methods, discarding any echo emissions triggered by remote sync.

### 3. Backend Role-Based Access Control (RBAC)
- All authorization checks are enforced **server-side** in [`Room.js`](file:///server/src/models/Room.js) and socket handlers:
  - `play`, `pause`, `seek`, `change_video` require `Host` or `Moderator`.
  - `assign_role` and `remove_participant` strictly require `Host`.
- Even if a malicious participant modifies client code to emit forbidden events, the server rejects unauthorized actions with an `error_message`.

### 4. OOP Architecture on the Backend
- **[`Room`](file:///server/src/models/Room.js)**: Encapsulates room state (current time, video ID, playback status), participant collections, role verification, and dynamic elapsed-time calculation.
- **[`Participant`](file:///server/src/models/Participant.js)**: Encapsulates user identity, socket mapping, role assignment, and serialization.
- **Modular Handlers**: [`roomHandler.js`](file:///server/src/socket/roomHandler.js) and [`playbackHandler.js`](file:///server/src/socket/playbackHandler.js) keep networking logic decoupled from core domain models.

### 5. Deployment Choices & Platform Limits
- **WebSocket Persistence**: Free serverless functions (like standard Vercel API routes) terminate after short timeouts and cannot hold persistent WebSockets. A persistent container on Render keeps connections active.
- **Spin-Down on Free Tier**: Render free services sleep after 15 minutes of inactivity; the initial request requires ~30–50s spin-up time.
