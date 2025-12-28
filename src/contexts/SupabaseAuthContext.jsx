
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null); // 'admin' or 'user'
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  // Busca o role diretamente no banco de dados
  const fetchUserRole = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle(); 
      
      if (error) {
        console.error('[Auth] Erro ao buscar role:', error);
        return 'user'; 
      }

      return data?.role || 'user';
    } catch (err) {
      console.error('[Auth] Erro inesperado em fetchUserRole:', err);
      return 'user';
    }
  }, []);

  const checkPremiumStatus = useCallback(async (userId) => {
    try {
      // We can use the RPC function or query the table directly
      // Querying table allows us to get details if needed later
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('status, ends_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('ends_at', new Date().toISOString())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Error checking premium:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('[Auth] Unexpected error checking premium:', error);
      return false;
    }
  }, []);

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const [userRole, premiumStatus] = await Promise.all([
        fetchUserRole(currentUser.id),
        checkPremiumStatus(currentUser.id)
      ]);
      setRole(userRole);
      setIsPremium(premiumStatus);
    } else {
      setRole(null);
      setIsPremium(false);
    }

    setLoading(false);
  }, [fetchUserRole, checkPremiumStatus]);

  useEffect(() => {
    // Inicialização
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
    };

    initAuth();

    // Listener de mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
           setRole(null);
           setIsPremium(false);
           setUser(null);
           setSession(null);
           setLoading(false);
        } else {
           await handleSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro no Cadastro",
        description: error.message || "Ocorreu um erro ao criar a conta.",
      });
    } else if (data.user && !data.session) {
       toast({
        title: "Verifique seu email",
        description: "Enviamos um link de confirmação para o seu email.",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true); 
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
       if (error.message.includes("Email not confirmed")) {
        toast({
          variant: "destructive",
          title: "Email não confirmado",
          description: "Por favor, verifique sua caixa de entrada.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro no Login",
          description: "Credenciais inválidas ou erro no servidor.",
        });
      }
    }
    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Sair",
        description: error.message,
      });
    }
    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    role,
    isPremium,
    loading,
    signUp,
    signIn,
    signOut,
    refreshSession: () => session && handleSession(session), // Helper to manually refresh status
  }), [user, session, role, isPremium, loading, signUp, signIn, signOut, handleSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
