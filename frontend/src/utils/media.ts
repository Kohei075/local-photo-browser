// Browser-natively playable video containers (must match backend config.VIDEO_EXTENSIONS).
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v']);

/** Returns true if the given file extension represents a video. */
export function isVideo(extension: string): boolean {
  return VIDEO_EXTENSIONS.has(extension.toLowerCase().replace(/^\./, ''));
}

/** Formats a duration in seconds as "m:ss" (or "h:mm:ss" past an hour). */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !isFinite(seconds) || seconds < 0) return '';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}
