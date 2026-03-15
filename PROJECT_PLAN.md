# E-Commerce Project Plan

## 1) End Result Vision

I will build one full-stack e-commerce app with:
- Frontend: React + React Router
- Backend: Node.js + Express (REST API)
- Database: PostgreSQL
- Auth: username/password + Google login (OAuth)
- Payments: Stripe Checkout
- Deploy: Render (frontend + backend + database connection)

When finished, the app can do:
- User register and login
- Third-party login (Google)
- Keep user session
- Product listing and product details
- Add item to cart
- Checkout and complete payment
- Save orders and show order history
- Protect private pages (cart/checkout/history)

## 2) Scope Boundaries (to avoid scope creep)

Only build what project ask now:
- No admin dashboard for now
- No advanced search/filter/sort
- No reviews and ratings
- No wishlist
- No coupon system
- No email marketing system
- No multi-language support

If extra idea come, I write it in "Later Ideas" list, not in current sprint.

## 3) Natural Break Points (Milestones)

### Milestone A: Foundation
- Plan project
- Set up React project
- Set up React Router

### Milestone B: Authentication
- Build registration page
- Build login page
- Set up third-party login
- Enable session support
- Add logout functionality

### Milestone C: Shopping Experience
- Build products listing page
- Build product details page
- Track cart items

### Milestone D: Purchase + Security
- Build checkout flow
- Allow access to protected resources

### Milestone E: History + Release
- Set up order history
- Deploy to Render
- Final QA + bug fixes

## 4) Timeline (4 Weeks)

## Week 1 (Days 1-7) - Setup + Auth Basics
- Day 1: Plan and repo setup
- Day 2: React app setup + folder structure
- Day 3: React Router pages and routes
- Day 4: Register page UI + API connect
- Day 5: Login page UI + API connect
- Day 6: Session handling + logout
- Day 7: Buffer day (fix bugs, clean code)

Goal end of week: user can register/login/logout with normal auth.

## Week 2 (Days 8-14) - Third-Party Auth + Product Browse
- Day 8-9: Google OAuth setup (frontend + backend)
- Day 10: Product listing page
- Day 11: Product details page
- Day 12: Add to cart logic
- Day 13: Cart persistence check (session/local state strategy)
- Day 14: Buffer day (fix auth/cart bugs)

Goal end of week: user can login with Google and add product to cart.

## Week 3 (Days 15-21) - Checkout + Protected Routes
- Day 15: Checkout page UI + cart summary
- Day 16-17: Stripe checkout integration
- Day 18: Save successful order in database
- Day 19: Protected routes middleware/client guards
- Day 20: Redirect flows when not logged in
- Day 21: Buffer day (payment and security testing)

Goal end of week: logged in user can pay and order is stored.

## Week 4 (Days 22-28) - Order History + Deploy
- Day 22-23: Order history backend endpoint + frontend page
- Day 24: Show order status + purchased items
- Day 25: Prepare env vars and deployment config
- Day 26: Deploy backend + frontend to Render
- Day 27: End-to-end test in production
- Day 28: Final polish + README update

Goal end of week: live app with full required features.

## 5) Weekly Checklist Mapping (16/16 tasks)

1. Plan your project -> Week 1 Day 1
2. Set up React project -> Week 1 Day 2
3. Set up React Router -> Week 1 Day 3
4. Build registration page -> Week 1 Day 4
5. Build login page -> Week 1 Day 5
6. Set up third-party login -> Week 2 Day 8-9
7. Enable session support -> Week 1 Day 6
8. Add logout functionality -> Week 1 Day 6
9. Build products listing page -> Week 2 Day 10
10. Build product details page -> Week 2 Day 11
11. Track cart items -> Week 2 Day 12
12. Build checkout flow -> Week 3 Day 15-17
13. Allow access to protected resources -> Week 3 Day 19-20
14. Set up order history -> Week 4 Day 22-24
15. Deploy to Render -> Week 4 Day 25-26
16. Final testing and bug fixes -> Week 4 Day 27-28

## 6) Definition of Done

Project is done only if all are true:
- All 16 tasks completed
- User can register/login with normal auth and Google auth
- User can browse products, add cart, and complete Stripe payment
- User can see previous orders
- Protected routes are blocked for non-logged users
- App is deployed on Render and working
