# 🏥 Health Analytics Dashboard

Live analytics dashboard for **Care Plan** and **Smart CGM** data — Jan & Feb 2026.

## Features
- 📊 Care Plan & Smart CGM toggle
- 🗂️ 5 tabs: Overview, Geography, Sales Team, Product Mix, CGM Analysis
- 🔍 Filters: Month, State, AM Name
- 📈 Charts: Revenue trends, state breakdowns, AM leaderboards, CGM type distribution
- 💰 KPIs: Revenue, Carepay, Discounts, BCA Attachment Rate

---

## 🚀 Deploy to GitHub + Vercel (Step-by-Step)

### Step 1 — Create GitHub Repository
1. Go to [github.com](https://github.com) → click **"New repository"**
2. Name it: `health-analytics-dashboard`
3. Set to **Public** (required for free Vercel)
4. **Don't** initialize with README (you already have one)
5. Click **"Create repository"**

### Step 2 — Upload Files to GitHub
You'll see instructions like "push an existing repository". Use this method:

**Option A — GitHub Web Upload (easiest, no terminal needed):**
1. In your new repo, click **"uploading an existing file"**
2. Drag and drop ALL the files from the zip you downloaded
3. Make sure to maintain the folder structure:
   ```
   index.html
   package.json
   vite.config.js
   README.md
   src/
     main.jsx
     App.jsx
     data/
       carePlanData.js
       smartCgmData.js
   ```
4. Click **"Commit changes"**

**Option B — Terminal (if you have Git installed):**
```bash
cd health-analytics-dashboard
git init
git add .
git commit -m "Initial dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/health-analytics-dashboard.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → Sign up / Log in with **GitHub**
2. Click **"Add New Project"**
3. Find and click **"Import"** next to `health-analytics-dashboard`
4. Vercel auto-detects Vite — settings will be:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **"Deploy"**
6. Wait ~60 seconds ✅
7. Your live URL: `https://health-analytics-dashboard.vercel.app`

---

## 🛠️ Local Development

```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`

## 📦 Tech Stack
- React 18
- Vite 5
- Recharts
- Vercel (hosting)
