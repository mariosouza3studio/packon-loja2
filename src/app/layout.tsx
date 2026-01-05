import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import CartProvider from "@/components/CartProvider";
import SearchResults from "@/components/layout/SearchResults";
import { Toaster } from "sonner";
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://packon.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL), // <--- CRUCIAL PARA SEO
  title: {
    default: "Packon | Embalagens Flexíveis e Personalizadas",
    template: "%s | Packon" // Isso cria títulos automáticos tipo "Saco Stand-up | Packon"
  },
  description: "Especialistas em embalagens flexíveis, stand-up pouches e sacos a vácuo. Inovação e tecnologia para destacar seu produto no ponto de venda.",
  openGraph: {
    title: "Packon Embalagens",
    description: "Embalagens que vendem por você.",
    url: BASE_URL,
    siteName: "Packon",
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <OrganizationJsonLd /> {/* Adicione aqui, logo no início do body ou head */}
        <CartProvider>
          <SmoothScroll>
            {children}
            <SearchResults />
            
            {/* COMPONENTE TOASTER ADICIONADO AQUI */}
            <Toaster 
              position="top-right" 
              toastOptions={{
                style: {
                  background: 'rgba(20, 20, 20, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                },
                className: 'packon-toast',
              }}
            />

          </SmoothScroll>
        </CartProvider>
      </body>
    </html>
  );
}