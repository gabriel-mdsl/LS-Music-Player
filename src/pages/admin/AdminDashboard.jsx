
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  LayoutDashboard, 
  Library, 
  Mic2, 
  Disc, 
  Music2, 
  Settings,
  Users,
  Megaphone,
  Crown
} from 'lucide-react';
import CategoriesManager from './CategoriesManager';
import BandsManager from './BandsManager';
import AlbumsManager from './AlbumsManager';
import SongsManager from './SongsManager';
import UsersManager from './UsersManager';
import AdsManager from './AdsManager';
import SubscriptionsManager from './SubscriptionsManager';

const AdminDashboard = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.includes(path) 
      ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500" 
      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200";
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Helmet>
        <title>Admin Dashboard - MusicHub</title>
      </Helmet>
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden md:block">
        <div className="p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-500" />
            Painel Admin
          </h2>
        </div>
        
        <nav className="space-y-1 px-3">
          <Link 
            to="/admin/categories" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all ${isActive('categories')}`}
          >
            <Library className="w-4 h-4" />
            Categorias
          </Link>
          
          <Link 
            to="/admin/bands" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all ${isActive('bands')}`}
          >
            <Mic2 className="w-4 h-4" />
            Bandas
          </Link>
          
          <Link 
            to="/admin/albums" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all ${isActive('albums')}`}
          >
            <Disc className="w-4 h-4" />
            Álbuns
          </Link>
          
          <Link 
            to="/admin/songs" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all ${isActive('songs')}`}
          >
            <Music2 className="w-4 h-4" />
            Músicas
          </Link>

          <div className="pt-4 mt-4 border-t border-slate-800/50">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Comercial</p>
            <Link 
              to="/admin/ads" 
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all ${isActive('ads')}`}
            >
              <Megaphone className="w-4 h-4" />
              Anúncios
            </Link>
             <Link 
              to="/admin/subscriptions" 
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all ${isActive('subscriptions')}`}
            >
              <Crown className="w-4 h-4" />
              Assinaturas
            </Link>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/50">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sistema</p>
            <Link 
              to="/admin/users" 
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all ${isActive('users')}`}
            >
              <Users className="w-4 h-4" />
              Usuários
            </Link>
            <Link 
              to="/admin/settings" 
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all ${isActive('settings')}`}
            >
              <Settings className="w-4 h-4" />
              Configurações
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-900 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-white">Bem-vindo ao Painel</h1>
              <p className="text-slate-400">Selecione uma opção no menu lateral para gerenciar o conteúdo.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <DashboardCard 
                  title="Categorias" 
                  icon={<Library className="w-6 h-6 text-indigo-400" />}
                  link="/admin/categories"
                  color="bg-indigo-500/10"
                />
                <DashboardCard 
                  title="Bandas" 
                  icon={<Mic2 className="w-6 h-6 text-pink-400" />}
                  link="/admin/bands"
                  color="bg-pink-500/10"
                />
                <DashboardCard 
                  title="Álbuns" 
                  icon={<Disc className="w-6 h-6 text-purple-400" />}
                  link="/admin/albums"
                  color="bg-purple-500/10"
                />
                <DashboardCard 
                  title="Músicas" 
                  icon={<Music2 className="w-6 h-6 text-cyan-400" />}
                  link="/admin/songs"
                  color="bg-cyan-500/10"
                />
                 <DashboardCard 
                  title="Anúncios" 
                  icon={<Megaphone className="w-6 h-6 text-orange-400" />}
                  link="/admin/ads"
                  color="bg-orange-500/10"
                />
                <DashboardCard 
                  title="Assinantes" 
                  icon={<Crown className="w-6 h-6 text-yellow-400" />}
                  link="/admin/subscriptions"
                  color="bg-yellow-500/10"
                />
                <DashboardCard 
                  title="Usuários" 
                  icon={<Users className="w-6 h-6 text-emerald-400" />}
                  link="/admin/users"
                  color="bg-emerald-500/10"
                />
              </div>
            </div>
          } />
          
          <Route path="categories" element={<CategoriesManager />} />
          <Route path="bands" element={<BandsManager />} />
          <Route path="albums" element={<AlbumsManager />} />
          <Route path="songs" element={<SongsManager />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="ads" element={<AdsManager />} />
          <Route path="subscriptions" element={<SubscriptionsManager />} />
          <Route path="settings" element={<div className="text-white">Configurações (Em breve)</div>} />
        </Routes>
      </main>
    </div>
  );
};

const DashboardCard = ({ title, icon, link, color }) => (
  <Link to={link} className="block group">
    <div className={`p-6 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 transition-all ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {icon}
      </div>
      <p className="text-sm text-slate-400 group-hover:text-indigo-400 transition-colors">
        Gerenciar {title} &rarr;
      </p>
    </div>
  </Link>
);

export default AdminDashboard;
