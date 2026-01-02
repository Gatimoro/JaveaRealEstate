'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, ExternalLink, Crop, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPropertyById, getProperties } from '@/lib/supabase/queries';
import { allProperties as fallbackProperties } from '@/data/properties';
import type { Property } from '@/data/properties';
import { useLanguage, getPropertyTitle, getLocalizedField, getLocalizedArray } from '@/lib/i18n';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { locale } = useLanguage();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [allProperties, setAllProperties] = useState<Property[]>([]);

  // Fetch property from Supabase
  useEffect(() => {
    async function loadProperty() {
      try {
        setIsLoading(true);
        const prop = await getPropertyById(id);
        if (prop) {
          setProperty(prop);
        } else {
          // Fallback to static data
          const fallbackProp = fallbackProperties.find((p) => p.id === id);
          setProperty(fallbackProp || null);
        }
      } catch (error) {
        console.error('Error loading property from Supabase:', error);
        // Fallback to static data
        const fallbackProp = fallbackProperties.find((p) => p.id === id);
        setProperty(fallbackProp || null);
      } finally {
        setIsLoading(false);
      }
    }

    loadProperty();
  }, [id]);

  // Fetch all properties for "similar properties" feature
  useEffect(() => {
    async function loadAllProperties() {
      try {
        const properties = await getProperties();
        setAllProperties(properties);
      } catch (error) {
        console.error('Error loading all properties:', error);
        // Fallback to static data
        setAllProperties(fallbackProperties);
      }
    }

    loadAllProperties();
  }, []);

  const translations = {
    es: {
      notFound: 'Propiedad no encontrada',
      backToHome: 'Volver al inicio',
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
      lessThan: 'a menos de',
      meters: 'metros',
      at: 'a',
    },
    en: {
      notFound: 'Property not found',
      backToHome: 'Back to home',
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
      lessThan: 'less than',
      meters: 'meters',
      at: 'at',
    },
    ru: {
      notFound: 'Объект не найден',
      backToHome: 'Вернуться на главную',
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
      lessThan: 'менее',
      meters: 'метров',
      at: 'на расстоянии',
    },
  };

  const t = translations[locale];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando propiedad...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t.notFound}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-primary hover:underline"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  const title = getPropertyTitle(property, locale);
  const description = getLocalizedField(property, 'description', locale) || property.description;
  const features = getLocalizedArray(property, 'features', locale);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

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

  // Get similar properties based on property type
  const getSimilarProperties = () => {
    if (!property.coordinates) return [];

    const filtered = allProperties.filter((p) => {
      if (p.id === property.id) return false;
      if (p.type !== property.type) return false;
      return true;
    });

    // For investments: prioritize similar price
    if (property.type === 'investment') {
      return filtered
        .map((p) => ({
          ...p,
          priceDiff: Math.abs(p.price - property.price),
          distance: p.coordinates ? calculateDistance(
            property.coordinates!.lat,
            property.coordinates!.lng,
            p.coordinates.lat,
            p.coordinates.lng
          ) : undefined,
        }))
        .sort((a, b) => a.priceDiff - b.priceDiff)
        .slice(0, 3);
    }

    // For plots: similar price OR location
    if (property.type === 'plot') {
      return filtered
        .filter((p) => p.coordinates !== undefined)
        .map((p) => {
          const distance = calculateDistance(
            property.coordinates!.lat,
            property.coordinates!.lng,
            p.coordinates!.lat,
            p.coordinates!.lng
          );
          const priceDiff = Math.abs(p.price - property.price);
          // Score: combine price similarity and distance (lower is better)
          const score = (priceDiff / property.price) * 50 + distance;
          return { ...p, distance, score };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);
    }

    // For houses: closest first (distance-based)
    return filtered
      .filter((p) => p.coordinates !== undefined)
      .map((p) => ({
        ...p,
        distance: calculateDistance(
          property.coordinates!.lat,
          property.coordinates!.lng,
          p.coordinates!.lat,
          p.coordinates!.lng
        ),
      }))
      .filter((p) => p.distance <= 5) // Within 5km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  };

  const similarProperties = getSimilarProperties();

  const formatDistance = (distanceKm: number) => {
    if (distanceKm < 1) {
      return `${t.lessThan} ${Math.round(distanceKm * 1000)} ${t.meters}`;
    }
    return `${t.at} ${distanceKm.toFixed(1)} km`;
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
            <img
              src={property.images[selectedImageIndex]}
              alt={title}
              className="w-full h-full object-cover"
            />
            {property.badge && (
              <div className="absolute top-4 left-4 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-full">
                {property.badge}
              </div>
            )}

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
                <img
                  src={image}
                  alt={`${title} - ${t.image} ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform"
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
                <span>{property.location}</span>
              </div>
              <div className="text-4xl font-bold gradient-text">
                {formatPrice(property.price)}
              </div>
            </div>

            {/* Specs */}
            <div className="flex flex-wrap items-center gap-6 text-lg py-4 border-y border-border">
              {property.specs.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="w-6 h-6 text-primary" />
                  <span>{property.specs.bedrooms} {t.bedrooms}</span>
                </div>
              )}
              {property.specs.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="w-6 h-6 text-primary" />
                  <span>{property.specs.bathrooms} {t.bathrooms}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Maximize className="w-6 h-6 text-primary" />
                <span>{property.specs.size}m²</span>
              </div>
              {property.specs.plotSize && (
                <div className="flex items-center gap-2">
                  <Crop className="w-6 h-6 text-primary" />
                  <span>{property.specs.plotSize}m² {t.plot}</span>
                </div>
              )}
              {property.specs.roi && (
                <div className="flex items-center gap-2">
                  <span className="text-primary font-semibold">ROI:</span>
                  <span>{property.specs.roi}%</span>
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <div>
                <h2 className="text-2xl font-bold mb-3">{t.description}</h2>
                <p className="text-muted leading-relaxed text-lg">{description}</p>
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

              {property.sourceUrl && (
                <a
                  href={property.sourceUrl}
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

              {property.type === 'investment' && property.specs.roi && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold mb-2">{t.investment}</h4>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex justify-between">
                      <span>{t.annualReturn}</span>
                      <span className="font-semibold text-foreground">{property.specs.roi}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.estimatedIncome}</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice((property.price * property.specs.roi) / 100)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {property.specs.zone && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold mb-2">{t.zone}</h4>
                  <p className="text-sm text-muted">{property.specs.zone}</p>
                </div>
              )}

              {property.specs.buildable !== undefined && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold mb-2">{t.buildability}</h4>
                  <p className="text-sm text-muted">
                    {property.specs.buildable ? t.buildable : t.notBuildable}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-3xl font-bold mb-6">{t.similarProperties}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full justify-items-center md:justify-items-stretch">
              {similarProperties.map((similar) => {
                const similarTitle = getPropertyTitle(similar, locale);
                return (
                  <Link
                    key={similar.id}
                    href={`/propiedad/${similar.id}`}
                    className="group w-full max-w-md md:max-w-none bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all duration-300 hover-glow"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={similar.images[0]}
                        alt={similarTitle}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    {similar.badge && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                        {similar.badge}
                      </div>
                    )}
                  </div>
                    <div className="p-4">
                      {similar.distance !== undefined && (
                        <div className="flex items-center text-sm text-primary mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{formatDistance(similar.distance)}</span>
                        </div>
                      )}
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">{similarTitle}</h3>
                      <p className="text-muted text-sm mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {similar.location}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold gradient-text">
                          {formatPrice(similar.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted mt-3 pt-3 border-t border-border">
                        {similar.specs.bedrooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            <span>{similar.specs.bedrooms}</span>
                          </div>
                        )}
                        {similar.specs.bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            <span>{similar.specs.bathrooms}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Maximize className="w-4 h-4" />
                          <span>{similar.specs.size}m²</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
