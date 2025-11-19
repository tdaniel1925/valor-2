# Vercel Environment Variables Checklist

Go to: https://vercel.com/tdaniel1925/valor-2/settings/environment-variables

## Required Environment Variables

Make sure ALL of these are set for **Production**, **Preview**, AND **Development**:

### 1. DATABASE_URL
```
postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

**IMPORTANT**: Must include `?pgbouncer=true&connection_limit=1` for Vercel serverless functions

### 2. DIRECT_URL
```
postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres
```

### 3. NEXT_PUBLIC_SUPABASE_URL
```
https://buteoznuikfowbwofabs.supabase.co
```

### 4. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dGVvem51aWtmb3did29mYWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzU5NDEsImV4cCI6MjA3OTExMTk0MX0.cGfct05CvGVJD5evDGEj1wOXt7lsx5BvmjxgJk-3LC8
```

## Common Issues:

### Issue 1: Prisma Connection Pooling
The DATABASE_URL MUST include `?pgbouncer=true&connection_limit=1` for Vercel.

**Wrong:**
```
postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres
```

**Correct:**
```
postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

### Issue 2: Variables Not Applied to All Environments
Click the checkboxes for:
- ☑ Production
- ☑ Preview
- ☑ Development

### Issue 3: Need to Redeploy After Adding Variables
After adding/changing environment variables:
1. Go to: https://vercel.com/tdaniel1925/valor-2
2. Click "Deployments" tab
3. Click "..." on latest deployment
4. Click "Redeploy"

## How to Check Current Variables:

1. Go to: https://vercel.com/tdaniel1925/valor-2/settings/environment-variables
2. Verify all 4 variables exist
3. Click each one to verify the value is correct
4. Ensure "Production" checkbox is checked

## Alternative: Use Supabase Integration

Instead of manual env vars, you can use Vercel's Supabase integration:
1. Go to: https://vercel.com/integrations/supabase
2. Click "Add Integration"
3. Connect your Supabase project
4. Auto-configures all environment variables

## After Fixing:

1. Redeploy on Vercel
2. Wait 30 seconds
3. Hard refresh: Ctrl+Shift+R on https://valor-2.vercel.app
4. Check browser console - should see no more 500 errors
