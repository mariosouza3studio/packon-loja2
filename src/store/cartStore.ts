import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCart, addToCart, getCart, removeLinesFromCart, updateLinesInCart } from '@/lib/shopify';

interface CartState {
  cart: any;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>; // Nova função
  updateQuantity: (lineId: string, quantity: number) => Promise<void>; // Nova função
  initCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      initCart: async () => {
        const existingCartId = get().cart?.id;
        
        if (existingCartId) {
          const freshCart = await getCart(existingCartId);
          if (freshCart) {
            set({ cart: freshCart });
            return;
          }
        }
        
        const newCart = await createCart();
        set({ cart: newCart });
      },

      addItem: async (variantId: string, quantity: number) => {
        let cartId = get().cart?.id;

        if (!cartId) {
          const newCart = await createCart();
          cartId = newCart.id;
          set({ cart: newCart });
        }

        set({ isOpen: true });
        const updatedCart = await addToCart(cartId, [{ merchandiseId: variantId, quantity }]);
        set({ cart: updatedCart });
      },

      // --- NOVAS FUNÇÕES ---

      removeItem: async (lineId: string) => {
        const cartId = get().cart?.id;
        if (!cartId) return;

        const updatedCart = await removeLinesFromCart(cartId, [lineId]);
        set({ cart: updatedCart });
      },

      updateQuantity: async (lineId: string, quantity: number) => {
        const cartId = get().cart?.id;
        if (!cartId) return;

        // Se a quantidade for 0 ou menor, removemos o item
        if (quantity <= 0) {
          const updatedCart = await removeLinesFromCart(cartId, [lineId]);
          set({ cart: updatedCart });
          return;
        }

        const updatedCart = await updateLinesInCart(cartId, [{ id: lineId, quantity }]);
        set({ cart: updatedCart });
      }
    }),
    {
      name: 'packon-cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);