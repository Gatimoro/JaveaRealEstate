# Supabase Setup Guide - Jávea Real Estate

## 📋 Overview

This guide will help you:
1. Set up your Supabase project
2. Configure Google OAuth with Supabase Auth (replaces NextAuth.js)
3. Create database tables for properties and saved properties
4. Migrate from localStorage to Supabase

**Benefits of Supabase Auth over NextAuth.js:**
- ✅ Simpler configuration
- ✅ Built-in database integration
- ✅ No need for separate API routes
- ✅ Better real-time capabilities
- ✅ Easier to manage users

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended)
4. Click "New Project"
5. Fill in:
   - **Name:** `javea-real-estate` (or your choice)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users (Europe West for Spain)
   - **Pricing Plan:** Free tier is perfect to start

6. Click "Create new project" (takes ~2 minutes)

---

## Step 2: Get Your Supabase Credentials

Once your project is created:

1. Go to **Settings** (⚙️ icon in sidebar) → **API**
2. Copy these values:

```bash
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Add to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Set Up Google OAuth in Supabase

### 3.1 Get Google OAuth Credentials

You already have these from Google Cloud Console! Use your existing:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### 3.2 Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google** to ON
4. Enter your credentials:
   - **Client ID:** Your `GOOGLE_CLIENT_ID`
   - **Client Secret:** Your `GOOGLE_CLIENT_SECRET`
5. Click **Save**

### 3.3 Update Google OAuth Settings

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Edit your OAuth 2.0 Client ID
2. **Authorized JavaScript origins:**
   - `http://localhost:3000` (development)
   - `https://your-app.vercel.app` (production)
   - **ADD:** `https://xxxxxxxxxxxxx.supabase.co` (your Supabase URL)

3. **Authorized redirect URIs:**
   - **REPLACE** NextAuth callback with Supabase callback:
   - Remove: `http://localhost:3000/api/auth/callback/google`
   - Remove: `https://your-app.vercel.app/api/auth/callback/google`
   - **ADD:** `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`

4. Click **Save**

**Note:** You can keep your Vercel app URLs in JavaScript origins, just update the callback URI to Supabase.

---

## Step 4: Enable Email Confirmations (Optional but Recommended)

1. In Supabase: **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Toggle **Enable email confirmations** (recommended for production)
4. For development, you can disable this

---

## Step 5: Create Database Tables

### 5.1 Open SQL Editor

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**

### 5.2 Create Saved Properties Table

Paste and run this SQL:

```sql
-- Create saved_properties table
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Create index for faster queries
CREATE INDEX idx_saved_properties_user_id ON saved_properties(user_id);

-- Enable Row Level Security
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved properties
CREATE POLICY "Users can view own saved properties"
  ON saved_properties FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved properties
CREATE POLICY "Users can insert own saved properties"
  ON saved_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved properties
CREATE POLICY "Users can delete own saved properties"
  ON saved_properties FOR DELETE
  USING (auth.uid() = user_id);
```

Click **Run** (or press Cmd/Ctrl + Enter)

### 5.3 Create Properties Table (Future - for when you migrate from static data)

```sql
-- Create properties table (for future migration)
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('house', 'investment', 'plot')),
  title TEXT NOT NULL,
  title_en TEXT,
  title_ru TEXT,
  description TEXT,
  description_en TEXT,
  description_ru TEXT,
  price INTEGER NOT NULL,
  location TEXT NOT NULL,
  images TEXT[] NOT NULL,

  -- Specs
  bedrooms INTEGER,
  bathrooms INTEGER,
  size INTEGER NOT NULL,
  size_plot INTEGER,
  roi NUMERIC(5,2),
  rental_yield NUMERIC(5,2),
  zone TEXT,
  buildable BOOLEAN,
  max_build_sqm INTEGER,

  -- Coordinates (for geospatial features)
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  -- Features (JSON array of strings)
  features JSONB DEFAULT '[]'::jsonb,
  features_en JSONB DEFAULT '[]'::jsonb,
  features_ru JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  source TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_location ON properties(location);

-- Enable Row Level Security (everyone can read properties)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view properties"
  ON properties FOR SELECT
  USING (true);
```

---

## Step 6: Install Supabase Client

In your project directory:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## Step 7: Update Environment Variables

Your `.env.local` should now have:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (keep these - used by Supabase)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret

# Remove these (no longer needed):
# NEXTAUTH_URL
# NEXTAUTH_SECRET
```

---

## Step 8: Vercel Environment Variables

For production deployment:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. **Remove** old NextAuth variables:
   - ❌ `NEXTAUTH_URL`
   - ❌ `NEXTAUTH_SECRET`
   - ❌ `GOOGLE_CLIENT_ID` (Supabase handles this)
   - ❌ `GOOGLE_CLIENT_SECRET` (Supabase handles this)

3. **Add** Supabase variables (Production environment):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Step 9: Test Your Setup

### 9.1 Test Database Connection

In Supabase Dashboard:
1. Go to **Table Editor**
2. You should see `saved_properties` table
3. Click on it - it should be empty (that's expected!)

### 9.2 Test Authentication

Once I update the code (next step):
1. Run `npm run dev`
2. Click "Sign in" button
3. You should see Google OAuth popup
4. After signing in, you should be redirected back
5. Check Supabase: **Authentication** → **Users** - you should see your user!

---

## Step 10: Migration Checklist

After I update the code, here's what will change:

- ✅ **Auth:** NextAuth.js → Supabase Auth
- ✅ **Saved Properties:** localStorage → Supabase database
- ✅ **Session Management:** Automatic with Supabase
- ✅ **User Profile:** Pulled from Supabase Auth
- ✅ **Real-time:** Ready for future real-time features

**Files that will be updated:**
- `lib/supabase.ts` (new - Supabase client)
- `lib/savedProperties.tsx` (update to use Supabase)
- `components/Navbar.tsx` (update auth)
- `components/Providers.tsx` (update providers)
- Remove: `lib/auth.ts` (NextAuth config)
- Remove: `app/api/auth/[...nextauth]/route.ts` (NextAuth API)

---

## 🎯 Ready to Proceed?

Let me know when you've:
1. ✅ Created Supabase project
2. ✅ Added credentials to `.env.local`
3. ✅ Configured Google OAuth in Supabase
4. ✅ Updated Google Console redirect URIs
5. ✅ Created database tables (SQL above)
6. ✅ Installed Supabase packages

Then I'll update all the code to use Supabase! 🚀

---

## 🆘 Troubleshooting

### "Invalid redirect URI"
- Make sure you added `https://xxxxx.supabase.co/auth/v1/callback` to Google Console

### "Invalid client"
- Check that Client ID and Secret match exactly in Supabase and Google Console

### "User not found"
- Make sure you signed in at least once
- Check **Authentication** → **Users** in Supabase

### Tables not showing up
- Make sure you ran the SQL queries in Step 5
- Check **Table Editor** in Supabase Dashboard

---

Need help with any step? Let me know! 🙌
