# Translation System (i18n)

This document explains how the multilingual translation system works, including locale management, translation utilities, and common patterns.

## Supported Languages

- **Spanish (es)** - Primary language, fallback for missing translations
- **English (en)** - Secondary language
- **Russian (ru)** - Tertiary language

**Default**: Spanish (es)
**Storage**: localStorage (key: `'locale'`)
**Browser Detection**: Yes (if no saved preference)

## Core Files

**lib/i18n.tsx** - Everything related to translation:
- `LanguageProvider` - React context for locale state
- `useLanguage()` - Hook to access current locale
- `translations` - UI text in all languages
- `formatPrice()` - Currency formatter
- `getPropertyTitle()` - Get translated property title
- `getLocalizedField()` - Get translated field from object
- `getLocalizedArray()` - Get translated array field

## Language Context

### LanguageProvider

Wraps the entire app in `app/layout.tsx`:

```typescript
'use client';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage first
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
    return 'es'; // Default fallback
  });

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
```

**Critical**: Uses `useState` initialization function to avoid hydration mismatch.

### useLanguage() Hook

Access current locale in any component:

```typescript
import { useLanguage } from '@/lib/i18n';

export default function MyComponent() {
  const { locale, setLocale } = useLanguage();

  return (
    <div>
      <p>Current language: {locale}</p>
      <button onClick={() => setLocale('en')}>Switch to English</button>
    </div>
  );
}
```

**Note**: Can only be used in Client Components ('use client').

## UI Translations

### translations Object

All UI text stored in `lib/i18n.tsx`:

```typescript
export const translations = {
  es: {
    // Navigation
    inicio: 'Inicio',
    nosotros: 'Nosotros',
    contacto: 'Contacto',

    // Property types
    houses: 'Casas y Pisos',
    investments: 'Oportunidades de Inversión',
    plots: 'Parcelas',

    // Property details
    bedrooms: 'habitaciones',
    bathrooms: 'baños',
    bedroomsShort: 'hab',
    bathroomsShort: 'baños',
    sizeLabel: 'Tamaño:',
    buildable: 'Edificable:',
    zone: 'Zona:',
    yes: 'Sí',
    no: 'No',

    // ... more translations
  },
  en: {
    inicio: 'Home',
    nosotros: 'About',
    // ... English translations
  },
  ru: {
    inicio: 'Главная',
    nosotros: 'О нас',
    // ... Russian translations
  },
} as const;
```

### Usage Pattern

```typescript
import { useLanguage, translations } from '@/lib/i18n';

export default function PropertyCard({ property }) {
  const { locale } = useLanguage();
  const t = translations[locale];

  return (
    <div>
      <span>{property.specs.bedrooms} {t.bedroomsShort}</span>
      <span>{property.specs.bathrooms} {t.bathroomsShort}</span>
    </div>
  );
}
```

**Pattern**: Always use `t.key` for UI text, never hardcode strings.

### Adding New UI Translations

1. Add key to all three language objects in `translations`
2. Use `t.newKey` in components

**Example**:
```typescript
// lib/i18n.tsx
export const translations = {
  es: {
    // ... existing
    viewMap: 'Ver en mapa',
  },
  en: {
    // ... existing
    viewMap: 'View on map',
  },
  ru: {
    // ... existing
    viewMap: 'Показать на карте',
  },
};

// Component usage
<button>{t.viewMap}</button>
```

## Property Content Translation

Properties have separate database columns for each language.

### Database Schema

```sql
title TEXT,           -- Base title (English from scraper)
title_en TEXT,        -- English translation
title_es TEXT,        -- Spanish translation
title_ru TEXT,        -- Russian translation
description TEXT,     -- Base description
description_en TEXT,
description_es TEXT,
description_ru TEXT,
features JSONB,       -- Base features array
features_en JSONB,
features_es JSONB,
features_ru JSONB
```

**Convention**: Database uses snake_case (`title_en`, `description_ru`)

### TypeScript Interface

```typescript
export interface Property {
  id: string;
  title: string;

  // Support both camelCase (static data) and snake_case (database)
  titleEn?: string;
  titleEs?: string;
  titleRu?: string;
  title_en?: string;
  title_es?: string;
  title_ru?: string;

  // Same pattern for description, features
  description?: string;
  descriptionEn?: string;
  descriptionEs?: string;
  descriptionRu?: string;
  description_en?: string;
  description_es?: string;
  description_ru?: string;

  features?: string[];
  featuresEn?: string[];
  featuresEs?: string[];
  featuresRu?: string[];
  features_en?: string[];
  features_es?: string[];
  features_ru?: string[];

  // ... rest of interface
}
```

**Critical**: Dual format support needed because:
- Static data files use camelCase
- Supabase returns snake_case

## Translation Utilities

### getLocalizedField()

Get translated field with intelligent fallback:

