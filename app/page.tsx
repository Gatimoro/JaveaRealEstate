'use client';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import CategoryCards from '@/components/CategoryCards';
import PropertyCarousel from '@/components/PropertyCarousel';
import AnalyticsSection from '@/components/AnalyticsSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import { houses, investments, plots } from '@/data/properties';
import { useLanguage } from '@/lib/i18n';

export default function Home() {
  const { locale } = useLanguage();

  const translations = {
    es: {
      houses: 'Casas y Pisos',
      investments: 'Oportunidades de Inversión',
      plots: 'Parcelas',
    },
    en: {
      houses: 'Houses & Apartments',
      investments: 'Investment Opportunities',
      plots: 'Land Plots',
    },
    ru: {
      houses: 'Дома и квартиры',
      investments: 'Инвестиционные возможности',
      plots: 'Участки',
    },
  };

  const t = translations[locale];

  return (
    <main className="relative min-h-screen">
      <Navbar />
      <HeroSection />
      <CategoryCards />
      <PropertyCarousel
        title={t.houses}
        properties={houses}
        id="casas"
      />
      <PropertyCarousel
        title={t.investments}
        properties={investments}
        id="inversiones"
      />
      <PropertyCarousel title={t.plots} properties={plots} id="parcelas" />
      <AnalyticsSection />
      <AboutSection />
      <ContactSection />
      <CTASection />
      <Footer />
    </main>
  );
}
