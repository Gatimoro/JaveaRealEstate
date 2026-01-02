'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Supported locales
export const locales = ['es', 'en', 'ru'] as const;
export type Locale = typeof locales[number];

// Language context
interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider component
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage if available, otherwise default to 'es'
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        return savedLocale;
      }
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en' || browserLang === 'ru') {
        return browserLang as Locale;
      }
    }
    return 'es';
  });

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// UI translations
export const translations = {
  es: {
    // Navigation
    inicio: 'Inicio',
    nosotros: 'Nosotros',
    contacto: 'Contacto',
    publicarPropiedad: 'Publicar propiedad',

    // Property types
    houses: 'Casas y Pisos',
    investments: 'Oportunidades de Inversión',
    plots: 'Parcelas',

    // Search
    search: 'Buscar propiedades...',
    searchButton: 'Buscar',
    filters: 'Filtros',
    clearFilters: 'Limpiar',
    results: 'resultados',
    noResults: 'No se encontraron propiedades',

    // Property details
    bedrooms: 'habitaciones',
    bathrooms: 'baños',
    size: 'm²',
    price: 'Precio',
    location: 'Ubicación',
    description: 'Descripción',
    features: 'Características',
    similarProperties: 'Propiedades similares cerca',

    // Actions
    viewAll: 'Ver todo',
    viewOriginal: 'Ver oferta original',
    requestInfo: 'Solicitar información',
    back: 'Volver',

    // Filters
    propertyType: 'Tipo de propiedad',
    all: 'Todas',
    minPrice: 'Precio mínimo',
    maxPrice: 'Precio máximo',
    minBedrooms: 'Habitaciones (mínimo)',
    minBathrooms: 'Baños (mínimo)',
    minSize: 'Tamaño mínimo (m²)',
    any: 'Cualquiera',

    // Analytics
    marketStats: 'Estadísticas del Mercado',
    averagePrice: 'Precio promedio',
    totalProperties: 'propiedades',

    // Footer
    allRightsReserved: 'Todos los derechos reservados',
  },
  en: {
    // Navigation
    inicio: 'Home',
    nosotros: 'About',
    contacto: 'Contact',
    publicarPropiedad: 'List property',

    // Property types
    houses: 'Houses & Apartments',
    investments: 'Investment Opportunities',
    plots: 'Land Plots',

    // Search
    search: 'Search properties...',
    searchButton: 'Search',
    filters: 'Filters',
    clearFilters: 'Clear',
    results: 'results',
    noResults: 'No properties found',

    // Property details
    bedrooms: 'bedrooms',
    bathrooms: 'bathrooms',
    size: 'm²',
    price: 'Price',
    location: 'Location',
    description: 'Description',
    features: 'Features',
    similarProperties: 'Similar properties nearby',

    // Actions
    viewAll: 'View all',
    viewOriginal: 'View original listing',
    requestInfo: 'Request information',
    back: 'Back',

    // Filters
    propertyType: 'Property type',
    all: 'All',
    minPrice: 'Min price',
    maxPrice: 'Max price',
    minBedrooms: 'Bedrooms (minimum)',
    minBathrooms: 'Bathrooms (minimum)',
    minSize: 'Minimum size (m²)',
    any: 'Any',

    // Analytics
    marketStats: 'Market Statistics',
    averagePrice: 'Average price',
    totalProperties: 'properties',

    // Footer
    allRightsReserved: 'All rights reserved',
  },
  ru: {
    // Navigation
    inicio: 'Главная',
    nosotros: 'О нас',
    contacto: 'Контакты',
    publicarPropiedad: 'Разместить объявление',

    // Property types
    houses: 'Дома и квартиры',
    investments: 'Инвестиционные возможности',
    plots: 'Участки',

    // Search
    search: 'Поиск недвижимости...',
    searchButton: 'Искать',
    filters: 'Фильтры',
    clearFilters: 'Очистить',
    results: 'результатов',
    noResults: 'Недвижимость не найдена',

    // Property details
    bedrooms: 'спален',
    bathrooms: 'ванных',
    size: 'м²',
    price: 'Цена',
    location: 'Расположение',
    description: 'Описание',
    features: 'Характеристики',
    similarProperties: 'Похожие объекты рядом',

    // Actions
    viewAll: 'Смотреть все',
    viewOriginal: 'Смотреть оригинал',
    requestInfo: 'Запросить информацию',
    back: 'Назад',

    // Filters
    propertyType: 'Тип недвижимости',
    all: 'Все',
    minPrice: 'Мин. цена',
    maxPrice: 'Макс. цена',
    minBedrooms: 'Спален (минимум)',
    minBathrooms: 'Ванных (минимум)',
    minSize: 'Минимальный размер (м²)',
    any: 'Любой',

    // Analytics
    marketStats: 'Статистика рынка',
    averagePrice: 'Средняя цена',
    totalProperties: 'объектов',

    // Footer
    allRightsReserved: 'Все права защищены',
  },
} as const;

