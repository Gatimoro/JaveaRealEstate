'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, ExternalLink, Crop, ChevronLeft, ChevronRight } from 'lucide-react';
import { allProperties } from '@/data/properties';
import type { Property } from '@/data/properties';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const property = allProperties.find((p) => p.id === id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Propiedad no encontrada</h1>
          <button
            onClick={() => router.push('/')}
            className="text-primary hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        {/* Image Gallery */}
        <div className="mb-8">
          {/* Hero Image */}
          <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden mb-4 group">
            <img
              src={property.images[selectedImageIndex]}
              alt={property.title}
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
                  alt={`${property.title} - imagen ${index + 1}`}
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
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{property.title}</h1>
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
                  <span>{property.specs.bedrooms} habitaciones</span>
                </div>
              )}
              {property.specs.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="w-6 h-6 text-primary" />
                  <span>{property.specs.bathrooms} baños</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Maximize className="w-6 h-6 text-primary" />
                <span>{property.specs.size}m²</span>
              </div>
              {property.specs.plotSize && (
                <div className="flex items-center gap-2">
                  <Crop className="w-6 h-6 text-primary" />
                  <span>{property.specs.plotSize}m² parcela</span>
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
            {property.description && (
              <div>
                <h2 className="text-2xl font-bold mb-3">Descripción</h2>
                <p className="text-muted leading-relaxed text-lg">{property.description}</p>
              </div>
            )}

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-3">Características</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature, index) => (
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
              <h3 className="text-xl font-bold">Información de contacto</h3>

              {property.sourceUrl && (
                <a
                  href={property.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  <span>Ver oferta original</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted mb-4">
                  ¿Interesado en esta propiedad? Contacta con nosotros para más información.
                </p>
                <button className="w-full bg-card border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors">
                  Solicitar información
                </button>
              </div>

              {property.type === 'investment' && property.specs.roi && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold mb-2">Inversión</h4>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex justify-between">
                      <span>Rentabilidad anual:</span>
                      <span className="font-semibold text-foreground">{property.specs.roi}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ingresos estimados/año:</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice((property.price * property.specs.roi) / 100)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {property.specs.zone && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold mb-2">Zona</h4>
                  <p className="text-sm text-muted">{property.specs.zone}</p>
                </div>
              )}

              {property.specs.buildable !== undefined && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold mb-2">Edificabilidad</h4>
                  <p className="text-sm text-muted">
                    {property.specs.buildable ? '✓ Edificable' : '✗ No edificable'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