```typescript
export function getLocalizedField<T extends Record<string, any>>(
  obj: T,
  field: string,
  locale: Locale
): string {
  const localeSuffix = locale.charAt(0).toUpperCase() + locale.slice(1);

  // 1. Try camelCase (descriptionEn, titleRu)
  const camelCaseKey = `${field}${localeSuffix}` as keyof T;
  if (obj[camelCaseKey]) {
    return obj[camelCaseKey] as string;
  }

  // 2. Try snake_case (description_en, title_ru)
  const snakeCaseKey = `${field}_${locale}` as keyof T;
  if (obj[snakeCaseKey]) {
    return obj[snakeCaseKey] as string;
  }

  // 3. Fallback to Spanish (camelCase)
  const esCamelKey = `${field}Es` as keyof T;
  if (obj[esCamelKey]) return obj[esCamelKey] as string;

  // 4. Fallback to Spanish (snake_case)
  const esSnakeKey = `${field}_es` as keyof T;
  if (obj[esSnakeKey]) return obj[esSnakeKey] as string;

  // 5. Fallback to English (both formats)
  // ...

  // 6. Final fallback to base field
  const baseKey = field as keyof T;
  if (obj[baseKey]) return obj[baseKey] as string;

  return '';
}
```

**Usage**:
```typescript
const description = getLocalizedField(property, 'description', locale);
```

**Fallback Chain**:
1. Requested locale (camelCase)
2. Requested locale (snake_case)
3. Spanish (both formats)
4. English (both formats)
5. Base field
6. Empty string

### getLocalizedArray()

Same as `getLocalizedField()` but for arrays (features):

```typescript
export function getLocalizedArray<T extends Record<string, any>>(
  obj: T,
  field: string,
  locale: Locale
): string[] {
  // Same logic as getLocalizedField but checks Array.isArray()
  // ...
  return [];
}
```

**Usage**:
```typescript
const features = getLocalizedArray(property, 'features', locale);
```

### getPropertyTitle()

Special handling for property titles with generic fallbacks:

```typescript
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

  // IMPORTANT: Return if exists, even if same as original
  if (translatedTitle) {
    return translatedTitle;
  }

  // If no translation and locale != Spanish, use generic fallback
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
    if (fallback) return fallback;
  }

  // Final fallback to base title
  return property.title;
}
```

**Critical Bug Fixed**: Previously had `if (translatedTitle && translatedTitle !== property.title)` which failed for English because `title === title_en` (both from scraper). Removed comparison.

**Usage**:
```typescript
const title = getPropertyTitle(property, locale);
```

## Price Formatting

### formatPrice()

Centralized currency formatter (eliminates 6+ duplicates):

```typescript
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
```

**Output Examples**:
- Spanish: `450.000 €`
- English: `€450,000`
- Russian: `450 000 €`

**Usage**:
```typescript
import { formatPrice } from '@/lib/i18n';

<div className="price">{formatPrice(property.price, locale)}</div>
```

**Before Centralization**: This function was duplicated in 6+ files. Now single source of truth.

## Language Switcher

Example implementation (not currently in codebase):

```typescript
'use client';

import { useLanguage, languageNames, languageFlags } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex gap-2">
      {['es', 'en', 'ru'].map((lang) => (
        <button
          key={lang}
          onClick={() => setLocale(lang as Locale)}
          className={locale === lang ? 'active' : ''}
        >
          {languageFlags[lang]} {languageNames[lang]}
        </button>
      ))}
    </div>
  );
}
```

**Current**: Language switcher exists in Navbar component.

## Common Patterns

### Pattern 1: Card Component Translation

```typescript
'use client';

import { useLanguage, getPropertyTitle, formatPrice, translations } from '@/lib/i18n';

export default function PropertyCard({ property }) {
  const { locale } = useLanguage();
  const t = translations[locale];
  const title = getPropertyTitle(property, locale);

  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="price">{formatPrice(property.price, locale)}</div>
      <div className="specs">
        <span>{property.specs.bedrooms} {t.bedroomsShort}</span>
        <span>{property.specs.bathrooms} {t.bathroomsShort}</span>
        <span>{property.specs.size}m²</span>
      </div>
    </div>
  );
}
```

**Key Points**:
1. Import all needed utilities from `@/lib/i18n`
2. Get `locale` and `t` at top of component
3. Use `getPropertyTitle()` for property titles
4. Use `formatPrice()` for prices
5. Use `t.key` for UI text

### Pattern 2: Property Detail Page

```typescript
import { getLocalizedField, getLocalizedArray } from '@/lib/i18n';

export default async function PropertyPage({ params }) {
  // Get locale from context or params
  const locale = 'en'; // In real app, from useLanguage()

  const property = await getPropertyById(params.id);

  const title = getPropertyTitle(property, locale);
  const description = getLocalizedField(property, 'description', locale);
  const features = getLocalizedArray(property, 'features', locale);

  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      <ul>
        {features.map((feature, i) => (
          <li key={i}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Pattern 3: Server Component Translation

**Problem**: Server Components can't use `useLanguage()` (it's a client hook).

**Solution 1**: Accept locale as prop from parent Client Component
```typescript
// Client Component
'use client';
export default function ParentComponent() {
  const { locale } = useLanguage();
  return <ServerComponent locale={locale} />;
}

