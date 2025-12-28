
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const MusicContext = createContext(undefined);

export const MusicProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // New States
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'all', 'one'

  const playSong = useCallback((song, songsList = []) => {
    setCurrentSong(song);
    setIsPlaying(true);
    if (songsList.length > 0) {
      setPlaylist(songsList);
      const index = songsList.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffling(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

  const playNext = useCallback(() => {
    if (playlist.length === 0) return;

    // Handle Repeat One
    if (repeatMode === 'one') {
      // Just re-trigger the current song (the audio element onEnded will catch the state change or we rely on the component to seek 0)
      // Actually, standard behavior for "next" button on repeat-one is usually "go to next anyway", 
      // but "auto-play next" stays on one. 
      // For simplicity here, we'll advance index unless it's auto-triggered, but let's stick to standard playlist logic:
    }

    let nextIndex;

    if (isShuffling) {
      // Simple random next (excluding current if possible)
      if (playlist.length === 1) nextIndex = 0;
      else {
        do {
          nextIndex = Math.floor(Math.random() * playlist.length);
        } while (nextIndex === currentIndex);
      }
    } else {
      nextIndex = currentIndex + 1;
    }

    // Handle End of Playlist
    if (nextIndex >= playlist.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return; // Stop at end
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentSong(playlist[nextIndex]);
    setIsPlaying(true);
  }, [playlist, currentIndex, isShuffling, repeatMode]);

  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;

    let prevIndex;

    if (isShuffling) {
       // In shuffle, previous usually goes to history, but for simple random implementation:
       prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex - 1;
    }

    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = playlist.length - 1;
      } else {
        prevIndex = 0; // Stay at start
      }
    }

    setCurrentIndex(prevIndex);
    setCurrentSong(playlist[prevIndex]);
    setIsPlaying(true);
  }, [playlist, currentIndex, isShuffling, repeatMode]);

  const value = useMemo(() => ({
    currentSong,
    isPlaying,
    playlist,
    currentIndex,
    isShuffling,
    repeatMode,
    playSong,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat
  }), [
    currentSong, isPlaying, playlist, currentIndex, isShuffling, repeatMode,
    playSong, togglePlay, playNext, playPrevious, toggleShuffle, toggleRepeat
  ]);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
