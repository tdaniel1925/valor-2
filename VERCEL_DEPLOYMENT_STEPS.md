# Vercel Deployment - Quick Start Guide

The local machine cannot connect to Supabase directly, so we'll deploy to Vercel first and let Vercel handle the database connection.

## Step 1: Prepare Vercel Deployment

Your code is already on GitHub at: `https://github.com/tdaniel1925/valor-2`

## Step 2: Go to Vercel

1. Visit: **https://vercel.com/new**
2. Sign in with GitHub (if not already)
3. Click **"Import Git Repository"**

## Step 3: Import Your Repository

1. Find: `tdaniel1925/valor-2`
2. Click **"Import"**
3. Framework: **Next.js** (should auto-detect)

## Step 4: Configure Environment Variables

Click **"Environment Variables"** and add these (copy-paste):

### Database (Required)

```
DATABASE_URL
postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

```
DIRECT_URL
postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres
```

### Supabase Auth (Required)

```
NEXT_PUBLIC_SUPABASE_URL
https://buteoznuikfowbwofabs.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dGVvem51aWtmb3did29mYWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzU5NDEsImV4cCI6MjA3OTExMTk0MX0.cGfct05CvGVJD5evDGEj1wOXt7lsx5BvmjxgJk-3LC8
```

### App Config (Optional but Recommended)

```
NEXT_PUBLIC_APP_NAME
Valor Insurance Platform
```

**IMPORTANT**:
- Add these to **ALL THREE** environments: Production, Preview, Development
- Click the checkboxes for all three when adding each variable

## Step 5: Deploy

1. Leave all other settings as default
2. Click **"Deploy"**
3. Wait 2-3 minutes for build to complete

## Step 6: Push Database Schema

Once Vercel deployment succeeds, we have two options:

### Option A: Use Vercel CLI (Recommended)

After deployment, run from Vercel's environment:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Run Prisma push remotely
vercel env pull .env.vercel
npx prisma db push
```

### Option B: Use Supabase Studio (Manual)

1. Go to: https://supabase.com/dashboard/project/buteoznuikfowbwofabs
2. Click **"SQL Editor"**
3. Run this locally first to generate SQL:
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
   ```
4. Copy contents of `schema.sql`
5. Paste into Supabase SQL Editor
6. Click **"Run"**

## Step 7: Verify Deployment

1. Visit your Vercel URL (provided after deployment)
2. Should see the Valor login page
3. Try registering a new user
4. Check Supabase dashboard → Table Editor to see if tables exist

## Expected Result

- ✅ App deployed at: `https://valor-2-[hash].vercel.app`
- ✅ Database tables created in Supabase
- ✅ Users can register and login
- ✅ All features working

## Troubleshooting

### If build fails:
- Check Vercel build logs
- Ensure all environment variables are set
- Verify `postinstall` script exists in package.json

### If database tables aren't created:
- Use Option B (Supabase Studio) to manually create tables
- Check Supabase project is active
- Verify DATABASE_URL is correct

## Next Steps After Successful Deployment

1. Test all major features
2. Update Supabase Auth redirect URLs to your Vercel domain
3. (Optional) Add custom domain in Vercel settings
4. Enable integrations by adding API keys to Vercel environment variables

---

**GitHub Repository**: https://github.com/tdaniel1925/valor-2
**Supabase Project**: https://buteoznuikfowbwofabs.supabase.co
**Next**: Deploy on Vercel → Verify → Push Schema
