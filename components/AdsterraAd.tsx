'use client';

import { useEffect, useRef } from 'react';

type AdFormat = 'banner-728x90' | 'banner-320x50' | 'rectangle-300x250';

interface AdsterraAdProps {
  format: AdFormat;
  /** Adsterra atOptions script key for this slot */
  atKey?: string;
}

const AD_SIZES: Record<AdFormat, { width: number; height: number }> = {
  'banner-728x90': { width: 728, height: 90 },
  'banner-320x50': { width: 320, height: 50 },
  'rectangle-300x250': { width: 300, height: 250 },
};

/**
 * AdsterraAd — CLS-safe Adsterra ad component.
 *
 * - Renders only on the client (useEffect) to avoid hydration errors.
 * - Reserves fixed dimensions before the ad loads, preventing layout shift.
 * - Replace the <script> contents inside useEffect with your real Adsterra
 *   invocation code (atOptions + banner script).
 */
export default function AdsterraAd({ format, atKey }: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const { width, height } = AD_SIZES[format];

  // Automatically read keys from env variables if not passed as props
  const resolvedKey =
    atKey ||
    (format === 'banner-728x90'
      ? process.env.NEXT_PUBLIC_ADSTERRA_KEY_728X90
      : format === 'banner-320x50'
      ? process.env.NEXT_PUBLIC_ADSTERRA_KEY_320X50
      : format === 'rectangle-300x250'
      ? process.env.NEXT_PUBLIC_ADSTERRA_KEY_300X250
      : undefined);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    // Placeholder: show a styled empty box until real key is configured
    if (!resolvedKey) {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = `
        width:${width}px; height:${height}px;
        display:flex; align-items:center; justify-content:center;
        background:rgba(30,41,59,0.6); border:1px dashed rgba(100,116,139,0.4);
        border-radius:4px; font-size:11px; color:rgba(148,163,184,0.5);
        font-family:monospace;
      `;
      placeholder.textContent = `Ad ${width}×${height}`;
      containerRef.current.appendChild(placeholder);
      return;
    }

    // Real Adsterra script injection
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      var atOptions = {
        'key': '${resolvedKey}',
        'format': 'iframe',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
    `;
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `//www.highperformanceformat.com/${resolvedKey}/invoke.js`;

    containerRef.current.appendChild(script);
    containerRef.current.appendChild(invokeScript);
  }, [resolvedKey, width, height]);

  return (
    /* Fixed-size wrapper prevents CLS — browser reserves this space immediately */
    <div
      className="flex items-center justify-center mx-auto overflow-hidden"
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-label="Advertisement"
      role="complementary"
    >
      <div ref={containerRef} />
    </div>
  );
}
