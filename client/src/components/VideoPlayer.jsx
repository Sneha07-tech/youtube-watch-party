import React, { useRef, useState, useEffect, useMemo } from 'react';
import YouTube from 'react-youtube';
import { Play, Pause, RotateCcw, Link2, Sparkles, CheckCircle2 } from 'lucide-react';
import { extractYouTubeId, formatTime } from '../utils/youtube';

export function VideoPlayer({
  videoId,
  canControl,
  socket,
  roomId,
  playbackState
}) {
  const playerRef = useRef(null);
  const isRemoteAction = useRef(false);
  const [inputUrl, setInputUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);
  const [syncNotice, setSyncNotice] = useState('🟢 Synced with party');

  // Track progress and update slider
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && isPlayerReady) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        const dur = playerRef.current.getDuration();
        if (dur) setDuration(dur);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady]);

  // Handle incoming socket events from server
  useEffect(() => {
    if (!socket) return;

    const handleRemotePlay = ({ currentTime: targetTime }) => {
      if (!playerRef.current) return;
      isRemoteAction.current = true;
      setIsPlayingLocal(true);

      if (targetTime !== undefined) {
        const localTime = playerRef.current.getCurrentTime();
        // If drift is more than 1.5 seconds, resync position
        if (Math.abs(localTime - targetTime) > 1.5) {
          playerRef.current.seekTo(targetTime, true);
        }
      }
      playerRef.current.playVideo();
      setSyncNotice('▶️ Playback started by host');

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 500);
    };

    const handleRemotePause = ({ currentTime: targetTime }) => {
      if (!playerRef.current) return;
      isRemoteAction.current = true;
      setIsPlayingLocal(false);

      if (targetTime !== undefined) {
        playerRef.current.seekTo(targetTime, true);
      }
      playerRef.current.pauseVideo();
      setSyncNotice('⏸️ Playback paused by host');

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 500);
    };

    const handleRemoteSeek = ({ currentTime: targetTime }) => {
      if (!playerRef.current) return;
      isRemoteAction.current = true;
      playerRef.current.seekTo(targetTime, true);
      setCurrentTime(targetTime);
      setSyncNotice(`⏩ Seeked to ${formatTime(targetTime)}`);

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 500);
    };

    // When server sends full live sync state (e.g. after Force Resync or on join)
    const handleSyncState = (state) => {
      if (!playerRef.current) return;
      isRemoteAction.current = true;

      if (state.currentTime !== undefined) {
        playerRef.current.seekTo(state.currentTime, true);
        setCurrentTime(state.currentTime);
      }

      if (state.isPlaying) {
        playerRef.current.playVideo();
        setIsPlayingLocal(true);
      } else {
        playerRef.current.pauseVideo();
        setIsPlayingLocal(false);
      }

      setSyncNotice('🟢 Synced with party');

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 500);
    };

    // Auto-correct drift for viewers if host sends heartbeat
    const handleTimeSync = ({ currentTime: serverTime }) => {
      if (!playerRef.current || canControl) return;
      const localTime = playerRef.current.getCurrentTime();
      if (Math.abs(localTime - serverTime) > 2.0) {
        isRemoteAction.current = true;
        playerRef.current.seekTo(serverTime, true);
        setTimeout(() => {
          isRemoteAction.current = false;
        }, 400);
      }
    };

    socket.on('play', handleRemotePlay);
    socket.on('pause', handleRemotePause);
    socket.on('seek', handleRemoteSeek);
    socket.on('sync_state', handleSyncState);
    socket.on('time_sync', handleTimeSync);

    return () => {
      socket.off('play', handleRemotePlay);
      socket.off('pause', handleRemotePause);
      socket.off('seek', handleRemoteSeek);
      socket.off('sync_state', handleSyncState);
      socket.off('time_sync', handleTimeSync);
    };
  }, [socket, canControl]);

  // Host sends periodic heartbeat to keep all viewers synchronized
  useEffect(() => {
    if (!canControl || !socket) return;

    const heartbeatInterval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && isPlayerReady) {
        const time = playerRef.current.getCurrentTime();
        socket.emit('heartbeat', {
          roomId,
          currentTime: time,
          isPlaying: isPlayingLocal
        });
      }
    }, 4000);

    return () => clearInterval(heartbeatInterval);
  }, [canControl, socket, roomId, isPlayerReady, isPlayingLocal]);

  // YouTube Player Ready Event
  const onReady = (event) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
    setDuration(event.target.getDuration() || 0);

    // Initial sync to room state
    if (playbackState) {
      if (playbackState.currentTime) {
        event.target.seekTo(playbackState.currentTime, true);
      }
      if (playbackState.isPlaying) {
        event.target.playVideo();
        setIsPlayingLocal(true);
      } else {
        event.target.pauseVideo();
        setIsPlayingLocal(false);
      }
    }
  };

  // Direct YouTube Player Play Event
  const handlePlayerPlay = (e) => {
    if (isRemoteAction.current) return;
    const time = e.target.getCurrentTime();
    setIsPlayingLocal(true);

    if (canControl) {
      socket.emit('play', { roomId, currentTime: time });
    } else {
      // Revert if unauthorized viewer presses play while room is paused
      if (playbackState && !playbackState.isPlaying) {
        isRemoteAction.current = true;
        e.target.pauseVideo();
        setTimeout(() => { isRemoteAction.current = false; }, 300);
      }
    }
  };

  // Direct YouTube Player Pause Event
  const handlePlayerPause = (e) => {
    if (isRemoteAction.current) return;
    const time = e.target.getCurrentTime();
    setIsPlayingLocal(false);

    if (canControl) {
      socket.emit('pause', { roomId, currentTime: time });
    } else {
      // Revert if unauthorized viewer presses pause while room is playing
      if (playbackState && playbackState.isPlaying) {
        isRemoteAction.current = true;
        e.target.playVideo();
        setTimeout(() => { isRemoteAction.current = false; }, 300);
      }
    }
  };

  // Playback Control Handlers (Host / Mod only custom buttons)
  const togglePlayPause = () => {
    if (!canControl || !playerRef.current) return;

    const time = playerRef.current.getCurrentTime();
    if (isPlayingLocal) {
      isRemoteAction.current = true;
      playerRef.current.pauseVideo();
      setIsPlayingLocal(false);
      socket.emit('pause', { roomId, currentTime: time });
      setTimeout(() => { isRemoteAction.current = false; }, 300);
    } else {
      isRemoteAction.current = true;
      playerRef.current.playVideo();
      setIsPlayingLocal(true);
      socket.emit('play', { roomId, currentTime: time });
      setTimeout(() => { isRemoteAction.current = false; }, 300);
    }
  };

  const handleSliderSeek = (e) => {
    if (!canControl || !playerRef.current) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    isRemoteAction.current = true;
    playerRef.current.seekTo(newTime, true);
    socket.emit('seek', { roomId, currentTime: newTime });
    setTimeout(() => { isRemoteAction.current = false; }, 300);
  };

  // Force Resync asks server for real-time computed room state
  const handleManualResync = () => {
    if (!socket || !roomId) return;
    setSyncNotice('🔄 Fetching live room state...');
    socket.emit('request_sync', { roomId });
  };

  // Change video handler
  const handleLoadVideo = (e) => {
    e.preventDefault();
    if (!canControl) return;

    const extractedId = extractYouTubeId(inputUrl);
    if (!extractedId) {
      setUrlError('Please enter a valid YouTube video URL or ID.');
      return;
    }

    setUrlError('');
    socket.emit('change_video', { roomId, videoId: extractedId });
    setInputUrl('');
  };

  // Re-load video if player is already mounted and videoId changes
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function' && videoId) {
      try {
        isRemoteAction.current = true;
        playerRef.current.loadVideoById(videoId);
        setCurrentTime(0);
        setIsPlayingLocal(true);
        setTimeout(() => {
          isRemoteAction.current = false;
        }, 500);
      } catch (err) {
        console.warn('Could not loadVideoById directly:', err);
      }
    }
  }, [videoId]);

  const opts = useMemo(() => ({
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      // If participant, hide YouTube default controls so they don't manually desync
      controls: canControl ? 1 : 0,
      modestbranding: 1,
      rel: 0,
    },
  }), [canControl]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Video URL Input Bar (Host / Mod only) */}
      {canControl ? (
        <form onSubmit={handleLoadVideo} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Link2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Paste any YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-[#131b2e] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Video</span>
          </button>
        </form>
      ) : (
        <div className="bg-[#131b2e]/60 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Viewer Mode: Video is synchronized with the room host.</span>
          </div>
          <button
            onClick={handleManualResync}
            className="text-gray-300 hover:text-white underline text-xs"
          >
            Force Resync
          </button>
        </div>
      )}

      {urlError && (
        <p className="text-red-400 text-xs font-medium px-1">{urlError}</p>
      )}

      {/* Main Video Screen Container (16:9 aspect ratio) */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center">
        {videoId ? (
          <YouTube
            key={videoId}
            videoId={videoId}
            opts={opts}
            onReady={onReady}
            onPlay={handlePlayerPlay}
            onPause={handlePlayerPause}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        ) : (
          <div className="text-gray-500 text-sm">No video loaded</div>
        )}
      </div>

      {/* Playback Control Bar */}
      <div className="bg-[#131b2e] border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-400 min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSliderSeek}
            disabled={!canControl}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-700 accent-red-500 ${
              !canControl ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          <span className="text-xs font-mono text-gray-400 min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {canControl ? (
              <button
                onClick={togglePlayPause}
                className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                title={isPlayingLocal ? 'Pause' : 'Play'}
              >
                {isPlayingLocal ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
            ) : (
              <div className="text-xs text-gray-400 italic">
                Only Host / Moderator can control playback
              </div>
            )}

            <button
              onClick={handleManualResync}
              title="Resync video to host"
              className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors border border-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{syncNotice}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
