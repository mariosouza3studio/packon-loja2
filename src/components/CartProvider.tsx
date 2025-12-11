"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const initCart = useCartStore((state) => state.initCart);

  useEffect(() => {
    initCart();
  }, [initCart]);

  return <>{children}</>;
}