'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import CategoryCards from '@/components/CategoryCards';
import PropertyCarousel from '@/components/PropertyCarousel';
import AnalyticsSection from '@/components/AnalyticsSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/i18n';
import { getPropertiesByType, getPropertyBadges } from '@/lib/supabase/queries';
import type { Property } from '@/data/properties';

export default function Home() {
  const { locale } = useLanguage();
  const [houses, setHouses] = useState<Property[]>([]);
  const [investments, setInvestments] = useState<Property[]>([]);
  const [plots, setPlots] = useState<Property[]>([]);
  const [badges, setBadges] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        setIsLoading(true);

        // Fetch all property types in parallel
        const [housesData, investmentsData, plotsData, badgesData] = await Promise.all([
          getPropertiesByType('house'),
          getPropertiesByType('investment'),
          getPropertiesByType('plot'),
          getPropertyBadges(),
        ]);

        // Apply badges to properties
        const applyBadges = (properties: Property[]) =>
          properties.map(p => ({
            ...p,
            badge: badgesData[p.id] || p.badge,
          }));

        setHouses(applyBadges(housesData));
        setInvestments(applyBadges(investmentsData));
        setPlots(applyBadges(plotsData));
        setBadges(badgesData);
      } catch (error) {
        console.error('Error loading properties:', error);
        // Fallback to static data if Supabase fails
        import('@/data/properties').then(({ houses: staticHouses, investments: staticInvestments, plots: staticPlots }) => {
          setHouses(staticHouses);
          setInvestments(staticInvestments);
          setPlots(staticPlots);
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProperties();
  }, []);

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

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando propiedades...</p>
        </div>
      ) : (
        <>
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
          <PropertyCarousel
            title={t.plots}
            properties={plots}
            id="parcelas"
          />
        </>
      )}

      <AnalyticsSection />
      <AboutSection />
      <ContactSection />
      <CTASection />
      <Footer />
    </main>
  );
}
