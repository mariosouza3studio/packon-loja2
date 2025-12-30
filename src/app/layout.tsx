import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import CartProvider from "@/components/CartProvider";
import SearchResults from "@/components/layout/SearchResults";

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
        <CartProvider>
          <SmoothScroll>
            {children}
            <SearchResults />
          </SmoothScroll>
        </CartProvider>
      </body>
    </html>
  );
}