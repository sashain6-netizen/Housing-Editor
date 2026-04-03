# Easy Cloudflare Dashboard Setup

You can set up everything directly from the Cloudflare Dashboard - no command line needed!

## 🎯 Quick Setup Steps

### 1. Database Setup (D1)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to **Workers & Pages** → **D1**
4. Click **"Create database"**
5. Name it: `housing-editor`
6. Click **"Create"**
7. Once created, click **"Initialize"** → **"Upload schema"**
8. Upload your `schema.sql` file
9. Click **"Initialize"**

### 2. KV Namespace Setup

1. In Cloudflare Dashboard, go to **Workers & Pages** → **KV**
2. Click **"Create namespace"**
3. Name it: `HOUSING_EDITOR_KV`
4. Click **"Create"**
5. Copy the **Namespace ID** (you'll need this)

### 3. Pages Project Setup

1. Go to **Workers & Pages** → **Pages**
2. Find your `housing-editor` project
3. Click on it → **Settings** → **Functions**
4. Add D1 database binding:
   - Variable name: `DB`
   - D1 database: `housing-editor`
5. Add KV namespace binding:
   - Variable name: `KV`
   - KV namespace: `HOUSING_EDITOR_KV`
6. Click **"Save"**

### 4. Environment Variables

1. In Pages project, go to **Settings** → **Environment variables**
2. Add:
   - Variable: `VITE_API_URL`
   - Value: `https://housing-editor.pages.dev/api`
   - Variable: `JWT_SECRET`
   - Value: `your-super-secret-jwt-key-change-this-in-production`
3. Click **"Save"**

### 5. Deploy

1. Go to your project's **Deployments** tab
2. Click **"Create deployment"**
3. Upload your built files or connect your GitHub repo
4. Click **"Deploy"**

## 🚀 Alternative: Just Deploy Directly

Since your `wrangler.toml` is already configured with the correct database and KV IDs, you can skip the setup and just deploy:

```bash
npm run pages:deploy
```

This will:
- Build your frontend
- Deploy to Pages
- Automatically use the existing D1 database and KV namespace

## 📋 What's Already Configured

Your `wrangler.toml` already has:
- ✅ D1 database binding: `DB` → `housing-editor`
- ✅ KV namespace binding: `KV` → `c675420dfbbe46e7937fa8043c5d9ef6`
- ✅ Environment variables for Pages

So you just need to:
1. Initialize the database with the schema (one-time)
2. Deploy the site

## 🔧 Database Schema Upload

If you prefer the dashboard for the database:

1. In D1 dashboard, click your `housing-editor` database
2. Click **"Initialize"**
3. Choose **"Upload schema"**
4. Upload the `schema.sql` file from your project
5. Click **"Initialize"**

## ✅ That's It!

Once the database is initialized and you deploy, your site will work at:
`https://housing-editor.pages.dev`

All API endpoints will be available at:
`https://housing-editor.pages.dev/api`

No command line tools required!
