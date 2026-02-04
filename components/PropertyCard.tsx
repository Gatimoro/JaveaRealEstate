/**
 * PropertyCard Component
 *
 * Displays a property listing card with image, price, specs, and features.
 * Optimized for performance with next/image automatic optimization.
 *
 * PERFORMANCE FEATURES:
 * - Lazy loading: Images load only when scrolled into view
 * - Automatic WebP conversion: 60-80% smaller image sizes
 * - Responsive images: Serves appropriate size for device
 * - Price overlay: Visible without JavaScript
 *
 * SPANISH-FIRST LOADING:
 * - Shows Spanish text immediately (cached in ISR)
 * - Other languages swap in client-side (acceptable flash)
 * - Features load progressively (expandable tags)
 */
'use client';

import { Bed, Bath, Maximize, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { Property } from '@/data/properties';
import type { PropertyCard as PropertyCardType } from '@/lib/supabase/server-queries';
import { useLanguage, getPropertyTitle, getLocalizedField, translations } from '@/lib/i18n';
import { formatPrice, getPricePerSqm } from '@/lib/utils';
import SavePropertyButton from './SavePropertyButton';

interface PropertyCardProps {
  property: Property | PropertyCardType; // Accept both full and minimal property data
  fullWidthMobile?: boolean;
}

export default function PropertyCard({ property, fullWidthMobile = true }: PropertyCardProps) {
  const { locale } = useLanguage();
  const [showAllTags, setShowAllTags] = useState(false);
  const t = translations[locale];

  // For minimal PropertyCard type, use title directly (Spanish only)
  // For full Property type, use getPropertyTitle for translations
  const title = 'title_en' in property
    ? getPropertyTitle(property as Property, locale)
    : property.title;

  // Description only available in full Property type
  const description = 'description' in property
    ? (getLocalizedField(property as Property, 'description', locale) || '')
    : '';

  // Calculate price per square meter using shared utility
  const pricePerSqm = getPricePerSqm(property.price, property.specs?.size);

  // Features only available in full Property type
  const featuresRaw = 'features' in property
    ? (getLocalizedField(property as Property, 'features', locale) || [])
    : [];
  const features = Array.isArray(featuresRaw) ? featuresRaw : [];
  const maxVisibleTags = 3;
  const visibleFeatures = showAllTags ? features : features.slice(0, maxVisibleTags);
  const hasMoreTags = features.length > maxVisibleTags;

  return (
    <div className={`group bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-all duration-300 hover-glow ${fullWidthMobile ? 'w-full' : 'w-full max-w-md'}`}>
      <Link href={`/propiedad/${property.id}`}>
        {/* Image with price overlay - Optimized with next/image */}
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <Image
            src={property.images[0]}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            quality={85}
          />

          {/* Badge */}
          {property.badge && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-primary text-white text-xs sm:text-sm font-semibold rounded-full">
              {property.badge}
            </div>
          )}

          {/* Save button */}
          <div className="absolute top-3 right-3">
            <SavePropertyButton propertyId={property.id} />
          </div>

          {/* Price overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="text-white">
              <div className="text-xl sm:text-2xl font-bold">
                {formatPrice(property.price, locale)}
              </div>
              {pricePerSqm && (
                <div className="text-xs sm:text-sm opacity-90">
                  {formatPrice(pricePerSqm, locale)}/m²
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Location */}
          <div className="text-xs sm:text-sm text-muted-foreground">
            {property.location}
          </div>

          {/* Description - max 2 lines */}
          <p className="text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
            {description || title}
          </p>

          {/* Mandatory specs */}
          <div className="flex items-center gap-4 text-sm text-foreground">
            {property.specs?.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4 text-muted-foreground" />
                <span>{property.specs.bedrooms}</span>
              </div>
            )}
            {property.specs?.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4 text-muted-foreground" />
                <span>{property.specs.bathrooms}</span>
              </div>
            )}
            {property.specs?.size && (
              <div className="flex items-center gap-1">
                <Maximize className="w-4 h-4 text-muted-foreground" />
                <span>{property.specs.size}m²</span>
              </div>
            )}
          </div>

          {/* Optional tags/features */}
          {features.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {visibleFeatures.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 bg-muted text-xs rounded-md text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Expand/collapse button for tags */}
              {hasMoreTags && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAllTags(!showAllTags);
                  }}
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {showAllTags ? (
                    <>
                      <span>Mostrar menos</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>+{features.length - maxVisibleTags} más</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
