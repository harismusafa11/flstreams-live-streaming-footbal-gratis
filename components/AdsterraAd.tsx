'use client';

import { useEffect, useRef } from 'react';

type AdFormat = 'banner-728x90' | 'banner-468x60' | 'banner-320x50' | 'rectangle-300x250';

interface AdsterraAdProps {
  format: AdFormat;
  /** Adsterra atOptions script key for this slot */
  atKey?: string;
}

const AD_SIZES: Record<AdFormat, { width: number; height: number }> = {
  'banner-728x90': { width: 728, height: 90 },
  'banner-468x60': { width: 468, height: 60 },
  'banner-320x50': { width: 320, height: 50 },
  'rectangle-300x250': { width: 300, height: 250 },
};

// Sequential queue loader to prevent race conditions on global window.atOptions
let adsterraQueue = Promise.resolve();

function queueAdLoad(task: () => Promise<void>) {
  const nextTask = adsterraQueue.then(task, task);
  adsterraQueue = nextTask.catch(() => undefined);
  return nextTask;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function AdsterraAd({ format, atKey }: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const { width, height } = AD_SIZES[format];

  // Automatically read keys from env variables if not passed as props
  const resolvedKey =
    atKey ||
    (format === 'banner-728x90'
      ? process.env.NEXT_PUBLIC_ADSTERRA_KEY_728X90 || 'a90d6bab75e89e072c78f8b6a4e22223'
      : format === 'banner-468x60'
      ? process.env.NEXT_PUBLIC_ADSTERRA_KEY_468X60 || 'fe37e1a7f98d3449911fb6a327cfbfd6'
      : format === 'banner-320x50'
      ? process.env.NEXT_PUBLIC_ADSTERRA_KEY_320X50
      : format === 'rectangle-300x250'
      ? process.env.NEXT_PUBLIC_ADSTERRA_KEY_300X250 || 'f6abcfb2f5ba24a6004400d2ef90b40a'
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

    const currentContainer = containerRef.current;
    let cancelled = false;

    queueAdLoad(async () => {
      if (cancelled || !currentContainer.isConnected) return;

      currentContainer.innerHTML = '';

      // Set global options for the current banner slot
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).atOptions = {
        key: resolvedKey,
        format: 'iframe',
        height,
        width,
        params: {},
      };

      await new Promise<void>((resolve) => {
        const invokeScript = document.createElement('script');
        invokeScript.type = 'text/javascript';
        invokeScript.src = `//www.highperformanceformat.com/${resolvedKey}/invoke.js`;
        invokeScript.onload = () => resolve();
        invokeScript.onerror = () => resolve();
        currentContainer.appendChild(invokeScript);
      });

      // Give the script a short window to write the iframe before the next ad overwrites atOptions
      await wait(450);
    });

    return () => {
      cancelled = true;
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
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
