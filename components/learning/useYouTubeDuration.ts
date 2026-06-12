'use client';

/**
 * Probe a YouTube video's duration using a hidden IFrame API player.
 * Used by the admin course builder so Phil never types durations by hand.
 */

import { useCallback, useRef } from 'react';

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer;
      ready: (cb: () => void) => void;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTPlayer {
  getDuration: () => number;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

let apiPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise<void>((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
}

export function useYouTubeDuration() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  /** Resolve duration in whole seconds, or null when the video can't be loaded. */
  const probeDuration = useCallback(async (videoId: string): Promise<number | null> => {
    try {
      await loadYouTubeIframeApi();
      if (!window.YT?.Player) return null;

      return await new Promise<number | null>((resolve) => {
        const host = document.createElement('div');
        host.style.position = 'fixed';
        host.style.left = '-9999px';
        host.style.width = '320px';
        host.style.height = '180px';
        (containerRef.current ?? document.body).appendChild(host);

        let settled = false;
        const finish = (value: number | null, player?: YTPlayer) => {
          if (settled) return;
          settled = true;
          try {
            player?.destroy();
          } catch {
            /* already gone */
          }
          host.remove();
          resolve(value);
        };

        const timeout = setTimeout(() => finish(null), 10000);

        const player = new window.YT!.Player(host, {
          videoId,
          width: 320,
          height: 180,
          events: {
            onReady: () => {
              clearTimeout(timeout);
              const duration = Math.round(player.getDuration());
              finish(duration > 0 ? duration : null, player);
            },
            onError: () => {
              clearTimeout(timeout);
              finish(null, player);
            },
          },
        });
      });
    } catch {
      return null;
    }
  }, []);

  return { probeDuration, containerRef };
}
