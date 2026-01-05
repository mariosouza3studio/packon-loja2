// src/components/home/Popular/index.tsx
"use client";

import styles from "./popular.module.css";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatPrice } from "@/utils/format";
import TransitionLink from "@/components/ui/TransitionLink"; 
import { useCartStore } from "@/store/cartStore";
import { ShopifyProduct } from "@/lib/shopify/types"; // <--- IMPORTAÇÃO NOVA

// Removemos a interface manual antiga "ProductNode". 
// Agora usamos a oficial.

interface PopularProps {
  // O tipo é um Array de objetos que contém a propriedade "node" do tipo ShopifyProduct
  products: { node: ShopifyProduct }[];
}

export default function Popular({ products }: PopularProps) {
  const { addItem, openCart } = useCartStore();

  if (!products || products.length === 0) return null;

  const handleAddToCart = async (variantId: string) => {
    await addItem(variantId, 1);
    openCart();
  };

  return (
    <section className={styles.popularSection}>
      <ScrollReveal className={styles.header}>
        <h2 className={styles.title}>Produtos em destaque</h2>
      </ScrollReveal>

      <ScrollReveal className={styles.gridContainer} stagger={0.1}>
        {products.map(({ node: product }) => {
          const image = product.images.edges[0]?.node;
          const firstVariant = product.variants.edges[0]?.node;
          
          // LÓGICA DE PREÇO:
          // Usa o preço da primeira variante. Se não tiver variante (raro), usa o do range.
          const price = firstVariant?.price || product.priceRange.minVariantPrice;
          
          const isAvailable = firstVariant?.availableForSale;

          return (
            <div key={product.id} className={styles.card}>
              
              <TransitionLink 
                href={`/produtos/${product.handle}`} 
                className={styles.imageContainer}
              >
                 {image ? (
                    <img 
                      src={image.url} 
                      alt={image.altText || product.title} 
                      className={styles.productImg} 
                    />
                 ) : (
                    <div className={styles.productImg} style={{background: '#222', width: '100%', height: '100%'}} />
                 )}
              </TransitionLink>

              <div className={styles.info}>
                <h3 className={styles.productName}>{product.title}</h3>
                <p className={styles.price}>
                  {formatPrice(price.amount, price.currencyCode)}
                </p>
              </div>

              <button 
                className={styles.buyButton}
                onClick={() => firstVariant && handleAddToCart(firstVariant.id)}
                disabled={!isAvailable}
                style={{ opacity: isAvailable ? 1 : 0.5, cursor: isAvailable ? 'pointer' : 'not-allowed' }}
              >
                {isAvailable ? 'Adicionar ao carrinho' : 'Indisponível'}
              </button>
            </div>
          );
        })}
      </ScrollReveal>
    </section>
  );
}