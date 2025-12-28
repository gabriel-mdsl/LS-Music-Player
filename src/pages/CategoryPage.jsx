
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      const { data: bandsData } = await supabase
        .from('bands')
        .select('*')
        .eq('category_id', id)
        .order('name');

      if (categoryData) setCategory(categoryData);
      if (bandsData) setBands(bandsData);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-slate-400 text-center">Categoria não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{category.name} - MusicHub</title>
        <meta name="description" content={`Explore bandas de ${category.name} no MusicHub`} />
      </Helmet>

      <Link to="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-slate-400">{category.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {bands.map((band, index) => (
          <motion.div
            key={band.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link to={`/band/${band.id}`}>
              <div className="group relative overflow-hidden rounded-lg bg-slate-800/50 border border-slate-700 hover:border-indigo-500 transition-all duration-300">
                <div className="aspect-square relative">
                  {band.cover_url ? (
                    <img
                      src={band.cover_url}
                      alt={band.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                      <span className="text-6xl text-slate-600">🎸</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {band.name}
                  </h3>
                  {band.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                      {band.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {bands.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">Nenhuma banda disponível nesta categoria.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
