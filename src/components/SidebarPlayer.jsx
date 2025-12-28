
import React, { useEffect, useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Shuffle, Repeat, Repeat1, Heart, Mic2, Disc, Music, Calendar, Clock, Tag
} from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';

const SidebarPlayer = ({ defaultContext = {} }) => {
  const { 
    currentSong, isPlaying, togglePlay, playNext, playPrevious, 
    isShuffling, toggleShuffle, repeatMode, toggleRepeat
  } = useMusic();
  const { user } = useAuth();
  
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Lyrics State
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  useEffect(() => {
    const syncProgress = () => {
      const audio = document.querySelector('audio');
      if (audio) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration || 0);
        setProgress((audio.currentTime / audio.duration) * 100 || 0);
        setVolume(audio.volume);
        setIsMuted(audio.muted);
      }
    };

    const interval = setInterval(syncProgress, 500); 
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  useEffect(() => {
    checkFavorite();
  }, [currentSong, user]);

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
    if (!user || !currentSong) return;
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('song_id', currentSong.id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, song_id: currentSong.id });
      setIsFavorite(true);
    }
  };

  const handleSeek = (value) => {
    const audio = document.querySelector('audio');
    if (audio) {
      const seekTime = (value[0] / 100) * audio.duration;
      audio.currentTime = seekTime;
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (val) => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.volume = val[0];
      setVolume(val[0]);
      setIsMuted(false);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchLyrics = async () => {
    if (!currentSong) return;
    setLoadingLyrics(true);
    const { data } = await supabase.from('song_lyrics').select('content').eq('song_id', currentSong.id).maybeSingle();
    setLyrics(data?.content || "Letra não disponível.");
    setLoadingLyrics(false);
  };

  const handleCoverClick = () => {
    if(currentSong) {
      setLyricsOpen(true);
      fetchLyrics();
    }
  };

  // Logic to switch between "Currently Playing" and "Page Default Context"
  // If a song is playing, we show that song's full details.
  // If nothing playing, we show the Album/Playlist details passed via props.
  const activeData = currentSong ? {
    image: currentSong.album_cover_url || currentSong.cover_url,
    title: currentSong.name,
    subtitle: currentSong.band_name,
    albumName: currentSong.album_name,
    year: currentSong.release_year,
    genre: currentSong.genre || 'Geral', // Assuming passed in context or enriched
    duration: currentSong.duration
  } : {
    image: defaultContext.image,
    title: defaultContext.title,
    subtitle: defaultContext.subtitle,
    albumName: defaultContext.type === 'Album' ? defaultContext.title : 'Vários',
    year: defaultContext.year,
    genre: defaultContext.genre,
    duration: null // Context usually doesn't have a single duration
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800">
      <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto">
        {/* Large Cover Art */}
        <div 
          className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl mb-8 relative group cursor-pointer border border-slate-800"
          onClick={handleCoverClick}
        >
          {activeData.image ? (
            <img src={activeData.image} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center bg-gradient-to-br from-indigo-900/20 to-slate-900">
              <Disc className="w-32 h-32 text-slate-700" />
            </div>
          )}
          
          {currentSong && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
               <Mic2 className="w-12 h-12 text-white" />
               <span className="ml-2 font-medium text-white">Ver Letra</span>
            </div>
          )}
        </div>

        {/* Info Section - Expanded */}
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{activeData.title || "Pronto para tocar"}</h2>
            <p className="text-indigo-400 text-lg font-medium">{activeData.subtitle || "Escolha uma música"}</p>
          </div>

          {/* Metadata Grid */}
          {(activeData.albumName || activeData.year || activeData.genre) && (
            <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                {activeData.albumName && (
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1"><Disc className="w-3 h-3"/> Álbum</span>
                    <span className="text-sm text-slate-300 truncate font-medium">{activeData.albumName}</span>
                  </div>
                )}
                 {activeData.genre && (
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1"><Tag className="w-3 h-3"/> Gênero</span>
                    <span className="text-sm text-slate-300 truncate font-medium">{activeData.genre}</span>
                  </div>
                )}
                {activeData.year && (
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3"/> Ano</span>
                    <span className="text-sm text-slate-300 truncate font-medium">{activeData.year}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Duração</span>
                  <span className="text-sm text-slate-300 truncate font-medium">
                    {activeData.duration ? formatTime(activeData.duration) : '--:--'}
                  </span>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="bg-slate-950 p-6 border-t border-slate-800 shrink-0">
        <div className="max-w-md mx-auto space-y-6">
           {/* Progress */}
           <div className="space-y-2">
             <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                disabled={!currentSong}
                className="cursor-pointer"
             />
             <div className="flex justify-between text-xs text-slate-500 font-mono">
               <span>{formatTime(currentTime)}</span>
               <span>{formatTime(duration)}</span>
             </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!currentSong}
                onClick={toggleShuffle}
                className={`hover:bg-slate-800 ${isShuffling ? 'text-indigo-500' : 'text-slate-500'}`}
              >
                <Shuffle className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-6">
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={playPrevious}
                    disabled={!currentSong}
                    className="text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <SkipBack className="w-8 h-8" />
                  </Button>

                  <Button 
                    size="icon" 
                    onClick={currentSong ? togglePlay : defaultContext.onPlayRequest} 
                    className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl hover:scale-105 transition-all"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current pl-1" />}
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={playNext}
                    disabled={!currentSong}
                    className="text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <SkipForward className="w-8 h-8" />
                  </Button>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!currentSong}
                onClick={toggleRepeat}
                className={`hover:bg-slate-800 ${repeatMode !== 'none' ? 'text-indigo-500' : 'text-slate-500'}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </Button>
           </div>

           {/* Secondary Controls */}
           <div className="flex items-center justify-between pt-2">
              <Button 
                 variant="ghost" 
                 size="icon" 
                 disabled={!currentSong}
                 onClick={toggleFavorite}
                 className={`hover:bg-slate-800 ${isFavorite ? 'text-red-500' : 'text-slate-500 hover:text-white'}`}
               >
                 <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
               </Button>

               <div className="flex items-center gap-3 w-40">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMuted(!isMuted)} 
                    className="text-slate-400 hover:text-white w-8 h-8 hover:bg-slate-800"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
               </div>
           </div>
        </div>
      </div>

       {/* Lyrics Modal */}
       <Dialog open={lyricsOpen} onOpenChange={setLyricsOpen}>
        <DialogContent className="max-w-2xl h-[80vh] bg-slate-950/95 border-slate-800 backdrop-blur-xl flex flex-col p-0 overflow-hidden">
          <div className="relative h-full flex flex-col">
            <div className="absolute inset-0 z-0">
               {currentSong?.album_cover_url && (
                 <img src={currentSong.album_cover_url} className="w-full h-full object-cover opacity-10 blur-xl" />
               )}
               <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-slate-950" />
            </div>
            <div className="relative z-10 p-6 flex-shrink-0 border-b border-slate-800/50 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <img 
                    src={currentSong?.album_cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop"} 
                    className="w-16 h-16 rounded-md shadow-lg"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-white">{currentSong?.name}</h2>
                    <p className="text-indigo-400">{currentSong?.band_name}</p>
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
    </div>
  );
};

export default SidebarPlayer;
