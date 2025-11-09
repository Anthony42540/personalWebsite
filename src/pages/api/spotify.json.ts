import type { APIRoute } from 'astro';
import { getNowPlaying } from '../../lib/spotify.ts';
import type { SpotifyPlayerResponse } from '../../lib/types';
import redis from '../../lib/redis.ts';

export const GET: APIRoute = async () => {
  try {
    const response = await getNowPlaying();

    if (response.status === 204 || response.status > 400) {
      const lastTrackRaw = await redis.get('last_track');
      let lastTrack = lastTrackRaw ? JSON.parse(lastTrackRaw) : { isPlaying: false };

      lastTrack = { ...lastTrack, isPlaying: false };

      return new Response(JSON.stringify(lastTrack), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const player = (await response.json()) as SpotifyPlayerResponse;

    const track = {
      isPlaying: player.is_playing,
      title: player.item.name,
      artist: player.item.artists.map(a => a.name).join(', '),
      album: player.item.album.name,
      albumImageUrl: player.item.album.images[0]?.url,
      songUrl: player.item.external_urls.spotify,
      duration: player.item.duration_ms,
      progress: player.progress_ms,
    };

    await redis.set('last_track', JSON.stringify(track));

    return new Response(JSON.stringify(track), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Spotify API error:', err);

    const lastTrackRaw = await redis.get('last_track');
    const lastTrack = lastTrackRaw ? JSON.parse(lastTrackRaw) : { isPlaying: false };

    return new Response(JSON.stringify(lastTrack), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
