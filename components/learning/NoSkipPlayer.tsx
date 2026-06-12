'use client';

/**
 * No-skip YouTube lesson player.
 *
 * Native YouTube controls are disabled and the iframe is covered by a click
 * shield. Playback is driven by custom play/pause/rewind controls only.
 * A 250ms poll snaps the playhead back whenever it gets ahead of the furthest
 * point actually watched, and a 5s heartbeat reports that point to the server
 * (which independently clamps growth — see lib/learning/progress.ts).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { loadYouTubeIframeApi, type YTPlayer } from '@/components/learning/useYouTubeDuration';

/** YT.PlayerState.PLAYING (the IFrame API exposes states as numbers). */
const STATE_PLAYING = 1;

const POLL_MS = 250;
const HEARTBEAT_MS = 5000;
/** Seconds the playhead may run ahead of maxWatched before we snap back. */
const FORWARD_SEEK_TOLERANCE = 2;

export interface HeartbeatResult {
  maxWatchedSeconds: number;
  canMarkDone: boolean;
}

interface NoSkipPlayerProps {
  videoId: string;
  lessonId: string;
  initialMaxWatchedSeconds: number;
  durationSeconds: number | null;
  /** Completed lessons play freely — no snap-back, no heartbeats. */
  completed: boolean;
  onHeartbeat: (result: HeartbeatResult) => void;
}

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function NoSkipPlayer({
  videoId,
  lessonId,
  initialMaxWatchedSeconds,
  durationSeconds,
  completed,
  onHeartbeat,
}: NoSkipPlayerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const maxWatchedRef = useRef(initialMaxWatchedSeconds);
  const onHeartbeatRef = useRef(onHeartbeat);
  onHeartbeatRef.current = onHeartbeat;

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds ?? 0);

  const sendHeartbeat = useCallback(async () => {
    if (completed) return;
    try {
      const res = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, positionSeconds: maxWatchedRef.current }),
      });
      if (res.ok) {
        const result = (await res.json()) as HeartbeatResult;
        onHeartbeatRef.current(result);
      }
    } catch {
      // Network hiccup — the next heartbeat retries; the server clamps growth anyway.
    }
  }, [lessonId, completed]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      await loadYouTubeIframeApi();
      if (cancelled || !window.YT?.Player || !hostRef.current) return;

      const player = new window.YT.Player(hostRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            playerRef.current = player;
            const reported = Math.round(player.getDuration());
            if (reported > 0) setTotalDuration(reported);
            if (initialMaxWatchedSeconds > 0 && !completed) {
              player.seekTo(initialMaxWatchedSeconds, true);
              player.pauseVideo();
            }
            setReady(true);
          },
          onStateChange: (event: { data: number }) => {
            if (cancelled) return;
            const isPlaying = event.data === STATE_PLAYING;
            setPlaying(isPlaying);
            // Final heartbeat on pause/ended so the last few seconds count.
            if (!isPlaying) void sendHeartbeat();
          },
        },
      });

      pollTimer = setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        const current = p.getCurrentTime();
        if (!completed && current > maxWatchedRef.current + FORWARD_SEEK_TOLERANCE) {
          p.seekTo(maxWatchedRef.current, true);
          return;
        }
        maxWatchedRef.current = Math.max(maxWatchedRef.current, current);
        setCurrentTime(current);
      }, POLL_MS);

      heartbeatTimer = setInterval(() => {
        const p = playerRef.current;
        if (!p || p.getPlayerState() !== STATE_PLAYING) return;
        void sendHeartbeat();
      }, HEARTBEAT_MS);
    };

    void init();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      try {
        playerRef.current?.destroy();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
    };
    // The player is created once per video/lesson; control flags are read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, lessonId, completed]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.getPlayerState() === STATE_PLAYING) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }, []);

  const rewind10 = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(Math.max(0, p.getCurrentTime() - 10), true);
  }, []);

  const progressPct = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;
  const watchedPct = totalDuration > 0 ? Math.min(100, (maxWatchedRef.current / totalDuration) * 100) : 0;

  return (
    <div className="rounded-lg overflow-hidden bg-black">
      <div className="relative aspect-video">
        <div ref={hostRef} className="absolute inset-0 h-full w-full" />
        {/* Click shield: blocks the YouTube UI; a click toggles playback instead. */}
        <button
          type="button"
          aria-label={playing ? 'Pause video' : 'Play video'}
          onClick={togglePlay}
          className="absolute inset-0 h-full w-full cursor-pointer bg-transparent"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-sm text-gray-400">
            Loading video…
          </div>
        )}
      </div>

      <div className="bg-gray-900 px-4 py-3">
        {/* Display-only progress bar — deliberately not clickable (no seeking). */}
        <div className="relative mb-3 h-1.5 rounded-full bg-gray-700 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-y-0 left-0 bg-gray-500 rounded-full" style={{ width: `${watchedPct}%` }} />
          <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            disabled={!ready}
            className="text-white hover:bg-gray-800 hover:text-white"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            <span className="sr-only">{playing ? 'Pause' : 'Play'}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={rewind10}
            disabled={!ready}
            className="text-white hover:bg-gray-800 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="ml-1 text-xs">10s</span>
          </Button>
          <span className="ml-auto text-xs tabular-nums text-gray-300">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
        {!completed && (
          <p className="mt-2 text-[11px] text-gray-500">
            Skipping ahead is disabled — watch the full video to complete this lesson.
          </p>
        )}
      </div>
    </div>
  );
}
