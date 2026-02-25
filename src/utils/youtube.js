const PIPED_INSTANCES = [
  'pipedapi.kavin.rocks',
  'pipedapi.adminforge.de',
  'pipedapi.in.projectsegfau.lt',
];

/**
 * Extract YouTube video ID from various URL formats.
 * Supports: watch?v=, youtu.be/, embed/, shorts/
 */
export function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) return m[1];
  }
  return null;
}

/**
 * Fetch a CORS-friendly stream URL via Piped API.
 * Picks the best MP4 stream ≤720p, falls back to any available stream.
 */
export async function fetchStreamUrl(videoId) {
  let lastError;

  for (const host of PIPED_INSTANCES) {
    try {
      const res = await fetch(`https://${host}/streams/${videoId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const streams = data.videoStreams || [];

      // Prefer MP4 streams ≤720p, sorted by quality descending
      const mp4 = streams
        .filter((s) => s.mimeType?.startsWith('video/mp4') && s.videoOnly === false)
        .sort((a, b) => {
          const aH = parseInt(a.quality) || 0;
          const bH = parseInt(b.quality) || 0;
          return bH - aH;
        });

      const target = mp4.find((s) => (parseInt(s.quality) || 0) <= 720) || mp4[0];
      if (target) return target.url;

      // Fallback: any non-video-only stream
      const any = streams.find((s) => s.videoOnly === false);
      if (any) return any.url;

      throw new Error('No suitable stream found');
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(lastError?.message || 'All Piped instances failed');
}
