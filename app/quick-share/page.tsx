'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Peer, { DataConnection } from 'peerjs';
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
  Wifi,
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

// Namespace peer IDs so codes don't collide with other apps using the public PeerJS signaling
const PEER_ID_PREFIX = 'devutils-quickshare-';
const CHUNK_SIZE = 64 * 1024;
const SEND_BUFFER_TARGET = 256 * 1024;

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** Waits until the underlying RTCDataChannel drains below SEND_BUFFER_TARGET. */
function waitBackpressure(conn: DataConnection): Promise<void> {
  const dc = conn.dataChannel;
  if (!dc || dc.readyState !== 'open') return Promise.resolve();
  if (dc.bufferedAmount <= SEND_BUFFER_TARGET) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let t: ReturnType<typeof setInterval> | null = null;
    const cleanup = () => {
      if (t) {
        clearInterval(t);
        t = null;
      }
      dc.removeEventListener('bufferedamountlow', onLow);
    };
    const onLow = () => {
      if (dc.readyState !== 'open') {
        cleanup();
        reject(new Error('Data channel is not open'));
        return;
      }
      if (dc.bufferedAmount <= SEND_BUFFER_TARGET) {
        cleanup();
        resolve();
      }
    };
    dc.bufferedAmountLowThreshold = SEND_BUFFER_TARGET;
    dc.addEventListener('bufferedamountlow', onLow);
    t = setInterval(() => {
      if (dc.readyState !== 'open') {
        cleanup();
        reject(new Error('Data channel is not open'));
        return;
      }
      if (dc.bufferedAmount <= SEND_BUFFER_TARGET) {
        cleanup();
        resolve();
      }
    }, 20);
  });
}

