# 🚀 Cloud Deployment Guide (Render & Railway)

Your project is already pre-configured with `render.yaml`, `Procfile`, `Dockerfile`, and dynamic port binding (`0.0.0.0:$PORT`).

---

## Step 1: Push Project to GitHub

If you haven't created a GitHub repository yet:
1. Go to **[github.com/new](https://github.com/new)**
2. Name your repository (e.g., `ai-resume-analyzer`)
3. Leave it **Public** (or Private), and **do not** check "Add a README" (your project already has one).
4. Click **Create repository**.

Then run the following commands in your terminal:

```powershell
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

*(Replace `<YOUR_GITHUB_USERNAME>` and `<YOUR_REPO_NAME>` with your actual GitHub details).*

---

## Step 2: Choose Your Cloud Platform

### Option A: Deploy on Render (Recommended - 100% Free)

1. Sign up or log in at **[render.com](https://render.com)** (you can sign in with GitHub).
2. On your Render Dashboard, click **New +** and select **Web Service** (or **Blueprint**).
3. Select your repository `ai-resume-analyzer` and click **Connect**.
4. Configure the service settings (Render will auto-fill most from `render.yaml`):
   - **Name**: `ai-resume-analyzer`
   - **Language**: `Python 3`
   - **Region**: Choose the closest to you (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
5. *(Optional)* Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Optional, for cloud AI bullet rewriting)*
6. Click **Deploy Web Service**!

> ⏳ Render will build dependencies and provide you with a live HTTPS URL (e.g., `https://ai-resume-analyzer.onrender.com`) in ~2 minutes.

---

### Option B: Deploy on Railway (Ultra Fast, Zero Config)

1. Go to **[railway.com](https://railway.com)** and sign in with GitHub.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository `ai-resume-analyzer`.
4. Railway will automatically detect the `Procfile` and `requirements.txt` and begin building.
5. In your project settings, click **Generate Domain** to get a public URL (e.g. `https://ai-resume-analyzer.up.railway.app`).

---

## Verification Checklist

Once deployed, verify:
- Open your live app URL in the browser.
- Try loading a sample preset (e.g. Senior Full Stack Engineer + Alex Turner).
- Click **Match & Analyze Candidate** to confirm scoring and missing skills extraction work.
- Click **Download PDF Report** to verify ReportLab generation.
