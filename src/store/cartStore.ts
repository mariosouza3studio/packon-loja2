// src/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Importar createJSONStorage
import { createCart, addToCart, getCart, removeLinesFromCart, updateLinesInCart } from '@/lib/shopify';
import { ShopifyCart } from '@/lib/shopify/types';

interface CartState {
  cart: ShopifyCart | null;
  isOpen: boolean;
  cartId: string | null; // Novo estado para guardar só o ID
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  initCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isOpen: false,
      cartId: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      initCart: async () => {
        const { cartId } = get();
        
        if (cartId) {
          // Busca dados frescos da Shopify
          const freshCart = await getCart(cartId);
          if (freshCart) {
            set({ cart: freshCart });
            return;
          }
        }
        // Se não tem ID ou o ID expirou na Shopify, cria um novo
        const newCart = await createCart();
        if (newCart) {
            set({ cart: newCart, cartId: newCart.id });
        }
      },

      addItem: async (variantId: string, quantity: number) => {
        let { cartId } = get();
        let currentCart = get().cart;

        if (!cartId || !currentCart) {
          const newCart = await createCart();
          if (newCart) {
            cartId = newCart.id;
            set({ cart: newCart, cartId: newCart.id });
          } else {
             return; 
          }
        }

        set({ isOpen: true });
        // Otimistic Update (Opcional, mas arriscado em Headless, melhor esperar)
        const updatedCart = await addToCart(cartId, [{ merchandiseId: variantId, quantity }]);
        if (updatedCart) set({ cart: updatedCart });
      },

      removeItem: async (lineId: string) => {
        const { cartId } = get();
        if (!cartId) return;
        const updatedCart = await removeLinesFromCart(cartId, [lineId]);
        if (updatedCart) set({ cart: updatedCart });
      },

      updateQuantity: async (lineId: string, quantity: number) => {
        const { cartId } = get();
        if (!cartId) return;
        if (quantity <= 0) {
          const updatedCart = await removeLinesFromCart(cartId, [lineId]);
          if (updatedCart) set({ cart: updatedCart });
          return;
        }
        const updatedCart = await updateLinesInCart(cartId, [{ id: lineId, quantity }]);
        if (updatedCart) set({ cart: updatedCart });
      }
    }),
    {
      name: 'packon-cart-storage',
      // MÁGICA AQUI: Persistimos APENAS o cartId
      partialize: (state) => ({ cartId: state.cartId }),
    }
  )
);