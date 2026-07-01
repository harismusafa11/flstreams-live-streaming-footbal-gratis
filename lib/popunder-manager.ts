/**
 * popunder-manager.ts
 *
 * Pure utility — NO React dependency, NO side effects saat import.
 * Semua fungsi aman dipanggil dari useEffect di client component.
 *
 * Tanggung jawab:
 *  - Membaca / menulis localStorage untuk tracking frekuensi
 *  - Menentukan apakah Popunder boleh muncul sekarang
 *  - Menentukan apakah path / elemen saat ini termasuk zona aman
 */

import { ADSTERRA_CONFIG, POPUP_STORAGE_KEYS } from './ads-config';

// ─────────────────────────────────────────────
// Tipe bantu
// ─────────────────────────────────────────────
interface PopunderState {
  lastShow: string | null;   // ISO timestamp
  dailyCount: number;
  dailyDate: string;         // YYYY-MM-DD
}

// ─────────────────────────────────────────────
// Helper: tanggal hari ini dalam format YYYY-MM-DD
// ─────────────────────────────────────────────
function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ─────────────────────────────────────────────
// Baca state dari localStorage
// ─────────────────────────────────────────────
function readState(): PopunderState {
  try {
    const lastShow  = localStorage.getItem(POPUP_STORAGE_KEYS.lastShow);
    const rawCount  = localStorage.getItem(POPUP_STORAGE_KEYS.dailyCount);
    const dailyDate = localStorage.getItem(POPUP_STORAGE_KEYS.dailyDate) ?? todayString();
    const dailyCount = rawCount ? parseInt(rawCount, 10) : 0;
    return { lastShow, dailyCount: isNaN(dailyCount) ? 0 : dailyCount, dailyDate };
  } catch {
    // localStorage tidak tersedia (mode incognito ekstrem, dll)
    return { lastShow: null, dailyCount: 0, dailyDate: todayString() };
  }
}

// ─────────────────────────────────────────────
// Reset counter harian jika hari sudah berganti
// ─────────────────────────────────────────────
function resetDailyCountIfNewDay(state: PopunderState): PopunderState {
  const today = todayString();
  if (state.dailyDate !== today) {
    try {
      localStorage.setItem(POPUP_STORAGE_KEYS.dailyCount, '0');
      localStorage.setItem(POPUP_STORAGE_KEYS.dailyDate, today);
    } catch { /* silent */ }
    return { ...state, dailyCount: 0, dailyDate: today };
  }
  return state;
}

// ─────────────────────────────────────────────
// Catat bahwa Popunder baru saja ditampilkan
// ─────────────────────────────────────────────
export function recordPopunderShown(): void {
  try {
    const state = resetDailyCountIfNewDay(readState());
    const newCount = state.dailyCount + 1;
    localStorage.setItem(POPUP_STORAGE_KEYS.lastShow, new Date().toISOString());
    localStorage.setItem(POPUP_STORAGE_KEYS.dailyCount, String(newCount));
    localStorage.setItem(POPUP_STORAGE_KEYS.dailyDate, todayString());
  } catch { /* silent */ }
}

// ─────────────────────────────────────────────
// Cek apakah Popunder BOLEH muncul sekarang
// ─────────────────────────────────────────────
export function canShowPopunder(): boolean {
  const cfg = ADSTERRA_CONFIG.popunder;

  if (!ADSTERRA_CONFIG.enabled || !cfg.enabled) return false;

  try {
    let state = readState();
    state = resetDailyCountIfNewDay(state);

    // 1. Cek daily limit
    if (state.dailyCount >= cfg.dailyLimit) return false;

    // 2. Cek cooldown
    if (state.lastShow) {
      const lastMs   = new Date(state.lastShow).getTime();
      const nowMs    = Date.now();
      const diffMins = (nowMs - lastMs) / 1000 / 60;
      if (diffMins < cfg.cooldownMinutes) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Cek apakah pathname saat ini termasuk blocked path
// Blocked paths memiliki prioritas lebih tinggi dari allowed paths
// ─────────────────────────────────────────────
export function isBlockedPath(pathname: string): boolean {
  const { blockedPaths, allowedPaths } = ADSTERRA_CONFIG.popunder;

  // Selalu blokir admin
  if (pathname.startsWith('/admin')) return true;

  // Cek blocked paths (prefix match)
  const isBlocked = blockedPaths.some((p) => pathname.startsWith(p));
  if (isBlocked) return true;

  // Jika allowedPaths kosong → semua diizinkan
  if (allowedPaths.length === 0) return false;

  // Cek apakah path masuk daftar allowed
  const isAllowed = allowedPaths.some((p) => {
    // '/' hanya cocok dengan root
    if (p === '/') return pathname === '/';
    return pathname.startsWith(p);
  });

  // Jika tidak ada di allowed list → blokir
  return !isAllowed;
}

// ─────────────────────────────────────────────
// Cek apakah elemen yang diklik termasuk zona aman
// ─────────────────────────────────────────────
export function isSafeClickTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;

  const { safeSelectors } = ADSTERRA_CONFIG.popunder;

  // Traverse up DOM tree — jika salah satu ancestor cocok dengan safe selector → aman
  let el: Element | null = target;
  while (el) {
    for (const selector of safeSelectors) {
      try {
        if (el.matches(selector)) return true;
      } catch { /* selector tidak valid, skip */ }
    }
    el = el.parentElement;
  }

  return false;
}

// ─────────────────────────────────────────────
// Ekspos ringkasan state (untuk debugging)
// ─────────────────────────────────────────────
export function getPopunderDebugInfo(): Record<string, unknown> {
  const state = resetDailyCountIfNewDay(readState());
  const cfg   = ADSTERRA_CONFIG.popunder;
  const minutesSinceLast = state.lastShow
    ? Math.round((Date.now() - new Date(state.lastShow).getTime()) / 1000 / 60)
    : null;

  return {
    canShow: canShowPopunder(),
    dailyCount: state.dailyCount,
    dailyLimit: cfg.dailyLimit,
    cooldownMinutes: cfg.cooldownMinutes,
    minutesSinceLast,
    lastShow: state.lastShow,
    dailyDate: state.dailyDate,
  };
}
