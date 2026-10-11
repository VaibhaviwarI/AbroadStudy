# Waygood Study Abroad Candidate Evaluation Starter

This repository is a starter assignment for backend-focused MERN candidates interviewing with Waygood.

Waygood's public website positions the business around helping students discover universities, compare options, plan budgets, and navigate their study-abroad journey with AI-assisted tools and partner networks. This starter mirrors that business context by focusing on student discovery, recommendation, and application tracking.

## Business Scenario

You are joining the engineering team working on a study-abroad platform for students and counselors.

The product already has:

- a basic university and program catalog
- seeded sample data for students, universities, programs, and applications
- a minimal React dashboard shell
- starter backend architecture with Express, Mongoose, controllers, services, and middleware

The product is still missing critical engineering work needed for a real candidate-ready release.

## Your Assignment

Build on top of this starter and complete the platform features below.

### Required Tasks

1. Implement secure authentication

- Complete `POST /api/auth/register`
- Complete `POST /api/auth/login`
- Add a protected `GET /api/auth/me`
- Use JWT-based authentication
- Store passwords securely using hashing
- Support roles for `student` and `counselor`

2. Complete advanced university and program discovery

- Extend `GET /api/universities` and `GET /api/programs`
- Add filtering by country, intake, degree level, budget, scholarship availability, and search term
- Add pagination metadata and sorting options
- Make the response format consistent and frontend-friendly

3. Build a recommendation engine using MongoDB aggregation

- Improve `GET /api/recommendations/:studentId`
- Use MongoDB aggregation to recommend relevant programs for a student
- Consider preferred countries, budget, field of interest, intake, and IELTS score
- Return top matches with a short explanation of why each result matched

4. Implement the application workflow

- Complete `POST /api/applications`
- Complete `PATCH /api/applications/:id/status`
- Prevent duplicate applications for the same student, program, and intake
- Enforce valid status transitions
- Record a timeline/history entry when status changes

5. Add caching and performance improvements

- Cache `GET /api/universities/popular` and/or dashboard summary responses
- You may use Redis or improve the provided in-memory cache
- Add or document MongoDB indexes that improve the most important queries
- Keep performance tradeoffs clear in code comments or README notes

6. Add testing and developer documentation

- Add tests for at least 2 important API flows
- Include at least 1 edge-case test
- Update this README with any assumptions, setup steps, and architecture notes needed to review your submission

### Bonus Tasks

- Integrate an AI endpoint for study-plan suggestions, SOP helper prompts, or shortlist summaries
- Dockerize the backend and database setup
- Improve the React dashboard to consume your new APIs cleanly
- Add rate limiting, request logging, or role-based access improvements

## What We Will Evaluate

- Backend architecture and code organization
- API design, validation, and error handling
- MongoDB query quality, aggregation usage, and indexing awareness
- Performance thinking, including caching and response design
- Code readability, maintainability, and naming
- Testing depth and practical engineering judgment
- How well your solution reflects a real study-abroad product workflow

## Suggested Timebox

A strong submission can usually be completed in 6-8 focused hours. We care more about thoughtful engineering tradeoffs than feature volume.

## Suggested Submission Expectations

- Keep the solution realistic and production-minded
- Favor clean, explainable code over unnecessary complexity
- If you make assumptions, document them
- If you skip a bonus feature, that is okay
- Share your repository, setup instructions, and any sample credentials or environment notes needed to review

## Starter Project Structure

