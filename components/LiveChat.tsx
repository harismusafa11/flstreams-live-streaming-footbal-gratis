'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  FormEvent,
} from 'react';
import { supabase, type ChatMessage } from '@/lib/supabaseClient';

// ── Deterministic username colour from string hash ───────────────────────────
const USERNAME_COLOURS = [
  'text-emerald-400',
  'text-sky-400',
  'text-violet-400',
  'text-amber-400',
  'text-rose-400',
  'text-cyan-400',
  'text-fuchsia-400',
  'text-lime-400',
  'text-orange-400',
  'text-teal-400',
];

function hashUsername(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return USERNAME_COLOURS[h % USERNAME_COLOURS.length];
}

// ── Random guest username stored in localStorage ─────────────────────────────
const ADJECTIVES = ['Cool', 'Bold', 'Fast', 'Wild', 'Epic', 'Fire', 'Giga', 'Ultra'];
const NOUNS = ['Fan', 'Viewer', 'Scout', 'Goat', 'Eagle', 'Tiger', 'Wolf'];

function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}_${num}`;
}

function getOrCreateUsername(): string {
  const stored = localStorage.getItem('fl_username');
  if (stored) return stored;
  const name = generateUsername();
  localStorage.setItem('fl_username', name);
  return name;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface LiveChatProps {
  matchId: string;
}

const MAX_MESSAGES = 50;

export default function LiveChat({ matchId }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Track whether user is scrolled near bottom
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  // Auto-scroll only when user is at bottom
  const scrollToBottom = useCallback(() => {
    if (isAtBottomRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  const handleChangeUsername = useCallback(() => {
    const newName = generateUsername();
    localStorage.setItem('fl_username', newName);
    setUsername(newName);
  }, []);

  // Init username on client
  useEffect(() => {
    Promise.resolve().then(() => {
      setUsername(getOrCreateUsername());
    });
  }, []);

  // Load initial messages
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/chat?match_id=${encodeURIComponent(matchId)}`)
      .then((r) => r.json())
      .then((data: ChatMessage[]) => {
        if (!cancelled) {
          setMessages(data.slice(-MAX_MESSAGES));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  // Scroll to bottom after initial load
  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messages.length, scrollToBottom]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            const updated = [...prev, newMsg];
            // Keep only last MAX_MESSAGES to prevent browser lag
            return updated.slice(-MAX_MESSAGES);
          });
          // Defer scroll so DOM updates first
          requestAnimationFrame(scrollToBottom);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, scrollToBottom]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, username, message: text }),
      });

      if (res.status === 429) {
        setError('Terlalu cepat, tunggu sebentar...');
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Gagal mengirim pesan');
      } else {
        setInput('');
      }
    } catch {
      setError('Koneksi gagal');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16]/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80 bg-slate-950/80">
        <div className="bg-emerald-500/10 p-1 rounded-md border border-emerald-500/20">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Chat Room</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Connected
        </span>
      </div>

      {/* Sub-header / Username info */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/40 bg-slate-900/10 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-slate-500 select-none">👤 Username:</span>
          <span className={`font-bold ${hashUsername(username)}`}>
            {username || '...'}
          </span>
        </div>
        <button
          onClick={handleChangeUsername}
          className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors flex items-center gap-0.5 cursor-pointer"
        >
          Ubah ↻
        </button>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-slate-650 gap-2">
            <svg className="w-10 h-10 text-slate-700 opacity-60 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs text-slate-500 text-center px-4 max-w-[220px] leading-relaxed">
              Tidak ada pesan. Jadilah yang pertama mengirim chat!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-1.5 group animate-fadeIn">
              <span className="text-slate-600 text-[10px] mt-0.5 shrink-0 leading-4 select-none">
                {formatTime(msg.created_at)}
              </span>
              <p className="text-sm leading-5 break-words min-w-0">
                <span
                  className={`font-semibold mr-1.5 ${hashUsername(msg.username)}`}
                >
                  {msg.username}:
                </span>
                <span className="text-slate-350">{msg.message}</span>
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input form */}
      <div className="border-t border-slate-800/80 p-3 bg-slate-950/20">
        {error && (
          <p className="text-rose-400 text-xs mb-2 px-1">{error}</p>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={300}
            placeholder="Kirim pesan ke live chat..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-colors"
            disabled={sending}
            aria-label="Pesan chat"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
            aria-label="Kirim pesan"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
