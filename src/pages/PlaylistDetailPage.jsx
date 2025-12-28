
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMusic } from '@/contexts/MusicContext';
import { ArrowLeft, Play, Pause, Trash2, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SidebarPlayer from '@/components/SidebarPlayer';

const PlaylistDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { playSong, currentSong, isPlaying } = useMusic();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylistData = async () => {
    const { data: playlistData } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const { data: songsData } = await supabase
      .from('playlist_songs')
      .select(`
        *,
        songs (
          *,
          albums (
            name,
            release_year,
            bands (
              name,
              categories ( name )
            )
          )
        )
      `)
      .eq('playlist_id', id)
      .order('position');

    if (playlistData) setPlaylist(playlistData);
    if (songsData) setSongs(songsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaylistData();
  }, [id, user]);

  const handleRemoveSong = async (playlistSongId) => {
    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('id', playlistSongId);

    if (!error) {
      setSongs(songs.filter(s => s.id !== playlistSongId));
      toast({
        title: 'Música removida',
        description: 'Música removida da playlist com sucesso',
      });
    }
  };

  const handlePlaySong = (playlistSong) => {
    const songData = playlistSong.songs;
    const song = {
      ...songData,
      album_name: songData.albums.name,
      band_name: songData.albums.bands.name,
      genre: songData.albums.bands.categories?.name,
      release_year: songData.albums.release_year
    };
    
    // Create playlist queue
    const queue = songs.map(s => ({
       ...s.songs,
       album_name: s.songs.albums.name,
       band_name: s.songs.albums.bands.name,
       genre: s.songs.albums.bands.categories?.name,
       release_year: s.songs.albums.release_year
    }));

    playSong(song, queue);
  };
  
  const playAll = () => {
      if(songs.length > 0) handlePlaySong(songs[0]);
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-full flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;
  if (!playlist) return <div className="h-full flex items-center justify-center text-slate-400">Playlist não encontrada.</div>;

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <Helmet>
        <title>{playlist.name} - MusicHub</title>
      </Helmet>

      {/* Left List */}
      <div className="h-full overflow-y-auto border-r border-slate-800 bg-slate-950">
        <div className="p-8">
            <Link to="/playlists" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Link>

            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {playlist.name}
                </h1>
                {playlist.description && (
                <p className="text-slate-400">{playlist.description}</p>
                )}
                <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm uppercase tracking-wide font-bold">
                    <ListMusic className="w-4 h-4"/> {songs.length} músicas
                </p>
            </div>

            <div className="space-y-2">
                {songs.length === 0 ? (
                   <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                      <p className="text-slate-400">Esta playlist está vazia.</p>
                   </div>
                ) : (
                    songs.map((playlistSong, index) => {
                        const isCurrent = currentSong?.id === playlistSong.songs.id;
                        return (
                            <div
                                key={playlistSong.id}
                                className={`flex items-center gap-4 p-3 rounded-lg hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800 ${isCurrent ? 'bg-indigo-900/20 border-indigo-500/30' : ''}`}
                            >
                                <span className="text-slate-500 w-6 text-center text-sm font-mono">{index + 1}</span>

                                <div className="relative group shrink-0 w-10 h-10">
                                    <img src={playlistSong.songs.album_cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop"} className="w-full h-full object-cover rounded" />
                                    <button
                                        onClick={() => handlePlaySong(playlistSong)}
                                        className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center rounded text-white"
                                    >
                                        {isCurrent && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate text-sm ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>{playlistSong.songs.name}</p>
                                    <p className="text-xs text-slate-400 truncate">
                                        {playlistSong.songs.albums.bands.name}
                                    </p>
                                </div>

                                <span className="text-slate-500 text-xs font-mono">{formatDuration(playlistSong.songs.duration)}</span>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSong(playlistSong.id)}
                                    className="shrink-0 w-8 h-8 text-slate-600 hover:text-red-400 hover:bg-red-950/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
      </div>

      {/* Right Player */}
      <div className="h-full hidden lg:block overflow-hidden relative">
            <SidebarPlayer 
                defaultContext={{
                    image: null,
                    title: playlist.name,
                    subtitle: "Playlist Personalizada",
                    year: new Date(playlist.created_at).getFullYear(),
                    genre: "Vários",
                    type: 'Playlist',
                    onPlayRequest: playAll
                }}
            />
      </div>
    </div>
  );
};

export default PlaylistDetailPage;
