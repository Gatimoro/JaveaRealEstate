/**
 * Property Detail Client Component
 *
 * Client-side interactive features for property detail page.
 * This component receives property data from the server component
 * and handles:
 * - Image carousel
 * - Similar properties
 * - Save/favorite button
 * - Language switching
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, ExternalLink, Crop, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProperties } from '@/lib/supabase/queries';
import { allProperties as fallbackProperties } from '@/data/properties';
import type { Property } from '@/data/properties';
import { useLanguage, getPropertyTitle, getLocalizedField, getLocalizedArray } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { getPropertyHref } from '@/lib/seo';
import SavePropertyButton from '@/components/SavePropertyButton';

interface PropertyDetailClientProps {
  property: Property;
}

export default function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const router = useRouter();
  const { locale } = useLanguage();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [allProperties, setAllProperties] = useState<Property[]>([]);

  // Track unique view — fires once on mount, fire-and-forget via sendBeacon
  useEffect(() => {
    let sessionId = localStorage.getItem('vid');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('vid', sessionId);
    }

    const payload = JSON.stringify({ propertyId: property.id, sessionId });
    const blob = new Blob([payload], { type: 'application/json' });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track-view', blob);
    } else {
      fetch('/api/track-view', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch all properties for recommendations
  useEffect(() => {
    async function loadAllProperties() {
      try {
        const properties = await getProperties();
        setAllProperties(properties);
      } catch (error) {
        console.error('Error loading all properties:', error);
        setAllProperties(fallbackProperties);
      }
    }

    loadAllProperties();
  }, []);

  const translations = {
    es: {
      back: 'Volver',
      image: 'imagen',
      bedrooms: 'habitaciones',
      bathrooms: 'baños',
      plot: 'parcela',
      description: 'Descripción',
      features: 'Características',
      contactInfo: 'Información de contacto',
      viewOriginal: 'Ver oferta original',
      interested: '¿Interesado en esta propiedad? Contacta con nosotros para más información.',
      requestInfo: 'Solicitar información',
      investment: 'Inversión',
      annualReturn: 'Rentabilidad anual:',
      estimatedIncome: 'Ingresos estimados/año:',
      zone: 'Zona',
      buildability: 'Edificabilidad',
      buildable: '✓ Edificable',
      notBuildable: '✗ No edificable',
      similarProperties: 'Propiedades similares cerca',
      biggerProperties: 'Propiedades más amplias',
      cheaperProperties: 'Alternativas más económicas',
      otherInvestments: 'Otras oportunidades de inversión',
      lessThan: 'a menos de',
      meters: 'metros',
      at: 'a',
      bigger: 'más grande',
      cheaper: 'más económico',
      perWeek: 'semana',
      perMonth: 'mes',
    },
    en: {
      back: 'Back',
      image: 'image',
      bedrooms: 'bedrooms',
      bathrooms: 'bathrooms',
      plot: 'plot',
      description: 'Description',
      features: 'Features',
      contactInfo: 'Contact Information',
      viewOriginal: 'View original listing',
      interested: 'Interested in this property? Contact us for more information.',
      requestInfo: 'Request information',
      investment: 'Investment',
      annualReturn: 'Annual return:',
      estimatedIncome: 'Estimated income/year:',
      zone: 'Zone',
      buildability: 'Buildability',
      buildable: '✓ Buildable',
      notBuildable: '✗ Not buildable',
      similarProperties: 'Similar properties nearby',
      biggerProperties: 'Larger properties',
      cheaperProperties: 'More affordable options',
      otherInvestments: 'Other investment opportunities',
      lessThan: 'less than',
      meters: 'meters',
      at: 'at',
      bigger: 'larger',
      cheaper: 'more affordable',
      perWeek: 'week',
      perMonth: 'month',
    },
    ru: {
      back: 'Назад',
      image: 'изображение',
      bedrooms: 'спален',
      bathrooms: 'ванных',
      plot: 'участок',
      description: 'Описание',
      features: 'Характеристики',
      contactInfo: 'Контактная информация',
      viewOriginal: 'Смотреть оригинал',
      interested: 'Заинтересованы в этом объекте? Свяжитесь с нами для получения дополнительной информации.',
      requestInfo: 'Запросить информацию',
      investment: 'Инвестиции',
      annualReturn: 'Годовая доходность:',
      estimatedIncome: 'Ожидаемый доход/год:',
      zone: 'Зона',
      buildability: 'Застройка',
      buildable: '✓ Возможна застройка',
      notBuildable: '✗ Застройка невозможна',
      similarProperties: 'Похожие объекты рядом',
      biggerProperties: 'Более просторные объекты',
      cheaperProperties: 'Более доступные варианты',
      otherInvestments: 'Другие инвестиционные возможности',
      lessThan: 'менее',
      meters: 'метров',
      at: 'на расстоянии',
      bigger: 'больше',
      cheaper: 'дешевле',
      perWeek: 'неделю',
      perMonth: 'месяц',
    },
  };

  const t = translations[locale];

  const title = getPropertyTitle(property, locale);
  const description = getLocalizedField(property, 'description', locale) || '';
  const features = getLocalizedArray(property, 'features', locale);

  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Helper: Normalize sub_category (treat house and apartment as the same for recommendations)
  const normalizeSubCategory = (sub: string | undefined) => {
    if (sub === 'house' || sub === 'apartment') return 'residential';
    return sub ?? '';
  };

  // 1. Similar nearby properties (same sub_category, nearby location or same neighborhood)
  const getSimilarNearbyProperties = () => {
    const currentType = normalizeSubCategory(property.sub_category);

    const filtered = allProperties.filter((p) => {
      if (p.id === property.id) return false;
      if (normalizeSubCategory(p.sub_category) !== currentType) return false;
      return true;
    });

    // If we have coordinates, sort by distance
    if (property.coordinates || (property.latitude && property.longitude)) {
      const lat = property.coordinates?.lat || property.latitude;
      const lng = property.coordinates?.lng || property.longitude;

      return filtered
        .filter((p) => (p.coordinates || (p.latitude && p.longitude)) !== undefined)
        .map((p) => ({
          ...p,
          distance: calculateDistance(
            lat!,
            lng!,
            p.coordinates?.lat || p.latitude!,
            p.coordinates?.lng || p.longitude!
          ),
        }))
        .filter((p) => p.distance <= 10) // Within 10km
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 4);
    }

    // Fallback: same municipality/area from location string
    const currentLocation = property.municipality || property.location?.toLowerCase() || '';
    return filtered
      .map((p) => {
        const pLocation = p.municipality || p.location?.toLowerCase() || '';
        const matchScore = currentLocation === pLocation ? 1 : 0;
        return { ...p, matchScore };
      })
      .filter((p) => p.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);
  };

  const similarProperties = getSimilarNearbyProperties();

  // Property card component for carousels
  const PropertyCarouselCard = ({ prop, badge }: { prop: Property & { distance?: number }, badge?: string }) => {
    const cardTitle = getPropertyTitle(prop, locale);
    return (
      <Link
        key={prop.id}
        href={getPropertyHref(prop)}
        className="group w-full max-w-md md:max-w-none bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all duration-300 hover-glow"
      >
        <div className="relative h-48 overflow-hidden">
          <Image
            src={prop.images[0]}
            alt={cardTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {(prop.badge || badge) && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
              {badge || prop.badge}
            </div>
          )}
        </div>
        <div className="p-4">
          {prop.distance !== undefined && (
            <div className="flex items-center text-sm text-primary mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{prop.distance < 1 ? `${Math.round(prop.distance * 1000)} ${t.meters}` : `${prop.distance.toFixed(1)} km`}</span>
            </div>
          )}
          <h3 className="font-bold text-lg mb-2 line-clamp-1">{cardTitle}</h3>
          <p className="text-muted text-sm mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {prop.municipality || prop.location}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold gradient-text">
              {formatPrice(prop.price, locale)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted mt-3 pt-3 border-t border-border">
            {prop.specs?.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{prop.specs.bedrooms}</span>
              </div>
            )}
            {prop.specs?.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{prop.specs.bathrooms}</span>
              </div>
            )}
            {prop.specs?.size && (
              <div className="flex items-center gap-1">
                <Maximize className="w-4 h-4" />
                <span>{prop.specs.size}m²</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </button>

        {/* Image Gallery */}
        <div className="mb-8">
          {/* Hero Image */}
          <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden mb-4 group">
            <Image
              src={property.images[selectedImageIndex]}
              alt={`${title} - ${t.image} ${selectedImageIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
              priority
              quality={90}
            />
            {property.badge && (
              <div className="absolute top-4 left-4 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-full">
                {property.badge}
              </div>
            )}

            {/* Save button */}
            <div className="absolute top-4 right-4">
              <SavePropertyButton propertyId={property.id} />
            </div>

            {/* Navigation Arrows - Only show if more than 1 image */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                  {selectedImageIndex + 1} / {property.images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Row */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index
                    ? 'border-primary scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Image
                  src={image}
                  alt={`${title} - ${t.image} ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Location */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
              <div className="flex items-center text-muted text-lg mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{property.municipality || property.location}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold gradient-text">
                  {formatPrice(property.price, locale)}
                </div>
                {property.listing_type === 'rent' && property.rent_period && (
                  <span className="text-lg text-muted-foreground">
                    /{property.rent_period === 'week' ? t.perWeek : t.perMonth}
                  </span>
                )}
              </div>
            </div>

            {/* Specs */}
            <div className="flex flex-wrap items-center gap-6 text-lg py-4 border-y border-border">
              {property.specs?.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="w-6 h-6 text-primary" />
                  <span>{property.specs.bedrooms} {t.bedrooms}</span>
                </div>
              )}
              {property.specs?.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="w-6 h-6 text-primary" />
                  <span>{property.specs.bathrooms} {t.bathrooms}</span>
                </div>
              )}
              {property.specs?.size && (
                <div className="flex items-center gap-2">
                  <Maximize className="w-6 h-6 text-primary" />
                  <span>{property.specs.size}m²</span>
                </div>
              )}
              {property.specs?.plotSize && (
                <div className="flex items-center gap-2">
                  <Crop className="w-6 h-6 text-primary" />
                  <span>{property.specs.plotSize}m² {t.plot}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <div>
                <h2 className="text-2xl font-bold mb-3">{t.description}</h2>
                <p className="text-muted leading-relaxed text-lg whitespace-pre-wrap">{description}</p>
              </div>
            )}

            {/* Features */}
            {features && features.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-3">{t.features}</h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-card border border-border rounded-full text-sm hover:border-primary transition-colors"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4 sticky top-8">
              <h3 className="text-xl font-bold">{t.contactInfo}</h3>

              {property.source_url && (
                <a
                  href={property.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  <span>{t.viewOriginal}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted mb-4">
                  {t.interested}
                </p>
                <button className="w-full bg-card border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors">
                  {t.requestInfo}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-3xl font-bold mb-6">{t.similarProperties}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((similar) => (
                <PropertyCarouselCard key={similar.id} prop={similar} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
