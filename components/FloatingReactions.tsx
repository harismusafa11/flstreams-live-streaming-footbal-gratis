'use client';

import { useState, useCallback, useRef } from 'react';

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number; // percent from left
}

const REACTIONS = [
  { emoji: '⚽', label: 'Gol' },
  { emoji: '🔥', label: 'Panas' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '👏', label: 'Tepuk tangan' },
  { emoji: '❤️', label: 'Suka' },
  { emoji: '😂', label: 'Lucu' },
];

let _uid = 0;

export default function FloatingReactions() {
  const [floaters, setFloaters] = useState<FloatingEmoji[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleReact = useCallback((emoji: string) => {
    const id = ++_uid;
    const x = 10 + Math.random() * 80; // stay within 10-90%

    setFloaters((prev) => [...prev, { id, emoji, x }]);

    // Remove after animation completes (~2.5 s)
    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 2500);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Floating emoji layer — absolutely positioned, pointer-events-none */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-20"
        aria-hidden="true"
      >
        {floaters.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-0 text-2xl select-none animate-float-up"
            style={{ left: `${f.x}%` }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Reaction buttons */}
      <div
        className="flex items-center gap-1 flex-wrap"
        role="group"
        aria-label="Reaksi langsung"
      >
        {REACTIONS.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            title={label}
            aria-label={`Kirim reaksi ${label}`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 text-lg transition-all duration-150 active:scale-90 select-none"
          >
            <span>{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
