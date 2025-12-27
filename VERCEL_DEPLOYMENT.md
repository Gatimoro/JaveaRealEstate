# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

This guide will help you deploy the Jávea Real Estate platform to Vercel with all required environment variables.

## Prerequisites

- Vercel account (free tier works fine)
- Google OAuth credentials (required for authentication)
- GitHub repository connected to Vercel

## Step 1: Google OAuth Setup

### 1.1 Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted:
   - User Type: External
   - App name: "Jávea Real Estate" (or your app name)
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: email, profile, openid (defaults)

### 1.2 Configure OAuth Client

1. Application type: **Web application**
2. Name: "Jávea Real Estate Web"
3. Authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://your-app-name.vercel.app` (for production)
   - Add your custom domain if you have one
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-app-name.vercel.app/api/auth/callback/google` (production)
   - Add custom domain callback if needed

5. Click **Create**
6. **IMPORTANT:** Copy the Client ID and Client Secret - you'll need these!

## Step 2: Generate NextAuth Secret

Run this command in your terminal to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output - this is your `NEXTAUTH_SECRET`.

## Step 3: Configure Vercel Environment Variables

### Via Vercel Dashboard

1. Go to your project on Vercel: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

#### Required for Authentication

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Production |
| `NEXTAUTH_URL` | `http://localhost:3000` | Development, Preview |
| `NEXTAUTH_SECRET` | Your generated secret from Step 2 | All |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | All |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret | All |

**Important Notes:**
- For Production: Use your actual Vercel URL
- For Preview: Use `http://localhost:3000` or leave blank (defaults to preview URL)
- Make sure to select the correct environment for each variable
- Click "Add" after each variable

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Add environment variables
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production

# Repeat for preview and development environments if needed
```

## Step 4: Update Google OAuth Redirect URIs

After your first deployment:

1. Note your Vercel deployment URL (e.g., `https://javea-real-estate.vercel.app`)
2. Go back to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Edit your OAuth 2.0 Client ID
4. Add the production redirect URI:
   - `https://your-vercel-url.vercel.app/api/auth/callback/google`
5. Save changes

## Step 5: Deploy

### Automatic Deployment (Recommended)

1. Push to your main branch on GitHub
2. Vercel will automatically deploy
3. Check the deployment logs for any errors

### Manual Deployment

```bash
vercel --prod
```

## Step 6: Verify Deployment

1. Visit your Vercel URL
2. Click "Sign in" in the navbar
3. You should be redirected to Google OAuth
4. After signing in with Google, you should be redirected back to your app
5. Your profile should appear in the navbar

## Troubleshooting

### "Error: No response from Google OAuth"

**Solution:** Check that your redirect URIs in Google Console exactly match your Vercel URL.

### "NEXTAUTH_URL mismatch"

**Solution:**
- Make sure `NEXTAUTH_URL` in Vercel matches your actual deployment URL
- No trailing slash in the URL
- Use `https://` not `http://` for production

### "Client authentication failed"

**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set in Vercel
- No extra spaces or quotes in the environment variables
- Make sure you're using credentials from the correct Google Cloud project

### "Callback URL mismatch"

**Solution:**
- In Google Console, add: `https://your-app.vercel.app/api/auth/callback/google`
- In Vercel env vars, set: `NEXTAUTH_URL=https://your-app.vercel.app`
- Both must match exactly (no trailing slashes)

### Preview Deployments Not Working

**Solution:**
- Vercel preview deployments use random URLs
- You can either:
  1. Add a wildcard domain in Google OAuth: `https://*.vercel.app/api/auth/callback/google` (if Google supports it)
  2. Use environment variables set to "Development, Preview" pointing to localhost
  3. Test auth only on production deployments

## Custom Domain Setup

If you're using a custom domain:

1. Add your domain in Vercel: **Settings** → **Domains**
2. Update environment variables:
   ```
   NEXTAUTH_URL=https://yourdomain.com
   ```
3. Add to Google OAuth:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Redirect URI: `https://yourdomain.com/api/auth/callback/google`

## Environment Variables Checklist

Before deploying, make sure you have:

- [ ] `NEXTAUTH_URL` - Your Vercel deployment URL
- [ ] `NEXTAUTH_SECRET` - Generated secret (32+ characters)
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] All redirect URIs added to Google OAuth config
- [ ] All origins added to Google OAuth config

## Optional: Supabase (Future Database)

When you're ready to connect a database:

1. Create a [Supabase](https://supabase.com) project
2. Add these environment variables in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
   ```

## Security Notes

⚠️ **NEVER commit .env.local to git**
⚠️ **NEVER share your GOOGLE_CLIENT_SECRET publicly**
⚠️ **Regenerate NEXTAUTH_SECRET if exposed**

## Support

If you're still having issues:

1. Check Vercel deployment logs: **Deployments** → Select deployment → **Logs**
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Make sure Google OAuth consent screen is published (not in testing mode)

## Quick Reference

```bash
# Redeploy after changing env vars
vercel --prod

# View deployment logs
vercel logs your-deployment-url

# List environment variables
vercel env ls

# Remove an environment variable
vercel env rm VARIABLE_NAME production
```

---

**Need help?** Check the [README.md](./README.md) or create an issue on GitHub.
