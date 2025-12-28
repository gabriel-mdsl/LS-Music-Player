
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Music, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const RegisterPage = () => {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up user with metadata
      const { data: signUpData, error: signUpError } = await signUp(
        formData.email, 
        formData.password, 
        {
          data: {
            username: formData.username,
          }
        }
      );

      if (signUpError) {
        setLoading(false);
        return;
      }

      // 2. Immediate Login attempt (relying on the auto-confirm trigger)
      // If the session is already established by signUp (depends on Supabase config), we use it.
      if (signUpData?.session) {
         toast({
          title: 'Bem-vindo!',
          description: `Conta criada com sucesso, ${formData.username}!`,
        });
        navigate('/');
        return;
      }

      // 3. Manual Sign In if no session returned immediately
      const { data: signInData, error: signInError } = await signIn(formData.email, formData.password);

      if (!signInError && signInData?.session) {
        toast({
          title: 'Bem-vindo!',
          description: `Conta criada com sucesso, ${formData.username}!`,
        });
        navigate('/');
      } else {
        // Fallback if something weird happens with auto-login
        toast({
          title: 'Conta Criada',
          description: 'Sua conta foi criada. Por favor, faça login.',
        });
        navigate('/login');
      }

    } catch (error) {
      console.error('Registration flow error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Helmet>
        <title>Registro - MusicHub</title>
        <meta name="description" content="Crie sua conta no MusicHub e comece a ouvir músicas agora" />
      </Helmet>

      <div className="w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="p-3 bg-slate-800 rounded-full ring-2 ring-indigo-500/20">
              <Music className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Criar Conta
              </h1>
              <p className="text-slate-400 text-sm mt-1">Junte-se ao MusicHub hoje</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Como devemos te chamar?"
                className="bg-slate-950/50 border-slate-800 focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="bg-slate-950/50 border-slate-800 focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-slate-950/50 border-slate-800 focus:border-indigo-500 transition-colors"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-slate-400 text-sm">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
