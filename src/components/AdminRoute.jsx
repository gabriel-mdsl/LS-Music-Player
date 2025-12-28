
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role !== 'admin') {
       toast({
         variant: "destructive",
         title: "Acesso Negado",
         description: "Você precisa de privilégios de administrador para acessar esta área.",
       });
    }
  }, [loading, user, role, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
           <p className="text-slate-400 text-sm">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  // Validação de Segurança Estrita
  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