// Translation function
export function t(key: keyof typeof translations['es'], locale: Locale = 'es'): string {
  return translations[locale][key] || translations['es'][key];
}

// Get localized property field
export function getLocalizedField<T extends Record<string, any>>(
  obj: T,
  field: string,
  locale: Locale
): string {
  // Try locale-specific field first (camelCase: descriptionEn, titleRu, etc.)
  const localeSuffix = locale.charAt(0).toUpperCase() + locale.slice(1);
  const localizedKey = `${field}${localeSuffix}` as keyof T;
  if (obj[localizedKey]) {
    return obj[localizedKey] as string;
  }

  // Fallback to Spanish (camelCase: descriptionEs, titleEs, etc.)
  const esKey = `${field}Es` as keyof T;
  if (obj[esKey]) {
    return obj[esKey] as string;
  }

  // Fallback to base field
  const baseKey = field as keyof T;
  if (obj[baseKey]) {
    return obj[baseKey] as string;
  }

  return '';
}

// Get localized array field (for features)
export function getLocalizedArray<T extends Record<string, any>>(
  obj: T,
  field: string,
  locale: Locale
): string[] {
  // Try locale-specific field first (camelCase: featuresEn, featuresRu, etc.)
  const localeSuffix = locale.charAt(0).toUpperCase() + locale.slice(1);
  const localizedKey = `${field}${localeSuffix}` as keyof T;
  if (obj[localizedKey] && Array.isArray(obj[localizedKey])) {
    return obj[localizedKey] as string[];
  }

  // Fallback to Spanish (camelCase: featuresEs, etc.)
  const esKey = `${field}Es` as keyof T;
  if (obj[esKey] && Array.isArray(obj[esKey])) {
    return obj[esKey] as string[];
  }

  // Fallback to base field
  const baseKey = field as keyof T;
  if (obj[baseKey] && Array.isArray(obj[baseKey])) {
    return obj[baseKey] as string[];
  }

  return [];
}

// Language names
export const languageNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  ru: 'Русский',
};

// Language flags (emoji)
export const languageFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  ru: '🇷🇺',
};

// Get property title with intelligent fallback
export function getPropertyTitle(
  property: { title: string; titleEn?: string; titleRu?: string; type?: 'house' | 'apartment' | 'investment' | 'plot' },
  locale: Locale
): string {
  // Try to get translated title
  const translatedTitle = getLocalizedField(property, 'title', locale);
  if (translatedTitle && translatedTitle !== property.title) {
    return translatedTitle;
  }

  // If no translation and locale is not Spanish, generate generic fallback
  if (locale !== 'es' && property.type) {
    const fallbacks = {
      en: {
        house: 'House',
        apartment: 'Apartment',
        investment: 'Investment Opportunity',
        plot: 'Land Plot',
      },
      ru: {
        house: 'Дом',
        apartment: 'Квартира',
        investment: 'Инвестиционная возможность',
        plot: 'Участок',
      },
    };

    const fallback = fallbacks[locale]?.[property.type];
    if (fallback) {
      return fallback;
    }
  }

  // Fallback to Spanish title
  return property.title;
}
