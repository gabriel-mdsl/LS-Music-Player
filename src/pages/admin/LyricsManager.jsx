
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Edit, Search, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const LyricsManager = () => {
  const { toast } = useToast();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [lyricsContent, setLyricsContent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSongs = async () => {
    setLoading(true);
    // Fetch songs with their lyrics status
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        albums (name, bands (name)),
        song_lyrics (id, content)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching songs:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar músicas', variant: 'destructive' });
    } else {
      setSongs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleOpenEditor = (song) => {
    setSelectedSong(song);
    // Check if lyrics exist (it's an array because of the join, but we expect 0 or 1)
    const existingLyrics = song.song_lyrics?.[0]?.content || '';
    setLyricsContent(existingLyrics);
    setIsDialogOpen(true);
  };

  const handleSaveLyrics = async () => {
    if (!selectedSong) return;
    setSaving(true);

    const { error } = await supabase
      .from('song_lyrics')
      .upsert({ 
        song_id: selectedSong.id, 
        content: lyricsContent 
      }, { onConflict: 'song_id' });

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar letra', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Letra salva com sucesso' });
      setIsDialogOpen(false);
      fetchSongs(); // Refresh list to update status
    }
    setSaving(false);
  };

  const filteredSongs = songs.filter(song => 
    song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.albums?.bands?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Gerenciar Letras</h1>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input 
          placeholder="Buscar música ou artista..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Música</th>
                  <th className="px-6 py-3">Artista / Álbum</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSongs.map((song) => {
                  const hasLyrics = song.song_lyrics && song.song_lyrics.length > 0 && song.song_lyrics[0].content;
                  return (
                    <tr key={song.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{song.name}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {song.albums?.bands?.name} • {song.albums?.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasLyrics ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            Com Letra
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
                            Sem Letra
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEditor(song)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {hasLyrics ? 'Editar' : 'Adicionar'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredSongs.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Nenhuma música encontrada.
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Letra: {selectedSong?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 py-4">
            <Textarea 
              value={lyricsContent}
              onChange={(e) => setLyricsContent(e.target.value)}
              placeholder="Cole a letra da música aqui..."
              className="h-full font-mono text-sm leading-relaxed resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveLyrics} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Salvando...' : 'Salvar Letra'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LyricsManager;
