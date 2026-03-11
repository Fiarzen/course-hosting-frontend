This is a react based front-end for a course-hosting website.

# Course Hosting Frontend

React frontend for the **mindleaf** course hosting app. Provides a user interface for browsing courses, managing enrollments, tracking lesson progress, and uploading course content.

---

## Overview

This repository contains the frontend for the mindleaf course hosting platform. It is a single-page application built with React and is designed to consume the Spring Boot REST API backend.

Key features:

- User registration and login with token-based authentication
- Role-aware UI for Students, Creators, and Admins
- Course browsing, enrollment, and progress tracking
- Lesson viewer with support for video and PDF resources
- Course and lesson management interface for Creators
- Admin panel for user management

---

## Tech stack

- React 18
- React Router (client-side routing)
- Axios (API communication)
- Tailwind CSS (styling)
- Vite (development server and build tool)


## Running locally

### Prerequisites

- Node.js 18 or higher
- The mindleaf backend running locally on `http://localhost:8080` (see the backend README)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

This controls where the frontend sends API requests. For production this should point to the deployed backend URL.

### 3. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

---

## Authentication

On login, the backend returns a token which is stored in memory via React context (and optionally in `localStorage` for persistence across page refreshes). Subsequent API requests include the token as:

```
Authorization: Bearer <token>
```

The auth context exposes the current user object, their role, and helper methods for login and logout. Components and routes can consume this context to conditionally render UI or redirect unauthenticated users.

Roles and what they unlock in the UI:

| Role      | Access                                              |
|-----------|-----------------------------------------------------|
| `STUDENT`   | Browse courses, enroll, track progress            |
| `CREATOR`   | All student access, plus course and lesson management |
| `ADMIN`     | All creator access, plus the admin user panel     |

---

## Available scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start local development server     |
| `npm run build`   | Build for production               |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                         |

---

## Deployment

The frontend is deployed as a static site on **Netlify**.

### Build settings (Netlify)

| Setting         | Value          |
|-----------------|----------------|
| Build command   | `npm run build` |
| Publish directory | `dist`       |

### Environment variable

Set `VITE_API_BASE_URL` in the Netlify environment settings to point to the deployed backend (e.g. the EC2 instance URL provisioned by Terraform).

### Client-side routing

React Router requires all routes to resolve to `index.html`. Add a `_redirects` file to the `public/` directory with the following content:

```
/*  /index.html  200
```

This ensures that navigating directly to a route (e.g. `/courses/5`) does not result in a 404 from Netlify.

---

## Connecting to the backend

The frontend expects the following public endpoints to be reachable without authentication:

- `POST /auth/login`
- `POST /users/register`
- `GET /courses`

All other requests require a valid bearer token. See the backend README for the full API reference and Swagger UI at `/swagger-ui.html`.