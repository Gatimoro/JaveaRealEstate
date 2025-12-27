'use client';

import { Home, TrendingUp, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function CategoryCards() {
  const { locale } = useLanguage();

  const translations = {
    es: {
      housesTitle: 'Casas y Pisos',
      housesDesc: 'Propiedades residenciales',
      investmentsTitle: 'Oportunidades de Inversión',
      investmentsDesc: 'Proyectos con alta rentabilidad',
      plotsTitle: 'Parcelas',
      plotsDesc: 'Terrenos edificables',
    },
    en: {
      housesTitle: 'Houses & Apartments',
      housesDesc: 'Residential properties',
      investmentsTitle: 'Investment Opportunities',
      investmentsDesc: 'High-yield projects',
      plotsTitle: 'Land Plots',
      plotsDesc: 'Buildable land',
    },
    ru: {
      housesTitle: 'Дома и квартиры',
      housesDesc: 'Жилая недвижимость',
      investmentsTitle: 'Инвестиционные возможности',
      investmentsDesc: 'Проекты с высокой доходностью',
      plotsTitle: 'Участки',
      plotsDesc: 'Земля под застройку',
    },
  };

  const t = translations[locale];

  const categories = [
    {
      icon: Home,
      title: t.housesTitle,
      description: t.housesDesc,
      href: '#casas',
    },
    {
      icon: TrendingUp,
      title: t.investmentsTitle,
      description: t.investmentsDesc,
      href: '#inversiones',
    },
    {
      icon: MapPin,
      title: t.plotsTitle,
      description: t.plotsDesc,
      href: '#parcelas',
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <a
              key={index}
              href={category.href}
              className="group relative bg-card border border-border rounded-xl p-8 hover:border-primary transition-all duration-300 hover-glow"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-orange-400/10 to-orange-600/10 rounded-lg group-hover:from-orange-400/20 group-hover:to-orange-600/20 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{category.title}</h3>
                <p className="text-muted text-sm">{category.description}</p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
