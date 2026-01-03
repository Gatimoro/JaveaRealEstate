# Cache Management Guide

This guide explains how to manage Vercel's cache for the Jávea Real Estate application after uploading new property data.

## 🚨 The Problem

Your app was using **client-side rendering** with `useEffect` hooks, which meant:
- Vercel couldn't cache any data (everything loaded in the browser)
- The revalidation endpoint had nothing to clear
- New Supabase data never appeared because there was no server-side cache to invalidate

## ✅ The Solution

We've implemented **server-side caching** with proper revalidation:

1. **Server-side query functions** with Next.js `unstable_cache`
2. **24-hour cache duration** (configurable)
3. **Tag-based revalidation** for targeted cache clearing
4. **Revalidation API endpoint** that actually works
5. **Simple script** to clear cache after data uploads

## 📁 What Changed

### New Files Created

1. **`lib/supabase/server-queries.ts`**
   - Server-side query functions with caching
   - Uses the server Supabase client
   - Caches data for 24 hours by default
   - Tagged for targeted revalidation

2. **`scripts/clear-cache.ts`**
   - Command-line script to clear cache
   - Run after uploading new property data
   - Supports targeted or full cache clearing

3. **`CACHE_MANAGEMENT.md`** (this file)
   - Documentation for cache management

### Modified Files

1. **`app/api/revalidate/route.ts`**
   - Enhanced to support tag-based revalidation
   - Better error handling
   - Supports targeted cache clearing

2. **`.env.example`**
   - Added `REVALIDATE_SECRET` configuration

3. **`package.json`**
   - Added `clear-cache` script

## 🚀 Setup Instructions

### 1. Install Required Dependencies

```bash
npm install dotenv
```

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
# Generate a secure secret with: openssl rand -base64 32
REVALIDATE_SECRET=your-super-secret-key-here
```

**For Vercel Production:**
1. Go to your Vercel project → Settings → Environment Variables
2. Add `REVALIDATE_SECRET` with the same value
3. Redeploy your application

### 3. Update Your App to Use Server-Side Queries

You need to convert your pages from client components to server components. Here's how:

#### Before (Client-Side - DON'T use this):
```typescript
'use client';
import { getProperties } from '@/lib/supabase/queries'; // ❌ Browser client

export default function Page() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await getProperties();
      setProperties(data);
    }
    load();
  }, []);

  return <div>{/* render */}</div>;
}
```

#### After (Server-Side - ✅ Use this):
```typescript
// Remove 'use client' - this is now a Server Component
import { getProperties } from '@/lib/supabase/server-queries'; // ✅ Server client with caching

export default async function Page() {
  // Fetch data directly in the component - it's cached!
  const properties = await getProperties();

  return <div>{/* render */}</div>;
}
```

## 🔄 Daily Workflow: Clearing Cache After Data Upload

After uploading new property data to Supabase, clear the cache:

### Option 1: Clear All Property Caches (Recommended)

```bash
npm run clear-cache
```

This clears all property-related caches and forces fresh data from Supabase.

### Option 2: Clear Specific Caches

```bash
# Clear only hot and new properties
npm run clear-cache -- --tags properties-hot properties-new

# Clear specific property types
npm run clear-cache -- --tags properties-type-house properties-type-apartment
```

### Option 3: Use the API Directly

You can also call the revalidation endpoint directly:

```bash
# Clear all property caches
curl -X POST https://your-app.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secret-here" \
  -d '{"clearAll": true}'

# Clear specific tags
curl -X POST https://your-app.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secret-here" \
  -d '{"tags": ["properties-hot", "properties-new"]}'
```

## 📋 Available Cache Tags

Use these tags for targeted revalidation:

| Tag | Description |
|-----|-------------|
| `properties` | **All property data** (clears everything) |
| `properties-all` | All properties list |
| `properties-hot` | Hot/trending properties (top 10 by views) |
| `properties-new` | New properties (less than 2 weeks old) |
| `properties-most-liked` | Most liked properties (top 10 by saves) |
| `properties-type-house` | House properties |
| `properties-type-apartment` | Apartment properties |
| `properties-type-investment` | Investment properties |
| `properties-type-plot` | Plot properties |
| `property-badges` | Property badge data (hot/new/liked) |

## 🛠️ How Caching Works Now

### Cache Duration

By default, all data is cached for **24 hours** (86,400 seconds). You can adjust this in `lib/supabase/server-queries.ts`:

```typescript
const CACHE_REVALIDATE = 86400; // Change this value (in seconds)
```

### Cache Hierarchy

```
User Request
    ↓
