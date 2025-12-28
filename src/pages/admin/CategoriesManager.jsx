
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const CategoriesManager = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', cover_url: '' });
  const [uploadingCover, setUploadingCover] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar categorias." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleUploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `category-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError, data } = await supabase.storage
        .from('covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(data.path);

      setFormData({ ...formData, cover_url: publicUrl });
      toast({ title: 'Upload concluído', description: 'Imagem carregada com sucesso.' });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no upload", description: error.message });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Categoria atualizada' });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(formData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Categoria criada' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta categoria?')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Categoria deletada' });
      fetchCategories();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao deletar", description: error.message });
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', cover_url: '' });
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  }

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      cover_url: category.cover_url || '',
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Categorias</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie os gêneros e categorias musicais</p>
        </div>
        <Button onClick={openNewDialog} className="bg-indigo-600 hover:bg-indigo-500">
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="w-16 h-16 rounded bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-700">
                {category.cover_url ? (
                  <img src={category.cover_url} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{category.name}</h3>
                <p className="text-slate-500 text-sm truncate">{category.description || 'Sem descrição'}</p>
              </div>
              <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)} className="hover:bg-slate-800 text-slate-400 hover:text-white">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)} className="hover:bg-red-950/30 text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input 
                id="name"
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Ex: Rock, Pop, Jazz"
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input 
                id="description"
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Breve descrição sobre o gênero"
              />
            </div>

            <div className="space-y-3">
              <Label>Imagem de Capa</Label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.cover_url ? (
                    <img src={formData.cover_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                   <Input 
                    type="file" 
                    onChange={handleUploadCover} 
                    accept="image/*" 
                    disabled={uploadingCover}
                    className="cursor-pointer file:cursor-pointer file:text-indigo-400 file:bg-indigo-950/20 file:border-0 file:rounded-md file:px-2 file:mr-4 hover:file:bg-indigo-950/40"
                  />
                  <p className="text-xs text-slate-500">Recomendado: 500x500px (JPG, PNG)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={uploadingCover} className="bg-indigo-600 hover:bg-indigo-500">
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar Categoria
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesManager;
