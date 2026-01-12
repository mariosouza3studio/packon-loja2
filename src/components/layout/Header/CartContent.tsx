// src/components/layout/Header/CartContent.tsx
"use client";

import Image from "next/image";
import { Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import styles from "./cartContent.module.css";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/format";
import { CartLine } from "@/lib/shopify/types";

interface CartContentProps {
  onBack?: () => void;
}

export default function CartContent({ onBack }: CartContentProps) {
  const { cart, removeItem, isLoading } = useCartStore();

  if (!cart) return null;

  const lines = cart.lines?.edges || [];
  const subtotal = cart.cost?.subtotalAmount;

  // Handler simplificado (Store cuida do resto)
  const handleRemove = (lineId: string) => {
    removeItem(lineId);
  };

  // --- CABEÇALHO DO MOBILE (Botão Voltar) ---
  const mobileHeader = onBack && (
    <button onClick={onBack} className={styles.backButton}>
      <ArrowLeft size={20} />
      <span>Voltar para o menu</span>
    </button>
  );

  if (lines.length === 0) {
    return (
      <div className={styles.container}>
        {mobileHeader}
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
          <p>Seu carrinho está vazio.</p>
          <span className={styles.emptySubtitle}>Navegue pelo catálogo para adicionar itens.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {mobileHeader}

      <div className={styles.listContainer}>
        {lines.map(({ node }: { node: CartLine }) => { 
          const merchandise = node.merchandise;
          const product = merchandise.product;

          return (
            <div key={node.id} className={styles.row}>
              <div className={styles.imageCircle}>
                {product.images.edges[0] ? (
                   <Image 
                     src={product.images.edges[0].node.url} 
                     alt={product.title} 
                     width={50} 
                     height={50} 
                     className={styles.productImg}
                   />
                ) : (
                  <div className={styles.placeholderImg} />
                )}
              </div>
              
              <div className={styles.colName}>
                <span className={styles.productName}>{product.title}</span>
                {/* Mostra variante se existir e não for "Default Title" */}
                {merchandise.title !== "Default Title" && (
                   <span className={styles.variantName}>{merchandise.title}</span>
                )}
              </div>
              
              <div className={styles.stepper}>
                <span className={styles.stepValue}>{node.quantity} un.</span>
              </div>

              <div className={styles.colPrice}>
                <span>{formatPrice(merchandise.price.amount, merchandise.price.currencyCode)}</span>
              </div>
              
              <button 
                onClick={() => handleRemove(node.id)}
                className={styles.trashBtn}
                aria-label="Remover item"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.subtotalWrapper}>
          <span className={styles.subtotalLabel}>Subtotal: </span>
          <span className={styles.subtotalValue}>
            {subtotal ? formatPrice(subtotal.amount, subtotal.currencyCode) : 'Calculando...'}
          </span>
        </div>
        
        <a href={cart.checkoutUrl} className={styles.checkoutBtn}>
           {isLoading ? 'Atualizando...' : 'Finalizar compra'}
        </a>
      </div>
    </div>
  );
}