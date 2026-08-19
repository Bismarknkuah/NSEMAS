const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { collection } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'nsemas-dev-secret-change-in-production';
const sessions = collection('vclass_sessions');

/**
 * Virtual classroom signaling
 * -----------------------------
 * This is real, working WebRTC: genuine camera/microphone capture and
 * genuine peer-to-peer media connections between browsers, not a
 * simulation. What this file does is the "signaling" — relaying the
 * connection-setup messages (offers, answers, ICE candidates) that two
 * browsers need to exchange before they can talk directly to each other.
 * Once that handshake completes, video/audio flows directly
 * browser-to-browser; this server never sees or touches the media itself.
 *
 * The one honest limit worth stating plainly: this uses STUN only (Google's
 * public STUN servers, for NAT traversal) — there is no TURN relay server
 * here. That means connections work reliably across the great majority of
 * home, mobile, and office networks, but can fail to connect across some
 * restrictive corporate/institutional firewalls that block direct peer
 * traffic entirely. A production deployment serving many institutions
 * would want a TURN server added; this build doesn't have one.
 *
 * Topology: full mesh (every participant connects directly to every other
 * participant). This is the right choice for the small-group class/meeting
 * sizes this feature is built for — it doesn't need a media server — but it
 * doesn't scale indefinitely; each added participant means one more
 * connection for everyone already in the room, so this stays smooth for
 * small-to-moderate class sizes rather than large-lecture-hall video (100+
 * simultaneous cameras would need a proper SFU media server, which this
 * isn't).
 */

module.exports = function attachSignaling(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/vclass' });

  // roomCode -> Map(userId -> { ws, name, role, muted, videoOff, handRaised })
  const rooms = new Map();

  function broadcastRoomState(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const participants = [...room.values()].map((p) => ({
      userId: p.userId, name: p.name, role: p.role, muted: p.muted, videoOff: p.videoOff, handRaised: p.handRaised, isHost: p.isHost,
    }));
    const payload = JSON.stringify({ type: 'room-state', participants });
    for (const p of room.values()) {
      if (p.ws.readyState === 1) p.ws.send(payload);
    }
  }

  function broadcastChat(roomCode, message) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const payload = JSON.stringify({ type: 'chat', message });
    for (const p of room.values()) {
      if (p.ws.readyState === 1) p.ws.send(payload);
    }
  }

  wss.on('connection', (ws, req) => {
    let joinedRoom = null;
    let userId = null;

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      if (msg.type === 'join') {
        let decoded;
        try { decoded = jwt.verify(msg.token, JWT_SECRET); } catch { ws.close(4001, 'Invalid token'); return; }
        const session = sessions.findById(msg.sessionId);
        if (!session || !session.active) { ws.close(4004, 'Session not found or ended'); return; }

        userId = decoded.id;
        joinedRoom = session.id;
        if (!rooms.has(joinedRoom)) rooms.set(joinedRoom, new Map());
        const room = rooms.get(joinedRoom);

        const existing = [...room.values()].map((p) => ({ userId: p.userId, name: p.name }));
        ws.send(JSON.stringify({ type: 'joined', selfId: userId, existingParticipants: existing }));

        room.set(userId, {
          userId, ws, name: decoded.name, role: decoded.role,
          muted: false, videoOff: false, handRaised: false, isHost: session.hostUserId === userId,
        });

        for (const p of room.values()) {
          if (p.userId !== userId && p.ws.readyState === 1) {
            p.ws.send(JSON.stringify({ type: 'peer-joined', userId, name: decoded.name }));
          }
        }
        broadcastRoomState(joinedRoom);
        return;
      }

      if (!joinedRoom || !rooms.has(joinedRoom)) return;
      const room = rooms.get(joinedRoom);

      if (msg.type === 'signal') {
        const target = room.get(msg.to);
        if (target && target.ws.readyState === 1) {
          target.ws.send(JSON.stringify({ type: 'signal', from: userId, data: msg.data }));
        }
      } else if (msg.type === 'update-state') {
        const me = room.get(userId);
        if (me) {
          if (typeof msg.muted === 'boolean') me.muted = msg.muted;
          if (typeof msg.videoOff === 'boolean') me.videoOff = msg.videoOff;
          if (typeof msg.handRaised === 'boolean') me.handRaised = msg.handRaised;
          broadcastRoomState(joinedRoom);
        }
      } else if (msg.type === 'chat-send') {
        const me = room.get(userId);
        if (me && msg.text) {
          broadcastChat(joinedRoom, { from: me.name, text: String(msg.text).slice(0, 2000), at: new Date().toISOString() });
        }
      } else if (msg.type === 'host-remove') {
        const me = room.get(userId);
        if (me?.isHost) {
          const target = room.get(msg.userId);
          if (target) {
            target.ws.send(JSON.stringify({ type: 'removed' }));
            target.ws.close();
          }
        }
      } else if (msg.type === 'host-end-session') {
        const me = room.get(userId);
        if (me?.isHost) {
          sessions.updateById(joinedRoom, { active: false, endedAt: new Date().toISOString() });
          for (const p of room.values()) {
            if (p.ws.readyState === 1) p.ws.send(JSON.stringify({ type: 'session-ended' }));
          }
          rooms.delete(joinedRoom);
        }
      }
    });

    ws.on('close', () => {
      if (!joinedRoom || !userId) return;
      const room = rooms.get(joinedRoom);
      if (!room) return;
      room.delete(userId);
      for (const p of room.values()) {
        if (p.ws.readyState === 1) p.ws.send(JSON.stringify({ type: 'peer-left', userId }));
      }
      if (room.size === 0) rooms.delete(joinedRoom);
      else broadcastRoomState(joinedRoom);
    });
  });

  console.log('Virtual classroom signaling attached at /ws/vclass');
};
