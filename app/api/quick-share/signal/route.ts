import { NextRequest, NextResponse } from 'next/server';
import { getRoom, pushMessageToPeer } from '@/lib/quick-share-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, fromPeerId, targetPeerId, payload } = body;

    if (!code || !fromPeerId || !targetPeerId || !payload) {
      return NextResponse.json(
        { error: 'Missing code, fromPeerId, targetPeerId, or payload' },
        { status: 400 }
      );
    }

    const room = getRoom(code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const success = pushMessageToPeer(code, targetPeerId, payload);
    if (!success) {
      return NextResponse.json({ error: 'Target peer not found or disconnected' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending signal:', error);
    return NextResponse.json({ error: 'Failed to send signal' }, { status: 500 });
  }
}
