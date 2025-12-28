
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AdsManager = () => {
  const { toast } = useToast();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({ title: '', link_url: '', image_url: '', position: 'footer', active: true });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar anúncios." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `ad-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError, data } = await supabase.storage.from('ads').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('ads').getPublicUrl(data.path);
      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: 'Sucesso', description: 'Imagem enviada.' });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no upload", description: error.message });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAd) {
        const { error } = await supabase.from('ads').update(formData).eq('id', editingAd.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Anúncio atualizado' });
      } else {
        const { error } = await supabase.from('ads').insert(formData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Anúncio criado' });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchAds();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deletar anúncio?')) return;
    try {
      const { error } = await supabase.from('ads').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Anúncio deletado' });
      fetchAds();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const toggleActive = async (ad) => {
    try {
      const { error } = await supabase.from('ads').update({ active: !ad.active }).eq('id', ad.id);
      if (error) throw error;
      
      setAds(ads.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
      toast({ title: 'Sucesso', description: `Anúncio ${!ad.active ? 'ativado' : 'desativado'}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const resetForm = () => {
    setEditingAd(null);
    setFormData({ title: '', link_url: '', image_url: '', position: 'footer', active: true });
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (ad) => {
    setEditingAd(ad);
    setFormData({ 
      title: ad.title, 
      link_url: ad.link_url || '', 
      image_url: ad.image_url, 
      position: ad.position || 'footer', 
      active: ad.active 
    });
    setIsDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciamento de Anúncios</h2>
          <p className="text-slate-400 text-sm mt-1">Controle os banners publicitários</p>
        </div>
        <Button onClick={openNewDialog} className="bg-indigo-600 hover:bg-indigo-500">
          <Plus className="w-4 h-4 mr-2" />Novo Anúncio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">Nenhum anúncio encontrado.</div>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className={`relative rounded-lg border bg-slate-900 overflow-hidden group transition-all ${ad.active ? 'border-slate-700' : 'border-red-900/50 opacity-70'}`}>
              <div className="aspect-[21/9] bg-slate-950 relative">
                {ad.image_url ? (
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon className="w-12 h-12" /></div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                   <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${ad.active ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                     {ad.active ? 'Ativo' : 'Inativo'}
                   </span>
                </div>
                <div className="absolute bottom-2 left-2">
                   <span className="text-[10px] px-2 py-0.5 rounded bg-black/70 text-white uppercase font-bold tracking-wider border border-white/10">
                     {ad.position}
                   </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-white truncate mb-1">{ad.title}</h3>
                <p className="text-xs text-slate-400 truncate mb-4">{ad.link_url || 'Sem link'}</p>
                
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(ad)} title={ad.active ? "Desativar" : "Ativar"}>
                    {ad.active ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(ad)}>
                    <Edit className="w-4 h-4 text-indigo-400" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(ad.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader><DialogTitle>{editingAd ? 'Editar' : 'Novo'} Anúncio</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            
            <div className="space-y-2">
              <Label>Link de Destino</Label>
              <Input value={formData.link_url} onChange={(e) => setFormData({...formData, link_url: e.target.value})} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label>Posição</Label>
              <select 
                className="w-full h-10 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              >
                <option value="footer">Rodapé (Todas as páginas)</option>
                <option value="feed">Feed (Entre listas)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Imagem do Banner</Label>
              <Input type="file" onChange={handleUploadImage} accept="image/*" disabled={uploadingImage} />
              {formData.image_url && <img src={formData.image_url} alt="Preview" className="mt-2 h-20 rounded border border-slate-700 object-cover" />}
            </div>

            <Button type="submit" className="w-full bg-indigo-600" disabled={uploadingImage}>
              {uploadingImage ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdsManager;
