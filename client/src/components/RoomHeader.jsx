import React, { useState } from 'react';
import { Tv, Copy, Check, LogOut, Crown, Shield, User } from 'lucide-react';

export function RoomHeader({ roomId, currentUser, onLeave }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Host':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Crown className="w-3.5 h-3.5" /> Host
          </span>
        );
      case 'Moderator':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5" /> Mod
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
            <User className="w-3.5 h-3.5" /> Viewer
          </span>
        );
    }
  };

  return (
    <header className="h-16 border-b border-gray-800 bg-[#0f172a]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <Tv className="w-5 h-5 text-red-500" />
        </div>
        <span className="font-bold text-lg text-white hidden sm:inline">
          Sync<span className="text-red-500">Watch</span>
        </span>
      </div>

      {/* Room Code Badge with Copy */}
      <div className="flex items-center gap-2 bg-[#131b2e] border border-gray-700/80 px-3 py-1.5 rounded-xl">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Room:</span>
        <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">{roomId}</span>
        <button
          onClick={handleCopyCode}
          title="Copy room code"
          className="ml-1 p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* User Info & Leave */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#131b2e] border border-gray-700/80 px-3 py-1 rounded-xl">
          <span className="text-xs text-gray-300 font-medium max-w-[120px] truncate">
            {currentUser?.username || 'You'}
          </span>
          {getRoleBadge(currentUser?.role)}
        </div>

        <button
          onClick={onLeave}
          title="Leave room"
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Leave</span>
        </button>
      </div>
    </header>
  );
}
