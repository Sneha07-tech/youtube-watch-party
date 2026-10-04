import React from 'react';
import { Users, Crown, Shield, UserMinus, ArrowUpCircle, ArrowDownCircle, ShieldCheck } from 'lucide-react';

export function ParticipantList({
  participants,
  currentUser,
  socket,
  roomId
}) {
  const isHost = currentUser?.role === 'Host';

  const handleAssignRole = (targetUserId, newRole) => {
    socket.emit('assign_role', {
      roomId,
      targetUserId,
      newRole
    });
  };

  const handleKickParticipant = (targetUserId, targetUsername) => {
    if (window.confirm(`Are you sure you want to remove ${targetUsername} from the room?`)) {
      socket.emit('remove_participant', {
        roomId,
        targetUserId
      });
    }
  };

  return (
    <div className="bg-[#131b2e] border border-gray-800 rounded-2xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Users className="w-4 h-4 text-red-500" />
          <span>Participants</span>
        </div>
        <span className="bg-gray-800 text-gray-300 text-xs font-mono px-2 py-0.5 rounded-full border border-gray-700">
          {participants.length}
        </span>
      </div>

      {/* List */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {participants.map((user) => {
          const isSelf = user.id === currentUser?.id;
          const isTargetHost = user.role === 'Host';

          return (
            <div
              key={user.id}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                isSelf
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-[#0f172a]/60 border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* User Avatar & Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    user.role === 'Host'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : user.role === 'Moderator'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  {user.role === 'Host' ? (
                    <Crown className="w-4 h-4" />
                  ) : user.role === 'Moderator' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                    <span>{user.username}</span>
                    {isSelf && <span className="text-[10px] text-gray-400">(you)</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>

              {/* Host Control Actions */}
              {isHost && !isSelf && !isTargetHost && (
                <div className="flex items-center gap-1 shrink-0">
                  {user.role === 'Participant' ? (
                    <button
                      onClick={() => handleAssignRole(user.id, 'Moderator')}
                      title="Promote to Moderator"
                      className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAssignRole(user.id, 'Participant')}
                      title="Demote to Viewer"
                      className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleKickParticipant(user.id, user.username)}
                    title="Remove user from room"
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