```text
.
|-- backend
|   |-- src
|   |   |-- config
|   |   |-- controllers
|   |   |-- data
|   |   |-- middleware
|   |   |-- models
|   |   |-- routes
|   |   |-- scripts
|   |   |-- services
|   |   `-- utils
|-- frontend
|   `-- src
`-- docs
```

## Getting Started
## Solution Implementation Overview

This repository contains the complete, production-ready solution for the Waygood Study Abroad Platform backend evaluation, built using **Node.js, Express, MongoDB/Mongoose, JWT, React, and Tailwind CSS**.

The architecture reflects real-world engineering standards while remaining clean and easy to explain during interviews.

---

## Key Features & Completed Tasks

### 1. Authentication & Security
- **Secure Password Hashing:** Implemented with `bcryptjs` using a pre-save hook in Mongoose with salt rounds of 10.
- **Explainable JWT Auth:** Clean `jwt.sign()` and `jwt.verify()` implementation using bearer tokens.
- **Endpoints:**
  - `POST /api/auth/register`: Validates user info, ensures unique email, hashes password, saves preferences (target countries, field interests, preferred intake, budget, IELTS score), and issues token.
  - `POST /api/auth/login`: Validates credentials, checks password match, and returns JWT.
  - `GET /api/auth/me`: Protected route returning user profile without exposing password hashes.
- **Role-Based Access Control:** Role validation supporting `student` and `counselor` with `requireRoles` middleware.

### 2. University & Program Discovery
- **`GET /api/programs`**: Advanced querying with filtering (`country`, `degreeLevel`, `field`, `intake`, `maxTuition`, `scholarshipAvailable`, text `q`), dynamic sorting (`tuitionAsc`, `tuitionDesc`, `relevance`), and standardized pagination metadata (`page`, `limit`, `total`, `totalPages`).
- **`GET /api/universities`**: Filtering by country, partner type, scholarship status, and full text search.
- **Consistent Response Contract:**
  ```json
  {
    "success": true,
    "data": [ ... ],
    "meta": { "page": 1, "limit": 10, "total": 12, "totalPages": 2 }
  }
  ```

### 3. Recommendation Engine (MongoDB Aggregation Pipeline)
- Located in `src/services/recommendationService.js`.
- Replaced in-memory JavaScript logic with a **native MongoDB Aggregation Pipeline**:
  - `$match`: Filters candidate programs by target destinations.
  - `$addFields` + `$cond`: Calculates matching scores based on real study-abroad criteria:
    - **Country Match:** +35 pts
    - **Field Alignment:** +30 pts
    - **Budget Affordability (`tuitionFeeUsd <= maxBudgetUsd`):** +20 pts
    - **Intake Match (`intakes contains preferredIntake`):** +10 pts
    - **IELTS Score (`score >= minimumIelts`):** +5 pts
  - `$concatArrays`: Dynamically builds human-readable explanation strings describing why each program was recommended.
  - `$sort`: Orders by `matchScore: -1` and `tuitionFeeUsd: 1`.
  - `$limit`: Returns top 5 best matches.

### 4. Application Workflow System
- **`POST /api/applications`**:
  - Validates program existence and destination country.
  - **Duplicate Prevention:** Prevents students from submitting multiple applications to the same program for the same intake.
  - Initializes timeline history with timestamp and creation note.
- **`PATCH /api/applications/:id/status`**:
  - Enforces strict state machine transitions:
    - `draft` → `submitted`
    - `submitted` → `under-review` or `rejected`
    - `under-review` → `offer-received` or `rejected`
    - `offer-received` → `visa-processing` or `rejected`
    - `visa-processing` → `enrolled` or `rejected`
  - Rejects illegal transitions with a 400 Bad Request error.
  - Records an immutable timeline entry for audit history.

### 5. Performance, Indexing & Caching
- **In-Memory TTL Caching (`cacheService.js`):**
  - Caches `GET /api/universities/popular` and `GET /api/dashboard/overview`.
  - Includes cache invalidation when applications are created or status changes.
  - Returns `meta.cache: "hit"` or `"miss"` in the API response.
- **Database Indexing Strategies:**
  - `Application`: Unique compound index `{ student: 1, program: 1, intake: 1 }` prevents duplicates at the database layer; index on `status` speeds up counselor filtering.
  - `Program`: Compound index on `{ country: 1, degreeLevel: 1, field: 1, tuitionFeeUsd: 1 }` optimizes catalog multi-filter queries.
  - `University`: Compound index on `{ popularScore: -1, qsRanking: 1 }` powers the popular endpoint; text index on `name`, `country`, `city` supports fast search.

### 6. Testing & Quality Assurance
- **Automated Tests:** 11 unit & integration tests covering:
  - Input validation on registration and login.
  - JWT authorization token checking and `/api/auth/me`.
  - Duplicate application prevention.
  - State machine transition rules & edge cases.
  - University popular caching and program pagination.
- Run tests:
  ```bash
  npm --prefix backend test
  ```

### 7. Modern React + Tailwind CSS Dashboard
- Responsive interactive frontend built with Vite, React, and Tailwind CSS.
- Features:
  - **Catalog Explorer:** Multi-filter search for programs and universities.
  - **Aggregation Recommendations Tab:** Shows live match scores (out of 100) and criteria badges.
  - **Application Tracker:** Step-by-step audit timeline with counselor transition actions.
  - **Analytics Tab:** Live metrics, status distribution, and cache status indicator (`HIT`/`MISS`).
  - **Demo User Switcher:** Seamlessly toggle between Aarav (Student), Sara (Student), and Neha (Counselor).

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
npm install
copy .env.example .env   # On macOS/Linux: cp .env.example .env
npm run seed             # Seeds sample universities, programs, students, and applications
npm run dev              # Starts Express API on http://localhost:4000
```

### 3. Run Automated Tests
```bash
cd backend
npm test
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev              # Starts React Vite server on http://localhost:5173
```

---

## Seeded Demo Credentials

| Role | Email | Password | Target Destinations |
|---|---|---|---|
| Student | `aarav@example.com` | `Candidate123!` | Canada, UAE |
| Student | `sara@example.com` | `Candidate123!` | UK, Australia |
| Counselor | `counselor@example.com` | `Candidate123!` | - |

