
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdBanner = ({ position = 'footer', className = '' }) => {
  const { isPremium, loading: authLoading } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      // Don't fetch if user is premium or auth is loading
      if (isPremium || authLoading) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('active', true)
          .eq('position', position)
          // Random ordering isn't natively supported easily in supabase-js without RPC, 
          // so we'll fetch a few and pick one on client or use a simple query
          .limit(10); 

        if (error) throw error;

        if (data && data.length > 0) {
          // Pick a random ad from the fetched list
          const randomAd = data[Math.floor(Math.random() * data.length)];
          setAd(randomAd);
        }
      } catch (error) {
        console.error('Error fetching ad:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [isPremium, authLoading, position]);

  // If premium, loading, or no ad found, return null
  if (isPremium || loading || !ad) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`w-full overflow-hidden ${className}`}
      >
        <div className="relative group rounded-lg overflow-hidden border border-slate-800 shadow-lg bg-slate-900">
          <a 
            href={ad.link_url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block relative"
          >
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-xs text-white px-2 py-0.5 rounded border border-white/10 z-10">
              Patrocinado
            </div>
            
            <img 
              src={ad.image_url} 
              alt={ad.title} 
              className="w-full h-32 sm:h-40 md:h-48 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg truncate pr-4">{ad.title}</h3>
                <div className="bg-indigo-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-300">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdBanner;
