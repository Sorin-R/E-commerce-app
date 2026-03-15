# Render Deployment Guide

This project is ready to deploy with Render using the `render.yaml` file in project root.

## 1) Push code to GitHub

From project root:

```bash
git add .
git commit -m "Prepare Render deployment"
git push origin main
```

## 2) Create Render Blueprint

1. Open Render dashboard.
2. Click **New** -> **Blueprint**.
3. Select this GitHub repository.
4. Render will detect `render.yaml` and show 2 services:
   - `ecommerce-application-backend-api`
   - `ecommerce-client-application-frontend`

## 3) Configure backend environment values

In backend service settings, set these env vars:

- `DATABASE_URL` -> your PostgreSQL connection string
- `FRONTEND_APPLICATION_URL` -> your frontend Render URL (for CORS), example: `https://ecommerce-client-application-frontend.onrender.com`
- `BACKEND_APPLICATION_URL` -> your backend Render URL, example: `https://ecommerce-application-backend-api.onrender.com`
- `STRIPE_SECRET_KEY` -> Stripe secret key
- `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` (if using Google login)
- `GOOGLE_OAUTH_CALLBACK_URL` -> `https://<backend-url>/api/auth/google/callback`
- `FACEBOOK_OAUTH_APP_ID` and `FACEBOOK_OAUTH_APP_SECRET` (if using Facebook login)
- `FACEBOOK_OAUTH_CALLBACK_URL` -> `https://<backend-url>/api/auth/facebook/callback`

Session cookie settings are already configured in `render.yaml` for production:

- `SESSION_COOKIE_SAME_SITE=none`
- `SESSION_COOKIE_SECURE=true`

## 4) Configure frontend environment values

In frontend service settings, set:

- `REACT_APP_BACKEND_BASE_URL` -> backend Render URL, example: `https://ecommerce-application-backend-api.onrender.com`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` -> Stripe publishable key

## 5) Deploy and verify

After deploy is green:

1. Open frontend URL.
2. Register/login user.
3. Open products and add cart item.
4. Complete checkout (Stripe test card example: `4242 4242 4242 4242`, future expiry, any CVC).
5. Open order history and verify paid/completed order appears.

## 6) Useful backend test URL

Health endpoint:

`https://<backend-url>/api/health`
