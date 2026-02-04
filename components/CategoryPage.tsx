'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PropertyCard from './PropertyCard';
import type { Property } from '@/data/properties';
import { Building2, Home as HomeIcon, Key, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';

interface CategoryPageProps {
  title: string;
  properties: Property[];
  categoryType: 'new-building' | 'sale' | 'rent';
}

export default function CategoryPage({ title, properties, categoryType }: CategoryPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBedrooms, setMinBedrooms] = useState('');

  // Get selected subcategory from URL
  const selectedSubCategory = searchParams.get('type') || null;

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

  // Filter properties
  let filteredProperties = properties;

  // Filter by subcategory
  if (selectedSubCategory && selectedSubCategory !== 'all') {
    filteredProperties = filteredProperties.filter(p => p.sub_category === selectedSubCategory);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredProperties = filteredProperties.filter(p =>
      p.title?.toLowerCase().includes(query) ||
      p.title_en?.toLowerCase().includes(query) ||
      p.title_es?.toLowerCase().includes(query) ||
      p.location?.toLowerCase().includes(query)
    );
  }

  // Filter by price
  if (minPrice) {
    filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
  }
  if (maxPrice) {
    filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
  }

  // Filter by bedrooms
  if (minBedrooms) {
    filteredProperties = filteredProperties.filter(p =>
      p.specs?.bedrooms && p.specs.bedrooms >= parseInt(minBedrooms)
    );
  }

  const handleSubcategoryChange = (subcategoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subcategoryId === 'all') {
      params.delete('type');
    } else {
      params.set('type', subcategoryId);
    }
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setMinBedrooms('');
  };

  const hasActiveFilters = searchQuery || minPrice || maxPrice || minBedrooms;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ubicación, título..."
            className="w-full px-4 py-3 pl-12 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Header with Filters Toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">
              {filteredProperties.length} {filteredProperties.length === 1 ? 'propiedad' : 'propiedades'}
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
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="€"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Precio máximo</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="€"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Habitaciones mínimas</label>
                <select
                  value={minBedrooms}
                  onChange={(e) => setMinBedrooms(e.target.value)}
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
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
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
