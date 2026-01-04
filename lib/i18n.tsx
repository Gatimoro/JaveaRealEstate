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
    bedroomsShort: 'hab',
    bathroomsShort: 'baños',
    size: 'm²',
    sizeLabel: 'Tamaño:',
    buildable: 'Edificable:',
    zone: 'Zona:',
    yes: 'Sí',
    no: 'No',
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
    bedroomsShort: 'beds',
    bathroomsShort: 'baths',
    size: 'm²',
    sizeLabel: 'Size:',
    buildable: 'Buildable:',
    zone: 'Zone:',
    yes: 'Yes',
    no: 'No',
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
    bedroomsShort: 'спален',
    bathroomsShort: 'ванных',
    size: 'м²',
    sizeLabel: 'Размер:',
    buildable: 'Застройка:',
    zone: 'Зона:',
    yes: 'Да',
    no: 'Нет',
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
  // Try locale-specific field - check BOTH snake_case (DB) and camelCase (static)
  const localeSuffix = locale.charAt(0).toUpperCase() + locale.slice(1);

  // Check camelCase first (e.g., descriptionEn, titleRu)
  const camelCaseKey = `${field}${localeSuffix}` as keyof T;
  if (obj[camelCaseKey]) {
    return obj[camelCaseKey] as string;
  }

  // Check snake_case (e.g., description_en, title_ru) - from Supabase
  const snakeCaseKey = `${field}_${locale}` as keyof T;
  if (obj[snakeCaseKey]) {
    return obj[snakeCaseKey] as string;
  }

  // Fallback to Spanish - check both formats
  const esCamelKey = `${field}Es` as keyof T;
  if (obj[esCamelKey]) {
    return obj[esCamelKey] as string;
  }

  const esSnakeKey = `${field}_es` as keyof T;
  if (obj[esSnakeKey]) {
    return obj[esSnakeKey] as string;
  }

  // Fallback to English - check both formats
  const enCamelKey = `${field}En` as keyof T;
  if (obj[enCamelKey]) {
    return obj[enCamelKey] as string;
  }

  const enSnakeKey = `${field}_en` as keyof T;
  if (obj[enSnakeKey]) {
    return obj[enSnakeKey] as string;
  }

  // Final fallback to base field
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
  // Try locale-specific field - check BOTH snake_case (DB) and camelCase (static)
  const localeSuffix = locale.charAt(0).toUpperCase() + locale.slice(1);

  // Check camelCase first (e.g., featuresEn, featuresRu)
  const camelCaseKey = `${field}${localeSuffix}` as keyof T;
  if (obj[camelCaseKey] && Array.isArray(obj[camelCaseKey])) {
    return obj[camelCaseKey] as string[];
  }

  // Check snake_case (e.g., features_en, features_ru) - from Supabase
  const snakeCaseKey = `${field}_${locale}` as keyof T;
  if (obj[snakeCaseKey] && Array.isArray(obj[snakeCaseKey])) {
    return obj[snakeCaseKey] as string[];
  }

  // Fallback to Spanish - check both formats
  const esCamelKey = `${field}Es` as keyof T;
  if (obj[esCamelKey] && Array.isArray(obj[esCamelKey])) {
    return obj[esCamelKey] as string[];
  }

  const esSnakeKey = `${field}_es` as keyof T;
  if (obj[esSnakeKey] && Array.isArray(obj[esSnakeKey])) {
    return obj[esSnakeKey] as string[];
  }

  // Fallback to English - check both formats
  const enCamelKey = `${field}En` as keyof T;
  if (obj[enCamelKey] && Array.isArray(obj[enCamelKey])) {
    return obj[enCamelKey] as string[];
  }

  const enSnakeKey = `${field}_en` as keyof T;
  if (obj[enSnakeKey] && Array.isArray(obj[enSnakeKey])) {
    return obj[enSnakeKey] as string[];
  }

  // Final fallback to base field
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
  property: {
    title: string;
    titleEn?: string;
    titleEs?: string;
    titleRu?: string;
    title_en?: string;
    title_es?: string;
    title_ru?: string;
    type?: 'house' | 'apartment' | 'investment' | 'plot'
  },
  locale: Locale
): string {
  // Try to get translated title
  const translatedTitle = getLocalizedField(property, 'title', locale);

  // If we found a translated title, use it (even if it's the same as the original)
  if (translatedTitle) {
    return translatedTitle;
  }

  // If no translation found and locale is not Spanish, generate generic fallback
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

  // Final fallback to base title
  return property.title;
}

/**
 * Format price with proper currency and locale
 * Centralized utility to avoid duplication across components
 */
export function formatPrice(price: number, locale: Locale): string {
  return new Intl.NumberFormat(
    locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'es-ES',
    {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  ).format(price);
}
