'use client';

/**
 * HomePageContent
 *
 * Client component that renders all visible homepage sections with full i18n support.
 * Follows the same inline-translations pattern as CategoryNav and Footer.
 *
 * Receives server-fetched property data as props so the server component (app/page.tsx)
 * can do the data fetching under ISR, while this component handles all locale-aware rendering.
 *
 * Sections rendered:
 * - Hero (image + CTA text)
 * - Category picker grid (Obra nueva / Alquiler / Venta)
 * - Stats (property counts per listing_type)
 * - Property carousels (new-building / sale / rent)
 * - About
 * - Contact
 */

import { Building2, Home as HomeIcon, Key, Store, MapPin, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import PropertyCarousel from '@/components/PropertyCarousel';
import type { PropertyCard } from '@/lib/supabase/server-queries';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Counts {
  sale: number;
  rent: number;
  newBuilding: number;
  total: number;
}

interface HomePageContentProps {
  saleProperties: PropertyCard[];
  rentProperties: PropertyCard[];
  newBuildingProperties: PropertyCard[];
  counts: Counts;
}

// ---------------------------------------------------------------------------
// Inline translations (same pattern as CategoryNav / Footer)
// ---------------------------------------------------------------------------

const t = {
  es: {
    // Hero
    heroTitle: 'Encuentra tu propiedad ideal',
    heroLocation: 'en Valencia',
    heroDesc: 'Obra nueva, alquiler y venta de propiedades en la Costa Blanca',

    // Category picker labels
    newBuildLabel: 'Obra nueva',
    rentLabel: 'Alquiler',
    saleLabel: 'Venta',
    allProjects: 'Todos los proyectos',
    apartments: 'Apartamentos',
    houses: 'Casas',
    commercial: 'Comercial',
    parcelas: 'Parcelas',
    viewAll: 'Ver todos',

    // Stats
    availableProperties: 'Propiedades disponibles',
    forSale: 'En venta',
    forRent: 'En alquiler',
    newBuild: 'Obra nueva',

    // Section headers
    newBuildingsTitle: 'Obra nueva en Valencia',
    newBuildingsSubtitle: 'Nuevos proyectos de construcción',
    saleTitle: 'Propiedades en venta',
    saleSubtitle: 'Apartamentos, casas, comercios y parcelas',
    rentTitle: 'Propiedades en alquiler',
    rentSubtitle: 'Apartamentos, casas y locales comerciales',
    soonNewBuildings: 'Próximamente: proyectos de obra nueva en Valencia',
    soonRentals: 'Próximamente: propiedades en alquiler en Valencia',

    // About
    aboutTitle: 'Sobre Miraluna',
    aboutText: 'Agregador de propiedades inmobiliarias en Valencia y Costa Blanca. Encuentra casas, apartamentos, parcelas y oportunidades de inversión de múltiples fuentes en un solo lugar.',
    aboutSubtext: 'Plataforma de demostración • Valencia Real Estate Aggregator',

    // Contact
    contactTitle: 'Contacto',
    contactDesc: '¿Tienes preguntas? Estamos aquí para ayudarte a encontrar tu propiedad ideal.',
    sendEmail: 'Enviar email',
    exploreProperties: 'Explorar propiedades',
  },
  en: {
    heroTitle: 'Find your ideal property',
    heroLocation: 'in Valencia',
    heroDesc: 'New builds, rentals and sales on the Costa Blanca',

    newBuildLabel: 'New builds',
    rentLabel: 'Rental',
    saleLabel: 'Sale',
    allProjects: 'All projects',
    apartments: 'Apartments',
    houses: 'Houses',
    commercial: 'Commercial',
    parcelas: 'Plots',
    viewAll: 'View all',

    availableProperties: 'Available properties',
    forSale: 'For sale',
    forRent: 'For rent',
    newBuild: 'New builds',

    newBuildingsTitle: 'New developments in Valencia',
    newBuildingsSubtitle: 'New construction projects',
    saleTitle: 'Properties for sale',
    saleSubtitle: 'Apartments, houses, commercial & plots',
    rentTitle: 'Rental properties',
    rentSubtitle: 'Apartments, houses and commercial spaces',
    soonNewBuildings: 'Coming soon: new development projects in Valencia',
    soonRentals: 'Coming soon: rental properties in Valencia',

    aboutTitle: 'About Miraluna',
    aboutText: 'Real estate aggregator for Valencia and the Costa Blanca. Find houses, apartments, plots and investment opportunities from multiple sources in one place.',
    aboutSubtext: 'Demo platform • Valencia Real Estate Aggregator',

    contactTitle: 'Contact',
    contactDesc: "Have questions? We're here to help you find your ideal property.",
    sendEmail: 'Send email',
    exploreProperties: 'Explore properties',
  },
  ru: {
    heroTitle: 'Найдите идеальную недвижимость',
    heroLocation: 'в Валенсии',
    heroDesc: 'Новостройки, аренда и продажа недвижимости на Коста Бланка',

    newBuildLabel: 'Новостройки',
    rentLabel: 'Аренда',
    saleLabel: 'Продажа',
    allProjects: 'Все проекты',
    apartments: 'Квартиры',
    houses: 'Дома',
    commercial: 'Коммерческая',
    parcelas: 'Участки',
    viewAll: 'Смотреть все',

    availableProperties: 'Доступно объектов',
    forSale: 'Продажа',
    forRent: 'Аренда',
    newBuild: 'Новостройки',

    newBuildingsTitle: 'Новостройки в Валенсии',
    newBuildingsSubtitle: 'Новые строительные проекты',
    saleTitle: 'Недвижимость на продажу',
    saleSubtitle: 'Квартиры, дома, коммерческие и участки',
    rentTitle: 'Недвижимость в аренду',
    rentSubtitle: 'Квартиры, дома и коммерческие помещения',
    soonNewBuildings: 'Скоро: новые строительные проекты в Валенсии',
    soonRentals: 'Скоро: аренда недвижимости в Валенсии',

    aboutTitle: 'О Miraluna',
    aboutText: 'Агрегатор недвижимости в Валенсии и на Коста Бланка. Находите дома, квартиры, участки и инвестиционные возможности из множества источников в одном месте.',
    aboutSubtext: 'Демонстрационная платформа • Агрегатор в Валенсии',

    contactTitle: 'Контакты',
    contactDesc: 'Есть вопросы? Мы готовы помочь найти идеальную недвижимость.',
    sendEmail: 'Написать письмо',
    exploreProperties: 'Смотреть объекты',
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomePageContent({
  saleProperties,
  rentProperties,
  newBuildingProperties,
  counts,
}: HomePageContentProps) {
  const { locale } = useLanguage();
  const tr = t[locale];

  return (
    <div className="container mx-auto px-4 py-8">

      {/* ------------------------------------------------------------------ */}
      {/* Hero Section — 2-column grid                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">

        {/* Left side — Category picker (3 cols) */}
        <div className="lg:col-span-3 space-y-4">

          {/* Top row: New Builds + Rent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* New Builds */}
            <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all">
              <div className="p-3 bg-primary/5 border-b border-border">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {tr.newBuildLabel}
                </h2>
              </div>
              <Link
                href="/categoria/obra-nueva"
                className="flex items-center justify-center gap-3 p-4 hover:bg-primary/5 transition-colors min-h-[100px]"
              >
                <Building2 className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="font-semibold text-sm">{tr.allProjects}</div>
                </div>
              </Link>
            </div>

            {/* Rent */}
            <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all">
              <div className="p-3 bg-orange-500/5 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  {tr.rentLabel}
                </h2>
                <Link href="/categoria/alquiler" className="text-xs text-primary hover:underline">
                  {tr.viewAll}
                </Link>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border">
                <Link
                  href="/categoria/alquiler?type=apartment"
                  className="flex flex-col items-center justify-center gap-1 p-3 hover:bg-primary/5 transition-colors min-h-[100px]"
                >
                  <Building2 className="w-5 h-5 text-primary" />
                  <div className="text-xs font-medium text-center">{tr.apartments}</div>
                </Link>
                <Link
                  href="/categoria/alquiler?type=house"
                  className="flex flex-col items-center justify-center gap-1 p-3 hover:bg-primary/5 transition-colors min-h-[100px]"
                >
                  <HomeIcon className="w-5 h-5 text-primary" />
                  <div className="text-xs font-medium text-center">{tr.houses}</div>
                </Link>
                <Link
                  href="/categoria/alquiler?type=commerce"
                  className="flex flex-col items-center justify-center gap-1 p-3 hover:bg-primary/5 transition-colors min-h-[100px]"
                >
                  <Store className="w-5 h-5 text-primary" />
                  <div className="text-xs font-medium text-center">{tr.commercial}</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom row: Sale (full width) */}
          <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all">
            <div className="p-3 bg-green-500/5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <HomeIcon className="w-5 h-5" />
                {tr.saleLabel}
              </h2>
              <Link href="/categoria/venta" className="text-xs text-primary hover:underline">
                {tr.viewAll}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
              <Link
                href="/categoria/venta?type=apartment"
                className="flex flex-col items-center justify-center gap-1 p-3 hover:bg-primary/5 transition-colors min-h-[100px]"
              >
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <div className="text-xs sm:text-sm font-medium text-center">{tr.apartments}</div>
              </Link>
              <Link
                href="/categoria/venta?type=house"
                className="flex flex-col items-center justify-center gap-1 p-3 hover:bg-primary/5 transition-colors min-h-[100px]"
              >
                <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <div className="text-xs sm:text-sm font-medium text-center">{tr.houses}</div>
              </Link>
              <Link
                href="/categoria/venta?type=commerce"
                className="flex flex-col items-center justify-center gap-1 p-3 hover:bg-primary/5 transition-colors min-h-[100px]"
              >
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <div className="text-xs sm:text-sm font-medium text-center">{tr.commercial}</div>
              </Link>
              <Link
                href="/categoria/venta?type=plot"
                className="flex flex-col items-center justify-center gap-1 p-3 hover:bg-primary/5 transition-colors min-h-[100px]"
              >
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <div className="text-xs sm:text-sm font-medium text-center">{tr.parcelas}</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right side — CTA image (2 cols) */}
        <div className="lg:col-span-2 relative rounded-xl overflow-hidden min-h-[400px] lg:min-h-full">
          <Image
            src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop"
            alt="Costa Blanca sea view"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-orange-500/80 to-orange-600/90" />
          <div className="relative z-10 h-full flex items-center justify-center p-8 text-center text-white">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {tr.heroTitle}
              </h1>
              <p className="text-lg md:text-xl mb-2 opacity-90">
                {tr.heroLocation}
              </p>
              <p className="text-sm md:text-base opacity-80 max-w-md mx-auto">
                {tr.heroDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats Section — live counts from DB (no data transfer, header-only) */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-16 py-8 px-6 bg-gradient-to-r from-primary/5 to-orange-500/5 rounded-xl border border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div className="text-3xl font-bold text-primary">{counts.total}</div>
            </div>
            <div className="text-sm text-muted-foreground">{tr.availableProperties}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HomeIcon className="w-5 h-5 text-primary" />
              <div className="text-3xl font-bold text-primary">{counts.sale}</div>
            </div>
            <div className="text-sm text-muted-foreground">{tr.forSale}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Key className="w-5 h-5 text-primary" />
              <div className="text-3xl font-bold text-primary">{counts.rent}</div>
            </div>
            <div className="text-sm text-muted-foreground">{tr.forRent}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-primary" />
              <div className="text-3xl font-bold text-primary">{counts.newBuilding}</div>
            </div>
            <div className="text-sm text-muted-foreground">{tr.newBuild}</div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Property Carousels                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-16">

        {/* New Buildings */}
        {newBuildingProperties.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-primary" />
                  {tr.newBuildingsTitle}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{tr.newBuildingsSubtitle}</p>
              </div>
              <Link href="/categoria/obra-nueva" className="flex items-center gap-1 text-sm text-primary hover:underline">
                {tr.viewAll}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <PropertyCarousel properties={newBuildingProperties} href="/categoria/obra-nueva" />
          </section>
        )}

        {/* Sale */}
        {saleProperties.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <HomeIcon className="w-6 h-6 text-primary" />
                  {tr.saleTitle}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{tr.saleSubtitle}</p>
              </div>
              <Link href="/categoria/venta" className="flex items-center gap-1 text-sm text-primary hover:underline">
                {tr.viewAll}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <PropertyCarousel properties={saleProperties} href="/categoria/venta" />
          </section>
        )}

        {/* Rent */}
        {rentProperties.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Key className="w-6 h-6 text-primary" />
                  {tr.rentTitle}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{tr.rentSubtitle}</p>
              </div>
              <Link href="/categoria/alquiler" className="flex items-center gap-1 text-sm text-primary hover:underline">
                {tr.viewAll}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <PropertyCarousel properties={rentProperties} href="/categoria/alquiler" />
          </section>
        )}

        {/* Fallback: only sale data exists, split it across obra-nueva + alquiler sections */}
        {saleProperties.length > 0 && rentProperties.length === 0 && newBuildingProperties.length === 0 && (
          <>
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    {tr.newBuildingsTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{tr.newBuildingsSubtitle}</p>
                </div>
                <Link href="/categoria/obra-nueva" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  {tr.viewAll}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <PropertyCarousel properties={saleProperties.slice(0, 3)} href="/categoria/obra-nueva" />
              <p className="text-sm text-muted-foreground text-center mt-6">{tr.soonNewBuildings}</p>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <Key className="w-6 h-6 text-primary" />
                    {tr.rentTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{tr.rentSubtitle}</p>
                </div>
                <Link href="/categoria/alquiler" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  {tr.viewAll}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <PropertyCarousel properties={saleProperties.slice(3, 6)} href="/categoria/alquiler" />
              <p className="text-sm text-muted-foreground text-center mt-6">{tr.soonRentals}</p>
            </section>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* About                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section id="nosotros" className="mt-20 py-12 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">{tr.aboutTitle}</h2>
          <p className="text-muted-foreground mb-4">{tr.aboutText}</p>
          <p className="text-sm text-muted-foreground">{tr.aboutSubtext}</p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Contact                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section id="contacto" className="py-12 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">{tr.contactTitle}</h2>
          <p className="text-muted-foreground mb-6">{tr.contactDesc}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@miraluna.com"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors font-semibold"
            >
              {tr.sendEmail}
            </a>
            <a
              href="/buscar"
              className="px-6 py-3 border border-border rounded-lg hover:border-primary transition-colors font-semibold"
            >
              {tr.exploreProperties}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
