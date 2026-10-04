/**
 * Participant model representing an individual user connected to a watch room.
 */
export class Participant {
  constructor(id, username, role = 'Participant') {
    this.id = id;
    this.username = username || 'Anonymous';
    this.role = role; // 'Host' | 'Moderator' | 'Participant'
    this.joinedAt = new Date();
  }

  setRole(newRole) {
    if (['Host', 'Moderator', 'Participant'].includes(newRole)) {
      this.role = newRole;
      return true;
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt
    };
  }
}
