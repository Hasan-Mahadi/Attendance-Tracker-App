# Production Deployment Guide — AIExpertsBD Attendance Tracker

This guide covers deployment of the AIExpertsBD Attendance Tracker stack across **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

---

## 1. Architecture & Domain Topology

In production, avoid cross-site cookie blocking by utilizing subdomains of the same parent domain:
- **Frontend App**: `https://attendance.aiexpertsbd.com` (Vercel)
- **REST API Backend**: `https://api-attendance.aiexpertsbd.com` (Render)
- **Cookie Scope**: `COOKIE_DOMAIN=.aiexpertsbd.com`

If deployed on default vendor domains (e.g. `*.vercel.app` and `*.onrender.com`), set `COOKIE_DOMAIN=` (empty) and ensure `SameSite=None` with `Secure=true`.

---

## 2. Database: MongoDB Atlas Configuration

1. Create a production cluster in MongoDB Atlas (recommended region: `ap-south-1` Mumbai or `ap-southeast-1` Singapore for lowest latency from Dhaka).
2. Create database user with `readWrite` permissions on the `attendance-tracker` database.
3. In Network Access, whitelist Render's outbound IPs (or `0.0.0.0/0` with strong password authentication).
4. Obtain connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/attendance-tracker?retryWrites=true&w=majority
   ```
5. Automated Index Creation:
   The Mongoose schemas automatically ensure compound indexes on startup:
   - `{ employee: 1, date: 1 }` (unique)
   - `{ employee: 1, leaveCategory: 1, year: 1 }` (unique)
   - `{ month: 1, year: 1 }` (unique)
   - `{ payrollPeriod: 1, employee: 1 }` (unique)

---

## 3. Backend Deployment: Render

1. Create a new **Web Service** on Render connected to the repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Environment Variables:
   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render default) |
   | `MONGODB_URI` | `mongodb+srv://...` |
   | `JWT_ACCESS_SECRET` | Strong 64-char random secret |
   | `JWT_REFRESH_SECRET` | Strong 64-char random secret |
   | `ACCESS_TOKEN_TTL` | `15m` |
   | `REFRESH_TOKEN_TTL` | `7d` |
   | `FRONTEND_URL` | `https://attendance.aiexpertsbd.com` |
   | `CORS_ORIGINS` | `https://attendance.aiexpertsbd.com` |
   | `COOKIE_DOMAIN` | `.aiexpertsbd.com` (or empty if on vercel.app) |
   | `SEED_ADMIN_EMAIL` | `admin@aiexpertsbd.com` |
   | `SEED_ADMIN_PASSWORD` | Strong administrative password |
4. Health Check Path: `/api/v1/health`
5. Seed Database on Initial Launch:
   From Render Shell:
   ```bash
   npm run seed
   ```

---

## 4. Frontend Deployment: Vercel

1. Import the Git repository into Vercel.
2. Configure settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Environment Variables:
   | Variable | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://api-attendance.aiexpertsbd.com/api/v1` |
4. Deploy and verify responsive views and CORS cookie sharing.
