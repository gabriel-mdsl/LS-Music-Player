
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { MusicProvider } from '@/contexts/MusicContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MusicPlayer from '@/components/MusicPlayer';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import HomePage from '@/pages/HomePage';
import CategoryPage from '@/pages/CategoryPage';
import BandPage from '@/pages/BandPage';
import AlbumPage from '@/pages/AlbumPage';
import FavoritesPage from '@/pages/FavoritesPage';
import PlaylistsPage from '@/pages/PlaylistsPage';
import PlaylistDetailPage from '@/pages/PlaylistDetailPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import LyricsManager from '@/pages/admin/LyricsManager';

// Inner component to handle location-based logic
const MainLayout = () => {
  const location = useLocation();
  const isPlayerHiddenPage = ['/album/', '/playlist/', '/favorites'].some(path => location.pathname.startsWith(path));

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      <Header />
      {/* 
        If on a player-hidden page (Album/Playlist/Favorites), we remove the bottom padding 
        because the global footer player is hidden and we want full height for the split layout.
      */}
      <main className={`flex-1 flex flex-col min-h-0 ${isPlayerHiddenPage ? 'pb-0' : 'pb-24 overflow-y-auto'}`}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/band/:id" element={<BandPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          
          {/* Protected Routes */}
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/playlists" element={<ProtectedRoute><PlaylistsPage /></ProtectedRoute>} />
          <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistDetailPage /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/lyrics" element={<AdminRoute><LyricsManager /></AdminRoute>} />
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Footer component (links etc) - Hide on full-screen layout pages to avoid clutter/scroll */}
      {!isPlayerHiddenPage && <Footer />}
      
      <MusicPlayer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <MusicProvider>
          <Helmet>
            <title>MusicHub - Your Music Streaming Platform</title>
            <meta name="description" content="Stream your favorite music, create playlists, and discover new artists on MusicHub" />
          </Helmet>
          <MainLayout />
          <Toaster />
        </MusicProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
