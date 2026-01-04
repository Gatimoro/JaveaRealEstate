# Code Redundancy & Issues Analysis

## 🚨 Critical Issues Found

### 1. **formatPrice Function - Duplicated 6+ Times**

**Location:** Found in at least 6 files:
- `components/PropertyCard.tsx` (line 24-31)
- `components/InvestmentCard.tsx` (line 24-31)
- `components/PlotCard.tsx` (line 24-31)
- `app/propiedad/[id]/page.tsx` (line 194-201)
- `components/AnalyticsSection.tsx`
- `components/ListingStatistics.tsx`

**The Code (duplicated):**
```typescript
const formatPrice = (price: number) => {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
```

**Problem:**
- Violates DRY (Don't Repeat Yourself) principle
- Hard to maintain - any change requires updating 6+ files
- Increases bundle size unnecessarily
- Error-prone when making updates

**Recommendation:** Create a shared utility function in `lib/utils.ts` or `lib/i18n.tsx`

```typescript
// lib/i18n.tsx or lib/utils.ts
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

---

### 2. **Duplicate Supabase Query Libraries**

**Files:**
- `lib/supabase/queries.ts` (client-side)
- `lib/supabase/server-queries.ts` (server-side)

**Problem:**
Both files contain **identical query logic**, just using different Supabase clients:
- `getProperties()`
- `getPropertyById()`
- `getPropertiesByType()`
- `getHotProperties()`
- `getNewProperties()`
- `getMostLikedProperties()`
- `searchPropertiesByPrice()`
- `getPropertyBadges()`

**Current State:**
```typescript
// queries.ts (client)
export async function getProperties() {
  const supabase = createClient(); // Client-side
  const { data, error } = await supabase.from('properties')...
}

// server-queries.ts (server)
export async function getProperties() {
  // Direct fetch API call
  const response = await fetch(...)
}
```

**Issues:**
- Code duplication (~400 lines duplicated)
- Maintenance burden - updates need to happen in 2 places
- Inconsistency risk - implementations can diverge

**Recommendation:**
Two approaches:

**Option A:** Unified query functions with client parameter
```typescript
// lib/supabase/queries.ts
export async function getProperties(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available');
  return data || [];
}

// Usage:
// Client-side: getProperties(createClientClient())
// Server-side: getProperties(createServerClient())
```

**Option B:** Keep separate but extract query builders
```typescript
// lib/supabase/query-builders.ts
export const propertyQueries = {
  all: () => ({ table: 'properties', filters: { status: 'available' } }),
  byType: (type) => ({ table: 'properties', filters: { type, status: 'available' } }),
  // ...
};
```

---

### 3. **Translation Objects Duplicated in Cards**

**Location:**
- `PropertyCard.tsx` (lines 16-20)
- `InvestmentCard.tsx` (lines 16-20)
- `PlotCard.tsx` (lines 16-19)

**The Code (duplicated):**
```typescript
const translations = {
  es: { bedrooms: 'hab', bathrooms: 'baños' },
  en: { bedrooms: 'beds', bathrooms: 'baths' },
  ru: { bedrooms: 'спален', bathrooms: 'ванных' },
};
```

**Problem:**
- Same translations defined 3 times
- Should be in central translation file

**Recommendation:** Add to `lib/i18n.tsx`:
```typescript
export const translations = {
  es: {
    // ... existing translations
    bedrooms: 'hab',
    bathrooms: 'baños',
    size: 'Tamaño',
    buildable: 'Edificable',
    zone: 'Zona',
  },
  // ... en, ru
};
```

---

### 4. **Property Card Components - 95% Identical Code**

**Files:**
- `PropertyCard.tsx` (93 lines)
- `InvestmentCard.tsx` (100 lines)
- `PlotCard.tsx` (110 lines)

**Identical Sections:**
- Image section (lines 38-52 in each)
- Price display (lines 56-59 in each)
- Title display (line 62 in each)
- Location display (lines 65-68 in each)
- Link wrapper and styling

**Only Differences:**
- PropertyCard: Shows bedrooms, bathrooms, size
- InvestmentCard: Shows same + ROI badge
- PlotCard: Shows size, buildable, zone

**Problem:**
- ~280 lines of code, ~80% is duplicated
- Hard to maintain consistent styling
- Changes require updating 3 files

**Recommendation:** Create a unified `BasePropertyCard` component:

```typescript
// components/BasePropertyCard.tsx
interface BasePropertyCardProps {
  property: Property;
  renderSpecs: (property: Property) => React.ReactNode;
  extraBadges?: React.ReactNode;
}

export default function BasePropertyCard({
  property,
  renderSpecs,
  extraBadges
}: BasePropertyCardProps) {
  // Shared image, price, title, location logic
  return (
    <Link href={`/propiedad/${property.id}`} className="...">
      {/* Image */}
      <div className="relative h-48">
        <img src={property.images[0]} alt={title} />
        {property.badge && <div className="badge">{property.badge}</div>}
        <SavePropertyButton propertyId={property.id} />
        {extraBadges}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="price">{formatPrice(property.price, locale)}</div>
        <h3>{title}</h3>
        <div className="location">{property.location}</div>
        {renderSpecs(property)}
      </div>
    </Link>
  );
}

// Then PropertyCard becomes:
export default function PropertyCard({ property }) {
  return (
    <BasePropertyCard
      property={property}
      renderSpecs={(p) => (
        <div className="specs">
          {p.specs.bedrooms && <span>{p.specs.bedrooms} bed</span>}
          {p.specs.bathrooms && <span>{p.specs.bathrooms} bath</span>}
          <span>{p.specs.size}m²</span>
        </div>
      )}
    />
  );
}
```

---

### 5. **Unnecessary Falsy Checks**

**Location:** Multiple files use optional chaining when values are guaranteed

**Example:** `app/propiedad/[id]/page.tsx`
```typescript
// Line 175 - property is guaranteed to exist here (we return early if null)
const title = getPropertyTitle(property, locale);

// But later we still check:
if (property.badge) { ... }  // OK - badge is optional
```

**Not a major issue, but:**
- Some checks are redundant after null guards
- Could simplify code slightly

---

### 6. **Client/Server Query Confusion**

**Location:** `app/propiedad/[id]/page.tsx`

**The Code:**
```typescript
// This is a CLIENT component ('use client')
import { getPropertyById, getProperties } from '@/lib/supabase/queries';

useEffect(() => {
  async function loadProperty() {
    const prop = await getPropertyById(id);  // Client-side query
  }
}, [id]);
```

**Issue:**
- Client component importing from `queries.ts` (correct)
- But `queries.ts` functions are almost identical to `server-queries.ts`
- Creates confusion about which to use when

**Current Setup:**
- `queries.ts` = client-side (uses `createClient()`)
- `server-queries.ts` = server-side (uses fetch API directly)

**Recommendation:**
- Keep this separation BUT unify the query logic
- Or use a single implementation with environment detection

---

## 📊 Summary of Redundancy

| Issue | Files Affected | Lines Duplicated | Priority |
|-------|----------------|------------------|----------|
| formatPrice function | 6+ files | ~48 lines | 🔴 HIGH |
| Supabase query logic | 2 files | ~400 lines | 🔴 HIGH |
| Translation objects | 3 files | ~15 lines | 🟡 MEDIUM |
| Property card structure | 3 files | ~220 lines | 🟡 MEDIUM |
| Unnecessary checks | Multiple | N/A | 🟢 LOW |

**Total Redundancy:** ~683 lines of duplicated code

---

## ✅ Recommended Action Plan

### Phase 1: Quick Wins (High Impact, Low Risk)

1. **Extract formatPrice to shared utility**
   - Create `lib/utils.ts` or add to `lib/i18n.tsx`
   - Replace all 6+ instances
   - Estimated savings: ~40 lines
   - Time: 15 minutes

2. **Centralize property card translations**
   - Add to existing `lib/i18n.tsx`
   - Update 3 card components
   - Estimated savings: ~12 lines
   - Time: 10 minutes

### Phase 2: Medium Effort (High Impact, Medium Risk)

3. **Unify Supabase query logic**
   - Choose Option A or B from above
   - Requires careful testing
   - Estimated savings: ~350 lines
   - Time: 2 hours

### Phase 3: Long-term Refactor (High Impact, Higher Risk)

4. **Create BasePropertyCard component**
   - Extract common card logic
   - Requires UI testing
   - Estimated savings: ~200 lines
   - Time: 3 hours

---

## 🐛 Other Potential Issues Found

### 1. Missing Error Boundaries
**Location:** Multiple pages

**Issue:** If Supabase query fails, entire page can crash

**Recommendation:** Add error boundaries or better error handling

### 2. No Loading States in Client Components
**Location:** `app/propiedad/[id]/page.tsx`

**Issue:** Shows "loading..." but then might show stale data

**Recommendation:** Add skeleton loaders or better loading UX

### 3. Locale Detection Could Be Optimized
**Location:** `lib/i18n.tsx`

**Current:**
```typescript
const [locale, setLocaleState] = useState<Locale>(() => {
  if (typeof window !== 'undefined') {
    const savedLocale = localStorage.getItem('locale') as Locale;
    // ... multiple checks
  }
  return 'es';
});
```

**Issue:** Runs on every component mount

**Recommendation:** Could use Context more efficiently

---

## 💡 Best Practices Not Followed

1. **DRY Principle** - Violated by formatPrice, query logic, translations
2. **Single Responsibility** - Card components doing too much
3. **Separation of Concerns** - Query logic mixed with fetch logic
4. **Code Reusability** - Too much copy-paste instead of abstraction

---

## 🎯 Impact Assessment

### If We Fix formatPrice Duplication:
- ✅ Easier to update currency formatting
- ✅ Smaller bundle size
- ✅ One place to add new locales
- ✅ Consistent formatting across app

### If We Fix Query Duplication:
- ✅ Single source of truth for queries
- ✅ Easier to add new query features
- ✅ Less risk of client/server divergence
- ✅ ~400 fewer lines to maintain

### If We Fix Card Duplication:
- ✅ Consistent card styling automatically
- ✅ Easier to add new features to all cards
- ✅ Better component reusability
- ✅ Cleaner codebase

---

## 🚀 Next Steps

**Recommended Order:**
1. Extract `formatPrice` → 15 min, high impact
2. Centralize translations → 10 min, low risk
3. Document query separation → 5 min, clarifies intent
4. (Optional) Unify query logic → 2 hours, high impact
5. (Optional) Refactor card components → 3 hours, medium impact

**Total quick wins:** 30 minutes for ~50 lines saved + better maintainability
