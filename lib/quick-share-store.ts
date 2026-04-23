export interface Peer {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array> | null;
}

const MAX_PENDING_SIGNALS = 200;

export interface Room {
  code: string;
  peers: Map<string, Peer>;
  createdAt: number;
  /** Messages for a peer that was not yet connected; flushed on addPeerToRoom */
  pendingByPeer: Map<string, unknown[]>;
}

// Module-level singleton room store - shared across all API routes
const rooms = new Map<string, Room>();

// Auto-cleanup rooms older than 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > 30 * 60 * 1000) {
      // Close all peer connections
      for (const peer of room.peers.values()) {
        if (peer.controller) {
          try {
            peer.controller.close();
          } catch (e) {
            // Already closed
          }
        }
      }
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getRooms(): Map<string, Room> {
  return rooms;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function createRoom(code: string): Room {
  const room: Room = {
    code,
    peers: new Map(),
    createdAt: Date.now(),
    pendingByPeer: new Map(),
  };
  rooms.set(code, room);
  return room;
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (room) {
    for (const peer of room.peers.values()) {
      if (peer.controller) {
        try {
          peer.controller.close();
        } catch (e) {
          // Already closed
        }
      }
    }
  }
  rooms.delete(code);
}

export function addPeerToRoom(code: string, peerId: string, controller: ReadableStreamDefaultController<Uint8Array>): boolean {
  const room = rooms.get(code);
  if (!room) return false;

  room.peers.set(peerId, { id: peerId, controller });

  const pending = room.pendingByPeer.get(peerId);
  if (pending?.length) {
    for (const message of pending) {
      try {
        const sse = `data: ${JSON.stringify(message)}\n\n`;
        controller.enqueue(new TextEncoder().encode(sse));
      } catch (e) {
        console.error('Error flushing pending signal to peer:', e);
        break;
      }
    }
    room.pendingByPeer.delete(peerId);
  }
  return true;
}

export function removePeerFromRoom(code: string, peerId: string): void {
  const room = rooms.get(code);
  if (!room) return;

  room.peers.delete(peerId);
  if (room.peers.size === 0) {
    rooms.delete(code);
  }
}

export function getPeerFromRoom(code: string, peerId: string): Peer | undefined {
  const room = rooms.get(code);
  if (!room) return undefined;
  return room.peers.get(peerId);
}

export function pushMessageToPeer(code: string, targetPeerId: string, message: any): boolean {
  const room = getRoom(code);
  if (!room) return false;

  const peer = getPeerFromRoom(code, targetPeerId);
  if (peer?.controller) {
    try {
      const sse = `data: ${JSON.stringify(message)}\n\n`;
      peer.controller.enqueue(new TextEncoder().encode(sse));
      return true;
    } catch (error) {
      console.error('Error pushing message to peer:', error);
    }
  }

  const q = room.pendingByPeer.get(targetPeerId) ?? [];
  if (q.length >= MAX_PENDING_SIGNALS) {
    console.warn('Pending signal queue full, dropping');
    return false;
  }
  q.push(message);
  room.pendingByPeer.set(targetPeerId, q);
  return true;
}
