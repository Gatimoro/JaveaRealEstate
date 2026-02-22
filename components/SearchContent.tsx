'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import InvestmentCard from '@/components/InvestmentCard';
import PlotCard from '@/components/PlotCard';
import { useLanguage } from '@/lib/i18n';
import type { Property } from '@/data/properties';

interface SearchContentProps {
  properties: Property[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function SearchContent({ properties, pagination }: SearchContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const { locale } = useLanguage();

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
      houses: 'Casas',
      apartments: 'Apartamentos',
      investments: 'Inversiones',
      plots: 'Parcelas',
      price: 'Precio',
      minPrice: 'Mín €',
      maxPrice: 'Máx €',
      minBedrooms: 'Habitaciones (mínimo)',
      any: 'Cualquiera',
      noResults: 'No se encontraron propiedades',
      clearFilters: 'Limpiar filtros',
      page: 'Página',
      of: 'de',
      previous: 'Anterior',
      next: 'Siguiente',
      searchPlaceholder: 'Buscar por ubicación, título...',
      search: 'Buscar',
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
      houses: 'Houses',
      apartments: 'Apartments',
      investments: 'Investments',
      plots: 'Land Plots',
      price: 'Price',
      minPrice: 'Min €',
      maxPrice: 'Max €',
      minBedrooms: 'Bedrooms (minimum)',
      any: 'Any',
      noResults: 'No properties found',
      clearFilters: 'Clear filters',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
      searchPlaceholder: 'Search by location, title...',
      search: 'Search',
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
      houses: 'Дома',
      apartments: 'Квартиры',
      investments: 'Инвестиции',
      plots: 'Участки',
      price: 'Цена',
      minPrice: 'Мин €',
      maxPrice: 'Макс €',
      minBedrooms: 'Спален (минимум)',
      any: 'Любой',
      noResults: 'Нет объектов недвижимости',
      clearFilters: 'Очистить фильтры',
      page: 'Страница',
      of: 'из',
      previous: 'Назад',
      next: 'Далее',
      searchPlaceholder: 'Поиск по местоположению, названию...',
      search: 'Искать',
    },
  };

  const t = translations[locale];
  const [showFilters, setShowFilters] = useState(false);
  // Local state for search input (only committed on form submit)
  const [searchInput, setSearchInput] = useState(query);

  // Read current filter values from URL
  const currentType = searchParams.get('type') || 'all';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentBedrooms = searchParams.get('bedrooms') || '';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // Reset to page 1 when filters change
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/buscar?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (searchInput.trim()) {
      params.set('q', searchInput.trim());
    } else {
      params.delete('q');
    }
    router.push(`/buscar?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchInput('');
    router.push('/buscar');
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    router.push(`/buscar?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPropertyCard = (property: Property) => {
    switch (property.sub_category) {
      case 'commerce':
        return <InvestmentCard key={property.id} property={property} />;
      case 'plot':
        return <PlotCard key={property.id} property={property} />;
      default:
        return <PropertyCard key={property.id} property={property} />;
    }
  };

  const { page: currentPage, totalPages, totalCount } = pagination;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {query ? `${t.resultsFor} "${query}"` : t.allProperties}
        </h1>
        <p className="text-muted-foreground">
          {totalCount} {totalCount === 1 ? t.propertyFound : t.propertiesFound}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
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

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-10 pr-8 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(''); updateParam('q', ''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors text-sm font-medium"
                >
                  {t.search}
                </button>
              </form>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t.propertyType}</label>
                <select
                  value={currentType}
                  onChange={(e) => updateParam('type', e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">{t.all}</option>
                  <option value="house">{t.houses}</option>
                  <option value="apartment">{t.apartments}</option>
                  <option value="commerce">{t.investments}</option>
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
                    defaultValue={currentMinPrice}
                    onBlur={(e) => updateParam('minPrice', e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    placeholder={t.maxPrice}
                    defaultValue={currentMaxPrice}
                    onBlur={(e) => updateParam('maxPrice', e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t.minBedrooms}</label>
                <select
                  value={currentBedrooms}
                  onChange={(e) => updateParam('bedrooms', e.target.value)}
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
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full justify-items-center sm:justify-items-stretch">
                {properties.map((property) => renderPropertyCard(property))}
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

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - currentPage) <= 2)
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                            currentPage === p
                              ? 'bg-primary text-white border-primary'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          {p}
                        </button>
                      ))}

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
  );
}
