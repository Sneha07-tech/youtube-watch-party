/**
 * Socket handlers for synchronized playback controls (Play, Pause, Seek, Change Video).
 */
export function registerPlaybackHandlers(io, socket, rooms) {
  /**
   * Helper to validate permissions before processing playback event.
   */
  const validateControlPermission = (roomId) => {
    const cleanRoomId = (roomId || socket.data?.roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) {
      socket.emit('error_message', 'Room not found.');
      return null;
    }

    if (!room.canControlPlayback(socket.id)) {
      socket.emit('error_message', 'Permission denied: Only Host and Moderators can control playback.');
      return null;
    }

    return { room, cleanRoomId };
  };

  /**
   * User pressed play.
   */
  socket.on('play', ({ roomId, currentTime }) => {
    const res = validateControlPermission(roomId);
    if (!res) return;
    const { room, cleanRoomId } = res;

    room.updatePlayback(socket.id, {
      isPlaying: true,
      currentTime: currentTime !== undefined ? currentTime : room.currentTime
    });

    socket.to(cleanRoomId).emit('play', {
      currentTime: room.currentTime,
      userId: socket.id
    });
  });

  /**
   * User pressed pause.
   */
  socket.on('pause', ({ roomId, currentTime }) => {
    const res = validateControlPermission(roomId);
    if (!res) return;
    const { room, cleanRoomId } = res;

    room.updatePlayback(socket.id, {
      isPlaying: false,
      currentTime: currentTime !== undefined ? currentTime : room.currentTime
    });

    socket.to(cleanRoomId).emit('pause', {
      currentTime: room.currentTime,
      userId: socket.id
    });
  });

  /**
   * User jumped/seeked to a different timestamp.
   */
  socket.on('seek', ({ roomId, currentTime }) => {
    const res = validateControlPermission(roomId);
    if (!res) return;
    const { room, cleanRoomId } = res;

    room.updatePlayback(socket.id, {
      currentTime: Number(currentTime)
    });

    socket.to(cleanRoomId).emit('seek', {
      currentTime: room.currentTime,
      userId: socket.id
    });
  });

  /**
   * User changed the active YouTube video.
   */
  socket.on('change_video', ({ roomId, videoId }) => {
    const res = validateControlPermission(roomId);
    if (!res) return;
    const { room, cleanRoomId } = res;

    if (!videoId) {
      return socket.emit('error_message', 'Invalid video ID.');
    }

    room.updatePlayback(socket.id, {
      videoId,
      currentTime: 0,
      isPlaying: true
    });

    console.log(`[VIDEO CHANGE] Room "${cleanRoomId}" video changed to ${videoId}`);

    // Broadcast video change to everyone in the room (including sender to confirm change)
    io.to(cleanRoomId).emit('change_video', {
      videoId: room.videoId,
      userId: socket.id
    });
  });

  /**
   * Viewer manually requests immediate synchronization with room.
   */
  socket.on('request_sync', ({ roomId }) => {
    const cleanRoomId = (roomId || socket.data?.roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;

    // Send latest calculated state directly back to the requesting client
    socket.emit('sync_state', room.getState());
  });

  /**
   * Host sends periodic playback heartbeat to keep everyone aligned.
   */
  socket.on('heartbeat', ({ roomId, currentTime, isPlaying }) => {
    const cleanRoomId = (roomId || socket.data?.roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;

    // Only host or moderator can send heartbeats
    if (!room.canControlPlayback(socket.id)) return;

    if (currentTime !== undefined) {
      room.currentTime = Number(currentTime);
      room.lastUpdatedAt = Date.now();
    }
    if (isPlaying !== undefined) {
      room.isPlaying = Boolean(isPlaying);
    }

    // Broadcast time sync to participants
    socket.to(cleanRoomId).emit('time_sync', {
      currentTime: room.currentTime,
      isPlaying: room.isPlaying
    });
  });
}
