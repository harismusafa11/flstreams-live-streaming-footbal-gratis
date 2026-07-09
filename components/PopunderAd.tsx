'use client';

import { useEffect } from 'react';

export default function PopunderAd() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const POPUNDER_URL =
      'https://tuxedoarbourannouncement.com/cf/78/ef/cf78ef4bc930bb834c8bcea2b7e75109.js';
    const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
    const MAX_PER_SESSION = 2;

    const handleDocClick = () => {
      try {
        const countStr = sessionStorage.getItem('fl_pop_count') || '0';
        const count = parseInt(countStr, 10);
        const lastStr = sessionStorage.getItem('fl_pop_last') || '0';
        const last = parseInt(lastStr, 10);

        const now = Date.now();

        // 1. Limit to max 2 popunders per session
        if (count >= MAX_PER_SESSION) {
          return;
        }

        // 2. Limit with 30-minute cooldown interval
        if (now - last < COOLDOWN_MS) {
          return;
        }

        // Allow popunder: Inject script tag dynamically
        const oldScript = document.getElementById('adsterra-popunder-script');
        if (oldScript) {
          oldScript.remove();
        }

        const s = document.createElement('script');
        s.id = 'adsterra-popunder-script';
        s.src = POPUNDER_URL;
        s.async = true;

        // Save state immediately to block subsequent clicks during cooldown
        sessionStorage.setItem('fl_pop_count', String(count + 1));
        sessionStorage.setItem('fl_pop_last', String(now));

        document.body.appendChild(s);

        // Remove script tag from DOM after 6 seconds to prevent continuous triggers on subsequent clicks
        setTimeout(() => {
          const injected = document.getElementById('adsterra-popunder-script');
          if (injected) {
            injected.remove();
          }
        }, 6000);
      } catch (err) {
        console.error('Popunder injection warning:', err);
      }
    };

    document.addEventListener('click', handleDocClick);
    return () => {
      document.removeEventListener('click', handleDocClick);
    };
  }, []);

  return null;
}
