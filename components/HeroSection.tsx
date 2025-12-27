'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function HeroSection() {
  const router = useRouter();
  const { locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/buscar');
    }
    // Don't clear the search query so user can see what they searched
  };

  const translations = {
    es: {
      headline: 'Encuentra tu lugar en',
      subtitle: 'Parcelas, obra nueva e inmuebles en la Costa Blanca',
      searchPlaceholder: 'Buscar propiedades en Jávea...',
      properties: 'Propiedades',
      plots: 'Parcelas',
      projects: 'Proyectos',
    },
    en: {
      headline: 'Find your place in',
      subtitle: 'Plots, new builds and properties on the Costa Blanca',
      searchPlaceholder: 'Search properties in Jávea...',
      properties: 'Properties',
      plots: 'Plots',
      projects: 'Projects',
    },
    ru: {
      headline: 'Найди свое место в',
      subtitle: 'Участки, новостройки и недвижимость на Коста Бланка',
      searchPlaceholder: 'Поиск недвижимости в Хавеа...',
      properties: 'Объектов',
      plots: 'Участков',
      projects: 'Проектов',
    },
  };

  const t = translations[locale];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20" id="inicio">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          {t.headline}{' '}
          <span className="gradient-text">Jávea</span>
        </h1>

        <div className="w-32 h-1.5 bg-primary mx-auto mb-6 rounded-full" />

        <p className="text-xl md:text-2xl text-muted mb-12 max-w-2xl mx-auto">
          {t.subtitle}
        </p>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full px-6 py-4 pr-14 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors"
            >
              <Search className="w-6 h-6" />
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 text-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold gradient-text">150+</span>
            <span className="text-muted">{t.properties}</span>
          </div>
          <div className="hidden md:block text-muted">|</div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold gradient-text">50+</span>
            <span className="text-muted">{t.plots}</span>
          </div>
          <div className="hidden md:block text-muted">|</div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold gradient-text">30+</span>
            <span className="text-muted">{t.projects}</span>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-5" />
    </section>
  );
}
