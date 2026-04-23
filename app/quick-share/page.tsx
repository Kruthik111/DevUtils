'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Share2,
  Link2,
  Copy,
  Check,
  FileUp,
  Download,
  Send,
  AlertCircle,
  Loader,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';

type ShareState =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'joining'
  | 'connecting'
  | 'connected'
  | 'transferring'
  | 'error';

interface ReceivedFile {
  name: string;
  blob: Blob;
  size: number;
}

interface ReceivedText {
  content: string;
  timestamp: number;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
/** Per SCTP/WebRTC data channel message; stream reads are split to this. */
const CHUNK_SIZE = 32 * 1024;
const SEND_BUFFER_TARGET = 256 * 1024;

/** Resolves when bufferedAmount is low enough, or rejects if the channel is not open. */
function waitDataChannelBackpressure(dc: RTCDataChannel): Promise<void> {
  if (dc.readyState !== 'open') {
    return Promise.reject(new Error('Data channel is not open'));
  }
  if (dc.bufferedAmount <= SEND_BUFFER_TARGET) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    let t: ReturnType<typeof setInterval> | null = null;
    const finish = (fn: () => void) => {
      if (t != null) {
        clearInterval(t);
        t = null;
      }
      dc.removeEventListener('bufferedamountlow', onLow);
      fn();
    };
    const onLow = () => {
      if (dc.readyState !== 'open') {
        finish(() => reject(new Error('Data channel is not open')));
        return;
      }
      if (dc.bufferedAmount <= SEND_BUFFER_TARGET) {
        finish(() => resolve());
      }
    };
    if (dc.bufferedAmount <= SEND_BUFFER_TARGET) {
      finish(() => resolve());
      return;
    }
    t = setInterval(() => {
      if (dc.readyState !== 'open') {
        finish(() => reject(new Error('Data channel is not open')));
        return;
      }
      if (dc.bufferedAmount <= SEND_BUFFER_TARGET) {
        finish(() => resolve());
      }
    }, 8);
    dc.addEventListener('bufferedamountlow', onLow);
  });
}

