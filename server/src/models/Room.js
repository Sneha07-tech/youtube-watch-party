import { Participant } from './Participant.js';

/**
 * Room class encapsulating watch party state, participants, and playback control logic.
 */
export class Room {
  constructor(roomId, defaultVideoId = 'jfKfPfyJRdk') {
    this.roomId = roomId;
    this.videoId = defaultVideoId;
    this.currentTime = 0;
    this.isPlaying = false;
    this.lastUpdatedAt = Date.now();
    this.participants = new Map(); // socketId -> Participant
  }

  /**
   * Add a new participant to the room.
   * The first participant to join is automatically granted the 'Host' role.
   */
  addParticipant(socketId, username) {
    const isFirstParticipant = this.participants.size === 0;
    const initialRole = isFirstParticipant ? 'Host' : 'Participant';
    const participant = new Participant(socketId, username, initialRole);
    this.participants.set(socketId, participant);
    return participant;
  }

  /**
   * Remove a participant from the room.
   * If the Host leaves and other users remain, automatically promotes the next user to Host.
   */
  removeParticipant(socketId) {
    const participant = this.participants.get(socketId);
    if (!participant) return null;

    this.participants.delete(socketId);

    // If host left and there are remaining users, promote the next user to Host
    if (participant.role === 'Host' && this.participants.size > 0) {
      const nextUser = this.participants.values().next().value;
      if (nextUser) {
        nextUser.setRole('Host');
      }
    }

    return participant;
  }

  /**
   * Get a participant by their socket ID.
   */
  getParticipant(socketId) {
    return this.participants.get(socketId) || null;
  }

  /**
   * Check if a given socket user has permission to control playback.
   */
  canControlPlayback(socketId) {
    const participant = this.getParticipant(socketId);
    return participant && (participant.role === 'Host' || participant.role === 'Moderator');
  }

  /**
   * Check if a given socket user is the Host.
   */
  isHost(socketId) {
    const participant = this.getParticipant(socketId);
    return participant && participant.role === 'Host';
  }

  /**
   * Assign a new role to a target participant (Host only).
   */
  assignRole(requesterSocketId, targetSocketId, newRole) {
    if (!this.isHost(requesterSocketId)) {
      return { success: false, error: 'Only the Host can assign roles.' };
    }

    const target = this.getParticipant(targetSocketId);
    if (!target) {
      return { success: false, error: 'Target participant not found in room.' };
    }

    if (targetSocketId === requesterSocketId && newRole !== 'Host') {
      return { success: false, error: 'Host cannot demote themselves directly. Use transfer host.' };
    }

    const updated = target.setRole(newRole);
    if (!updated) {
      return { success: false, error: 'Invalid role specified.' };
    }

    return { success: true, participant: target };
  }

  /**
   * Transfer host role to another participant.
   */
  transferHost(currentHostSocketId, targetSocketId) {
    if (!this.isHost(currentHostSocketId)) {
      return { success: false, error: 'Only the current Host can transfer host status.' };
    }

    const target = this.getParticipant(targetSocketId);
    if (!target) {
      return { success: false, error: 'Target user not found.' };
    }

    const currentHost = this.getParticipant(currentHostSocketId);
    currentHost.setRole('Moderator');
    target.setRole('Host');

    return { success: true, newHost: target, previousHost: currentHost };
  }

  /**
   * Update video playback state (play/pause/seek).
   */
  updatePlayback(socketId, { isPlaying, currentTime, videoId }) {
    if (!this.canControlPlayback(socketId)) {
      return { success: false, error: 'Playback control restricted to Host and Moderators.' };
    }

    const now = Date.now();

    if (isPlaying !== undefined) {
      const willPlay = Boolean(isPlaying);
      // If we were playing and are now pausing, accumulate elapsed time
      if (this.isPlaying && !willPlay) {
        const elapsed = (now - this.lastUpdatedAt) / 1000;
        this.currentTime += elapsed;
      }
      this.isPlaying = willPlay;
    }

    if (currentTime !== undefined) {
      this.currentTime = Number(currentTime);
    }

    if (videoId !== undefined) {
      this.videoId = String(videoId);
      this.currentTime = 0; // Reset time when video changes
      this.isPlaying = true;
    }

    this.lastUpdatedAt = now;

    return {
      success: true,
      state: this.getPlaybackState()
    };
  }

  /**
   * Get current playback state with dynamically calculated elapsed time.
   */
  getPlaybackState() {
    let currentCalculatedTime = this.currentTime;
    if (this.isPlaying) {
      const elapsedSeconds = (Date.now() - this.lastUpdatedAt) / 1000;
      currentCalculatedTime += elapsedSeconds;
    }

    return {
      videoId: this.videoId,
      currentTime: Math.max(0, currentCalculatedTime),
      isPlaying: this.isPlaying,
      lastUpdatedAt: this.lastUpdatedAt
    };
  }

  /**
   * Return array of all participants in the room.
   */
  getParticipantsList() {
    return Array.from(this.participants.values()).map(p => p.toJSON());
  }

  /**
   * Full room state snapshot.
   */
  getState() {
    return {
      roomId: this.roomId,
      ...this.getPlaybackState(),
      participants: this.getParticipantsList()
    };
  }

  /**
   * Check if the room has no more connected participants.
   */
  isEmpty() {
    return this.participants.size === 0;
  }
}
