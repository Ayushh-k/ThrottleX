# THROTTLEX — Production Deployment Guide
## Deploying to Vercel with MongoDB Atlas

This repository is pre-configured with **Vercel Serverless Functions** and **Vercel Static SPA Routing** for turnkey, zero-config deployment.

---

### Step 1: Set Up Free MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account (or log in).
2. Click **Create a Deployment** and choose the **M0 Free Tier**.
3. Under **Security Quickstart**:
   - Create a Database User with username (e.g. `throttlex_admin`) and a secure password.
   - Under **Where would you like to connect from?**, choose **Allow Access from Anywhere (`0.0.0.0/0`)** so Vercel's serverless functions can connect.
4. Click **Choose a connection method** -> **Drivers (Node.js)**.
5. Copy your connection URI. It will look like:
   ```
   mongodb+srv://throttlex_admin:<password>@cluster0.yourcluster.mongodb.net/throttlex?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual database user password)*.

---

### Step 2: Push Your Code to GitHub

Open terminal in `c:\Bike` and initialize Git:

```bash
git init
git add .
git commit -m "feat: complete THROTTLEX rental manager with Vercel and MongoDB Atlas support"
```

Create a new repository on your GitHub account (e.g., `throttlex-rental-manager`) and push:

```bash
git remote add origin https://github.com/<your-username>/throttlex-rental-manager.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy on Vercel

1. Go to [Vercel](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select your `throttlex-rental-manager` repository and click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset**: *Other* (or Vite)
   - **Root Directory**: `./` (leave default)
   - Expand the **Environment Variables** section and add:
     - `MONGODB_URI`: Your MongoDB Atlas connection string from Step 1.
     - `JWT_SECRET`: Any random string (e.g. `throttlex_jwt_super_key_2026`)
     - `NODE_ENV`: `production`
5. Click **Deploy**!

Vercel will automatically build the React Vite frontend and configure the Express API as a high-speed Serverless Function on your custom `*.vercel.app` domain.

---

### Step 4: First Launch & Owner Sign In

Once your Vercel deployment finishes:
1. Open your live URL: `https://your-project.vercel.app` (or `http://localhost:3000` locally).
2. Your Owner account is automatically initialized upon database connection:
   - **Email:** `ayushkamboj9690@gmail.com`
   - **Password:** `ayush@tx123`
3. Click **"Sign In to Dashboard"**.
4. You are now logged in as the official Owner & Managing Partner of THROTTLEX! From there, you can:
   - Add your bikes to the fleet
   - Invite your business partner
   - Start recording rentals, expenses, and partner settlements!

---

### Troubleshooting Common Issues

1. **"Server error (500)" on Vercel:**
   - **Cause 1:** Missing `MONGODB_URI` environment variable. Go to your Vercel Project -> **Settings** -> **Environment Variables**, verify `MONGODB_URI` is added for **Production**, **Preview**, and **Development**.
   - **Cause 2:** MongoDB Atlas IP access blocked. In [MongoDB Atlas](https://cloud.mongodb.com), go to **Network Access** -> click **Add IP Address** -> select **Allow Access From Anywhere (`0.0.0.0/0`)** -> Confirm.
   - **Cause 3:** MongoDB Atlas password has special characters not URL-encoded (e.g. `@`, `#`, `%`). If your password contains `@`, encode it as `%40` or change your database user password to an alphanumeric string in Atlas.

