import React from 'react';
import { Music, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AdBanner from '@/components/AdBanner';
const Footer = () => {
  const {
    user
  } = useAuth();
  return <footer className="bg-slate-900/80 backdrop-blur-md border-t border-slate-800 mt-auto">
      {/* Ad Banner Section in Footer */}
      <div className="container mx-auto px-4 pt-8">
        <AdBanner position="footer" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-indigo-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">LS Music Player</span>
            </div>
            <p className="text-slate-400 text-sm">
              Sua plataforma de streaming de música. Ouça, crie playlists e descubra novos artistas.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-lg font-semibold text-white">Links Rápidos</span>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">
                Início
              </Link>
              {user && <>
                  <Link to="/favorites" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Favoritos
                  </Link>
                  <Link to="/playlists" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Minhas Playlists
                  </Link>
                </>}
            </nav>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-lg font-semibold text-white">Redes Sociais</span>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} MusicHub. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;