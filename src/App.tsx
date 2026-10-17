import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import BotanicalDecor from './components/BotanicalDecor';
import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.page}>
      <BotanicalDecor />
      <Navbar />
      <main className={styles.main}>
        <Hero />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
