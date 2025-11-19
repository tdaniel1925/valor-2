# Vercel Production Fix Guide

## The Problem

Your Vercel deployment shows this error:
```
Can't reach database server at `db.buteoznuikfowbwofabs.supabase.co:5432`
```

This means Vercel **cannot connect to your Supabase database**. The database exists and has tables, but Vercel doesn't have the correct connection information.

## Step 1: Check Current Environment Variables

1. Go to: https://vercel.com/tdaniel1925/valor-2/settings/environment-variables
2. Look for these 4 variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: Verify DATABASE_URL

**CRITICAL**: The `DATABASE_URL` in Vercel MUST include connection pooling parameters.

### ❌ WRONG (This will cause 500 errors):
```
postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres
```

### ✅ CORRECT (This will work):
```
postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

**Notice the difference**: `?pgbouncer=true&connection_limit=1` at the end.

## Step 3: Set All Environment Variables

### Copy-paste these exact values into Vercel:

#### 1. DATABASE_URL
```
postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

#### 2. DIRECT_URL
```
postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres
```

#### 3. NEXT_PUBLIC_SUPABASE_URL
```
https://buteoznuikfowbwofabs.supabase.co
```

#### 4. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dGVvem51aWtmb3did29mYWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzU5NDEsImV4cCI6MjA3OTExMTk0MX0.cGfct05CvGVJD5evDGEj1wOXt7lsx5BvmjxgJk-3LC8
```

## Step 4: Important Settings

For EACH environment variable:
1. ✅ Check "Production"
2. ✅ Check "Preview"
3. ✅ Check "Development"

## Step 5: Redeploy

After updating the environment variables:

1. Go to: https://vercel.com/tdaniel1925/valor-2
2. Click the "Deployments" tab
3. Find the latest deployment
4. Click the "..." menu button
5. Click "Redeploy"
6. **IMPORTANT**: Check "Use existing Build Cache" = OFF (force fresh build)
7. Click "Redeploy"

## Step 6: Wait and Test

1. Wait 30-60 seconds for deployment to complete
2. Go to: https://valor-2.vercel.app
3. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
4. Check browser console (F12) - you should see NO more 500 errors

## Troubleshooting

### If still getting 500 errors after following all steps:

1. **Check Vercel Logs**:
   - Go to: https://vercel.com/tdaniel1925/valor-2
   - Click on the latest deployment
   - Click "Functions" tab
   - Click on any failed API route
   - Read the error message

2. **Verify Supabase is Running**:
   - Go to: https://supabase.com/dashboard/project/buteoznuikfowbwofabs
   - Check that project status is "Active" (green)
   - Try connecting from Supabase SQL Editor

3. **Check Connection String**:
   - In Supabase dashboard, go to Project Settings > Database
   - Copy the "Connection string" under "Connection pooling"
   - Compare with what you entered in Vercel
   - They should match (except password might be masked)

## Alternative: Use Vercel's Supabase Integration

Instead of manually setting environment variables:

1. Go to: https://vercel.com/integrations/supabase
2. Click "Add Integration"
3. Follow prompts to connect your Supabase project
4. This will automatically set all environment variables correctly

## Need More Help?

If errors persist after following this guide:

1. Take a screenshot of your Vercel environment variables page (hide the values)
2. Copy the error message from Vercel function logs
3. Check if Supabase shows any connection attempts in their logs

---

## Quick Checklist

- [ ] DATABASE_URL includes `?pgbouncer=true&connection_limit=1`
- [ ] All 4 environment variables are set
- [ ] Each variable is checked for Production, Preview, Development
- [ ] Redeployed with cache cleared
- [ ] Waited 60 seconds for deployment
- [ ] Hard refreshed the page (Ctrl+Shift+R)
- [ ] Checked Vercel function logs for new error messages
