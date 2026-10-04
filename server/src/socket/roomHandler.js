/**
 * Socket handlers for room management, roles, and participants.
 */
export function registerRoomHandlers(io, socket, rooms) {
  /**
   * User joins a room.
   */
  socket.on('join_room', ({ roomId, username }) => {
    if (!roomId || !username) {
      return socket.emit('error_message', 'Room ID and username are required.');
    }

    const cleanRoomId = roomId.trim().toLowerCase();
    const cleanUsername = username.trim();

    let room = rooms.get(cleanRoomId);
    if (!room) {
      // Room will be created in server.js or dynamically here
      return socket.emit('error_message', 'Room does not exist.');
    }

    // Add participant to room
    const participant = room.addParticipant(socket.id, cleanUsername);
    socket.join(cleanRoomId);
    socket.data.roomId = cleanRoomId;
    socket.data.username = cleanUsername;

    console.log(`[JOIN] ${cleanUsername} (${socket.id}) joined room "${cleanRoomId}" as ${participant.role}`);

    // Notify newly joined client of full initial state
    socket.emit('sync_state', room.getState());

    // Broadcast to everyone else in the room that a new user joined
    io.to(cleanRoomId).emit('user_joined', {
      username: participant.username,
      userId: participant.id,
      role: participant.role,
      participants: room.getParticipantsList()
    });
  });

  /**
   * Host assigns a new role (e.g. promote Participant -> Moderator).
   */
  socket.on('assign_role', ({ roomId, targetUserId, newRole }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error_message', 'Room not found.');

    const result = room.assignRole(socket.id, targetUserId, newRole);
    if (!result.success) {
      return socket.emit('error_message', result.error);
    }

    console.log(`[ROLE] ${result.participant.username} assigned role "${newRole}" in room "${roomId}"`);

    // Broadcast updated participant list and role change
    io.to(roomId).emit('role_assigned', {
      userId: result.participant.id,
      username: result.participant.username,
      role: result.participant.role,
      participants: room.getParticipantsList()
    });
  });

  /**
   * Host removes (kicks) a participant from the room.
   */
  socket.on('remove_participant', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error_message', 'Room not found.');

    if (!room.isHost(socket.id)) {
      return socket.emit('error_message', 'Only the Host can remove participants.');
    }

    const targetParticipant = room.getParticipant(targetUserId);
    if (!targetParticipant) {
      return socket.emit('error_message', 'Participant not found.');
    }

    // Remove from room state
    room.removeParticipant(targetUserId);

    // Notify the kicked socket directly to leave
    const targetSocket = io.sockets.sockets.get(targetUserId);
    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.emit('kicked', { message: 'You have been removed from the watch party by the host.' });
    }

    // Notify all remaining participants in the room
    io.to(roomId).emit('participant_removed', {
      userId: targetUserId,
      username: targetParticipant.username,
      participants: room.getParticipantsList()
    });
  });

  /**
   * Host transfers host status to another participant.
   */
  socket.on('transfer_host', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error_message', 'Room not found.');

    const result = room.transferHost(socket.id, targetUserId);
    if (!result.success) {
      return socket.emit('error_message', result.error);
    }

    io.to(roomId).emit('role_assigned', {
      userId: result.newHost.id,
      username: result.newHost.username,
      role: result.newHost.role,
      participants: room.getParticipantsList()
    });
  });

  /**
   * Live chat message broadcast.
   */
  socket.on('send_chat', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room || !message || !message.trim()) return;

    const participant = room.getParticipant(socket.id);
    const chatPayload = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: socket.id,
      username: participant ? participant.username : 'Guest',
      role: participant ? participant.role : 'Participant',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    io.to(roomId).emit('chat_received', chatPayload);
  });

  /**
   * Explicit leave_room or socket disconnect.
   */
  const handleLeave = () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const removedParticipant = room.removeParticipant(socket.id);
    socket.leave(roomId);
    socket.data.roomId = null;

    if (removedParticipant) {
      console.log(`[LEAVE] ${removedParticipant.username} left room "${roomId}"`);

      // If room is empty, clean it up after a grace period
      if (room.isEmpty()) {
        console.log(`[CLEANUP] Room "${roomId}" is now empty. Removing.`);
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit('user_left', {
          userId: socket.id,
          username: removedParticipant.username,
          participants: room.getParticipantsList()
        });
      }
    }
  };

  socket.on('leave_room', handleLeave);
  socket.on('disconnect', handleLeave);
}
