'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PropertyCard from './PropertyCard';
import { Pagination } from './Pagination';
import type { Property } from '@/data/properties';
import { Building2, Home as HomeIcon, Key, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';

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

export default function CategoryPage({ title, properties, categoryType, pagination }: CategoryPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  // Get values from URL params
  const selectedSubCategory = searchParams.get('type') || null;
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minBedrooms = searchParams.get('bedrooms') || '';

  // Define subcategories based on category type
  const subcategories = categoryType === 'new-building'
    ? [
        { id: 'all', label: 'Todos los proyectos', icon: Building2 },
      ]
    : [
        { id: 'all', label: 'Todas', icon: MapPin },
        { id: 'apartment', label: 'Apartamentos', icon: Building2 },
        { id: 'house', label: 'Casas', icon: HomeIcon },
        { id: 'commerce', label: 'Comercial', icon: Building2 },
        ...(categoryType === 'sale' ? [{ id: 'plot', label: 'Parcelas', icon: MapPin }] : []),
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
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters = minPrice || maxPrice || minBedrooms;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Filters Toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">
              {pagination ? `${pagination.totalCount} ${pagination.totalCount === 1 ? 'propiedad' : 'propiedades'}` : `${properties.length} propiedades`}
              {selectedSubCategory && selectedSubCategory !== 'all' && ` (${subcategories.find(s => s.id === selectedSubCategory)?.label})`}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-white border-primary'
                : 'bg-background border-border hover:border-primary'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
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
              <h3 className="font-semibold">Filtros</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Precio mínimo</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="€"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Precio máximo</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="€"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Habitaciones mínimas</label>
                <select
                  value={minBedrooms}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Cualquiera</option>
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
            No hay propiedades disponibles con los filtros seleccionados
          </p>
          <button
            onClick={() => {
              handleSubcategoryChange('all');
              clearFilters();
            }}
            className="text-primary hover:underline"
          >
            Ver todas las propiedades
          </button>
        </div>
      )}
    </div>
  );
}
