// src/components/ui/TransitionLink.tsx
"use client";

import Link, { LinkProps } from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import gsap from "gsap";

interface TransitionLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  style?: React.CSSProperties; // Adicionado para aceitar estilos inline
}

export default function TransitionLink({
  children,
  href,
  onClick,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Impede a navegação imediata (o corte seco)

    // Se tiver onclick adicional (ex: fechar menu mobile), executa
    if (onClick) onClick(e);

    // Evita rodar animação se já estiver na mesma página
    if (pathname === href) return;

    // Busca o container definido no template
    const container = document.getElementById("page-transition-container");

    if (container) {
      // ANIMAÇÃO DE SAÍDA (O "Exit Elegante")
      gsap.to(container, {
        opacity: 0,
        y: -20,             // Sobe um pouquinho (dando ideia de continuidade)
        filter: "blur(10px)", // Blur cinematográfico
        scale: 0.98,        // Leve recuo
        duration: 0.5,      // Tempo suficiente para ser suave, mas rápido
        ease: "power2.in",  // Acelera para sair
        onComplete: () => {
          router.push(href.toString()); // Troca a rota APÓS a animação
        },
      });
    } else {
      // Fallback de segurança se não achar o ID
      router.push(href.toString());
    }
  };

  return (
    <Link {...props} href={href} onClick={handleTransition}>
      {children}
    </Link>
  );
}