"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, ArrowLeft } from "lucide-react"; // Removidos Plus e Minus
import styles from "./cartContent.module.css";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/format";

interface CartContentProps {
  onBack?: () => void;
}

export default function CartContent({ onBack }: CartContentProps) {
  const { cart, removeItem } = useCartStore(); // Removido updateQuantity
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  if (!cart) return null;

  const lines = cart.lines?.edges || [];
  const subtotal = cart.cost?.subtotalAmount;

  const handleRemove = async (lineId: string) => {
    setIsUpdating(lineId);
    await removeItem(lineId);
    setIsUpdating(null);
  };

  // REMOVIDA A FUNÇÃO handleUpdateQty

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
          <p>Seu carrinho está vazio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {mobileHeader}

      <div className={styles.listContainer}>
        {lines.map(({ node }: any) => {
          const merchandise = node.merchandise;
          const product = merchandise.product;
          const isLoading = isUpdating === node.id;



          return (
            <div key={node.id} className={styles.row} style={{ opacity: isLoading ? 0.5 : 1 }}>
              <div className={styles.imageCircle}>
                {product.images.edges[0] ? (
                   <Image 
                     src={product.images.edges[0].node.url} 
                     alt={product.title} 
                     width={40} 
                     height={40} 
                     className={styles.productImg}
                   />
                ) : (
                  <div className={styles.placeholderImg} />
                )}
              </div>
              
              <div className={styles.colName}>
                <span className={styles.productName}>{product.title}</span>
              </div>
              
              {/* Mantido colInfo para alinhamento */}


              {/* MANTIDO O STEPPER VISUALMENTE PARA PRESERVAR O LAYOUT 
                  Mas agora ele é apenas um display estático
              */}
              <div className={styles.stepper}>
                <span className={styles.stepValue}>{node.quantity} item(s)</span>
              </div>

              <div className={styles.colPrice}>
                <span>Valor: {formatPrice(merchandise.price.amount, merchandise.price.currencyCode)}</span>
              </div>
              
              <button 
                onClick={() => handleRemove(node.id)}
                disabled={!!isUpdating}
                className={styles.trashBtn}
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.subtotalWrapper}>
          <span>Subtotal: </span>
          <span className={styles.subtotalValue}>
            {subtotal ? formatPrice(subtotal.amount, subtotal.currencyCode) : 'R$ 0,00'}
          </span>
        </div>
        <a href={cart.checkoutUrl} className={styles.checkoutBtn}>
          Finalizar compra
        </a>
      </div>
    </div>
  );
}