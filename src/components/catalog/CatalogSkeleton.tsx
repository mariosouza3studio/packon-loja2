// src/components/catalog/CatalogSkeleton.tsx
import styles from "@/components/ui/skeletons.module.css";

// Gera um array de 6 itens para preencher a tela
const dummyItems = Array.from({ length: 6 });

export default function CatalogSkeleton() {
  return (
    <div className={styles.catalogGrid}>
      {dummyItems.map((_, i) => (
        <div key={i} className={styles.cardSkeleton}>
          
          {/* Área da Imagem */}
          <div className={`${styles.shimmer} ${styles.imageArea}`} />
          
          {/* Informações */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Título */}
            <div className={`${styles.shimmer} ${styles.titleArea}`} />
            
            {/* Preço */}
            <div className={`${styles.shimmer} ${styles.priceArea}`} />
          </div>
          
          {/* Botão */}
          <div className={`${styles.shimmer} ${styles.buttonArea}`} />
          
        </div>
      ))}
    </div>
  );
}