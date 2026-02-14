'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PropertyCard from './PropertyCard';
import { Pagination } from './Pagination';
import { useLanguage } from '@/lib/i18n';
import type { Property } from '@/data/properties';
import { Building2, Home as HomeIcon, Key, MapPin, Search, SlidersHorizontal, X, ChevronDown, ArrowUpDown } from 'lucide-react';

interface CategoryPageProps {
  title: string;
  properties: Property[];
  categoryType: 'new-building' | 'sale' | 'rent';
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Translations
const translations = {
  es: {
    allProjects: 'Todos los proyectos',
    all: 'Todas',
    apartments: 'Apartamentos',
    houses: 'Casas',
    commercial: 'Comercial',
    plots: 'Parcelas',
    property: 'propiedad',
    properties: 'propiedades',
    searching: 'Buscando',
    searchPlaceholder: 'Buscar por ubicación, título...',
    search: 'Buscar',
    filters: 'Filtros',
    clearFilters: 'Limpiar filtros',
    minPrice: 'Precio mínimo',
    maxPrice: 'Precio máximo',
    minBedrooms: 'Habitaciones mínimas',
    any: 'Cualquiera',
    noProperties: 'No hay propiedades disponibles con los filtros seleccionados',
    viewAll: 'Ver todas las propiedades',
    sortNewest: 'Más recientes',
    sortOldest: 'Más antiguos',
    sortPriceAsc: 'Precio: menor a mayor',
    sortPriceDesc: 'Precio: mayor a menor',
    sortSizeDesc: 'Tamaño: mayor a menor',
    sortSizeAsc: 'Tamaño: menor a mayor',
  },
  en: {
    allProjects: 'All projects',
    all: 'All',
    apartments: 'Apartments',
    houses: 'Houses',
    commercial: 'Commercial',
    plots: 'Plots',
    property: 'property',
    properties: 'properties',
    searching: 'Searching',
    searchPlaceholder: 'Search by location, title...',
    search: 'Search',
    filters: 'Filters',
    clearFilters: 'Clear filters',
    minPrice: 'Min price',
    maxPrice: 'Max price',
    minBedrooms: 'Min bedrooms',
    any: 'Any',
    noProperties: 'No properties available with selected filters',
    viewAll: 'View all properties',
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',
    sortPriceAsc: 'Price: low to high',
    sortPriceDesc: 'Price: high to low',
    sortSizeDesc: 'Size: large to small',
    sortSizeAsc: 'Size: small to large',
  },
  ru: {
    allProjects: 'Все проекты',
    all: 'Все',
    apartments: 'Квартиры',
    houses: 'Дома',
    commercial: 'Коммерческая',
    plots: 'Участки',
    property: 'объект',
    properties: 'объектов',
    searching: 'Поиск',
    searchPlaceholder: 'Поиск по местоположению, названию...',
    search: 'Искать',
    filters: 'Фильтры',
    clearFilters: 'Сбросить фильтры',
    minPrice: 'Мин. цена',
    maxPrice: 'Макс. цена',
    minBedrooms: 'Мин. спален',
    any: 'Любое',
    noProperties: 'Нет объектов с выбранными фильтрами',
    viewAll: 'Смотреть все объекты',
    sortNewest: 'Сначала новые',
    sortOldest: 'Сначала старые',
    sortPriceAsc: 'Цена: по возрастанию',
    sortPriceDesc: 'Цена: по убыванию',
    sortSizeDesc: 'Площадь: по убыванию',
    sortSizeAsc: 'Площадь: по возрастанию',
  },
};

export default function CategoryPage({ title, properties, categoryType, pagination }: CategoryPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const t = translations[locale];
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Get values from URL params
  const selectedSubCategory = searchParams.get('type') || null;
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minBedrooms = searchParams.get('bedrooms') || '';
  const currentSort = searchParams.get('sortBy') || 'date-desc';
  const currentSearch = searchParams.get('search') || '';

  // Define subcategories based on category type (translated)
  const subcategories = categoryType === 'new-building'
    ? [
        { id: 'all', label: t.allProjects, icon: Building2 },
      ]
    : [
        { id: 'all', label: t.all, icon: MapPin },
        { id: 'apartment', label: t.apartments, icon: Building2 },
        { id: 'house', label: t.houses, icon: HomeIcon },
        { id: 'commerce', label: t.commercial, icon: Building2 },
        ...(categoryType === 'sale' ? [{ id: 'plot', label: t.plots, icon: MapPin }] : []),
      ];

  const handleSubcategoryChange = (subcategoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // Reset to page 1
    if (subcategoryId === 'all') {
      params.delete('type');
    } else {
      params.set('type', subcategoryId);
    }
    router.push(`?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // Reset to page 1 when filters change
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    // Keep category type if set
    if (selectedSubCategory && selectedSubCategory !== 'all') {
      params.set('type', selectedSubCategory);
    }
    setSearchInput('');
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // Reset to page 1
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // Reset to page 1
    if (sortBy && sortBy !== 'date-desc') {
      params.set('sortBy', sortBy);
    } else {
      params.delete('sortBy');
    }
    router.push(`?${params.toString()}`);
  };

  const sortOptions = [
    { value: 'date-desc', label: t.sortNewest },
    { value: 'date-asc', label: t.sortOldest },
    { value: 'price-asc', label: t.sortPriceAsc },
    { value: 'price-desc', label: t.sortPriceDesc },
    { value: 'size-desc', label: t.sortSizeDesc },
    { value: 'size-asc', label: t.sortSizeAsc },
  ];

  const hasActiveFilters = minPrice || maxPrice || minBedrooms || currentSearch;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">
              {pagination ? `${pagination.totalCount} ${pagination.totalCount === 1 ? t.property : t.properties}` : `${properties.length} ${t.properties}`}
              {selectedSubCategory && selectedSubCategory !== 'all' && ` (${subcategories.find(s => s.id === selectedSubCategory)?.label})`}
              {currentSearch && ` • ${t.searching}: "${currentSearch}"`}
            </p>
          </div>
        </div>

        {/* Search Bar and Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    if (currentSearch) {
                      handleFilterChange('search', '');
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors font-medium"
            >
              {t.search}
            </button>
          </form>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer min-w-[180px]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-white border-primary'
                : 'bg-background border-border hover:border-primary'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{t.filters}</span>
            {hasActiveFilters && !showFilters && (
              <span className="ml-1 px-2 py-0.5 bg-white text-primary text-xs rounded-full font-semibold">
                •
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-muted/30 border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t.filters}</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  {t.clearFilters}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t.minPrice}</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="€"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.maxPrice}</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="€"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.minBedrooms}</label>
                <select
                  value={minBedrooms}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
        )}

        {/* Subcategory filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {subcategories.map((subcat) => {
            const Icon = subcat.icon;
            const isActive = selectedSubCategory === subcat.id || (!selectedSubCategory && subcat.id === 'all');

            return (
              <button
                key={subcat.id}
                onClick={() => handleSubcategoryChange(subcat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background border-border hover:border-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{subcat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Properties grid */}
      {properties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              hasNextPage={pagination.hasNextPage}
            />
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground mb-4">
            {t.noProperties}
          </p>
          <button
            onClick={() => {
              handleSubcategoryChange('all');
              clearFilters();
            }}
            className="text-primary hover:underline"
          >
            {t.viewAll}
          </button>
        </div>
      )}
    </div>
  );
}
