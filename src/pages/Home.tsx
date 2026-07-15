import React, { useState, useEffect } from 'react';
import { slidersApi, categoriesApi, productsApi, wishlistApi } from '../lib/api';
import { ChevronLeft, ChevronRight, Star, Heart, ShoppingBag, Trash2, X, Crown, Tag, Sparkles, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart, getVariantStock } from '../context/CartContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export const Home = () => {
// ...
// (keeping Home as is, just updating imports)
  const [sliders, setSliders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [under599Products, setUnder599Products] = useState<any[]>([]);
  const [currentSlider, setCurrentSlider] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, cRes, nRes, uRes] = await Promise.all([
          slidersApi.getAll(),
          categoriesApi.getAll(),
          productsApi.getAll({ is_new_arrival: 'true', limit: 8 }),
          productsApi.getAll({ is_under_599: 'true', limit: 8 })
        ]);
        
        if (sRes.data) setSliders(sRes.data);
        if (cRes.data) setCategories(cRes.data);
        if (nRes.data) setNewArrivals(nRes.data);
        if (uRes.data) setUnder599Products(uRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, []);

  const nextSlider = () => setCurrentSlider(prev => (prev + 1) % sliders.length);
  const prevSlider = () => setCurrentSlider(prev => (prev - 1 + sliders.length) % sliders.length);

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Slider */}
      <section className="relative h-[60vh] lg:h-[80vh] overflow-hidden bg-gray-100">
        {sliders.length > 0 ? (
          <>
            <div className="absolute inset-0">
              {sliders.map((slider, idx) => (
                <motion.div
                  key={slider.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: idx === currentSlider ? 1 : 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <Link 
                    to={slider.category_id ? `/products?category=${slider.category_id}` : '/products'}
                    className="block w-full h-full"
                  >
                    <picture>
                      <source media="(max-width: 768px)" srcSet={slider.mobile_banner} />
                      <img 
                        src={slider.desktop_banner} 
                        alt="Banner" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </picture>
                  </Link>
                  {/* Dim Background Overlay */}
                  <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                  {(() => {
                    const descPos = slider.desc_position || 'middle-center';
                    const btnPos = slider.button_position || 'middle-center';
                    const isSamePos = descPos === btnPos;

                    const posClasses: Record<string, string> = {
                      'top-left': 'items-start justify-start text-left p-12 md:p-16 lg:p-24',
                      'top-center': 'items-start justify-center text-center p-12 md:p-16 lg:p-24',
                      'top-right': 'items-start justify-end text-right p-12 md:p-16 lg:p-24',
                      'middle-left': 'items-center justify-start text-left p-12 md:p-16 lg:p-24',
                      'middle-center': 'items-center justify-center text-center p-12 md:p-16 lg:p-24',
                      'middle-right': 'items-center justify-end text-right p-12 md:p-16 lg:p-24',
                      'bottom-left': 'items-end justify-start text-left p-12 md:p-16 lg:p-24',
                      'bottom-center': 'items-end justify-center text-center p-12 md:p-16 lg:p-24',
                      'bottom-right': 'items-end justify-end text-right p-12 md:p-16 lg:p-24',
                    };

                    const renderDesc = () => {
                      const showDesc = (slider.show_description === 1 || slider.show_description === true || slider.show_description === '1' || (slider.show_description !== 0 && slider.show_description !== false && slider.description)) && slider.description;
                      if (!showDesc) return null;
                      return (
                        <motion.p 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: idx === currentSlider ? 0 : 20, opacity: idx === currentSlider ? 1 : 0 }}
                          style={{ color: slider.desc_color || '#ffffff' }}
                          className="text-lg lg:text-3xl font-bold font-serif mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                        >
                          {slider.description}
                        </motion.p>
                      );
                    };

                    const renderBtn = () => {
                      const showBtn = (slider.show_button === 1 || slider.show_button === true || slider.show_button === '1' || (slider.show_button !== 0 && slider.show_button !== false));
                      if (!showBtn) return null;
                      return (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: idx === currentSlider ? 0 : 20, opacity: idx === currentSlider ? 1 : 0 }}
                        >
                          <Link 
                            to={slider.category_id ? `/products?category=${slider.category_id}` : '/products'}
                            className="inline-block bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg transition-all active:scale-95 shadow-md shadow-brand-pink/20 pointer-events-auto"
                          >
                            {slider.button_text || 'Shop Now'}
                          </Link>
                        </motion.div>
                      );
                    };

                    if (isSamePos) {
                      return (
                        <div className={`absolute inset-0 flex ${posClasses[descPos] || posClasses['middle-center']} px-4 pointer-events-none`}>
                          <div className="max-w-3xl pointer-events-auto">
                            {renderDesc()}
                            {renderBtn()}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Separate Overlay for Description */}
                        <div className={`absolute inset-0 flex ${posClasses[descPos] || posClasses['middle-center']} px-4 pointer-events-none`}>
                          <div className="max-w-3xl pointer-events-auto">
                            {renderDesc()}
                          </div>
                        </div>

                        {/* Separate Overlay for Button */}
                        <div className={`absolute inset-0 flex ${posClasses[btnPos] || posClasses['middle-center']} px-4 pointer-events-none`}>
                          <div className="max-w-3xl pointer-events-auto">
                            {renderBtn()}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              ))}
            </div>
            <button onClick={prevSlider} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-10">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextSlider} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-10">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-pink-light">
            <p className="text-brand-pink font-bold uppercase tracking-widest font-serif text-lg">Being Women Collection</p>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold tracking-tight text-center text-brand-brown font-serif mb-2">Shop by Category</h2>
        <p className="text-neutral-500 text-xs text-center uppercase tracking-widest mb-8">Curated Elegant Styles</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-8">
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              to={`/products?category=${cat.id}`}
              className="group text-center block"
            >
              <div className="aspect-[3/4] overflow-hidden bg-brand-pink-light mb-4 rounded-[14px] shadow-xs group-hover:shadow-md transition-all border border-brand-pink/10">
                <img 
                  src={cat.image_url} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-neutral-700 group-hover:text-brand-pink transition-colors">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-brand-brown font-serif">New Arrivals</h2>
              <p className="text-neutral-500 text-xs uppercase tracking-widest mt-1">Our latest premium collection</p>
            </div>
            <Link to="/products" className="text-xs font-bold uppercase tracking-widest text-brand-pink border-b-2 border-brand-pink pb-1 hover:text-brand-pink-hover hover:border-brand-pink-hover transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {newArrivals.map(product => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Under 599 Section */}
      {under599Products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-brand-brown font-serif">Budget Store @599</h2>
              <p className="text-neutral-500 text-xs uppercase tracking-widest mt-1">Quality fashion at unbeatable prices</p>
            </div>
            <Link to="/products" className="text-xs font-bold uppercase tracking-widest text-brand-pink border-b-2 border-brand-pink pb-1 hover:text-brand-pink-hover hover:border-brand-pink-hover transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {under599Products.map(product => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Promo Section */}
      <section className="bg-gradient-to-br from-[#241815] to-brand-brown text-white py-20 px-4 rounded-[14px] max-w-7xl mx-auto shadow-xl border border-brand-brown/10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-brand-pink text-xs font-bold uppercase tracking-widest">Exquisite Designs</span>
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight font-serif mt-2 mb-6">Premium Collection</h2>
          <p className="text-neutral-300 max-w-2xl mx-auto mb-10 text-sm leading-relaxed">
            Experience the ultimate in premium women's wear, handcrafted designer sarees, and stylish ethnic outfits that honor your elegance.
          </p>
          <Link to="/products?tag=Premium" className="inline-block bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white px-12 py-4 font-bold rounded-full text-xs uppercase tracking-widest hover:shadow-lg transition-all transform hover:-translate-y-0.5 duration-200">
            Explore Premium
          </Link>
        </div>
      </section>
    </div>
  );
};

export const ProductCard = ({ product, onRemove, isWishlistPage }: { product: any, onRemove?: () => void, isWishlistPage?: boolean }) => {
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const isSizeAvailable = (size: string) => {
    if (!product.variant_stock || Object.keys(product.variant_stock).length === 0) {
      return product.stock_quantity > 0;
    }

    const activeColors = product.colors && product.colors.length > 0 ? product.colors : [];

    if (selectedColor && activeColors.includes(selectedColor)) {
      const key = `${size}-${selectedColor}`;
      if (product.variant_stock.hasOwnProperty(key)) {
        return (product.variant_stock[key] || 0) > 0;
      }
      if (product.variant_stock.hasOwnProperty(size)) {
        return (product.variant_stock[size] || 0) > 0;
      }
      return false;
    }

    if (activeColors.length > 0) {
      return activeColors.some((color: string) => {
        const key = `${size}-${color}`;
        if (product.variant_stock.hasOwnProperty(key)) {
          return (product.variant_stock[key] || 0) > 0;
        }
        return false;
      });
    }

    if (product.variant_stock.hasOwnProperty(size)) {
      return (product.variant_stock[size] || 0) > 0;
    }

    return false;
  };

  const isColorAvailable = (color: string) => {
    if (!product.variant_stock || Object.keys(product.variant_stock).length === 0) {
      return product.stock_quantity > 0;
    }

    const activeSizes = product.sizes && product.sizes.length > 0 ? product.sizes : [];

    if (selectedSize && activeSizes.includes(selectedSize)) {
      const key = `${selectedSize}-${color}`;
      if (product.variant_stock.hasOwnProperty(key)) {
        return (product.variant_stock[key] || 0) > 0;
      }
      if (product.variant_stock.hasOwnProperty(color)) {
        return (product.variant_stock[color] || 0) > 0;
      }
      return false;
    }

    if (activeSizes.length > 0) {
      return activeSizes.some((size: string) => {
        const key = `${size}-${color}`;
        if (product.variant_stock.hasOwnProperty(key)) {
          return (product.variant_stock[key] || 0) > 0;
        }
        return false;
      });
    }

    if (product.variant_stock.hasOwnProperty(color)) {
      return (product.variant_stock[color] || 0) > 0;
    }

    return false;
  };

  useEffect(() => {
    if (selectedSize && !isSizeAvailable(selectedSize)) {
      setSelectedSize('');
    }
  }, [selectedColor]);

  useEffect(() => {
    if (selectedColor && !isColorAvailable(selectedColor)) {
      setSelectedColor('');
    }
  }, [selectedSize]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    const wasWishlisted = isWishlisted;
    await toggleWishlist(product.id);
    if (onRemove && wasWishlisted) onRemove();
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;

    if (!hasSizes && !hasColors) {
      const maxStockVal = getVariantStock(product, 'N/A', 'N/A');
      addToCart({
        id: '', // Will be generated in context
        productId: product.id,
        name: product.name,
        price: product.discount_price,
        image: product.main_image,
        quantity: 1,
        size: 'N/A',
        color: 'N/A',
        maxStock: maxStockVal
      });
      toast.success('Added to cart!');
    } else {
      setIsModalOpen(true);
    }
  };

  const handleConfirmAddToCart = async () => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;

    if ((hasSizes && !selectedSize) || (hasColors && !selectedColor)) {
      toast.error('Please select required options');
      return;
    }

    const maxStockVal = getVariantStock(product, selectedSize || 'N/A', selectedColor || 'N/A');

    addToCart({
      id: '', // Will be generated in context
      productId: product.id,
      name: product.name,
      price: product.discount_price,
      image: product.main_image,
      quantity: 1,
      size: selectedSize || 'N/A',
      color: selectedColor || 'N/A',
      maxStock: maxStockVal
    });
    toast.success('Added to cart!');
    setIsModalOpen(false);
    setSelectedSize('');
    setSelectedColor('');
  };

  return (
    <div className="group relative bg-white dark:bg-neutral-900 p-3.5 rounded-[14px] shadow-xs hover:shadow-md border border-brand-pink/5 dark:border-neutral-800/40 hover:-translate-y-1 transition-all duration-300">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-brand-pink-light dark:bg-neutral-800/50 relative rounded-[14px]">
          <img 
            src={product.main_image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          {product.discount_price < product.original_price && (
            <div className="absolute top-3 left-3 bg-brand-pink text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
              {Math.round((1 - product.discount_price / product.original_price) * 100)}% OFF
            </div>
          )}
          {product.tag && (() => {
            const normalized = product.tag.toLowerCase().trim();
            let iconElement = <Sparkles className="w-3.5 h-3.5 text-white" />;
            let bgClass = 'bg-gradient-to-r from-pink-400 to-pink-500 shadow-pink-500/20';
            let label = product.tag;

            if (normalized === 'premium') {
              iconElement = <Crown className="w-3.5 h-3.5 text-white" />;
              bgClass = 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-500/20';
              label = 'Premium Collection';
            } else if (normalized === '@599' || normalized.includes('599')) {
              iconElement = <Tag className="w-3.5 h-3.5 text-white" />;
              bgClass = 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-emerald-500/20';
              label = 'Deal under ₹599';
            } else if (normalized === 'new arrival' || normalized.includes('new')) {
              iconElement = <Sparkles className="w-3.5 h-3.5 text-white" />;
              bgClass = 'bg-gradient-to-r from-[#D94F7A] to-pink-500 shadow-pink-500/20';
              label = 'New Arrival';
            } else if (normalized === 'best seller' || normalized.includes('best') || normalized.includes('seller')) {
              iconElement = <Flame className="w-3.5 h-3.5 text-white" />;
              bgClass = 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-500/20';
              label = 'Best Seller';
            }

            return (
              <div 
                title={label}
                className={`absolute top-3 right-3 p-1.5 rounded-full text-white shadow-md hover:scale-110 transition-transform duration-200 cursor-pointer ${bgClass}`}
              >
                {iconElement}
              </div>
            );
          })()}
          
          {/* Quick Add Overlay */}
          <div className={`absolute inset-x-0 bottom-0 p-3 transition-transform bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs ${isWishlistPage ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
            <button 
              onClick={handleQuickAdd}
              className="w-full bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm hover:shadow transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 line-clamp-1 group-hover:text-brand-pink transition-colors">{product.name}</h3>
            <button 
              onClick={handleToggle}
              className={`p-1 transition-colors ${isWishlisted ? 'text-brand-pink' : 'text-neutral-400 dark:text-neutral-500 hover:text-brand-pink'}`}
            >
              {isWishlistPage ? (
                <Trash2 className="w-4 h-4 text-neutral-400 dark:text-neutral-500 hover:text-brand-pink transition-colors" />
              ) : (
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-brand-pink' : ''}`} />
              )}
            </button>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">₹{product.discount_price}</span>
            {product.discount_price < product.original_price && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">₹{product.original_price}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              {product.avg_rating ? product.avg_rating.toFixed(1) : '0.0'} ({product.review_count || 0})
            </span>
          </div>

          {/* Sizes and Colors indicator */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-brand-pink/5 dark:border-neutral-800/40">
            {product.sizes && product.sizes.length > 0 ? (
              <div className="flex gap-1 overflow-hidden max-w-[60%]">
                {product.sizes.slice(0, 3).map((size: string) => (
                  <span key={size} className="text-[8px] font-bold px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-sm">
                    {size}
                  </span>
                ))}
                {product.sizes.length > 3 && <span className="text-[8px] font-bold text-neutral-400">+</span>}
              </div>
            ) : (
              <span className="text-[8px] font-bold text-gray-400/80 italic">No Sizes</span>
            )}

            {product.colors && product.colors.length > 0 ? (
              <div className="flex -space-x-1 items-center">
                {product.colors.slice(0, 3).map((color: string) => {
                  const hexMap: Record<string, string> = {
                    'black': '#000000', 'white': '#ffffff', 'red': '#ef4444', 'pink': '#ec4899', 'blue': '#3b82f6', 'green': '#10b981',
                    'yellow': '#f59e0b', 'orange': '#f97316', 'purple': '#8b5cf6', 'gray': '#6b7280', 'grey': '#6b7280', 'brown': '#78350f',
                    'beige': '#f5f5dc', 'cream': '#fffdd0', 'gold': '#d4af37', 'silver': '#c0c0c0', 'maroon': '#800000', 'navy': '#000080'
                  };
                  const colorLower = color.toLowerCase();
                  const isHex = colorLower.startsWith('#');
                  const bgColor = isHex ? color : (hexMap[colorLower] || null);

                  return bgColor ? (
                    <span 
                      key={color} 
                      className="w-2.5 h-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-2xs" 
                      style={{ backgroundColor: bgColor }}
                      title={color}
                    />
                  ) : (
                    <span key={color} className="text-[7px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-1 rounded-sm" title={color}>
                      {color}
                    </span>
                  );
                })}
                {product.colors.length > 3 && <span className="text-[7px] font-black text-neutral-400 dark:text-neutral-500 ml-1">+</span>}
              </div>
            ) : (
              <span className="text-[8px] font-bold text-gray-400/80 italic">No Colors</span>
            )}
          </div>
        </div>
      </Link>

      {/* Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 bg-white z-[110] rounded-t-3xl p-8 lg:max-w-md lg:mx-auto lg:rounded-3xl lg:bottom-1/2 lg:translate-y-1/2"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase tracking-widest">Select Options</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-8">
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400">Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {(product.sizes || []).map((size: string) => {
                        const available = isSizeAvailable(size);
                        return (
                          <button
                            key={size}
                            disabled={!available}
                            onClick={() => setSelectedSize(size)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-xs transition-all relative overflow-hidden ${
                              !available 
                                ? 'border-neutral-200 bg-neutral-100/50 text-neutral-400 cursor-not-allowed opacity-50' 
                                : selectedSize === size 
                                  ? 'border-brand-pink bg-brand-pink text-white shadow-md' 
                                  : 'border-neutral-100 text-neutral-700 hover:border-brand-pink hover:bg-brand-pink-light'
                            }`}
                          >
                            <span>{size}</span>
                            {!available && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[140%] h-[1.5px] bg-neutral-400 rotate-45 transform" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400">Color</h3>
                    <div className="flex flex-wrap gap-2">
                      {(product.colors || []).map((color: string) => {
                        const available = isColorAvailable(color);
                        return (
                          <button
                            key={color}
                            disabled={!available}
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2 rounded-full border-2 font-bold text-xs transition-all relative overflow-hidden ${
                              !available 
                                ? 'border-neutral-200 bg-neutral-100/50 text-neutral-400 cursor-not-allowed opacity-50' 
                                : selectedColor === color 
                                  ? 'border-brand-pink bg-brand-pink text-white shadow-md' 
                                  : 'border-neutral-100 text-neutral-700 hover:border-brand-pink hover:bg-brand-pink-light'
                            }`}
                          >
                            <span>{color}</span>
                            {!available && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[110%] h-[1.5px] bg-neutral-400 rotate-12 transform" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleConfirmAddToCart}
                  disabled={
                    ((product.sizes && product.sizes.length > 0) && !selectedSize) ||
                    ((product.colors && product.colors.length > 0) && !selectedColor)
                  }
                  className="w-full bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white py-4 rounded-[14px] font-bold uppercase tracking-widest disabled:opacity-50 text-xs shadow-md hover:shadow-lg transition-all"
                >
                  Confirm & Add to Cart
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
