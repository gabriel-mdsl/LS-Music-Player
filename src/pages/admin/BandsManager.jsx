
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const BandsManager = () => {
  const { toast } = useToast();
  const [bands, setBands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBand, setEditingBand] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', cover_url: '', category_id: '' });
  const [uploadingCover, setUploadingCover] = useState(false);

  const fetchData = async () => {
    try {
      // Changed sorting to created_at ASC (Oldest/First Added first)
      const { data: bandsData, error: bandsError } = await supabase
        .from('bands')
        .select('*, categories(name)')
        .order('created_at', { ascending: true }); // <--- Modified sorting here

      const { data: categoriesData, error: catError } = await supabase.from('categories').select('*').order('name');

      if (bandsError) throw bandsError;
      if (catError) throw catError;

      if (bandsData) setBands(bandsData);
      if (categoriesData) setCategories(categoriesData);
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
    const fileName = `band-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError, data } = await supabase.storage.from('covers').upload(fileName, file);

      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(data.path);

      setFormData({ ...formData, cover_url: publicUrl });
      toast({ title: 'Sucesso', description: 'Imagem enviada' });
    } catch (error) {
       toast({ variant: "destructive", title: "Erro no upload", description: error.message });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBand) {
        const { error } = await supabase.from('bands').update(formData).eq('id', editingBand.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Banda atualizada' });
      } else {
        const { error } = await supabase.from('bands').insert(formData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Banda criada' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza? Isso pode apagar álbuns associados.')) return;
    try {
      const { error } = await supabase.from('bands').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Banda deletada' });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao deletar", description: error.message });
    }
  };

  const resetForm = () => {
    setEditingBand(null);
    setFormData({ name: '', description: '', cover_url: '', category_id: '' });
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (band) => {
    setEditingBand(band);
    setFormData({ name: band.name, description: band.description || '', cover_url: band.cover_url || '', category_id: band.category_id });
    setIsDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Bandas e Artistas</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie os artistas da plataforma</p>
        </div>
        <Button onClick={openNewDialog} className="bg-indigo-600 hover:bg-indigo-500">
          <Plus className="w-4 h-4 mr-2" />Nova Banda
        </Button>
      </div>

      <div className="space-y-4">
        {bands.length === 0 ? (
           <p className="text-center text-slate-500 py-10">Nenhuma banda cadastrada.</p>
        ) : (
          bands.map((band) => (
            <div key={band.id} className="flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
              <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-700">
                {band.cover_url ? (
                  <img src={band.cover_url} alt={band.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{band.name}</h3>
                <p className="text-slate-400 text-sm">{band.categories?.name || 'Sem Categoria'}</p>
                <p className="text-slate-600 text-xs">Criado em: {new Date(band.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(band)} className="text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(band.id)} className="text-slate-400 hover:text-red-400 hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader><DialogTitle>{editingBand ? 'Editar' : 'Nova'} Banda</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select className="w-full h-10 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} required>
                <option value="">Selecione uma categoria...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Nome</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            
            <div className="space-y-3">
              <Label>Foto do Artista</Label>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.cover_url ? (
                    <img src={formData.cover_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
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

export default BandsManager;
