import { NextRequest, NextResponse } from 'next/server';
import {
  generateRoomCode,
  getRoom,
  createRoom,
  addPeerToRoom,
  removePeerFromRoom,
} from '@/lib/quick-share-store';

export async function POST(req: NextRequest) {
  try {
    let code = generateRoomCode();
    while (getRoom(code)) {
      code = generateRoomCode();
    }

    createRoom(code);
    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const verify = req.nextUrl.searchParams.get('verify');

  if (verify === '1') {
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }
    const room = getRoom(code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const peerId = req.nextUrl.searchParams.get('peerId');

  if (!code || !peerId) {
    return NextResponse.json({ error: 'Missing code or peerId' }, { status: 400 });
  }

  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addPeerToRoom(code, peerId, controller);

      const ack = `data: ${JSON.stringify({ type: 'connected', peerId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(ack));

      const originalClose = controller.close.bind(controller);
      controller.close = function () {
        removePeerFromRoom(code, peerId);
        originalClose();
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
