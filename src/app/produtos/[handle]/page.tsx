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

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return { title: "Produto não encontrado" };

  const { title, description } = product;
  const image = product.images.edges[0]?.node.url;

  return {
    title: title,
    description: description ? description.substring(0, 160) : `Compre ${title} na Packon.`,
    openGraph: {
      title: title,
      description: description ? description.substring(0, 160) : undefined,
      images: image ? [{ url: image, width: 800, height: 800, alt: title }] : [],
      type: "website",
      url: `https://packon.com.br/produtos/${product.handle}`,
      siteName: "Packon",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description ? description.substring(0, 160) : undefined,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `https://packon.com.br/produtos/${product.handle}`,
    }
  };
}

export default async function ProductPage(props: Props) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) {
    notFound(); 
  }

  // Schema.org Profissional e Sanitizado
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ? product.description.substring(0, 5000) : product.title,
    image: product.images.edges.map((img: any) => img.node.url),
    sku: product.variants.edges[0]?.node.id || product.id,
    brand: {
      "@type": "Brand",
      name: "Packon"
    },
    offers: {
      "@type": "Offer",
      url: `https://packon.com.br/produtos/${product.handle}`,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      price: product.priceRange.minVariantPrice.amount,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // +1 ano dinâmico
      itemCondition: "https://schema.org/NewCondition",
      availability: product.availableForSale 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Packon Embalagens"
      }
    }
  };

  return (
    <main style={{ backgroundColor: "#020202", minHeight: "100vh" }}>
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