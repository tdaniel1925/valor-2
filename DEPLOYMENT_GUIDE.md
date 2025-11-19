# Valor Insurance Platform - Deployment Guide

Complete guide to deploying the Valor Insurance Platform to production.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Supabase account (https://supabase.com)
- [ ] GitHub account
- [ ] Vercel account (https://vercel.com)
- [ ] Git installed

---

## Step 1: Supabase Production Setup ☁️

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Configure:
   - **Name**: `valor-insurance-prod`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Plan**: Select appropriate tier
4. Click **"Create new project"** (takes ~2 minutes)

### 1.2 Get Database Credentials

**Settings** → **Database** → Copy connection strings:

```
Host: db.[PROJECT-REF].supabase.co
Database: postgres
Port: 5432
User: postgres
Password: [YOUR-PASSWORD]
```

Connection string format:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 1.3 Get Supabase API Keys

**Settings** → **API** → Copy:

- **Project URL**: `https://[PROJECT-REF].supabase.co`
- **anon/public key**: `eyJhbGc...`

### 1.4 Configure Supabase Auth (Optional)

**Authentication** → **Providers**:
- Enable Email/Password
- Enable Google OAuth (optional)
- Configure redirect URLs for production

---

## Step 2: Push Database Schema 🗄️

### 2.1 Update Environment Variables

Create `.env.production` (don't commit this!):

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

### 2.2 Generate Prisma Client

```bash
npx prisma generate
```

### 2.3 Push Schema to Supabase

```bash
npx prisma db push
```

This creates all tables in your Supabase database.

### 2.4 Seed Initial Data (Optional)

```bash
npm run db:seed
```

### 2.5 Verify in Supabase

Go to **Table Editor** in Supabase dashboard - you should see all tables created.

---

## Step 3: GitHub Setup 🐙

### 3.1 Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Valor Insurance Platform"
```

### 3.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `valor-insurance-platform`
3. Description: `Insurance back office platform for agents and agencies`
4. **Private** repository (recommended)
5. Don't initialize with README (we already have one)
6. Click **"Create repository"**

### 3.3 Push to GitHub

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR-USERNAME/valor-insurance-platform.git

# Push code
git branch -M main
git push -u origin main
```

### 3.4 Verify Upload

Go to your GitHub repository - all files should be there (except `.env*` files).

---

## Step 4: Vercel Deployment 🚀

### 4.1 Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `valor-insurance-platform` repository
4. Click **"Import"**

### 4.2 Configure Project

**Framework Preset**: Next.js (auto-detected)

**Build & Development Settings**:
- Build Command: `next build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)
- Development Command: `next dev` (default)

### 4.3 Add Environment Variables

Click **"Environment Variables"** and add:

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=Valor Insurance Platform

# Add integration API keys as needed (optional)
# WINFLEX_ENABLED=true
# WINFLEX_API_KEY=...
```

**Important**: Add these to **Production**, **Preview**, and **Development** environments.

### 4.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://[PROJECT-NAME].vercel.app`

---

## Step 5: Post-Deployment Setup ✅

### 5.1 Update Supabase Auth URLs

In Supabase dashboard → **Authentication** → **URL Configuration**:

Add these URLs:
- Site URL: `https://[YOUR-APP].vercel.app`
- Redirect URLs:
  - `https://[YOUR-APP].vercel.app/auth/callback`
  - `https://[YOUR-APP].vercel.app`

### 5.2 Test Production Deployment

1. Visit your Vercel URL
2. Test user registration/login
3. Verify database connection
4. Test creating a quote
5. Check all pages load correctly

### 5.3 Configure Custom Domain (Optional)

**Vercel Dashboard** → **Settings** → **Domains**:

1. Add your custom domain (e.g., `app.valorinsurance.com`)
2. Update DNS records as instructed
3. Update Supabase redirect URLs with custom domain

---

## Step 6: Continuous Deployment 🔄

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main
```

Vercel will:
1. Detect the push
2. Build the project
3. Deploy to production
4. Update your live site

### Branch Deployments

Push to other branches for preview deployments:

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
```

Vercel creates a preview URL for testing.

---

## Environment Variables Quick Reference

### Required Variables

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# App Config (REQUIRED)
NEXT_PUBLIC_APP_URL=https://...
NEXT_PUBLIC_APP_NAME=Valor Insurance Platform
```

### Optional Integration Variables

Only add these when you're ready to enable integrations:

```env
# WinFlex
WINFLEX_ENABLED=true
WINFLEX_API_KEY=your_key

# iPipeline
IPIPELINE_ENABLED=true
IPIPELINE_API_KEY=your_key
IPIPELINE_API_SECRET=your_secret

# Resend (Email)
RESEND_ENABLED=true
RESEND_API_KEY=your_key

# Add others as needed...
```

---

## Troubleshooting 🔧

### Build Fails on Vercel

**Error**: `Prisma Client not generated`

**Fix**: Ensure `postinstall` script in `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Database Connection Issues

**Error**: `Can't reach database server`

**Fix**:
1. Verify `DATABASE_URL` is correct
2. Check Supabase project is active
3. Ensure IP is not blocked (Supabase allows all by default)

### Environment Variables Not Working

**Fix**:
1. Verify variables are added in Vercel dashboard
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

### Pages Return 404

**Fix**:
1. Clear Vercel cache and redeploy
2. Ensure `app` directory structure is correct
3. Check middleware isn't blocking routes

---

## Security Checklist 🔒

Before going live:

- [ ] All `.env*` files in `.gitignore`
- [ ] No API keys committed to GitHub
- [ ] Supabase Row Level Security (RLS) enabled
- [ ] Auth configured properly
- [ ] Rate limiting enabled on Vercel
- [ ] CORS configured correctly
- [ ] SSL/HTTPS enabled (automatic on Vercel)
- [ ] Database backups enabled in Supabase

---

## Monitoring & Maintenance 📊

### Vercel Dashboard

Monitor:
- Build logs
- Runtime logs
- Performance metrics
- Error tracking

### Supabase Dashboard

Monitor:
- Database size
- API requests
- Auth users
- Storage usage

### Regular Maintenance

- **Weekly**: Check error logs
- **Monthly**: Review performance metrics
- **Quarterly**: Update dependencies
- **As needed**: Scale Supabase/Vercel plans

---

## Scaling Considerations 📈

### Database (Supabase)

- **Free**: 500 MB, 2 GB bandwidth
- **Pro**: 8 GB, 50 GB bandwidth - $25/month
- **Team**: Custom, contact sales

### Hosting (Vercel)

- **Hobby**: Free for personal projects
- **Pro**: $20/user/month - includes team features
- **Enterprise**: Custom pricing

### When to Scale

- Users > 1,000: Consider Pro plans
- Database > 5 GB: Upgrade Supabase
- Traffic spikes: Vercel scales automatically
- API integrations active: Monitor usage carefully

---

## Success Metrics 🎯

Track these after deployment:

- ✅ Users can register/login
- ✅ Quotes generate successfully
- ✅ Cases create and track properly
- ✅ Commissions calculate correctly
- ✅ Reports load data
- ✅ All pages accessible
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Page load < 3 seconds
- ✅ 99%+ uptime

---

## Next Steps

After successful deployment:

1. **Invite Users**: Add your team to test
2. **Enable Integrations**: Add API keys as needed
3. **Configure Branding**: Customize colors/logos
4. **Set Up Monitoring**: Enable error tracking (Sentry)
5. **Create Documentation**: User guides and training
6. **Plan Rollout**: Phased user onboarding

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Production URL**: _______________
**Supabase Project**: _______________

---

✅ **Ready to Deploy!**

Follow the steps above in order, and you'll have a production-ready insurance platform running in under an hour.
