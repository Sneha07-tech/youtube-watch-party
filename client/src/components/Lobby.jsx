import React, { useState } from 'react';
import { Tv, Users, Shield, PlayCircle, Sparkles, ArrowRight } from 'lucide-react';

export function Lobby({ onJoin }) {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError('Please enter your name first.');
      return;
    }
    setError('');
    // Generate a random clean room code: e.g. "party-948"
    const randomCode = 'party-' + Math.floor(100 + Math.random() * 900);
    onJoin({ roomId: randomCode, username: username.trim(), isCreator: true });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code.');
      return;
    }
    setError('');
    onJoin({ roomId: roomCode.trim().toLowerCase(), username: username.trim(), isCreator: false });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4 shadow-lg shadow-red-500/5">
            <Tv className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            Sync<span className="text-red-500">Watch</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Watch YouTube videos together with real-time sync & roles
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#131b2e]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3.5 py-2.5 rounded-xl font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Step 1: Enter Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Your Nickname
            </label>
            <input
              type="text"
              placeholder="e.g. Alex"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0b0f19] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          {/* Action 1: Create Room */}
          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create New Watch Party</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="flex-shrink mx-4 text-xs uppercase font-medium text-gray-500">
              Or join existing
            </span>
            <div className="flex-grow border-t border-gray-800"></div>
          </div>

          {/* Action 2: Join via Room Code */}
          <form onSubmit={handleJoinRoom} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Enter Room Code (e.g. party-101)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full bg-[#0b0f19] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm border border-gray-700"
            >
              <span>Join Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Feature Pills Footer */}
        <div className="grid grid-cols-3 gap-3 mt-6 text-center text-xs text-gray-400">
          <div className="bg-[#131b2e]/50 border border-gray-800/60 p-2.5 rounded-xl flex flex-col items-center gap-1">
            <PlayCircle className="w-4 h-4 text-red-400" />
            <span>Instant Sync</span>
          </div>
          <div className="bg-[#131b2e]/50 border border-gray-800/60 p-2.5 rounded-xl flex flex-col items-center gap-1">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Host & Roles</span>
          </div>
          <div className="bg-[#131b2e]/50 border border-gray-800/60 p-2.5 rounded-xl flex flex-col items-center gap-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Multiplayer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
