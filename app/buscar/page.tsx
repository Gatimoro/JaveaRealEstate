'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProperties } from '@/lib/supabase/queries';
import { allProperties as fallbackProperties } from '@/data/properties';
import PropertyCard from '@/components/PropertyCard';
import InvestmentCard from '@/components/InvestmentCard';
import PlotCard from '@/components/PlotCard';
import type { Property } from '@/data/properties';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage, getLocalizedField } from '@/lib/i18n';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || 'all';
  const { locale } = useLanguage();

  // State for properties
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch properties from Supabase
  useEffect(() => {
    async function loadProperties() {
      try {
        setIsLoading(true);
        const properties = await getProperties();
        setAllProperties(properties);
      } catch (error) {
        console.error('Error loading properties from Supabase:', error);
        // Fallback to static data
        setAllProperties(fallbackProperties);
      } finally {
        setIsLoading(false);
      }
    }

    loadProperties();
  }, []);

  const translations = {
    es: {
      resultsFor: 'Resultados para',
      allProperties: 'Todas las propiedades',
      propertyFound: 'propiedad encontrada',
      propertiesFound: 'propiedades encontradas',
      filters: 'Filtros',
      clear: 'Limpiar',
      propertyType: 'Tipo de propiedad',
      all: 'Todas',
      housesApartments: 'Casas y Pisos',
      investments: 'Inversiones',
      plots: 'Parcelas',
      price: 'Precio',
      minPrice: 'Mín €',
      maxPrice: 'Máx €',
      minBedrooms: 'Habitaciones (mínimo)',
      minBathrooms: 'Baños (mínimo)',
      minSize: 'Tamaño mínimo (m²)',
      any: 'Cualquiera',
      sizePlaceholder: 'm²',
      noResults: 'No se encontraron propiedades',
      clearFilters: 'Limpiar filtros',
      loading: 'Cargando...',
      page: 'Página',
      of: 'de',
      previous: 'Anterior',
      next: 'Siguiente',
    },
    en: {
      resultsFor: 'Results for',
      allProperties: 'All properties',
      propertyFound: 'property found',
      propertiesFound: 'properties found',
      filters: 'Filters',
      clear: 'Clear',
      propertyType: 'Property type',
      all: 'All',
      housesApartments: 'Houses & Apartments',
      investments: 'Investments',
      plots: 'Land Plots',
      price: 'Price',
      minPrice: 'Min €',
      maxPrice: 'Max €',
      minBedrooms: 'Bedrooms (minimum)',
      minBathrooms: 'Bathrooms (minimum)',
      minSize: 'Minimum size (m²)',
      any: 'Any',
      sizePlaceholder: 'm²',
      noResults: 'No properties found',
      clearFilters: 'Clear filters',
      loading: 'Loading...',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
    },
    ru: {
      resultsFor: 'Результаты для',
      allProperties: 'Вся недвижимость',
      propertyFound: 'объект найден',
      propertiesFound: 'объектов найдено',
      filters: 'Фильтры',
      clear: 'Очистить',
      propertyType: 'Тип недвижимости',
      all: 'Все',
      housesApartments: 'Дома и квартиры',
      investments: 'Инвестиции',
      plots: 'Участки',
      price: 'Цена',
      minPrice: 'Мин €',
      maxPrice: 'Макс €',
      minBedrooms: 'Спален (минимум)',
      minBathrooms: 'Ванных (минимум)',
      minSize: 'Минимальный размер (м²)',
      any: 'Любой',
      sizePlaceholder: 'м²',
      noResults: 'Нет объектов недвижимости',
      clearFilters: 'Очистить фильтры',
      loading: 'Загрузка...',
      page: 'Страница',
      of: 'из',
      previous: 'Назад',
      next: 'Далее',
    },
  };

  const t = translations[locale];

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(40);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minSize: '',
    type: typeParam,
  });

  // Detect screen size for responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth < 768 ? 20 : 40);
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filters]);

  const filteredProperties = useMemo(() => {
    return allProperties.filter((property) => {
      // Search query filter - check localized fields
      const title = getLocalizedField(property, 'title', locale) || property.title;
      const description = getLocalizedField(property, 'description', locale) || property.description;
      const matchesQuery =
        query === '' ||
        title.toLowerCase().includes(query.toLowerCase()) ||
        property.location.toLowerCase().includes(query.toLowerCase()) ||
        description?.toLowerCase().includes(query.toLowerCase());

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

  // Calculate pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      <div className="container mx-auto px-2 sm:px-4 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {query ? `${t.resultsFor} "${query}"` : t.allProperties}
          </h1>
          <p className="text-muted">
            {filteredProperties.length} {filteredProperties.length === 1 ? t.propertyFound : t.propertiesFound}
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
                <span>{t.filters}</span>
              </button>

              {/* Filters Panel */}
              <div className={`bg-card border border-border rounded-xl p-6 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{t.filters}</h2>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:text-orange-400 transition-colors"
                  >
                    {t.clear}
                  </button>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.propertyType}</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">{t.all}</option>
                    <option value="house">{t.housesApartments}</option>
                    <option value="investment">{t.investments}</option>
                    <option value="plot">{t.plots}</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.price}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder={t.minPrice}
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder={t.maxPrice}
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.minBedrooms}</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t.any}</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.minBathrooms}</label>
                  <select
                    value={filters.bathrooms}
                    onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t.any}</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.minSize}</label>
                  <input
                    type="number"
                    placeholder={t.sizePlaceholder}
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
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">{t.loading}</p>
              </div>
            ) : filteredProperties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mx-auto max-w-[95%] sm:max-w-full">
                  {paginatedProperties.map((property) => (
                    <div key={property.id} className="w-full">
                      {renderPropertyCard(property)}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                    {/* Previous Button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span className="hidden sm:inline">{t.previous}</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-2">
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => goToPage(1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:border-primary transition-colors"
                          >
                            1
                          </button>
                          {currentPage > 4 && <span className="text-muted">...</span>}
                        </>
                      )}

                      {/* Pages around current */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === currentPage ||
                            page === currentPage - 1 ||
                            page === currentPage + 1 ||
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          );
                        })
                        .map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                              currentPage === page
                                ? 'bg-primary text-white border-primary'
                                : 'border-border hover:border-primary'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="text-muted">...</span>}
                          <button
                            onClick={() => goToPage(totalPages)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:border-primary transition-colors"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border"
                    >
                      <span className="hidden sm:inline">{t.next}</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Page Info */}
                    <div className="text-sm text-muted sm:absolute sm:right-4">
                      {t.page} {currentPage} {t.of} {totalPages}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted mb-4">{t.noResults}</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  {t.clearFilters}
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

function LoadingFallback() {
  const { locale } = useLanguage();
  const loadingText = {
    es: 'Cargando...',
    en: 'Loading...',
    ru: 'Загрузка...',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl text-muted">{loadingText[locale]}</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SearchContent />
    </Suspense>
  );
}
