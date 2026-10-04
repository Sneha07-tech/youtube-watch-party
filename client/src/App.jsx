import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Lobby } from './components/Lobby';
import { RoomHeader } from './components/RoomHeader';
import { VideoPlayer } from './components/VideoPlayer';
import { ParticipantList } from './components/ParticipantList';
import { Chat } from './components/Chat';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export function App() {
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [playbackState, setPlaybackState] = useState({
    videoId: 'jfKfPfyJRdk', // Default chill lofi video
    currentTime: 0,
    isPlaying: false
  });
  const [notification, setNotification] = useState('');
  const socketRef = useRef(null);

  // Initialize socket connection once
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket.id);
    });

    socket.on('sync_state', (state) => {
      console.log('Room synced:', state);
      setPlaybackState({
        videoId: state.videoId,
        currentTime: state.currentTime,
        isPlaying: state.isPlaying
      });
      setParticipants(state.participants || []);

      const myUser = state.participants.find((p) => p.id === socket.id);
      if (myUser) {
        setCurrentUser(myUser);
      }
    });

    socket.on('user_joined', (data) => {
      setParticipants(data.participants);
      showToast(`${data.username} joined the party!`);
    });

    socket.on('user_left', (data) => {
      setParticipants(data.participants);
      showToast(`${data.username} left the room.`);
    });

    socket.on('role_assigned', (data) => {
      setParticipants(data.participants);
      if (data.userId === socket.id) {
        setCurrentUser((prev) => ({ ...prev, role: data.role }));
        showToast(`Your role changed to: ${data.role}`);
      } else {
        showToast(`${data.username} is now ${data.role}`);
      }
    });

    socket.on('participant_removed', (data) => {
      setParticipants(data.participants);
      showToast(`${data.username} was removed from the party.`);
    });

    socket.on('change_video', ({ videoId }) => {
      setPlaybackState((prev) => ({
        ...prev,
        videoId,
        currentTime: 0,
        isPlaying: true
      }));
      showToast('Video changed!');
    });

    socket.on('kicked', ({ message }) => {
      alert(message || 'You have been removed from the room.');
      handleLeaveRoom();
    });

    socket.on('error_message', (msg) => {
      showToast(`Error: ${msg}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 4000);
  };

  const handleJoin = async ({ roomId: enteredRoomId, username }) => {
    const socket = socketRef.current;
    if (!socket) return;

    try {
      // Proactively ensure room is created on backend
      await fetch(`${BACKEND_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: enteredRoomId })
      });
    } catch (err) {
      console.warn('API room pre-creation failed, relying on WebSocket directly:', err);
    }

    setRoomId(enteredRoomId);
    setCurrentUser({ id: socket.id, username, role: 'Participant' });

    socket.emit('join_room', {
      roomId: enteredRoomId,
      username
    });

    setInRoom(true);
  };

  const handleLeaveRoom = () => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('leave_room', { roomId });
    }
    setInRoom(false);
    setRoomId('');
    setParticipants([]);
    setCurrentUser(null);
  };

  const canControl = currentUser?.role === 'Host' || currentUser?.role === 'Moderator';

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#1e293b]/95 border border-red-500/40 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md animate-bounce">
          {notification}
        </div>
      )}

      {!inRoom ? (
        <Lobby onJoin={handleJoin} />
      ) : (
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <RoomHeader
            roomId={roomId}
            currentUser={currentUser}
            onLeave={handleLeaveRoom}
          />

          {/* Main Layout (Left: Video Player, Right: Sidebar) */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Left Column: Video & Controls (~70%) */}
              <div className="lg:col-span-8 flex flex-col">
                <VideoPlayer
                  videoId={playbackState.videoId}
                  canControl={canControl}
                  socket={socketRef.current}
                  roomId={roomId}
                  playbackState={playbackState}
                />
              </div>

              {/* Right Column: Participants & Chat (~30%) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="flex-1 min-h-[220px]">
                  <ParticipantList
                    participants={participants}
                    currentUser={currentUser}
                    socket={socketRef.current}
                    roomId={roomId}
                  />
                </div>
                <div className="flex-1 min-h-[260px]">
                  <Chat
                    socket={socketRef.current}
                    roomId={roomId}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
