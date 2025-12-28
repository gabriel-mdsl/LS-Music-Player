import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Music, User, LogOut, Settings, Heart, ListMusic, ShieldCheck, Crown } from 'lucide-react';
const Header = () => {
  const {
    user,
    role,
    isPremium,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  return <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <Music className="h-8 w-8 text-indigo-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent hidden sm:inline-block">LS Music Player</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Início
            </Link>
            {user && <>
                <Link to="/favorites" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
                  Favoritos
                </Link>
                <Link to="/playlists" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
                  Playlists
                </Link>
              </>}
            
            {role === 'admin' && <Link to="/admin" className="text-sm font-bold text-indigo-400 transition-colors hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Painel Admin
              </Link>}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Premium Badge or Upgrade CTA */}
          {user && !isPremium && role !== 'admin' && <div className="hidden sm:block">
               <span className="text-xs text-slate-400 mr-2">Cansado de anúncios?</span>
               <Button variant="outline" size="sm" className="h-7 text-xs border-yellow-500/50 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10" onClick={() => alert("Entre em contato com o admin para fazer upgrade!")}>
                 <Crown className="w-3 h-3 mr-1" />
                 Seja Premium
               </Button>
             </div>}

          {user && isPremium && <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
               <Crown className="w-3 h-3 text-yellow-500" />
               <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide">Premium</span>
             </div>}

          {user ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-slate-800 hover:ring-slate-700 transition-all">
                  <User className="h-5 w-5 text-slate-300" />
                  <span className="sr-only">Menu do usuário</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <div className="flex items-center justify-start gap-2 p-2 border-b border-slate-800 mb-2">
                   <div className="flex flex-col space-y-1 leading-none">
                    {user.user_metadata?.username && <p className="font-medium">{user.user_metadata.username}</p>}
                    <p className="w-[200px] truncate text-xs text-slate-400">{user.email}</p>
                    <div className="flex gap-2 mt-1">
                      {role === 'admin' && <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Admin</span>}
                      {isPremium && <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Premium</span>}
                    </div>
                  </div>
                </div>
                
                {/* Mobile Menu Items */}
                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer md:hidden">
                   <Link to="/" className="w-full flex items-center"><Music className="w-4 h-4 mr-2" /> Início</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer md:hidden">
                   <Link to="/favorites" className="w-full flex items-center"><Heart className="w-4 h-4 mr-2" /> Favoritos</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer md:hidden">
                   <Link to="/playlists" className="w-full flex items-center"><ListMusic className="w-4 h-4 mr-2" /> Playlists</Link>
                </DropdownMenuItem>

                {role === 'admin' && <>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem asChild className="focus:bg-indigo-900/30 focus:text-indigo-300 cursor-pointer">
                      <Link to="/admin" className="w-full flex items-center text-indigo-400 font-medium">
                        <Settings className="w-4 h-4 mr-2" /> 
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  </>}

                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-950/30 cursor-pointer mt-1" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                  Criar Conta
                </Button>
              </Link>
            </div>}
        </div>
      </div>
    </header>;
};
export default Header;