
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMusic } from '@/contexts/MusicContext';
import { Play, Pause, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SidebarPlayer from '@/components/SidebarPlayer';

const FavoritesPage = () => {
  const { user } = useAuth();
  const { playSong, currentSong, isPlaying } = useMusic();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('favorites')
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setFavorites(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (favoriteId, songId) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    if (!error) {
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast({
        title: 'Removido dos favoritos',
        description: 'Música removida com sucesso',
      });
    }
  };

  const handlePlaySong = (favorite) => {
     const songData = favorite.songs;
     const song = {
      ...songData,
      album_name: songData.albums.name,
      band_name: songData.albums.bands.name,
      genre: songData.albums.bands.categories?.name,
      release_year: songData.albums.release_year
    };
    
    // Queue
    const queue = favorites.map(f => ({
      ...f.songs,
      album_name: f.songs.albums.name,
      band_name: f.songs.albums.bands.name,
      genre: f.songs.albums.bands.categories?.name,
      release_year: f.songs.albums.release_year
    }));

    playSong(song, queue);
  };

  const playAll = () => {
      if(favorites.length > 0) handlePlaySong(favorites[0]);
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-full flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <Helmet>
        <title>Favoritos - MusicHub</title>
      </Helmet>

      {/* Left List */}
      <div className="h-full overflow-y-auto border-r border-slate-800 bg-slate-950">
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Favoritos
                </h1>
                <p className="text-slate-400">Coleção de {favorites.length} músicas curtidas</p>
            </div>

            <div className="space-y-2">
                {favorites.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                         <p className="text-slate-400">Você ainda não curtiu nenhuma música.</p>
                    </div>
                ) : (
                    favorites.map((favorite) => {
                        const isCurrent = currentSong?.id === favorite.songs.id;
                        return (
                            <div
                                key={favorite.id}
                                className={`flex items-center gap-4 p-3 rounded-lg hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800 ${isCurrent ? 'bg-indigo-900/20 border-indigo-500/30' : ''}`}
                            >
                                <div className="relative group shrink-0 w-10 h-10">
                                    <img src={favorite.songs.album_cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop"} className="w-full h-full object-cover rounded" />
                                    <button
                                        onClick={() => handlePlaySong(favorite)}
                                        className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center rounded text-white"
                                    >
                                        {isCurrent && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate text-sm ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>{favorite.songs.name}</p>
                                    <p className="text-xs text-slate-400 truncate">
                                        {favorite.songs.albums.bands.name}
                                    </p>
                                </div>

                                <span className="text-slate-500 text-xs font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3"/>
                                    {formatDuration(favorite.songs.duration)}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveFavorite(favorite.id, favorite.songs.id)}
                                    className="shrink-0 w-8 h-8 text-red-500 hover:bg-red-950/20"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
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
                    image: "https://images.unsplash.com/photo-1514525253440-b393452e233e?w=500&h=500&fit=crop",
                    title: "Suas Curtidas",
                    subtitle: "Lista de Favoritos",
                    year: new Date().getFullYear(),
                    genre: "Misturado",
                    type: 'Playlist',
                    onPlayRequest: playAll
                }}
            />
      </div>
    </div>
  );
};

export default FavoritesPage;
