# AstroNumerix

A responsive SaaS-style astrology, numerology, and timing intelligence platform with a React/Webpack frontend and Express/MongoDB Atlas backend.

Registration and account settings can optionally store birth time and resolved birth location coordinates. When date of birth, birth time, and location are available, the backend calculates approximate Vedic birth indicators including ascendant and birth rashi.

## Requirements

- Node.js 18+
- MongoDB Atlas connection string

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm start
```

Set `MONGO_URI` in `backend/.env` to your MongoDB Atlas URI. The backend runs at `http://localhost:3000`.

## Frontend

```bash
npm install
copy .env.example .env
npm start
```

The frontend runs at `http://localhost:8080` and uses `REACT_APP_API_URL=http://localhost:3000`.

## API

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`
- `PATCH /users/me`
- `POST /numerology/profile`
- `POST /numerology/forecast`
- `POST /numerology/compatibility`
- `POST /numerology/loshu`
- `POST /numerology/name-score`
- `GET /numerology/history`
- `DELETE /numerology/history`
- `POST /trade/clean-analysis`

`GET /auth/me`, `PATCH /users/me`, all `/numerology/*` routes, and `/trade/clean-analysis` require `Authorization: Bearer <jwt>`.

`POST /trade/clean-analysis` powers the Clean Trade Engine. It returns informational timing intelligence from sunrise/sunset Choghadiya, Rahu Kaal, deterministic Vela overlays, optional ascendant weighting, and optional asset context. It is not investment, trading, tax, or financial advice. Asset analysis attempts live Yahoo Finance chart data for current price, support, resistance, and trend, then falls back to deterministic/mock analysis if live data is unavailable.

The `/clean-trade` page runs a default analysis on load using today's date, saved birth location/ascendant when available, and the Cumming, Georgia fallback otherwise. Manual Clean Trade runs are saved to calculation history; the automatic default analysis is not.

## Frontend Routes

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password/:token`
- `/dashboard`
- `/calculator`
- `/forecast`
- `/compatibility`
- `/loshu`
- `/clean-trade`
- `/profile`
- `/history`

## Quick Deployment

Recommended fast setup for sharing with testers:

1. Push this repository to GitHub.
2. Deploy the backend on Render as a Web Service:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variables:
     - `NODE_ENV=production`
     - `PORT=3000`
     - `MONGO_URI=<your MongoDB Atlas URI>`
     - `JWT_SECRET=<strong secret>`
     - `JWT_EXPIRES_IN=7d`
     - `CLIENT_URL=<your deployed frontend URL>`
3. Confirm the backend health check:
   - `https://your-backend.onrender.com/health`
4. Deploy the frontend on Netlify:
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Environment variable:
     - `REACT_APP_API_URL=https://your-backend.onrender.com`
5. After Netlify gives you the frontend URL, update Render `CLIENT_URL` to that exact URL and redeploy the backend.

The included `netlify.toml` handles React Router fallback routes such as `/dashboard` and `/clean-trade`.
