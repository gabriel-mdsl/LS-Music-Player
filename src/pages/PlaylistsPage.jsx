
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Plus, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const PlaylistsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPlaylists = async () => {
    const { data } = await supabase
      .from('playlists')
      .select('*, playlist_songs(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPlaylists(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        name: newPlaylistName,
        description: newPlaylistDescription,
      });

    if (!error) {
      toast({
        title: 'Playlist criada',
        description: 'Playlist criada com sucesso',
      });
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsDialogOpen(false);
      fetchPlaylists();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Minhas Playlists - MusicHub</title>
        <meta name="description" content="Gerencie suas playlists no MusicHub" />
      </Helmet>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Minhas Playlists
          </h1>
          <p className="text-slate-400">Organize suas músicas favoritas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Playlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Nome da playlist"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Descrição da playlist"
                />
              </div>
              <Button type="submit" className="w-full">
                Criar Playlist
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {playlists.map((playlist, index) => (
          <motion.div
            key={playlist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link to={`/playlist/${playlist.id}`}>
              <div className="group relative overflow-hidden rounded-lg bg-slate-800/50 border border-slate-700 hover:border-indigo-500 transition-all duration-300">
                <div className="aspect-square relative bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                  <Music className="w-16 h-16 text-slate-600" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {playlist.playlist_songs?.[0]?.count || 0} músicas
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {playlists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg mb-4">Você ainda não tem playlists.</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Playlist
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
