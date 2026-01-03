'use client';

import PropertyCarousel from '@/components/PropertyCarousel';
import { useLanguage } from '@/lib/i18n';
import type { Property } from '@/data/properties';

interface HomeContentProps {
  houses: Property[];
  investments: Property[];
  plots: Property[];
}

export default function HomeContent({ houses, investments, plots }: HomeContentProps) {
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
  );
}
