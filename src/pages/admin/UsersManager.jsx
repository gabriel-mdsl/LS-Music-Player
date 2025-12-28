
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Shield, ShieldAlert, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UsersManager = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // State for confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      // Call the RPC function we created in database migration
      const { data, error } = await supabase.rpc('get_all_users_with_profiles');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ 
        variant: "destructive", 
        title: "Erro", 
        description: "Falha ao carregar lista de usuários." 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const initiateRoleChange = (user) => {
    if (user.id === currentUser.id) {
      toast({
        variant: "destructive",
        title: "Ação não permitida",
        description: "Você não pode alterar seu próprio nível de acesso."
      });
      return;
    }
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;

    const newRole = selectedUser.role === 'admin' ? 'user' : 'admin';
    setActionLoading(selectedUser.id);
    setDialogOpen(false); // Close dialog immediately

    try {
      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('user_id', selectedUser.id)
        .single();

      let error;
      
      if (existingProfile) {
        // Update existing
        const { error: updateError } = await supabase
          .from('users_profiles')
          .update({ role: newRole })
          .eq('user_id', selectedUser.id);
        error = updateError;
      } else {
        // Create new (rare case if trigger failed)
        const { error: insertError } = await supabase
          .from('users_profiles')
          .insert({ user_id: selectedUser.id, role: newRole });
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${selectedUser.email} agora é ${newRole === 'admin' ? 'Administrador' : 'Usuário Comum'}.`
      });

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));

    } catch (err) {
      console.error('Error updating role:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar permissões do usuário."
      });
    } finally {
      setActionLoading(null);
      setSelectedUser(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie permissões e acessos</p>
        </div>
      </div>

      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
            <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="rounded-md border border-slate-800 bg-slate-950/40">
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-slate-400 border-b border-slate-800">
              <div className="col-span-6 sm:col-span-5">Usuário / Email</div>
              <div className="col-span-3 sm:col-span-3 text-center">Status</div>
              <div className="col-span-3 sm:col-span-2 text-center">Data Cadastro</div>
              <div className="col-span-12 sm:col-span-2 text-right">Ações</div>
            </div>
            
            {users.map((userItem) => (
              <div key={userItem.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-slate-800/50 last:border-0 hover:bg-slate-900/30 transition-colors">
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 overflow-hidden">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${userItem.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                    {userItem.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>
                  <span className="text-slate-200 truncate" title={userItem.email}>{userItem.email}</span>
                </div>
                
                <div className="col-span-3 sm:col-span-3 flex justify-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userItem.role === 'admin' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {userItem.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </div>

                <div className="col-span-3 sm:col-span-2 text-center text-xs text-slate-500">
                  {new Date(userItem.created_at).toLocaleDateString()}
                </div>

                <div className="col-span-12 sm:col-span-2 flex justify-end">
                   {userItem.id !== currentUser?.id && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => initiateRoleChange(userItem)}
                      disabled={actionLoading === userItem.id}
                      className={`
                        h-8 text-xs
                        ${userItem.role === 'admin' 
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-950/20' 
                          : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20'}
                      `}
                    >
                      {actionLoading === userItem.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        userItem.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'
                      )}
                    </Button>
                   )}
                   {userItem.id === currentUser?.id && (
                     <span className="text-xs text-slate-600 italic px-2">Você</span>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              Confirmar Alteração de Permissão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {selectedUser?.role === 'admin' ? (
                <>
                  Você está prestes a remover os privilégios de administrador de <span className="text-white font-semibold">{selectedUser?.email}</span>. 
                  Eles perderão acesso a este painel imediatamente.
                </>
              ) : (
                <>
                  Você está prestes a tornar <span className="text-white font-semibold">{selectedUser?.email}</span> um administrador. 
                  Isso dará a eles controle total sobre o conteúdo da plataforma.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRoleChange}
              className={selectedUser?.role === 'admin' ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManager;
