/**
 * Extracts a YouTube Video ID from various URL formats or raw video IDs.
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID (raw 11 character string)
 */
export function extractYouTubeId(urlOrId) {
  if (!urlOrId) return null;
  const input = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const urlStr = input.startsWith('http') ? input : `https://${input}`;
    const parsed = new URL(urlStr);

    // youtu.be/ID
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (id && id.length === 11) return id;
    }

    // youtube.com (watch?v=, shorts/, embed/)
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.has('v')) {
        const v = parsed.searchParams.get('v');
        if (v && v.length === 11) return v;
      }

      const paths = parsed.pathname.split('/');
      const shortsIndex = paths.indexOf('shorts');
      if (shortsIndex !== -1 && paths[shortsIndex + 1]) {
        return paths[shortsIndex + 1].substring(0, 11);
      }

      const embedIndex = paths.indexOf('embed');
      if (embedIndex !== -1 && paths[embedIndex + 1]) {
        return paths[embedIndex + 1].substring(0, 11);
      }
    }
  } catch (e) {
    // Continue to regex fallback
  }

  // Robust fallback regex
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = input.match(regex);
  return match ? match[1] : null;
}

/**
 * Format seconds into mm:ss or hh:mm:ss format.
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
}
