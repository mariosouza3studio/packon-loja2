import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import CartProvider from "@/components/CartProvider"; // Importe aqui
import SearchResults from "@/components/layout/SearchResults"; // Importe o novo componente

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });


export const metadata: Metadata = {
  title: "Packon",
  description: "Uma experiência de compra única.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <CartProvider> {/* Envolva aqui */}
          <SmoothScroll>
            {children}
            <SearchResults />
          </SmoothScroll>
        </CartProvider>
      </body>
    </html>
  );
}