export default function QuickSharePage() {
  const [state, setState] = useState<ShareState>('idle');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [peerId, setPeerId] = useState<'a' | 'b'>('a');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [connectedPeerId, setConnectedPeerId] = useState('');

  const [textInput, setTextInput] = useState('');
  const [receivedTexts, setReceivedTexts] = useState<ReceivedText[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferFileName, setTransferFileName] = useState('');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fileBufferRef = useRef<{ [key: string]: Uint8Array[] }>({});
  const fileSizeRef = useRef<{ [key: string]: number }>({});
  const fileBytesReceivedRef = useRef<{ [key: string]: number }>({});

  const setupDataChannel = (dc: RTCDataChannel, otherPeer: 'a' | 'b') => {
    dcRef.current = dc;
    dc.binaryType = 'arraybuffer';
    // Below this, `bufferedamountlow` can fire; keeps backpressure from deadlocking
    dc.bufferedAmountLowThreshold = SEND_BUFFER_TARGET;

    dc.onopen = () => {
      setState('connected');
      setConnectedPeerId(otherPeer);
      toast.success('Connected! You can now share files and text.');
    };

    dc.onclose = () => {
      setState('error');
      setError('Connection closed');
      setConnectedPeerId('');
    };

    dc.onmessage = (event) => {
      try {
        if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data);

          if (msg.type === 'file-meta') {
            setTransferFileName(msg.name);
            setTransferProgress(0);
            fileBufferRef.current[msg.name] = [];
            fileSizeRef.current[msg.name] = msg.size;
            fileBytesReceivedRef.current[msg.name] = 0;
          } else if (msg.type === 'file-done') {
            const chunks = fileBufferRef.current[msg.name] || [];
            const blob = new Blob(chunks as BlobPart[], {
              type: 'application/octet-stream',
            });
            setReceivedFiles((prev) => [
              ...prev,
              { name: msg.name, blob, size: fileSizeRef.current[msg.name] || 0 },
            ]);
            delete fileBufferRef.current[msg.name];
            delete fileSizeRef.current[msg.name];
            delete fileBytesReceivedRef.current[msg.name];
            setTransferFileName('');
            setTransferProgress(0);
            toast.success(`File received: ${msg.name}`);
          } else if (msg.type === 'text') {
            setReceivedTexts((prev) => [
              ...prev,
              { content: msg.content, timestamp: Date.now() },
            ]);
          }
        } else {
          // File chunk (binaryType is "arraybuffer"); handle views if present
          let bytes: Uint8Array;
          if (event.data instanceof ArrayBuffer) {
            bytes = new Uint8Array(event.data);
          } else if (ArrayBuffer.isView(event.data)) {
            const v = event.data;
            bytes = new Uint8Array(
              v.buffer,
              v.byteOffset,
              v.byteLength
            );
          } else {
            return;
          }
          const lastFileName = transferFileName || Object.keys(fileBufferRef.current)[0];
          if (lastFileName && fileBufferRef.current[lastFileName]) {
            const buf = new Uint8Array(bytes);
            fileBufferRef.current[lastFileName].push(buf);
            const total = fileSizeRef.current[lastFileName] || 0;
            fileBytesReceivedRef.current[lastFileName] =
              (fileBytesReceivedRef.current[lastFileName] || 0) + buf.length;
            const progress =
              total > 0
                ? Math.min((fileBytesReceivedRef.current[lastFileName] / total) * 100, 99)
                : 0;
            setTransferProgress(progress);
          }
        }
      } catch (err) {
        console.error('DataChannel message error:', err);
      }
    };

    dc.onerror = (e) => {
      // Often followed by onclose; avoid tearing down UI so send() can still surface a clear error
      console.error('Data channel error:', e);
    };
  };

  const otherFrom = (id: 'a' | 'b') => (id === 'a' ? 'b' : 'a');

  async function setupWebRTC(
    isInitiator: boolean,
    code: string,
    myPeerId: 'a' | 'b'
  ) {
    const targetPeerId = otherFrom(myPeerId);
    if (!isInitiator) {
      setState('connecting');
    }
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch('/api/quick-share/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              fromPeerId: myPeerId,
              targetPeerId,
              payload: {
                type: 'ice-candidate',
                candidate: event.candidate,
              },
            }),
          });
        }
      };

      if (isInitiator) {
        const dc = pc.createDataChannel('share', { ordered: true });
        setupDataChannel(dc, targetPeerId);
      }

      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel, targetPeerId);
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await fetch('/api/quick-share/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            fromPeerId: myPeerId,
            targetPeerId,
            payload: {
              type: 'offer',
              offer: { type: offer.type, sdp: offer.sdp },
            },
          }),
        });
      }
    } catch (err) {
      console.error('WebRTC setup error:', err);
      setError('Failed to establish connection');
      setState('error');
    }
  }

  function subscribeToSignaling(code: string, myPeerId: 'a' | 'b') {
    const targetPeerId = otherFrom(myPeerId);
    const eventSource = new EventSource(
      `/api/quick-share/room?code=${encodeURIComponent(code)}&peerId=${myPeerId}`
    );

    eventSourceRef.current = eventSource;

    eventSource.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          // Initial connection ACK
        } else if (msg.type === 'offer') {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription({ type: 'offer', sdp: msg.offer.sdp })
            );
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);

            await fetch('/api/quick-share/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code,
                fromPeerId: myPeerId,
                targetPeerId,
                payload: {
                  type: 'answer',
                  answer: { type: answer.type, sdp: answer.sdp },
                },
              }),
            });
          }
        } else if (msg.type === 'answer') {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription({ type: 'answer', sdp: msg.answer.sdp })
            );
          }
        } else if (msg.type === 'ice-candidate') {
          if (pcRef.current && msg.candidate) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.warn('ICE candidate error:', e);
            }
          }
        }
      } catch (err) {
        console.error('Signaling error:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setError('Signaling connection lost');
      setState('error');
    };
  }

  const createRoom = async () => {
    setState('creating');
    try {
      const res = await fetch('/api/quick-share/room', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create room');

      const data = await res.json();
      const newCode = data.code as string;
      setRoomCode(newCode);
      setPeerId('a');
      setState('waiting');

      subscribeToSignaling(newCode, 'a');
      await setupWebRTC(true, newCode, 'a');
    } catch (err) {
      setError('Failed to create room');
      setState('error');
      console.error(err);
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setState('joining');
    try {
      const codeUpper = joinCode.toUpperCase();
      const res = await fetch(
        `/api/quick-share/room?code=${encodeURIComponent(codeUpper)}&verify=1`,
        { method: 'GET', headers: { 'Cache-Control': 'no-cache' } }
      );

      if (res.status === 404) {
        setError('Room not found');
        setState('idle');
        return;
      }

      if (!res.ok) throw new Error('Failed to join room');

      setRoomCode(codeUpper);
      setPeerId('b');
      setState('connecting');

      // PC must exist before SSE delivers the offer; host queues signals until b connects.
      await setupWebRTC(false, codeUpper, 'b');
      subscribeToSignaling(codeUpper, 'b');
    } catch (err) {
      setError('Failed to join room');
      setState('idle');
      console.error(err);
    }
  };

  const sendText = async () => {
    if (!textInput.trim() || !dcRef.current) return;

    dcRef.current.send(
      JSON.stringify({
        type: 'text',
        content: textInput,
      })
    );

    setReceivedTexts((prev) => [
      ...prev,
      { content: textInput, timestamp: Date.now() },
    ]);
    setTextInput('');
  };

  const sendFile = async (file: File) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== 'open') {
      toast.error('Not connected');
      return;
    }

    setState('transferring');
    setTransferFileName(file.name);
    setTransferProgress(0);

    try {
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

      dc.send(
        JSON.stringify({
          type: 'file-meta',
          name: file.name,
          size: file.size,
          mimeType: file.type,
          totalChunks,
        })
      );

      const reader = file.stream().getReader();
      let bytesSent = 0;

      const sendSlice = async (u8: Uint8Array) => {
        let offset = 0;
        while (offset < u8.length) {
          const end = Math.min(offset + CHUNK_SIZE, u8.length);
          const part = u8.subarray(offset, end);
          await waitDataChannelBackpressure(dc);
          if (dc.readyState !== 'open') {
            throw new Error('Data channel is not open');
          }
          dc.send(part);
          offset = end;
          bytesSent += part.length;
          setTransferProgress((bytesSent / file.size) * 100);
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (value) {
          await sendSlice(new Uint8Array(value));
        }
        if (done) break;
      }

      if (dc.readyState !== 'open') {
        throw new Error('Data channel is not open');
      }
      dc.send(
        JSON.stringify({
          type: 'file-done',
          name: file.name,
        })
      );

      setState('connected');
      setTransferFileName('');
      setTransferProgress(0);
      toast.success(`File sent: ${file.name}`);
    } catch (err) {
      console.error('File send error:', err);
      toast.error('Failed to send file');
      setState('connected');
    }
  };

  const downloadFile = (file: ReceivedFile) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/quick-share?room=${roomCode}`;
    await navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const reset = () => {
    setState('idle');
    setRoomCode('');
    setJoinCode('');
    setError('');
    setConnectedPeerId('');
    setTextInput('');
    setReceivedTexts([]);
    setReceivedFiles([]);
    if (pcRef.current) pcRef.current.close();
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (dcRef.current) dcRef.current.close();
    fileBufferRef.current = {};
    fileSizeRef.current = {};
    fileBytesReceivedRef.current = {};
  };

  // Handle room code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && state === 'idle') {
      setJoinCode(code);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
            <Share2 className="w-8 h-8 text-primary" />
            Quick Share
          </h1>
          <p className="text-foreground/60">
            P2P file and text sharing. Everything is encrypted and stays between you and
            your peer.
          </p>
        </div>

        {state === 'idle' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Create Room
              </h2>
              <p className="text-sm text-foreground/60 mb-6">
                Start a new P2P session. Share the code or link with someone else.
              </p>
              <button
                onClick={createRoom}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition"
              >
                Create Room
              </button>
            </div>

            <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Join Room
              </h2>
              <p className="text-sm text-foreground/60 mb-4">
                Enter a room code to connect with someone already sharing.
              </p>
              <input
                type="text"
                placeholder="Enter room code (e.g., X7K2MN)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground mb-4 focus:ring-1 focus:ring-primary/50 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              />
              <button
                onClick={joinRoom}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition"
              >
                Join Room
              </button>
            </div>
          </div>
        )}

        {state === 'creating' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-foreground">Creating room...</p>
          </div>
        )}

        {state === 'waiting' && (
          <div className="bg-background border border-primary/20 rounded-xl p-8 shadow-sm max-w-md mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">Share this code:</h2>
            <div className="bg-secondary rounded-lg p-6 mb-6 text-center">
              <p className="text-4xl font-mono font-bold text-primary tracking-widest">
                {roomCode}
              </p>
            </div>

            <button
              onClick={copyCode}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition mb-3 flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>

            <button
              onClick={copyLink}
              className="w-full bg-secondary border border-border hover:bg-accent text-foreground font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              Copy Link
            </button>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/60">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Waiting for peer...
              </div>
            </div>
          </div>
        )}

        {state === 'joining' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-foreground">Joining room...</p>
          </div>
        )}

        {state === 'connecting' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-foreground">Establishing secure P2P connection...</p>
          </div>
        )}

        {(state === 'connected' || state === 'transferring') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-background border border-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-foreground">Connected</span>
              </div>
              <button
                onClick={reset}
                className="bg-secondary hover:bg-accent border border-border text-foreground font-semibold text-xs py-2 px-4 rounded-lg transition"
              >
                Disconnect
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Text Share */}
              <div className="bg-background border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Share Text</h3>
                <textarea
                  placeholder="Enter text to share..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground mb-4 focus:ring-1 focus:ring-primary/50 outline-none h-24 resize-none"
                />
                <button
                  onClick={sendText}
                  disabled={!textInput.trim()}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Text
                </button>

                {receivedTexts.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-foreground/40 uppercase">
                      Received Messages
                    </p>
                    {receivedTexts.map((text, i) => (
                      <div
                        key={i}
                        className="bg-secondary border border-border/50 rounded-lg p-3 text-sm"
                      >
                        <p className="text-foreground break-words">{text.content}</p>
                        <p className="text-xs text-foreground/40 mt-1">
                          {new Date(text.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Share */}
              <div className="bg-background border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Share Files</h3>
                <label className="block w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/50 transition">
                  <FileUp className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    Drop files here or click to select
                  </p>
                  <p className="text-xs text-foreground/60">Max 100 MB per file</p>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) sendFile(file);
                    }}
                    className="hidden"
                  />
                </label>

                {state === 'transferring' && transferFileName && (
                  <div className="mt-6 p-4 bg-secondary rounded-lg">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      Sending: {transferFileName}
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2 border border-border">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${transferProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground/60 mt-2">
                      {Math.round(transferProgress)}%
                    </p>
                  </div>
                )}

                {receivedFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-foreground/40 uppercase">
                      Received Files
                    </p>
                    {receivedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="bg-secondary border border-border/50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => downloadFile(file)}
                          className="ml-3 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-lg transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-background border border-red-500/20 rounded-xl p-6 shadow-sm max-w-md mx-auto">
            <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Error
            </h2>
            <p className="text-foreground/60 mb-6">{error}</p>
            <button
              onClick={reset}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
