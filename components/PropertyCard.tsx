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

import { Bed, Bath, Maximize, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import type { Property } from '@/data/properties';
import type { PropertyCard as PropertyCardType } from '@/lib/supabase/server-queries';
import { useLanguage, getPropertyTitle, getLocalizedField, translations } from '@/lib/i18n';
import { formatPrice, getPricePerSqm } from '@/lib/utils';
import { getPropertyHref } from '@/lib/seo';
import SavePropertyButton from './SavePropertyButton';

interface PropertyCardProps {
  property: Property | PropertyCardType; // Accept both full and minimal property data
  fullWidthMobile?: boolean;
}

// Spec keys already displayed as icons — exclude from extra tags
const KNOWN_SPEC_KEYS = new Set(['bedrooms', 'bathrooms', 'size', 'area', 'plotSize', 'roi', 'zone', 'buildable']);

/** Remove known "no photo" placeholder URLs from external scrapers */
function filterImages(urls: string[]): string[] {
  return urls.filter(url =>
    url &&
    !url.includes('default_nophoto') &&
    !url.includes('nophoto') &&
    !url.includes('no_photo') &&
    !url.includes('no-photo')
  );
}

// Badge key → i18n key mapping
const badgeI18nMap: Record<string, keyof typeof translations['es']> = {
  new: 'badgeNew',
  most_viewed: 'badgeMostViewed',
  most_saved: 'badgeMostSaved',
};

/** Swipeable image slider for mobile, lazy-loads extras beyond thumbnail */
function ImageSlider({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedUpTo, setLoadedUpTo] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
      if (index > loadedUpTo) setLoadedUpTo(index);
    }
  }

  function markFailed(i: number) {
    setFailedImages(prev => { const next = new Set(prev); next.add(i); return next; });
  }

  return (
    <div className="relative w-full h-full">
      {/* Slides */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hidden w-full h-full"
      >
        {images.map((src, i) => (
          <div key={i} className="flex-none w-full h-full relative snap-start">
            {i <= loadedUpTo + 1 ? (
              failedImages.has(i) ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted">
                  <Building2 className="w-12 h-12 text-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground">Sin imagen</span>
                </div>
              ) : (
                <Image
                  src={src}
                  alt={`${title} - ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  quality={85}
                  onError={() => markFailed(i)}
                />
              )
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === activeIndex ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertyCard({ property, fullWidthMobile = true }: PropertyCardProps) {
  const { locale } = useLanguage();
  const [showAllTags, setShowAllTags] = useState(false);
  const [imgError, setImgError] = useState(false);
  const t = translations[locale];

  // For minimal PropertyCard type, use title directly (Spanish only)
  // For full Property type, use getPropertyTitle for translations
  const rawTitle = 'title_en' in property
    ? getPropertyTitle(property as Property, locale)
    : property.title;

  // Fallback: sub_category label → generic "Property"
  const subCategoryLabel: Record<string, Record<string, string>> = {
    apartment: { es: 'Apartamento', en: 'Apartment', ru: 'Квартира' },
    house:     { es: 'Casa',        en: 'House',      ru: 'Дом' },
    commerce:  { es: 'Local',       en: 'Commercial', ru: 'Коммерческая' },
    plot:      { es: 'Parcela',     en: 'Plot',       ru: 'Участок' },
  };
  const title = rawTitle
    || subCategoryLabel[property.sub_category ?? '']?.[locale]
    || (locale === 'ru' ? 'Недвижимость' : locale === 'en' ? 'Property' : 'Propiedad');

  // Description only available in full Property type
  const description = 'description' in property
    ? (getLocalizedField(property as Property, 'description', locale) || '')
    : '';

  const specsRooms = property.specs?.bedrooms;
  const specsBaths = property.specs?.bathrooms;
  const specsSize = property.specs?.size;

  // Calculate price per square meter using shared utility
  const pricePerSqm = getPricePerSqm(property.price, specsSize);

  // Features only available in full Property type
  const featuresRaw = 'features' in property
    ? (getLocalizedField(property as Property, 'features', locale) || [])
    : [];
  const features = Array.isArray(featuresRaw) ? featuresRaw : [];

  // Extra spec fields (non-standard keys) shown as additional tags
  const specTags = Object.entries(property.specs || {})
    .filter(([key, val]) => !KNOWN_SPEC_KEYS.has(key) && val != null && String(val).trim() !== '')
    .map(([, val]) => String(val));
  const allTags = [...features, ...specTags];

  const maxVisibleTags = 3;
  const visibleTags = showAllTags ? allTags : allTags.slice(0, maxVisibleTags);
  const hasMoreTags = allTags.length > maxVisibleTags;

  const images = filterImages(property.images ?? []);
  const hasMultipleImages = images.length > 1;

  // Localized badge text
  const badgeText = property.badge
    ? (t[badgeI18nMap[property.badge] as keyof typeof t] as string | undefined ?? property.badge)
    : null;

  return (
    <div className={`group bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-all duration-300 hover-glow ${fullWidthMobile ? 'w-full' : 'w-full max-w-md'}`}>
      <Link href={getPropertyHref(property)}>
        {/* Image with price overlay - Optimized with next/image */}
        <div className="relative h-48 sm:h-56 overflow-hidden bg-muted">
          {hasMultipleImages ? (
            <ImageSlider images={images} title={title} />
          ) : images[0] && !imgError ? (
            <Image
              src={images[0]}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              quality={85}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Building2 className="w-16 h-16 text-muted-foreground/30" />
              <span className="text-xs text-muted-foreground">Sin imagen</span>
            </div>
          )}

          {/* Badge */}
          {badgeText && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-primary text-white text-xs sm:text-sm font-semibold rounded-full z-10">
              {badgeText}
            </div>
          )}

          {/* Save button */}
          <div className="absolute top-3 right-3 z-10">
            <SavePropertyButton propertyId={property.id} />
          </div>

          {/* Price overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
            <div className="text-white">
              <div className="text-xl sm:text-2xl font-bold flex items-baseline gap-1">
                {formatPrice(property.price, locale)}
                {property.listing_type === 'rent' && 'rent_period' in property && property.rent_period && (
                  <span className="text-sm font-normal opacity-80">
                    /{property.rent_period === 'week' ? t.perWeek : t.perMonth}
                  </span>
                )}
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
            {specsRooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4 text-muted-foreground" />
                <span>{specsRooms}</span>
              </div>
            )}
            {specsBaths && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4 text-muted-foreground" />
                <span>{specsBaths}</span>
              </div>
            )}
            {specsSize && (
              <div className="flex items-center gap-1">
                <Maximize className="w-4 h-4 text-muted-foreground" />
                <span>{specsSize}m²</span>
              </div>
            )}
          </div>

          {/* Optional tags/features */}
          {allTags.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {visibleTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 bg-muted text-xs rounded-md text-muted-foreground"
                  >
                    {tag}
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
                      <span>+{allTags.length - maxVisibleTags} más</span>
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
