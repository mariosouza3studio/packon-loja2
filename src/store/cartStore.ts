// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCart, addToCart, getCart, removeLinesFromCart, updateLinesInCart } from '@/lib/shopify';
import { ShopifyCart } from '@/lib/shopify/types';
import { toast } from 'sonner';

interface CartState {
  cart: ShopifyCart | null;
  isOpen: boolean;
  cartId: string | null;
  isLoading: boolean; // Estado global de carregamento para feedbacks sutis

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  addItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  
  // Inicialização robusta
  initCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isOpen: false,
      cartId: null,
      isLoading: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      initCart: async () => {
        const { cartId } = get();
        if (cartId) {
          const freshCart = await getCart(cartId);
          // Se o carrinho expirou na Shopify (retorna null), limpamos o local
          if (!freshCart) {
            set({ cart: null, cartId: null });
          } else {
            set({ cart: freshCart });
          }
        }
      },

      addItem: async (variantId: string, quantity: number) => {
        set({ isLoading: true, isOpen: true }); // Abre o carrinho imediatamente para feedback
        let { cartId } = get();
        let newCart: ShopifyCart | null = null;

        try {
          // 1. Garante que existe um carrinho
          if (!cartId) {
            newCart = await createCart();
            if (newCart) {
              cartId = newCart.id;
              set({ cartId, cart: newCart });
            } else {
              throw new Error("Falha ao criar carrinho.");
            }
          }

          // 2. Adiciona o item
          const updatedCart = await addToCart(cartId!, [{ merchandiseId: variantId, quantity }]);
          
          if (updatedCart) {
            set({ cart: updatedCart });
          } else {
            throw new Error("Erro ao atualizar carrinho.");
          }

        } catch (error) {
          console.error(error);
          toast.error("Não foi possível adicionar o produto. Tente novamente.");
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (lineId: string) => {
        const { cart, cartId } = get();
        if (!cart || !cartId) return;

        // --- OPTIMISTIC UI START ---
        // 1. Salva o estado anterior para Rollback
        const previousCart = JSON.parse(JSON.stringify(cart));

        // 2. Atualiza a UI Instantaneamente (Simulação Local)
        // Removemos a linha visualmente e ajustamos a quantidade total grosseiramente
        const lineToRemove = cart.lines.edges.find(edge => edge.node.id === lineId);
        const qtyToRemove = lineToRemove?.node.quantity || 0;

        const optimisticCart = {
          ...cart,
          totalQuantity: Math.max(0, cart.totalQuantity - qtyToRemove),
          lines: {
            ...cart.lines,
            edges: cart.lines.edges.filter((edge) => edge.node.id !== lineId)
          }
          // Nota: Não recalculamos o subtotal localmente pois é complexo lidar com moedas/cents sem biblioteca
          // O usuário aceita ver o subtotal antigo por 1s enquanto a API processa.
        };

        set({ cart: optimisticCart });
        // --- OPTIMISTIC UI END ---

        try {
          // 3. Executa a chamada real na API
          const updatedCart = await removeLinesFromCart(cartId, [lineId]);
          
          if (updatedCart) {
            // Sucesso: Sincroniza com o dado real do servidor (que traz preços certos)
            set({ cart: updatedCart });
          } else {
            throw new Error("API retornou vazio");
          }

        } catch (error) {
          console.error("Erro ao remover item:", error);
          // 4. Rollback em caso de erro
          set({ cart: previousCart });
          toast.error("Erro ao remover item. O carrinho foi restaurado.");
        }
      },
    }),
    {
      name: 'packon-cart-storage',
      partialize: (state) => ({ cartId: state.cartId }), // Persiste apenas o ID
    }
  )
);