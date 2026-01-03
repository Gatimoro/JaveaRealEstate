import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import CategoryCards from '@/components/CategoryCards';
import AnalyticsSection from '@/components/AnalyticsSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import HomeContent from '@/components/HomeContent';
import { getPropertiesByType, getPropertyBadges } from '@/lib/supabase/server-queries';
import type { Property } from '@/data/properties';

/**
 * Home Page - Server Component
 *
 * Fetches data on the server with 24-hour caching.
 * Data is passed to client components for interactivity.
 */
export default async function Home() {
  // Fetch all data on the server (cached for 24 hours!)
  let houses: Property[] = [];
  let investments: Property[] = [];
  let plots: Property[] = [];
  let badges: Record<string, string> = {};

  try {
    // Fetch all property types in parallel (cached!)
    const [housesData, investmentsData, plotsData, badgesData] = await Promise.all([
      getPropertiesByType('house'),
      getPropertiesByType('investment'),
      getPropertiesByType('plot'),
      getPropertyBadges(),
    ]);

    houses = housesData;
    investments = investmentsData;
    plots = plotsData;
    badges = badgesData;
  } catch (error) {
    console.error('Error loading properties:', error);
    // Fallback to static data if Supabase fails
    const { houses: staticHouses, investments: staticInvestments, plots: staticPlots } = await import('@/data/properties');
    houses = staticHouses;
    investments = staticInvestments;
    plots = staticPlots;
  }

  // Apply badges to properties
  const applyBadges = (properties: Property[]) =>
    properties.map(p => ({
      ...p,
      badge: badges[p.id] || p.badge,
    }));

  const housesWithBadges = applyBadges(houses);
  const investmentsWithBadges = applyBadges(investments);
  const plotsWithBadges = applyBadges(plots);

  return (
    <main className="relative min-h-screen">
      <Navbar />
      <HeroSection />
      <CategoryCards />

      {/* Pass server-fetched data to client component for interactivity */}
      <HomeContent
        houses={housesWithBadges}
        investments={investmentsWithBadges}
        plots={plotsWithBadges}
      />

      <AnalyticsSection />
      <AboutSection />
      <ContactSection />
      <CTASection />
      <Footer />
    </main>
  );
}