Vercel Edge Cache (24h)
    ↓ (if expired or invalidated)
Next.js Server
    ↓
unstable_cache (24h, tagged)
    ↓ (if expired or invalidated)
Supabase Database
```

### What Happens When You Upload Data

1. **Without cache clearing:**
   - Old data served for up to 24 hours
   - Users won't see new properties until cache expires

2. **With cache clearing (`npm run clear-cache`):**
   - Cache immediately invalidated
   - Next request fetches fresh data from Supabase
   - New data cached for another 24 hours

## 🔍 Troubleshooting

### Cache Not Clearing

**Problem:** Running `npm run clear-cache` but data doesn't update.

**Solutions:**
1. Check that `REVALIDATE_SECRET` matches in both `.env.local` and Vercel
2. Ensure you've deployed the updated code to Vercel
3. Verify the API endpoint is accessible: `https://your-app.vercel.app/api/revalidate`
4. Check Vercel logs for errors

### "Unauthorized" Error

**Problem:** Getting 401 Unauthorized when calling revalidation endpoint.

**Solutions:**
1. Verify `REVALIDATE_SECRET` is set in environment variables
2. Make sure the header `x-revalidate-secret` matches the env variable
3. Check Vercel environment variables are set correctly

### Data Still Old After Clearing Cache

**Problem:** Cleared cache but still seeing old data.

**Possible causes:**
1. **Browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Still using client-side queries** - Make sure you're importing from `server-queries.ts`, not `queries.ts`
3. **CDN cache** - Vercel CDN might take a few seconds to propagate
4. **Not awaiting properly** - Ensure you're using `await` when fetching data

### "Module not found: Can't resolve 'dotenv/config'"

**Problem:** Script fails because dotenv is not installed.

**Solution:**
```bash
npm install dotenv
```

## 📊 Monitoring Cache Performance

### Check Cache Status

In development, you can check if data is being cached by looking at server logs:

```bash
npm run dev
```

Visit pages and check the console - cached data will load much faster.

### Vercel Analytics

Enable Vercel Analytics to see:
- Cache hit rates
- Response times
- Data freshness

## 🔐 Security Notes

1. **Never commit** `.env.local` to git (already in `.gitignore`)
2. **Keep `REVALIDATE_SECRET` secret** - treat it like a password
3. **Use different secrets** for development and production
4. **Rotate secrets** periodically for security

## 🎯 Best Practices

1. **Clear cache after every data upload** - Make it part of your workflow
2. **Use specific tags** when possible - Faster than clearing everything
3. **Monitor cache hit rates** - Adjust cache duration if needed
4. **Set up automated clearing** - Use cron jobs or Vercel Cron for daily uploads
5. **Test in preview deployments** - Verify cache behavior before production

## 🤖 Automation Ideas

### GitHub Actions (After Data Upload)

```yaml
name: Clear Cache After Upload
on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  clear-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Clear Vercel Cache
        run: |
          curl -X POST https://your-app.vercel.app/api/revalidate \
            -H "Content-Type: application/json" \
            -H "x-revalidate-secret: ${{ secrets.REVALIDATE_SECRET }}" \
            -d '{"clearAll": true}'
```

### Vercel Cron Job

Add to your app to automatically clear cache daily:

```typescript
// app/api/cron/daily-revalidate/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Call your revalidation endpoint
  await fetch(`${process.env.NEXT_PUBLIC_URL}/api/revalidate`, {
    method: 'POST',
    headers: {
      'x-revalidate-secret': process.env.REVALIDATE_SECRET!,
    },
    body: JSON.stringify({ clearAll: true }),
  });

  return Response.json({ success: true });
}
```

## 📚 Additional Resources

- [Next.js Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [Vercel Cache Documentation](https://vercel.com/docs/concepts/edge-network/caching)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## 💡 Questions?

If you encounter issues:
1. Check this documentation
2. Review Vercel deployment logs
3. Verify environment variables are set
4. Test the revalidation endpoint manually

---

**Remember:** The key to fresh data is running `npm run clear-cache` after every upload! 🚀
