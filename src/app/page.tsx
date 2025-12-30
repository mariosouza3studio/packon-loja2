import Header from "@/components/layout/Header";
import Hero from "@/components/home/Hero";
import Popular from "@/components/home/Popular"; 
import styles from "./page.module.css";
import Categories from "@/components/home/Categories";
import About from "@/components/home/About";
import Benefits from "@/components/home/Benefits";
import CTA from "@/components/home/CTA";
import Footer from "@/components/layout/Footer";

// Importamos a função de busca que criamos no passo anterior
import { getProductsInCollection } from "@/lib/shopify";

// Componente assíncrono (Recurso do Next.js 13+)
export default async function Home() {
  // Busca os produtos da coleção 'destaques'
  // Se sua coleção tiver outro handle, troque 'destaques' pelo correto.
  const products = await getProductsInCollection("destaques");

  return (
    <main className={styles.main}>
      <Header />
      <Hero />
      
      {/* Passamos os dados reais para o componente */}
      <Popular products={products} />
      
      {/* Categories por enquanto permanece estático pois envolve lógica visual complexa,
          podemos dinamizar na próxima etapa se quiser mapear as imagens */}
      <Categories/>
      <About />
      <Benefits/>
      <CTA/>
      <Footer/>
    </main>
  );
}