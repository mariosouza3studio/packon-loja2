import Header from "@/components/layout/Header";
import Hero from "@/components/home/Hero";
import Popular from "@/components/home/Popular"; 
import styles from "./page.module.css";
import Categories from "@/components/home/Categories";
import About from "@/components/home/About";
import Benefits from "@/components/home/Benefits";
import CTA from "@/components/home/CTA";
import Footer from "@/components/layout/Footer";
import { getProductsInCollection } from "@/lib/shopify";


export default async function Home() {

  const products = await getProductsInCollection("destaques");

  return (
    <main className={styles.main}>
      <Header />
      <Hero />
      <Popular products={products} />
      <Categories/>
      <About />
      <Benefits/>
      <CTA/>
      <Footer/>
    </main>
  );
}