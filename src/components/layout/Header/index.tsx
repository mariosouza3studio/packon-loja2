"use client";

import { useRef, useState, useEffect } from "react";
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link"; // Usaremos Link padrão ou div para os botões de scroll
import Image from "next/image";
import styles from "./header.module.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCartStore } from "@/store/cartStore";
import CartContent from "./CartContent";
import SearchBox from "./SearchBox";
import MobileSearchResults from "./MobileSearchResults";
import TransitionLink from "@/components/ui/TransitionLink";
import { useLenis } from "@/components/ui/SmoothScroll"; // Importe o hook do Lenis
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const lenis = useLenis(); // Pegamos a instância do scroll
  const pathname = usePathname();
  const router = useRouter();

  // ... (Mantenha todas as suas refs: mobileContentRef, cartContentRef, etc...)
  // ... (Mantenha todos os seus states: isMobileMenuOpen, cart store...)
  
  // REFS E STATES (Copiados do seu código para contexto)
  const mobileContentRef = useRef<HTMLDivElement>(null); 
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileCartRef = useRef<HTMLDivElement>(null);
  const cartContentRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isOpen: isCartOpen, openCart, closeCart, cart } = useCartStore();
  const mobileTl = useRef<gsap.core.Timeline | null>(null);
  const cartTl = useRef<gsap.core.Timeline | null>(null);
  const totalItems = cart?.lines?.edges?.length || 0;

  // ... (Mantenha suas animações useGSAP e useEffects existentes exatamente como estão) ...

  const { contextSafe } = useGSAP(() => {
     // ... (Sua animação de entrada e timelines mantidas iguais)
     // ...
     gsap.set(headerRef.current, { xPercent: -50, y: -150, autoAlpha: 0 });
     gsap.to(headerRef.current, { y: 0, autoAlpha: 1, duration: 1.2, ease: "power4.out", delay: 0.2 });
     
     // ... (Copie suas Timelines mobileTl e cartTl aqui) ...
     const mTl = gsap.timeline({ paused: true });
     if (headerRef.current && mobileContentRef.current && line1Ref.current) {
        mTl.set(mobileContentRef.current, { display: 'flex', autoAlpha: 0, y: -20 });
        mTl.to(line2Ref.current, { scaleX: 0, opacity: 0, duration: 0.2 }, 0)
           .to(line1Ref.current, { y: 9, rotate: 45, duration: 0.3 }, 0)
           .to(line3Ref.current, { y: -9, rotate: -45, duration: 0.3 }, 0);
        mTl.to(headerRef.current, { height: "auto", borderRadius: "32px", backgroundColor: "rgba(20,20,20, 0.6)", duration: 0.9, ease: "expo.inOut" }, 0);
        mTl.to(mobileContentRef.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.5");
        mTl.set(mobileMenuRef.current, { autoAlpha: 1, display: 'flex' }, 0);
        mTl.set(mobileCartRef.current, { autoAlpha: 0, display: 'none' }, 0);
     }
     mobileTl.current = mTl;

     const cTl = gsap.timeline({ paused: true });
     if (headerRef.current && cartContentRef.current) {
        cTl.set(cartContentRef.current, { display: 'flex', autoAlpha: 0, y: -20 })
           .to(headerRef.current, { height: "auto", borderRadius: "32px", backgroundColor: "rgba(20,20,20,0.6)", duration: 0.9, ease: "expo.inOut" })
           .to(cartContentRef.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.5");
     }
     cartTl.current = cTl;

  }, { scope: headerRef });

  // ... (Mantenha switchMobileView, toggleMobileMenu, handleCartClick iguais) ...
  const switchMobileView = contextSafe((target: 'cart' | 'menu') => {
    // ... (sua lógica existente)
    if (!mobileMenuRef.current || !mobileCartRef.current) return;
    if (target === 'cart') {
      gsap.to(mobileMenuRef.current, { autoAlpha: 0, duration: 0.3, onComplete: () => {
          gsap.set(mobileMenuRef.current, { display: 'none' });
          gsap.set(mobileCartRef.current, { display: 'block' });
          gsap.fromTo(mobileCartRef.current, { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.4 });
      }});
    } else {
      gsap.to(mobileCartRef.current, { autoAlpha: 0, duration: 0.3, onComplete: () => {
          gsap.set(mobileCartRef.current, { display: 'none' });
          gsap.set(mobileMenuRef.current, { display: 'flex' });
          gsap.fromTo(mobileMenuRef.current, { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.4 });
      }});
    }
  });

  useEffect(() => {
    if (!lenis) return;

    if (isCartOpen || isMobileMenuOpen) {
      // Pausa o scroll da página principal instantaneamente
      lenis.stop(); 
      // Opcional: Adiciona classe no body para evitar scroll nativo se o Lenis falhar
      document.body.style.overflow = 'hidden'; 
    } else {
      // Retoma o scroll suave
      lenis.start();
      document.body.style.overflow = '';
    }

    // Cleanup de segurança
    return () => {
      lenis.start();
      document.body.style.overflow = '';
    };
  }, [isCartOpen, isMobileMenuOpen, lenis]);

  const toggleMobileMenu = contextSafe(() => {
    if (!mobileTl.current) return;
    if (!isMobileMenuOpen) {
        if (isCartOpen) closeCart(); 
        setIsMobileMenuOpen(true);
        mobileTl.current.play();
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

  // --- NOVA FUNÇÃO: SCROLL SUAVE PARA ÂNCORAS ---
  const handleScrollTo = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault(); // Evita navegação padrão

    // Se estiver no Mobile Menu, fecha ele primeiro
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }

    // Se não estiver na Home, forçamos ir para home primeiro (Opcional, mas seguro)
    if (pathname !== "/") {
      router.push("/");
      // Pequeno delay para esperar a página carregar (solução simples para SPA híbrida)
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      return;
    }

    // Se já estiver na Home e o Lenis existir
    if (lenis) {
      // O offset -100 compensa a altura do Header fixo para não cobrir o título
      lenis.scrollTo(`#${targetId}`, { offset: -100, duration: 1.5 });
    }
  };

  return (
    <header className={styles.header} ref={headerRef}>
      
      <div className={styles.navBar}>
          <TransitionLink href="/" className={styles.logoLink}>
            <div className={styles.logoWrapper}>
              <Image src="/logo2.svg" alt="Packon" fill priority sizes="120px" style={{ objectFit: 'contain' }} />
            </div>
          </TransitionLink>

          {/* Desktop Nav - ATUALIZADO */}
          <nav className={styles.desktopNav}>
             <TransitionLink href="/" className={styles.navLink}>Início</TransitionLink>
             <TransitionLink href="/produtos" className={styles.navLink}>Catálogo</TransitionLink>
             
             {/* LINKS SCROLLAVEIS */}
             <a href="#quem-somos" onClick={(e) => handleScrollTo(e, 'quem-somos')} className={styles.navLink}>
               Quem somos
             </a>
             <a href="#contato" onClick={(e) => handleScrollTo(e, 'contato')} className={styles.navLink}>
               Contato
             </a>
          </nav>

          <div className={styles.desktopActions}>
            <SearchBox />
            <button className={styles.cartButton} onClick={handleCartClick}>
              <ShoppingCart className={styles.cartIcon} size={26} />
              {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
            </button>
          </div>

          <button className={styles.hamburger} onClick={toggleMobileMenu}>
              <span ref={line1Ref} className={styles.line}></span>
              <span ref={line2Ref} className={styles.line}></span>
              <span ref={line3Ref} className={styles.line}></span>
          </button>
      </div>
      
      <div className={styles.cartContainer} ref={cartContentRef}>
          <CartContent />
      </div>

      <div className={styles.mobileContent} ref={mobileContentRef}>
          <div className={styles.mobileNavWrapper} ref={mobileMenuRef}>
             <div className={styles.mobileSearchSection}>
                <SearchBox isMobile={true} />
                <MobileSearchResults onLinkClick={toggleMobileMenu} />
             </div>

             <button className={styles.mobileCartBtn} onClick={() => switchMobileView('cart')}>
                <ShoppingCart size={32} />
                <span>Carrinho ({totalItems})</span>
             </button>

             {/* Mobile Nav - ATUALIZADO */}
             <nav className={styles.mobileNav}>
               <TransitionLink href="/" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Início</TransitionLink>
               <TransitionLink href="/produtos" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Catálogo</TransitionLink>
               
               {/* LINKS SCROLLAVEIS MOBILE */}
               <a href="#quem-somos" onClick={(e) => handleScrollTo(e, 'quem-somos')} className={styles.mobileNavLink}>
                 Quem somos
               </a>
               <a href="#contato" onClick={(e) => handleScrollTo(e, 'contato')} className={styles.mobileNavLink}>
                 Contato
               </a>
             </nav>
          </div>

          <div className={styles.mobileCartWrapper} ref={mobileCartRef} style={{ display: 'none', opacity: 0 }}>
             <CartContent onBack={() => switchMobileView('menu')} />
          </div>
      </div>
    </header>
  );
}