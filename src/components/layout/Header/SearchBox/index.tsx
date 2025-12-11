"use client";

import { useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import styles from "./searchBox.module.css";
import { useSearchStore } from "@/store/searchStore";
import { performSearch } from "@/app/actions/search";

interface SearchBoxProps {
  isMobile?: boolean;
}

export default function SearchBox({ isMobile = false }: SearchBoxProps) {
  const { 
    query, setQuery, setIsOpen, isOpen, 
    setResults, setLoading 
  } = useSearchStore();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (term: string) => {
    setQuery(term);
    
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (term.length >= 2) {
        setLoading(true);
        try {
          const data = await performSearch(term);
          setResults(data);
          // Se for desktop, abre o box. Se for mobile, a lista aparece inline automaticamente.
          if (data.length > 0 && !isMobile) setIsOpen(true);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);
  };

  const handleFocus = () => {
    if (query.length >= 2 && !isMobile) setIsOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div 
      className={`
        ${styles.searchContainer} 
        ${isOpen ? styles.active : ''} 
        ${isMobile ? styles.mobile : ''} 
      `}
    >
      <input 
        ref={inputRef}
        type="text" 
        className={styles.searchInput} 
        placeholder={isMobile ? "Buscar produtos..." : "Buscar..."}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={handleFocus}
      />
      
      <button className={styles.iconButton} onClick={query ? handleClear : undefined}>
        {useSearchStore(s => s.loading) ? (
           <Loader2 size={isMobile ? 20 : 16} className={styles.spin} />
        ) : query ? (
           <X size={isMobile ? 20 : 16} color="#ffea97" />
        ) : (
           <Search size={isMobile ? 20 : 18} color={isMobile ? "#fff" : "#ffea97"} />
        )}
      </button>
    </div>
  );
}