
import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Shuffle, Repeat, Repeat1, ListMusic, Heart, Mic2, X
} from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';

const MusicPlayer = () => {
  const { 
    currentSong, isPlaying, togglePlay, playNext, playPrevious, 
    isShuffling, toggleShuffle, repeatMode, toggleRepeat 
  } = useMusic();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // Logic to determine if we should HIDE the visible footer
  // because the page has a SidebarPlayer.
  // Note: We MUST keep the component mounted so the <audio> tag persists,
  // we just hide the visible UI.
  const isSidePlayerPage = ['/album/', '/playlist/', '/favorites'].some(path => location.pathname.startsWith(path));
  
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Lyrics State
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Audio Control Logic
  useEffect(() => {
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
      // Check favorite status
      checkFavorite();
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const checkFavorite = async () => {
    if (!user || !currentSong) return;
    const { data } = await supabase.from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('song_id', currentSong.id)
      .maybeSingle();
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('song_id', currentSong.id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, song_id: currentSong.id });
      setIsFavorite(true);
    }
  };

  const fetchLyrics = async () => {
    if (!currentSong) return;
    setLoadingLyrics(true);
    const { data } = await supabase
      .from('song_lyrics')
      .select('content')
      .eq('song_id', currentSong.id)
      .maybeSingle();
    
    setLyrics(data?.content || "Letra não disponível para esta música.");
    setLoadingLyrics(false);
  };

  // Open lyrics when clicking cover
  const handleCoverClick = () => {
    setLyricsOpen(true);
    fetchLyrics();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      const seekTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = seekTime;
      setProgress(value[0]);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
      />

      {/* Lyrics Overlay Modal - Available globally */}
      <Dialog open={lyricsOpen} onOpenChange={setLyricsOpen}>
        <DialogContent className="max-w-2xl h-[80vh] bg-slate-950/95 border-slate-800 backdrop-blur-xl flex flex-col p-0 overflow-hidden">
          <div className="relative h-full flex flex-col">
            <div className="absolute inset-0 z-0">
               {currentSong.album_cover_url && (
                 <img src={currentSong.album_cover_url} className="w-full h-full object-cover opacity-10 blur-xl" />
               )}
               <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-slate-950" />
            </div>

            <div className="relative z-10 p-6 flex-shrink-0 border-b border-slate-800/50 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <img 
                    src={currentSong.album_cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop"} 
                    className="w-16 h-16 rounded-md shadow-lg"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-white">{currentSong.name}</h2>
                    <p className="text-indigo-400">{currentSong.band_name}</p>
                  </div>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setLyricsOpen(false)}>
                 <X className="text-slate-400" />
               </Button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto p-8 text-center">
              {loadingLyrics ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                </div>
              ) : (
                <p className="text-xl md:text-2xl leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">
                  {lyrics}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FOOTER PLAYER - VISIBLE ONLY IF NOT ON SIDE PLAYER PAGES */}
      {!isSidePlayerPage && (
        <AnimatePresence>
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 h-24 bg-slate-950 border-t border-slate-800 z-50 flex items-center px-4"
          >
            {/* Left: Album/Song Info */}
            <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
              <div 
                className="relative group cursor-pointer w-16 h-16 shrink-0 rounded-md overflow-hidden"
                onClick={handleCoverClick}
                title="Ver Letra"
              >
                <img 
                  src={currentSong.album_cover_url || currentSong.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop"} 
                  alt="Cover" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Mic2 className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="hidden sm:block overflow-hidden">
                <h4 className="text-white font-semibold truncate text-sm hover:underline cursor-pointer" onClick={handleCoverClick}>
                  {currentSong.name}
                </h4>
                <p className="text-slate-400 text-xs truncate">
                  {currentSong.band_name} • {currentSong.release_year || 'Unknown'}
                </p>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className={`hidden md:flex ml-2 ${isFavorite ? 'text-red-500' : 'text-slate-500 hover:text-white'}`}
                onClick={toggleFavorite}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Center: Controls */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-[40%] gap-2">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`w-8 h-8 ${isShuffling ? 'text-indigo-500' : 'text-slate-500 hover:text-white'}`}
                  onClick={toggleShuffle}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="icon" onClick={playPrevious} className="text-slate-300 hover:text-white">
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                <Button 
                  size="icon" 
                  onClick={togglePlay} 
                  className="w-10 h-10 rounded-full bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-1" />}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={playNext} className="text-slate-300 hover:text-white">
                  <SkipForward className="w-5 h-5" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`w-8 h-8 ${repeatMode !== 'none' ? 'text-indigo-500' : 'text-slate-500 hover:text-white'}`}
                  onClick={toggleRepeat}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="w-full flex items-center gap-2">
                <span className="text-[10px] text-slate-400 w-8 text-right font-mono">{formatTime(currentTime)}</span>
                <Slider
                  value={[progress]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="flex-1 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 w-8 font-mono">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right: Volume & Extra */}
            <div className="flex items-center justify-end gap-2 w-[30%] min-w-[200px]">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" title="Lista de Reprodução">
                  <ListMusic className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2 w-24 sm:w-32">
                  <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white w-8 h-8">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={(val) => { setVolume(val[0]); setIsMuted(false); }}
                    max={1}
                    step={0.01}
                    className="w-20"
                  />
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};

export default MusicPlayer;
