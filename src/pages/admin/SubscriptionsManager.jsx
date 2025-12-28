
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Calendar, CreditCard, Search, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const SubscriptionsManager = () => {
  const { toast } = useToast();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form for manually adding/editing time
  const [daysToAdd, setDaysToAdd] = useState(30);

  const fetchSubs = async () => {
    try {
      // Need a join here to get user emails. 
      // Supabase-js syntax for foreign table join:
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          users:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to flatten the user email structure slightly for easier usage
      const formatted = data?.map(s => ({
        ...s,
        email: s.users?.email || 'Unknown User'
      })) || [];

      setSubs(formatted);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar assinaturas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleAddDays = async () => {
    if (!selectedSub) return;
    setActionLoading(true);

    try {
      const currentEnd = selectedSub.ends_at ? new Date(selectedSub.ends_at) : new Date();
      // If expired, start from now. If active, add to existing end date.
      const baseDate = currentEnd < new Date() ? new Date() : currentEnd;
      
      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + parseInt(daysToAdd));

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          ends_at: newEndDate.toISOString(),
          status: 'active'
        })
        .eq('id', selectedSub.id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Assinatura estendida.' });
      setIsDialogOpen(false);
      fetchSubs();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (sub) => {
    if (!window.confirm('Cancelar assinatura imediatamente?')) return;
    
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled', ends_at: new Date().toISOString() })
        .eq('id', sub.id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Assinatura cancelada.' });
      fetchSubs();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const filteredSubs = subs.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.includes(searchTerm)
  );

  const openManageDialog = (sub) => {
    setSelectedSub(sub);
    setDaysToAdd(30);
    setIsDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Assinaturas Premium</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie os planos dos usuários</p>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar por email ou ID..." 
            className="pl-10 bg-slate-900 border-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-950/40 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-slate-400 border-b border-slate-800 bg-slate-900/50">
          <div className="col-span-5">Usuário</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3 text-center">Vence em</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        
        {filteredSubs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma assinatura encontrada.</div>
        ) : (
          filteredSubs.map((sub) => {
            const isExpired = new Date(sub.ends_at) < new Date();
            const isActive = sub.status === 'active' && !isExpired;

            return (
              <div key={sub.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-slate-800/50 last:border-0 hover:bg-slate-900/30">
                <div className="col-span-5 flex items-center gap-3 overflow-hidden">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-800 text-slate-500'}`}>
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 truncate font-medium">{sub.email}</p>
                    <p className="text-xs text-slate-500 font-mono">{sub.plan_type}</p>
                  </div>
                </div>
                
                <div className="col-span-2 flex justify-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="col-span-3 text-center text-sm text-slate-400">
                  {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'Nunca'}
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openManageDialog(sub)} className="text-indigo-400 hover:text-indigo-300">
                    <CreditCard className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Gerenciar Assinatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="bg-slate-950 p-4 rounded border border-slate-800 mb-4">
               <p className="text-sm text-slate-400">Usuário: <span className="text-white">{selectedSub?.email}</span></p>
               <p className="text-sm text-slate-400">Vencimento Atual: <span className="text-white">{selectedSub?.ends_at ? new Date(selectedSub.ends_at).toLocaleDateString() : 'N/A'}</span></p>
             </div>

             <div className="space-y-2">
               <Label>Adicionar dias de Premium</Label>
               <div className="flex gap-2">
                 <Input 
                    type="number" 
                    value={daysToAdd} 
                    onChange={(e) => setDaysToAdd(e.target.value)} 
                    className="flex-1"
                  />
                 <Button onClick={handleAddDays} disabled={actionLoading} className="bg-indigo-600">
                   {actionLoading ? <Loader2 className="animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                   Adicionar
                 </Button>
               </div>
             </div>

             <div className="border-t border-slate-800 pt-4 mt-4">
               <Button variant="destructive" className="w-full" onClick={() => { setIsDialogOpen(false); handleCancel(selectedSub); }}>
                 Cancelar Assinatura Agora
               </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Simple helper icon for the button above
const Plus = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

export default SubscriptionsManager;
