"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchStore } from "@/store/searchStore";
import styles from "./mobileSearchResults.module.css";

interface MobileSearchResultsProps {
  onLinkClick: () => void; // Função para fechar o menu mobile ao clicar
}

export default function MobileSearchResults({ onLinkClick }: MobileSearchResultsProps) {
  const { results, query, loading } = useSearchStore();

  // Só mostra se tiver digitado algo
  if (query.length < 2) return null;

  return (
    <div className={styles.container}>
      
      {loading && <p className={styles.status}>Buscando...</p>}

      {!loading && results.length > 0 && (
        <div className={styles.list}>
          {results.map((product) => (
            <Link 
              key={product.id} 
              href={`/produtos/${product.handle}`} 
              className={styles.item}
              onClick={onLinkClick} // Fecha o menu mobile
            >
              <div className={styles.imageWrapper}>
                {product.image ? (
                  <Image 
                    src={product.image} 
                    alt={product.title} 
                    width={40} 
                    height={40} 
                    className={styles.img} 
                  />
                ) : (
                  <div className={styles.placeholder} />
                )}
              </div>
              <div className={styles.info}>
                <span className={styles.title}>{product.title}</span>
                {/* Se quiser mostrar preço, pode adicionar aqui */}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query.length >= 2 && (
        <p className={styles.status}>Nenhum produto encontrado.</p>
      )}
    </div>
  );
}