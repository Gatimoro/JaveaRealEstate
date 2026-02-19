'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PropertyCard from './PropertyCard';
import { useLanguage, translations } from '@/lib/i18n';
import type { PropertyCard as PropertyCardType } from '@/lib/supabase/server-queries';
import type { Property } from '@/data/properties';

interface PropertyCarouselProps {
  properties: (PropertyCardType | Property)[];
  href: string;
}

export default function PropertyCarousel({ properties, href }: PropertyCarouselProps) {
  const { locale } = useLanguage();
  const t = translations[locale];

  return (
    <>
      {/* Mobile: horizontal scroll carousel */}
      <div
        className="flex lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hidden gap-4 pb-4"
      >
        {properties.map((property) => (
          <div key={property.id} className="flex-none w-[82vw] snap-start">
            <PropertyCard property={property} fullWidthMobile={false} />
          </div>
        ))}

        {/* "Explorar todos" CTA card — mobile */}
        <div className="flex-none w-[82vw] snap-start">
          <Link
            href={href}
            className="flex flex-col items-center justify-center gap-3 h-full min-h-[320px] rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/30 hover:from-primary/20 hover:to-primary/40 transition-all text-center p-6"
          >
            <ArrowRight className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold text-primary">
              {t.exploreAll}
            </span>
          </Link>
        </div>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden lg:grid grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}

        {/* "Explorar todos" CTA card — desktop (7th cell) */}
        <Link
          href={href}
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/30 hover:from-primary/20 hover:to-primary/40 transition-all text-center p-6 min-h-[200px]"
        >
          <ArrowRight className="w-8 h-8 text-primary" />
          <span className="text-lg font-semibold text-primary">
            {t.exploreAll}
          </span>
        </Link>
      </div>
    </>
  );
}
