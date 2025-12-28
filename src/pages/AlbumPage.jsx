
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { ArrowLeft, Play, Heart, Pause, Disc, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import SidebarPlayer from '@/components/SidebarPlayer';

const AlbumPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playSong, currentSong, isPlaying } = useMusic();
  const { toast } = useToast();
  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch album with band and nested category name
      const { data: albumData } = await supabase
        .from('albums')
        .select(`
            *,
            bands (
                name,
                categories (
                    name
                )
            )
        `)
        .eq('id', id)
        .single();

      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .eq('album_id', id)
        .order('track_number');

      if (user) {
        const { data: favoritesData } = await supabase
          .from('favorites')
          .select('song_id')
          .eq('user_id', user.id);
        
        if (favoritesData) setFavorites(favoritesData.map(f => f.song_id));
      }

      if (albumData) setAlbum(albumData);
      if (songsData) setSongs(songsData);
      setLoading(false);
    };

    fetchData();
  }, [id, user]);

  const handlePlaySong = (song) => {
    const enrichedSongs = songs.map(s => ({
      ...s,
      album_name: album.name,
      band_name: album.bands.name,
      album_cover_url: album.cover_url,
      genre: album.bands.categories?.name,
      release_year: album.release_year
    }));
    const enrichedSong = {
      ...song,
      album_name: album.name,
      band_name: album.bands.name,
      album_cover_url: album.cover_url,
      genre: album.bands.categories?.name,
      release_year: album.release_year
    };
    playSong(enrichedSong, enrichedSongs);
  };

  const playAlbum = () => {
    if (songs.length > 0) handlePlaySong(songs[0]);
  };

  const handleToggleFavorite = async (songId) => {
    if (!user) {
      toast({ title: 'Login necessário', description: 'Faça login para adicionar favoritos', variant: 'destructive' });
      navigate('/login');
      return;
    }

    const isFavorite = favorites.includes(songId);

    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('song_id', songId);
      setFavorites(favorites.filter(id => id !== songId));
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, song_id: songId });
      setFavorites([...favorites, songId]);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-full flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;
  if (!album) return <div className="h-full flex items-center justify-center text-slate-400">Álbum não encontrado.</div>;

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <Helmet>
        <title>{album.name} - MusicHub</title>
      </Helmet>

      {/* Left Column: List - SCROLLABLE */}
      <div className="h-full overflow-y-auto border-r border-slate-800 bg-slate-950">
        <div className="p-8">
            <Link to={`/band/${album.band_id}`} className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Artista
            </Link>

            <div className="mb-6">
                <h1 className="text-4xl font-bold text-white mb-2">{album.name}</h1>
                <div className="flex items-center gap-3 text-slate-400">
                    <span className="font-medium text-indigo-400">{album.bands.name}</span>
                    <span>•</span>
                    <span>{album.release_year}</span>
                    <span>•</span>
                    <span>{songs.length} músicas</span>
                </div>
            </div>

            <div className="bg-slate-900/30 rounded-xl border border-slate-800/50 overflow-hidden">
                {songs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Nenhuma música encontrada.</div>
                ) : (
                <table className="w-full text-left">
                    <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800/50 sticky top-0 backdrop-blur-md">
                    <tr>
                        <th className="px-4 py-4 w-12 text-center">#</th>
                        <th className="px-4 py-4">Título</th>
                        <th className="px-4 py-4 text-right">Tempo</th>
                        <th className="px-4 py-4 w-16"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                    {songs.map((song, i) => {
                        const isCurrent = currentSong?.id === song.id;
                        return (
                        <tr 
                            key={song.id} 
                            className={`group hover:bg-slate-800/50 transition-colors ${isCurrent ? 'bg-indigo-500/10' : ''}`}
                        >
                            <td className="px-4 py-3 text-slate-500 font-mono text-sm relative text-center">
                                <span className="group-hover:hidden">{i + 1}</span>
                                <button 
                                    onClick={() => handlePlaySong(song)}
                                    className="hidden group-hover:flex items-center justify-center absolute inset-0 w-full h-full text-white"
                                >
                                    {isCurrent && isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                </button>
                            </td>
                            <td className="px-4 py-3">
                                <div className={`font-medium ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>
                                    {song.name}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400 text-sm font-mono">
                                {formatDuration(song.duration)}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => handleToggleFavorite(song.id)} className="text-slate-500 hover:text-red-500 transition-colors p-2">
                                    <Heart className={`w-4 h-4 ${favorites.includes(song.id) ? 'fill-red-500 text-red-500' : ''}`} />
                                </button>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                )}
            </div>
        </div>
      </div>

      {/* Right Column: Player - FIXED/FLEX */}
      <div className="h-full hidden lg:block overflow-hidden relative">
            <SidebarPlayer 
                defaultContext={{
                    image: album.cover_url,
                    title: album.name,
                    subtitle: album.bands.name,
                    year: album.release_year,
                    genre: album.bands.categories?.name,
                    type: 'Album',
                    onPlayRequest: playAlbum
                }}
            />
      </div>
    </div>
  );
};

export default AlbumPage;
