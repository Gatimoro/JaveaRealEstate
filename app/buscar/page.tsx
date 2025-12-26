'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { allProperties } from '@/data/properties';
import PropertyCard from '@/components/PropertyCard';
import InvestmentCard from '@/components/InvestmentCard';
import PlotCard from '@/components/PlotCard';
import type { Property } from '@/data/properties';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minSize: '',
    type: 'all',
  });

  const filteredProperties = useMemo(() => {
    return allProperties.filter((property) => {
      // Search query filter
      const matchesQuery =
        query === '' ||
        property.title.toLowerCase().includes(query.toLowerCase()) ||
        property.location.toLowerCase().includes(query.toLowerCase()) ||
        property.description?.toLowerCase().includes(query.toLowerCase());

      // Price filters
      const matchesMinPrice =
        filters.minPrice === '' || property.price >= Number(filters.minPrice);
      const matchesMaxPrice =
        filters.maxPrice === '' || property.price <= Number(filters.maxPrice);

      // Bedrooms filter
      const matchesBedrooms =
        filters.bedrooms === '' ||
        (property.specs.bedrooms && property.specs.bedrooms >= Number(filters.bedrooms));

      // Bathrooms filter
      const matchesBathrooms =
        filters.bathrooms === '' ||
        (property.specs.bathrooms && property.specs.bathrooms >= Number(filters.bathrooms));

      // Size filter
      const matchesSize =
        filters.minSize === '' || property.specs.size >= Number(filters.minSize);

      // Type filter
      const matchesType = filters.type === 'all' || property.type === filters.type;

      return (
        matchesQuery &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesBedrooms &&
        matchesBathrooms &&
        matchesSize &&
        matchesType
      );
    });
  }, [query, filters]);

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minSize: '',
      type: 'all',
    });
  };

  const renderPropertyCard = (property: Property) => {
    switch (property.type) {
      case 'investment':
        return <InvestmentCard key={property.id} property={property} />;
      case 'plot':
        return <PlotCard key={property.id} property={property} />;
      default:
        return <PropertyCard key={property.id} property={property} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {query ? `Resultados para "${query}"` : 'Todas las propiedades'}
          </h1>
          <p className="text-muted">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border rounded-lg mb-4 hover:border-primary transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filtros</span>
              </button>

              {/* Filters Panel */}
              <div className={`bg-card border border-border rounded-xl p-6 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Filtros</h2>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:text-orange-400 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Tipo de propiedad</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todas</option>
                    <option value="house">Casas y Pisos</option>
                    <option value="investment">Inversiones</option>
                    <option value="plot">Parcelas</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Precio</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Mín €"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Máx €"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Habitaciones (mínimo)</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Cualquiera</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Baños (mínimo)</label>
                  <select
                    value={filters.bathrooms}
                    onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Cualquiera</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Tamaño mínimo (m²)</label>
                  <input
                    type="number"
                    placeholder="m²"
                    value={filters.minSize}
                    onChange={(e) => setFilters({ ...filters, minSize: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1">
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property) => renderPropertyCard(property))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted mb-4">No se encontraron propiedades</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted">Cargando...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