export default function QuickSharePage() {
  const [state, setState] = useState<ShareState>('idle');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [textInput, setTextInput] = useState('');
  const [receivedTexts, setReceivedTexts] = useState<ReceivedText[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferFileName, setTransferFileName] = useState('');

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const fileBufferRef = useRef<{ [key: string]: Uint8Array[] }>({});
  const fileSizeRef = useRef<{ [key: string]: number }>({});
  const fileBytesReceivedRef = useRef<{ [key: string]: number }>({});
  const currentIncomingFileRef = useRef<string | null>(null);

  const handleIncomingData = (data: unknown) => {
    try {
      if (typeof data === 'string') {
        const msg = JSON.parse(data);

        if (msg.type === 'file-meta') {
          currentIncomingFileRef.current = msg.name;
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
          currentIncomingFileRef.current = null;
          setTransferFileName('');
          setTransferProgress(0);
          toast.success(`File received: ${msg.name}`);
        } else if (msg.type === 'text') {
          setReceivedTexts((prev) => [
            ...prev,
            { content: msg.content, timestamp: Date.now() },
          ]);
        }
        return;
      }

      // Binary chunk — PeerJS may deliver ArrayBuffer or a typed array
      let bytes: Uint8Array | null = null;
      if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
      } else if (data instanceof Uint8Array) {
        bytes = data;
      } else if (ArrayBuffer.isView(data)) {
        const v = data as ArrayBufferView;
        bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      }
      if (!bytes) return;

      const name = currentIncomingFileRef.current;
      if (name && fileBufferRef.current[name]) {
        const copy = new Uint8Array(bytes);
        fileBufferRef.current[name].push(copy);
        const total = fileSizeRef.current[name] || 0;
        fileBytesReceivedRef.current[name] =
          (fileBytesReceivedRef.current[name] || 0) + copy.length;
        const progress =
          total > 0
            ? Math.min((fileBytesReceivedRef.current[name] / total) * 100, 99)
            : 0;
        setTransferProgress(progress);
      }
    } catch (err) {
      console.error('Data receive error:', err);
    }
  };

  const setupConnection = (conn: DataConnection) => {
    connRef.current = conn;

    conn.on('open', () => {
      // Tune underlying data channel for efficient binary transfer
      const dc = conn.dataChannel;
      if (dc) {
        dc.binaryType = 'arraybuffer';
        dc.bufferedAmountLowThreshold = SEND_BUFFER_TARGET;
      }
      setState('connected');
      toast.success('Connected! You can now share files and text.');
    });

    conn.on('data', handleIncomingData);

    conn.on('close', () => {
      setState((prev) => (prev === 'error' ? prev : 'error'));
      setError((prev) => prev || 'Peer disconnected');
    });

    conn.on('error', (err) => {
      console.error('DataConnection error:', err);
    });
  };

  const createRoom = async () => {
    setState('creating');
    setError('');

    const attempt = (attemptsLeft: number) => {
      const code = generateRoomCode();
      const fullId = PEER_ID_PREFIX + code;
      const peer = new Peer(fullId, { debug: 1 });
      peerRef.current = peer;

      let opened = false;

      peer.on('open', () => {
        opened = true;
        setRoomCode(code);
        setState('waiting');
      });

      peer.on('connection', (conn) => {
        setState('connecting');
        setupConnection(conn);
      });

      peer.on('disconnected', () => {
        if (!peer.destroyed) {
          try {
            peer.reconnect();
          } catch {
            // reconnect may throw if already reconnecting
          }
        }
      });

      peer.on('error', (err: unknown) => {
        const e = err as { type?: string; message?: string };
        console.error('Peer error:', err);
        if (!opened && e?.type === 'unavailable-id' && attemptsLeft > 0) {
          try {
            peer.destroy();
          } catch {
            /* noop */
          }
          attempt(attemptsLeft - 1);
          return;
        }
        setError(
          e?.type === 'network' || e?.type === 'server-error'
            ? 'Signaling service unavailable, please try again.'
            : `Failed to create room${e?.type ? ` (${e.type})` : ''}`
        );
        setState('error');
      });
    };

    attempt(5);
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter a room code');
      return;
    }
    setState('joining');
    setError('');

    const hostId = PEER_ID_PREFIX + code;
    const peer = new Peer({ debug: 1 });
    peerRef.current = peer;

    peer.on('open', () => {
      setRoomCode(code);
      setState('connecting');
      const conn = peer.connect(hostId, {
        reliable: true,
        serialization: 'binary',
      });
      setupConnection(conn);
    });

    peer.on('error', (err: unknown) => {
      const e = err as { type?: string; message?: string };
      console.error('Peer error:', err);
      if (e?.type === 'peer-unavailable') {
        setError('Room not found or host is offline');
      } else if (e?.type === 'network' || e?.type === 'server-error') {
        setError('Signaling service unavailable, please try again.');
      } else {
        setError(`Failed to join room${e?.type ? ` (${e.type})` : ''}`);
      }
      setState('error');
    });
  };

  const sendText = () => {
    const conn = connRef.current;
    if (!textInput.trim() || !conn || !conn.open) return;

    conn.send(
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
    const conn = connRef.current;
    if (!conn || !conn.open) {
      toast.error('Not connected');
      return;
    }

    setState('transferring');
    setTransferFileName(file.name);
    setTransferProgress(0);

    try {
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

      conn.send(
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
          await waitBackpressure(conn);
          if (!conn.open) throw new Error('Connection closed');
          // Copy so BufferSource matches strict RTCDataChannel.send typing
          conn.send(new Uint8Array(part));
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

      if (!conn.open) throw new Error('Connection closed');
      conn.send(
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
    setTextInput('');
    setReceivedTexts([]);
    setReceivedFiles([]);

    if (connRef.current) {
      try {
        connRef.current.close();
      } catch {
        /* noop */
      }
      connRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {
        /* noop */
      }
      peerRef.current = null;
    }
    fileBufferRef.current = {};
    fileSizeRef.current = {};
    fileBytesReceivedRef.current = {};
    currentIncomingFileRef.current = null;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && state === 'idle') {
      setJoinCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (connRef.current) {
        try {
          connRef.current.close();
        } catch {
          /* noop */
        }
      }
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch {
          /* noop */
        }
      }
    };
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
                id="quick-share-create-room"
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
                id="quick-share-join-code"
                type="text"
                placeholder="Enter room code (e.g., X7K2MN)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground mb-4 focus:ring-1 focus:ring-primary/50 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              />
              <button
                id="quick-share-join-room"
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
              id="quick-share-copy-code"
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
              id="quick-share-copy-link"
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
                id="quick-share-disconnect"
                onClick={reset}
                className="bg-secondary hover:bg-accent border border-border text-foreground font-semibold text-xs py-2 px-4 rounded-lg transition"
              >
                Disconnect
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-background border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Share Text</h3>
                <textarea
                  id="quick-share-text-input"
                  placeholder="Enter text to share..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground mb-4 focus:ring-1 focus:ring-primary/50 outline-none h-24 resize-none"
                />
                <button
                  id="quick-share-send-text"
                  onClick={sendText}
                  disabled={!textInput.trim()}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Text
                </button>

                {receivedTexts.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-foreground/60 uppercase">
                      Received Messages
                    </p>
                    {receivedTexts.map((text, i) => (
                      <div
                        key={i}
                        className="bg-secondary border border-border/50 rounded-lg p-3 text-sm"
                      >
                        <p className="text-foreground break-words">{text.content}</p>
                        <p className="text-xs text-foreground/60 mt-1">
                          {new Date(text.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-background border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Share Files</h3>
                <label className="block w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/50 transition">
                  <FileUp className="w-8 h-8 text-foreground/60 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    Drop files here or click to select
                  </p>
                  <p className="text-xs text-foreground/60">Max 100 MB per file</p>
                  <input
                    id="quick-share-file-input"
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
                    <p className="text-xs font-bold text-foreground/60 uppercase">
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
                          id={`quick-share-download-${i}`}
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
              id="quick-share-retry"
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
