
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Plus, Edit, Trash2, Loader2, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const SongsManager = () => {
  const { toast } = useToast();
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  
  // Extended form data to include lyrics
  const [formData, setFormData] = useState({ 
    name: '', 
    album_id: '', 
    duration: '', 
    track_number: '',
    lyrics: '' 
  });
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch songs
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select(`
          *,
          albums(name, bands(name))
        `)
        .order('created_at', { ascending: false });

      if (songsError) throw songsError;

      // Fetch albums for dropdown
      const { data: albumsData } = await supabase.from('albums').select('id, name, bands(name)').order('name');
      
      setSongs(songsData || []);
      setAlbums(albumsData || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = async (song) => {
    setEditingSong(song);
    
    // Fetch lyrics for this song
    const { data: lyricsData } = await supabase
      .from('song_lyrics')
      .select('content')
      .eq('song_id', song.id)
      .maybeSingle();

    setFormData({
      name: song.name,
      album_id: song.album_id,
      duration: song.duration || '',
      track_number: song.track_number || '',
      lyrics: lyricsData?.content || ''
    });
    setAudioFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let audioUrl = editingSong?.audio_url;

      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('songs')
          .upload(fileName, audioFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('songs')
          .getPublicUrl(data.path);
          
        audioUrl = publicUrl;
      }

      let songId = editingSong?.id;

      // 1. Insert/Update Song
      const songPayload = {
        name: formData.name,
        album_id: formData.album_id,
        duration: formData.duration ? parseInt(formData.duration) : null,
        track_number: formData.track_number ? parseInt(formData.track_number) : null,
        ...(audioUrl && { audio_url: audioUrl })
      };

      if (editingSong) {
        const { error } = await supabase.from('songs').update(songPayload).eq('id', songId);
        if (error) throw error;
        toast({ title: 'Música atualizada' });
      } else {
        if (!audioFile) throw new Error("Arquivo de áudio é obrigatório para novas músicas");
        const { data: newSong, error } = await supabase.from('songs').insert(songPayload).select().single();
        if (error) throw error;
        songId = newSong.id;
        toast({ title: 'Música criada' });
      }

      // 2. Handle Lyrics (Upsert)
      if (songId) {
        if (formData.lyrics && formData.lyrics.trim() !== '') {
          // Check if exists
          const { data: existing } = await supabase.from('song_lyrics').select('id').eq('song_id', songId).maybeSingle();
          
          if (existing) {
             await supabase.from('song_lyrics').update({ content: formData.lyrics }).eq('song_id', songId);
          } else {
             await supabase.from('song_lyrics').insert({ song_id: songId, content: formData.lyrics });
          }
        } else {
          // If empty, user might want to delete lyrics? For now, we just don't update if empty or leave as is.
          // Optional: Delete if empty string provided
        }
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      await supabase.from('songs').delete().eq('id', id);
      toast({ title: 'Música removida' });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const resetForm = () => {
    setEditingSong(null);
    setFormData({ name: '', album_id: '', duration: '', track_number: '', lyrics: '' });
    setAudioFile(null);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Gerenciar Músicas</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Nova Música</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingSong ? 'Editar' : 'Nova'} Música</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Álbum</Label>
                <select 
                  className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-white"
                  value={formData.album_id}
                  onChange={e => setFormData({...formData, album_id: e.target.value})}
                  required
                >
                  <option value="">Selecione um álbum...</option>
                  {albums.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.bands?.name})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração (segundos)</Label>
                  <Input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Número da Faixa</Label>
                  <Input type="number" value={formData.track_number} onChange={e => setFormData({...formData, track_number: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Letra da Música</Label>
                <textarea 
                  className="w-full min-h-[150px] px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-white font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.lyrics}
                  onChange={e => setFormData({...formData, lyrics: e.target.value})}
                  placeholder="Cole a letra da música aqui..."
                />
              </div>

              <div className="space-y-2">
                <Label>Arquivo de Áudio {editingSong && '(Opcional se já existir)'}</Label>
                <Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files[0])} required={!editingSong} />
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin mr-2" /> : null} Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-slate-900 rounded-md border border-slate-800">
        {songs.map((song) => (
          <div key={song.id} className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="bg-slate-800 p-2 rounded"><Music2 className="w-6 h-6 text-slate-500" /></div>
              <div>
                <p className="font-medium text-white">{song.name}</p>
                <p className="text-sm text-slate-400">{song.albums?.bands?.name} • {song.albums?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleEditClick(song)}><Edit className="w-4 h-4 text-indigo-400" /></Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(song.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongsManager;
