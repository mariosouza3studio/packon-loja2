// src/app/produtos/[handle]/page.tsx
import { getProduct } from "@/lib/shopify";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string }>;
}

// 1. Geração de Metadados (SEO Base + Open Graph para WhatsApp/Insta)
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return { title: "Produto não encontrado" };

  const image = product.images.edges[0]?.node.url;

  return {
    title: `${product.title} | Packon`,
    description: product.description ? product.description.substring(0, 160) : "Confira os detalhes deste produto exclusivo da Packon.",
    openGraph: {
      title: product.title,
      description: product.description ? product.description.substring(0, 160) : undefined,
      images: image ? [{ url: image }] : [],
      type: "website",
    }
  };
}

// 2. Página do Produto
export default async function ProductPage(props: Props) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) {
    notFound(); 
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.edges[0]?.node.url,
    offers: {
      "@type": "Offer",
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      price: product.priceRange.minVariantPrice.amount,
      availability: product.availableForSale 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      url: `https://packon.com.br/produtos/${product.handle}`,
    },
  };

  return (
    <main style={{ backgroundColor: "#020202", minHeight: "100vh" }}>
      {/* Injeta o JSON-LD no head da página de forma invisível */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />
      <ProductView product={product} />
      <Footer />
    </main>
  );
}