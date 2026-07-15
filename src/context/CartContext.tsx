import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productsApi } from '../lib/api';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  color: string;
  maxStock?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  syncCartPricesAndStock: () => Promise<void>;
}

export const getVariantStock = (product: any, size: string, color: string): number => {
  if (!product) return 0;
  if (!product.variant_stock || Object.keys(product.variant_stock).length === 0) {
    return product.stock_quantity || 0;
  }
  const s = size && size !== 'N/A' ? size.trim() : '';
  const c = color && color !== 'N/A' ? color.trim() : '';
  
  if (s && c) {
    const key = `${s}-${c}`;
    if (product.variant_stock.hasOwnProperty(key)) {
      return product.variant_stock[key] || 0;
    }
    // Try matching with trimmed keys in variant_stock to be extra safe
    const matchedKey = Object.keys(product.variant_stock).find(k => {
      const parts = k.split('-');
      if (parts.length === 2) {
        return parts[0].trim() === s && parts[1].trim() === c;
      }
      return false;
    });
    if (matchedKey !== undefined) {
      return product.variant_stock[matchedKey] || 0;
    }

    if (product.variant_stock.hasOwnProperty(s)) {
      return product.variant_stock[s] || 0;
    }
    if (product.variant_stock.hasOwnProperty(c)) {
      return product.variant_stock[c] || 0;
    }
  } else if (s) {
    if (product.variant_stock.hasOwnProperty(s)) {
      return product.variant_stock[s] || 0;
    }
    const matchedKey = Object.keys(product.variant_stock).find(k => k.trim() === s);
    if (matchedKey !== undefined) {
      return product.variant_stock[matchedKey] || 0;
    }
  } else if (c) {
    if (product.variant_stock.hasOwnProperty(c)) {
      return product.variant_stock[c] || 0;
    }
    const matchedKey = Object.keys(product.variant_stock).find(k => k.trim() === c);
    if (matchedKey !== undefined) {
      return product.variant_stock[matchedKey] || 0;
    }
  }
  return product.stock_quantity || 0;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const syncCartPricesAndStock = async () => {
    const savedCart = localStorage.getItem('being_women_cart');
    if (!savedCart) return;
    try {
      const currentCart: CartItem[] = JSON.parse(savedCart);
      if (currentCart.length === 0) return;

      const { data: latestProducts } = await productsApi.getAll();
      if (!latestProducts || latestProducts.length === 0) return;

      let changed = false;
      const updatedCart = currentCart.map(item => {
        const dbProduct = latestProducts.find((p: any) => String(p.id) === String(item.productId));
        if (dbProduct) {
          const latestPrice = dbProduct.discount_price;
          const latestMaxStock = getVariantStock(dbProduct, item.size, item.color);
          
          if (item.price !== latestPrice || item.maxStock !== latestMaxStock) {
            changed = true;
            return {
              ...item,
              price: latestPrice,
              maxStock: latestMaxStock,
              quantity: Math.min(item.quantity, latestMaxStock > 0 ? latestMaxStock : 1)
            };
          }
        }
        return item;
      });

      if (changed) {
        setCart(updatedCart);
        localStorage.setItem('being_women_cart', JSON.stringify(updatedCart));
      }
    } catch (error) {
      console.error('Error syncing cart prices:', error);
    }
  };

  useEffect(() => {
    const savedCart = localStorage.getItem('being_women_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
    }
    syncCartPricesAndStock();
  }, []);

  useEffect(() => {
    localStorage.setItem('being_women_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.size === item.size && i.color === item.color);
      const maxStock = item.maxStock !== undefined ? item.maxStock : 999;

      if (existing) {
        const newQuantity = existing.quantity + item.quantity;
        if (newQuantity > maxStock) {
          toast.error(`Cannot add more! Only ${maxStock} items available in stock.`);
          return prev.map(i => i === existing ? { ...i, quantity: maxStock, maxStock } : i);
        }
        return prev.map(i => i === existing ? { ...i, quantity: newQuantity, maxStock } : i);
      }

      if (item.quantity > maxStock) {
        toast.error(`Cannot add more! Only ${maxStock} items available in stock.`);
        return [...prev, { ...item, id: Math.random().toString(36).substr(2, 9), quantity: maxStock }];
      }

      return [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const maxStock = item.maxStock !== undefined ? item.maxStock : 999;
        if (quantity > maxStock) {
          toast.error(`Only ${maxStock} items available in stock.`);
          return { ...item, quantity: maxStock };
        }
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, syncCartPricesAndStock }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
