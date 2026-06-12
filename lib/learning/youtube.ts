/**
 * YouTube URL helpers for the Learning Center.
 */

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract the 11-char YouTube video ID from any common URL form
 * (watch?v=, youtu.be/, embed/, shorts/, live/) or a raw ID.
 * Returns null when no valid ID is found.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/')[1] || '';
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v');
    if (v && YOUTUBE_ID_PATTERN.test(v)) return v;

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(segments[0])) {
      return YOUTUBE_ID_PATTERN.test(segments[1]) ? segments[1] : null;
    }
  }

  return null;
}
