'use client';

import { Bed, Bath, Maximize, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { Property } from '@/data/properties';
import { useLanguage, getPropertyTitle } from '@/lib/i18n';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { locale } = useLanguage();

  const translations = {
    es: { bedrooms: 'hab', bathrooms: 'baños' },
    en: { bedrooms: 'beds', bathrooms: 'baths' },
    ru: { bedrooms: 'спален', bathrooms: 'ванных' },
  };

  const t = translations[locale];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const title = getPropertyTitle(property, locale);

  return (
    <Link href={`/propiedad/${property.id}`} className="group flex-shrink-0 w-full min-w-[280px] max-w-[320px] bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all duration-300 hover-glow block">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.images[0]}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {property.badge && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-primary text-white text-sm font-semibold rounded-full">
            {property.badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Price */}
        <div className="text-2xl font-bold gradient-text">
          {formatPrice(property.price)}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>

        {/* Location */}
        <div className="flex items-center text-muted text-sm">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-sm text-muted pt-2 border-t border-border">
          {property.specs.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.specs.bedrooms} {t.bedrooms}</span>
            </div>
          )}
          {property.specs.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.specs.bathrooms} {t.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4" />
            <span>{property.specs.size}m²</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
