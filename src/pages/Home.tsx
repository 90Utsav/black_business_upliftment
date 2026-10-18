import { useEffect } from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';

export default function Home() {
  useEffect(() => {
    document.title = 'CivicText - Funding Our Futures, One Text at a Time';
  }, []);

  return (
    <>
      <Hero />
      <HowItWorks />
    </>
  );
}
