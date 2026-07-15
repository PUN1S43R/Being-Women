import { useState, useEffect } from 'react';
import { wishlistApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from './Home';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Wishlist = () => {
  const { user } = useAuth();
  const { wishlistIds, refreshWishlist } = useWishlist();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, wishlistIds]);

  const fetchWishlist = async () => {
    try {
      const { data } = await wishlistApi.getAll();
      if (data) setWishlist(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-brand-pink-light dark:bg-brand-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-8 h-8 text-brand-pink animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-brand-brown dark:text-brand-pink-light font-serif mb-3">Please Login</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10 text-sm">Login to see your saved items and curation collection.</p>
        <Link 
          to="/account" 
          className="inline-block bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg transition-all active:scale-95 shadow-md shadow-brand-pink/10"
        >
          Login Now
        </Link>
      </div>
    );
  }

  const filteredWishlist = wishlist.filter(p => wishlistIds.has(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <span className="text-brand-pink text-xs font-bold uppercase tracking-widest">My Saved Items</span>
          <h1 className="text-4xl font-bold text-brand-brown dark:text-brand-pink-light font-serif mt-1">My Wishlist ({wishlistIds.size})</h1>
        </div>
        <Link 
          to="/products" 
          className="text-xs font-bold uppercase tracking-widest text-brand-pink border-b-2 border-brand-pink pb-1 hover:text-brand-pink-hover hover:border-brand-pink-hover transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : filteredWishlist.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredWishlist.map(product => (
            <div key={product.id}>
              <ProductCard product={product} onRemove={fetchWishlist} isWishlistPage={true} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[24px] p-8 border border-brand-pink/5 dark:border-neutral-800/40 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 bg-brand-pink-light dark:bg-brand-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-brand-pink" />
          </div>
          <h2 className="text-2xl font-bold text-brand-brown dark:text-brand-pink-light font-serif mb-2">Wishlist is Empty</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8 text-xs">Explore our exquisite collection and add your favorite ethnic pieces here.</p>
          <Link 
            to="/products" 
            className="inline-block bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:shadow-lg transition-all active:scale-95 shadow-md shadow-brand-pink/10"
          >
            Explore Collection
          </Link>
        </div>
      )}
    </div>
  );
};
