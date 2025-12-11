"use client";

import { useRef, useState, useEffect } from "react";
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "./header.module.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCartStore } from "@/store/cartStore";
import CartContent from "./CartContent";
import SearchBox from "./SearchBox";
import MobileSearchResults from "./MobileSearchResults";
import TransitionLink from "@/components/ui/TransitionLink";

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  
  // Refs para as "Telas" do Mobile
  const mobileContentRef = useRef<HTMLDivElement>(null); // Container Pai Mobile
  const mobileMenuRef = useRef<HTMLDivElement>(null);    // Tela 1: Links
  const mobileCartRef = useRef<HTMLDivElement>(null);    // Tela 2: Carrinho

  // Refs do Desktop
  const cartContentRef = useRef<HTMLDivElement>(null);

  // Hamburger
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { isOpen: isCartOpen, openCart, closeCart, cart } = useCartStore();

  const mobileTl = useRef<gsap.core.Timeline | null>(null);
  const cartTl = useRef<gsap.core.Timeline | null>(null);

const totalItems = cart?.lines?.edges?.length || 0;

  const { contextSafe } = useGSAP(() => {
    // 1. Entrada Header
    gsap.set(headerRef.current, { xPercent: -50, y: -150, autoAlpha: 0 });
    gsap.to(headerRef.current, { y: 0, autoAlpha: 1, duration: 1.2, ease: "power4.out", delay: 0.2 });

    // 2. Timeline ABERTURA DO MENU MOBILE (Geral)
    const mTl = gsap.timeline({ paused: true });
    
    if (headerRef.current && mobileContentRef.current && line1Ref.current) {
        
        // Passo 1: Prepara o conteúdo (invisível, mas ocupando espaço)
        mTl.set(mobileContentRef.current, { display: 'flex', autoAlpha: 0, y: -20 });

        // Passo 2: Animação do Ícone Hamburguer (Rápida)
        mTl.to(line2Ref.current, { scaleX: 0, opacity: 0, duration: 0.2 }, 0)
           .to(line1Ref.current, { y: 9, rotate: 45, duration: 0.3 }, 0)
           .to(line3Ref.current, { y: -9, rotate: -45, duration: 0.3 }, 0);
        
        // Passo 3: A Expansão com "Peso" (Igual ao Desktop)
        mTl.to(headerRef.current, { 
            height: "auto", 
            borderRadius: "32px", 
            backgroundColor: "rgba(20,20,20, 0.6)", // Fundo escuro
            duration: 0.9, // Duração longa para dar a sensação de "arrastar"
            ease: "expo.inOut" // A curva mágica que dá o peso
        }, 0);
        
        // Passo 4: O conteúdo surge suavemente
        mTl.to(mobileContentRef.current, { 
           autoAlpha: 1, 
           y: 0, 
           duration: 0.6,
           ease: "power2.out"
        }, "-=0.5"); // Entra antes da caixa terminar de abrir

        // Garante o estado inicial dos sub-menus
        mTl.set(mobileMenuRef.current, { autoAlpha: 1, display: 'flex' }, 0);
        mTl.set(mobileCartRef.current, { autoAlpha: 0, display: 'none' }, 0);
    }
    mobileTl.current = mTl;

    // 3. Timeline DESKTOP CART (Igual ao anterior)
    const cTl = gsap.timeline({ paused: true });
    if (headerRef.current && cartContentRef.current) {
        cTl.set(cartContentRef.current, { display: 'flex', autoAlpha: 0, y: -20 })
           .to(headerRef.current, { 
              height: "auto", 
              borderRadius: "32px", 
              backgroundColor: "rgba(20,20,20,0.6)",
              duration: 0.9, 
              ease: "expo.inOut", 
           })
           .to(cartContentRef.current, { 
              autoAlpha: 1, 
              y: 0, 
              duration: 0.6,
              ease: "power2.out" 
           }, "-=0.5");
    }
    cartTl.current = cTl;

  }, { scope: headerRef });

  // --- ANIMAÇÃO DE TROCA (MENU <-> CART) ---
  const switchMobileView = contextSafe((target: 'cart' | 'menu') => {
    if (!mobileMenuRef.current || !mobileCartRef.current) return;

    if (target === 'cart') {
      // Fade OUT Menu -> Fade IN Cart
      gsap.to(mobileMenuRef.current, { 
        autoAlpha: 0, 
        duration: 0.3, 
        onComplete: () => {
          gsap.set(mobileMenuRef.current, { display: 'none' });
          gsap.set(mobileCartRef.current, { display: 'block' });
          gsap.fromTo(mobileCartRef.current, 
            { autoAlpha: 0, x: 20 }, 
            { autoAlpha: 1, x: 0, duration: 0.4 }
          );
        }
      });
    } else {
      // Fade OUT Cart -> Fade IN Menu
      gsap.to(mobileCartRef.current, { 
        autoAlpha: 0, 
        duration: 0.3, 
        onComplete: () => {
          gsap.set(mobileCartRef.current, { display: 'none' });
          gsap.set(mobileMenuRef.current, { display: 'flex' });
          gsap.fromTo(mobileMenuRef.current, 
            { autoAlpha: 0, x: -20 }, 
            { autoAlpha: 1, x: 0, duration: 0.4 }
          );
        }
      });
    }
  });

  // --- EFEITOS E HANDLERS ---
  
  useEffect(() => {
    if (cartTl.current && window.innerWidth > 1024) { // Só ativa desktop cart se for desktop
        if (isCartOpen) {
            if (isMobileMenuOpen) toggleMobileMenu();
            cartTl.current.play();
        } else {
            cartTl.current.reverse();
        }
    }
  }, [isCartOpen]);

  const toggleMobileMenu = contextSafe(() => {
    if (!mobileTl.current) return;
    if (!isMobileMenuOpen) {
        if (isCartOpen) closeCart(); 
        setIsMobileMenuOpen(true);
        mobileTl.current.play();
        
        // Reset sempre para o menu de links ao abrir
        gsap.set(mobileMenuRef.current, { display: 'flex', autoAlpha: 1, x: 0 });
        gsap.set(mobileCartRef.current, { display: 'none', autoAlpha: 0 });

    } else {
        setIsMobileMenuOpen(false);
        mobileTl.current.reverse();
    }
  });

  const handleCartClick = () => {
      if (isCartOpen) closeCart();
      else openCart();
  };

  return (
    <header className={styles.header} ref={headerRef}>
      
      <div className={styles.navBar}>
          <TransitionLink href="/" className={styles.logoLink}>
            <div className={styles.logoWrapper}>
              <Image src="/logo2.svg" alt="Packon" fill priority sizes="120px" style={{ objectFit: 'contain' }} />
            </div>
          </TransitionLink>

          {/* Desktop Nav */}
          <nav className={styles.desktopNav}>
<nav className={styles.desktopNav}>
  <TransitionLink href="/" className={styles.navLink}>Início</TransitionLink>
  <TransitionLink href="/produtos" className={styles.navLink}>Catálogo</TransitionLink>
  <TransitionLink href="/quem-somos" className={styles.navLink}>Quem somos</TransitionLink>
  <TransitionLink href="/contato" className={styles.navLink}>Contato</TransitionLink>
</nav>
          </nav>

          {/* Desktop Actions */}
          <div className={styles.desktopActions}>
            <SearchBox />
            <button className={styles.cartButton} onClick={handleCartClick}>
              <ShoppingCart className={styles.cartIcon} size={26} />
              {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button className={styles.hamburger} onClick={toggleMobileMenu}>
              <span ref={line1Ref} className={styles.line}></span>
              <span ref={line2Ref} className={styles.line}></span>
              <span ref={line3Ref} className={styles.line}></span>
          </button>
      </div>
      
      {/* DESKTOP CARRINHO */}
      <div className={styles.cartContainer} ref={cartContentRef}>
          <CartContent />
      </div>

      {/* MOBILE CONTAINER GERAL */}
      <div className={styles.mobileContent} ref={mobileContentRef}>
          
          {/* TELA 1: MENU DE LINKS + BUSCA */}
          <div className={styles.mobileNavWrapper} ref={mobileMenuRef}>
             <div className={styles.mobileNavWrapper} ref={mobileMenuRef}>

    {/* Container da Busca */}
    <div className={styles.mobileSearchSection}>
        {/* O Input de Busca (Reutilizando o SearchBox) */}
        <SearchBox isMobile={true} />

        {/* AQUI ESTÁ A MUDANÇA: Os resultados aparecem aqui, empurrando o resto */}
        <MobileSearchResults onLinkClick={toggleMobileMenu} />
    </div>

    {/* Botão Carrinho (continua aqui, será empurrado para baixo se tiver resultados) */}
    <button className={styles.mobileCartBtn} onClick={() => switchMobileView('cart')}>
       {/* ... */}
    </button>

    {/* ... Nav Links ... */}
</div>

             

             {/* Botão que chama a TELA 2 (Carrinho) */}
             <button className={styles.mobileCartBtn} onClick={() => switchMobileView('cart')}>
                <ShoppingCart size={32} />
                <span>Carrinho ({totalItems})</span>
             </button>

             <nav className={styles.mobileNav}>
               <TransitionLink href="/" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Início</TransitionLink>
               <TransitionLink href="/produtos" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Catálogo</TransitionLink>
               <TransitionLink href="/quem-somos" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Quem somos</TransitionLink>
               <TransitionLink href="/contato" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Contato</TransitionLink>
             </nav>
          </div>

          {/* TELA 2: CARRINHO INTERNO */}
          <div className={styles.mobileCartWrapper} ref={mobileCartRef} style={{ display: 'none', opacity: 0 }}>
             {/* Passamos a função de voltar para o componente */}
             <CartContent onBack={() => switchMobileView('menu')} />
          </div>

      </div>

    </header>
  );
}