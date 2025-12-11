import { getCollectionProducts } from "@/lib/shopify";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CatalogWrapper from "@/components/catalog/CatalogWrapper";
import styles from "@/components/catalog/catalog.module.css"; // Vamos criar esse CSS abaixo
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loja | Packon",
  description: "Confira nossas embalagens de alta qualidade.",
};

export default async function CatalogPage() {
  // Buscamos produtos da coleção principal.
  // DICA: Se tiver muitos produtos (+100), futuramente implementamos paginação.
  // Por enquanto, trazemos 100 para garantir que o filtro funcione liso na tela.
  const products = await getCollectionProducts("products", "CREATED", true);

  return (
    <main style={{ backgroundColor: "#020202", minHeight: "100vh" }}>
      <Header />
      
      {/* Container principal com padding do Header */}
      <div className={styles.pageContainer}>
         <CatalogWrapper initialProducts={products} />
      </div>

      <Footer />
    </main>
  );
}