// Browser-natively playable video containers (must match backend config.VIDEO_EXTENSIONS).
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v']);

/** Returns true if the given file extension represents a video. */
export function isVideo(extension: string): boolean {
  return VIDEO_EXTENSIONS.has(extension.toLowerCase().replace(/^\./, ''));
}
