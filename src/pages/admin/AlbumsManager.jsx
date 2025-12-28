
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Plus, Edit, Trash2, Loader2, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AlbumsManager = () => {
  const { toast } = useToast();
  const [albums, setAlbums] = useState([]);
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [formData, setFormData] = useState({ name: '', cover_url: '', release_year: '', band_id: '' });
  const [uploadingCover, setUploadingCover] = useState(false);

  const fetchData = async () => {
    try {
      const { data: albumsData, error: albumError } = await supabase.from('albums').select('*, bands(name)').order('name');
      const { data: bandsData, error: bandError } = await supabase.from('bands').select('*').order('name');

      if (albumError) throw albumError;
      if (bandError) throw bandError;

      if (albumsData) setAlbums(albumsData);
      if (bandsData) setBands(bandsData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar dados." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `album-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError, data } = await supabase.storage.from('covers').upload(fileName, file);

      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(data.path);

      setFormData({ ...formData, cover_url: publicUrl });
      toast({ title: 'Sucesso', description: 'Capa enviada' });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no upload", description: error.message });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAlbum) {
        const { error } = await supabase.from('albums').update(formData).eq('id', editingAlbum.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Álbum atualizado' });
      } else {
        const { error } = await supabase.from('albums').insert(formData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Álbum criado' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
       toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deletar álbum? As músicas também podem ser afetadas.')) return;
    try {
      const { error } = await supabase.from('albums').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Álbum deletado' });
      fetchData();
    } catch (error) {
       toast({ variant: "destructive", title: "Erro ao deletar", description: error.message });
    }
  };

  const resetForm = () => {
    setEditingAlbum(null);
    setFormData({ name: '', cover_url: '', release_year: '', band_id: '' });
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (album) => {
    setEditingAlbum(album);
    setFormData({ name: album.name, cover_url: album.cover_url || '', release_year: album.release_year || '', band_id: album.band_id });
    setIsDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Álbuns</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie a discografia</p>
        </div>
        <Button onClick={openNewDialog} className="bg-indigo-600 hover:bg-indigo-500">
          <Plus className="w-4 h-4 mr-2" />Novo Álbum
        </Button>
      </div>

      <div className="space-y-4">
        {albums.length === 0 ? (
          <p className="text-center text-slate-500 py-10">Nenhum álbum cadastrado.</p>
        ) : (
          albums.map((album) => (
            <div key={album.id} className="flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
              <div className="w-16 h-16 rounded bg-slate-800 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                 {album.cover_url ? (
                  <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
                 ) : (
                   <Disc className="w-8 h-8 text-slate-600" />
                 )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{album.name}</h3>
                <p className="text-slate-400 text-sm">
                  {album.bands?.name} 
                  {album.release_year && <span className="text-slate-600"> • {album.release_year}</span>}
                </p>
              </div>
              <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(album)} className="text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(album.id)} className="text-slate-400 hover:text-red-400 hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader><DialogTitle>{editingAlbum ? 'Editar' : 'Novo'} Álbum</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Banda</Label>
              <select className="w-full h-10 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.band_id} onChange={(e) => setFormData({ ...formData, band_id: e.target.value })} required>
                <option value="">Selecione uma banda...</option>
                {bands.map(band => <option key={band.id} value={band.id}>{band.name}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Nome do Álbum</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Ano de Lançamento</Label><Input type="number" min="1900" max="2099" value={formData.release_year} onChange={(e) => setFormData({ ...formData, release_year: e.target.value })} /></div>
            
            <div className="space-y-3">
              <Label>Capa do Álbum</Label>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.cover_url ? (
                    <img src={formData.cover_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Disc className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <Input type="file" onChange={handleUploadCover} accept="image/*" disabled={uploadingCover} className="flex-1" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={uploadingCover}>
              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlbumsManager;