// Server Component
export default async function ServerComponent({ locale }: { locale: Locale }) {
  const properties = await getProperties();
  // Use locale directly
}
```

**Solution 2**: Use cookies or headers (more complex)
```typescript
import { cookies } from 'next/headers';

export default async function ServerComponent() {
  const locale = cookies().get('locale')?.value || 'es';
  // ...
}
```

**Current**: Most server components don't handle locale - they fetch all language fields and let client components display correct one.

## Translation Workflow

### For New Properties (Upload Script)

1. **Scraper** extracts property in English (`new_scraper.py`)
2. **Upload script** translates to ES/RU (`new_upload.py --translate`)
3. **Database** stores all 3 languages in separate columns
4. **Frontend** displays based on user's locale

### Translation Services Used

**Current**: Google Translate API (in `new_upload.py`)
**Future**: Consider DeepL for better quality

### Manual Translation Override

Properties can have manually corrected translations:
1. Export property from DB
2. Edit translation fields
3. Re-upload with updated JSON

## Known Issues

### Issue 1: English Titles Showing as "House"

**Fixed**: `getPropertyTitle()` had faulty comparison `translatedTitle !== property.title`

**Problem**: For English properties, `title === title_en` (both from scraper), so comparison failed.

**Solution**: Removed comparison, now returns `translatedTitle` if it exists.

See commit: "Fix English titles showing as generic 'House' instead of actual titles"

### Issue 2: Description Duplication

**Fixed**: Upload script saved English description to both `description` and `description_en`

**Problem**: Code had:
```python
'description': prop.get('description'),  # English
'description_en': prop.get('description_en') or prop.get('description'),  # Duplicate!
```

**Solution**: Properly separate fields in `new_upload.py`

### Issue 3: Missing Spanish Columns

**Fixed**: Database schema missing `title_es`, `description_es`, `features_es`

**Solution**: Ran `database-schema-fixes.sql`

### Issue 4: Naming Convention Mismatch

**Ongoing**: Database uses snake_case, TypeScript uses camelCase

**Impact**: Requires dual format support in interface

**Solution**: `getLocalizedField()` handles both formats

**Future**: Consider standardizing on snake_case everywhere (breaking change)

## Performance Considerations

### localStorage Access

**Current**: Reading locale on every component mount
```typescript
const savedLocale = localStorage.getItem('locale');
```

**Impact**: Minimal - localStorage is synchronous and fast

**Optimization**: Could memoize in Context (already done via `useState`)

### Translation Object Size

**Current**: ~250 translation keys across 3 languages

**Bundle Impact**: ~5KB gzipped (negligible)

**Future**: If grows to >1000 keys, consider lazy loading translations

## Adding a New Language

1. **Update locales array**:
```typescript
export const locales = ['es', 'en', 'ru', 'de'] as const; // Add 'de'
```

2. **Add translation object**:
```typescript
export const translations = {
  // ... existing
  de: {
    inicio: 'Startseite',
    nosotros: 'Über uns',
    // ... all translations
  },
};
```

3. **Add database columns**:
```sql
ALTER TABLE properties ADD COLUMN title_de TEXT;
ALTER TABLE properties ADD COLUMN description_de TEXT;
ALTER TABLE properties ADD COLUMN features_de JSONB DEFAULT '[]'::jsonb;
```

4. **Update upload script** to translate to new language

5. **Add language names and flags**:
```typescript
export const languageNames = {
  // ... existing
  de: 'Deutsch',
};

export const languageFlags = {
  // ... existing
  de: '🇩🇪',
};
```

## Testing Translations

### Manual Testing

1. Switch language in navbar
2. Verify all UI text updates
3. Check property titles, descriptions, features
4. Verify price formatting

### Automated Testing (Future)

```typescript
describe('Translation System', () => {
  it('should format prices correctly for each locale', () => {
    expect(formatPrice(450000, 'es')).toContain('€');
    expect(formatPrice(450000, 'en')).toContain('€');
    expect(formatPrice(450000, 'ru')).toContain('€');
  });

  it('should fall back to Spanish if translation missing', () => {
    const property = { title: 'Casa', titleEs: 'Casa' };
    expect(getPropertyTitle(property, 'ru')).toBe('Casa');
  });
});
```

## Best Practices

1. **Never hardcode UI text** - Always use `t.key`
2. **Always use formatPrice()** - Don't format manually
3. **Use getPropertyTitle()** - Don't access title fields directly
4. **Support both naming conventions** - camelCase and snake_case
5. **Provide fallbacks** - Spanish → English → base field
6. **Test all three languages** - Don't assume one works = all work

## Next Steps

See other documentation for related topics:
- **[DATABASE.md](./DATABASE.md)** - Translation field storage
- **[COMPONENTS.md](./COMPONENTS.md)** - Using translations in components
- **[TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)** - Translation system improvements
