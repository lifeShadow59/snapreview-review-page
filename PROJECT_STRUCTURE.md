# Project Structure & Authentication Guide

This document outlines the recommended project structure and authentication implementation. Adhering to these conventions will help maintain a clean, scalable, and easy-to-navigate codebase.

## 🔐 Authentication Routes

- **Sign In**: `/auth/login` (http://localhost:3000/auth/login)
- **Registration**: `/auth/register` (http://localhost:3000/auth/register)
- **Dashboard**: `/dashboard` (protected route)

## Directory Overview

```
review-frontend/
├── .vscode/                  # Workspace settings (e.g., for recommended extensions)
├── public/                   # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                  # Next.js App Router: pages, layouts, and route handlers
│   │   ├── auth/             # 🔐 Authentication pages
│   │   │   ├── login/        # Sign-in page (/auth/login)
│   │   │   │   └── page.tsx
│   │   │   └── register/     # Registration page (/auth/register)
│   │   │       └── page.tsx
│   │   ├── dashboard/        # 🛡️ Protected dashboard page
│   │   │   ├── page.tsx
│   │   │   └── components/   # Components specific to the dashboard
│   │   │       └── Chart.tsx
│   │   ├── api/              # API routes (route handlers)
│   │   │   └── auth/         # 🔐 Authentication API routes
│   │   │       ├── [...nextauth]/route.ts  # NextAuth.js handlers
│   │   │       └── register/route.ts       # User registration API
│   │   └── layout.tsx        # Root layout with SessionProvider
│   │
│   ├── components/           # Shared components used across the application
│   │   ├── ui/               # Basic, reusable UI elements (Button, Input, Card)
│   │   ├── common/           # More complex components composed of UI elements
│   │   ├── auth/             # 🔐 Authentication-specific components
│   │   │   └── AuthButton.tsx
│   │   └── providers/        # Context providers
│   │       └── SessionProvider.tsx
│   │
│   ├── lib/                  # Utility functions, helpers, and constants
│   │   ├── auth.ts           # 🔐 NextAuth.js configuration
│   │   └── db.ts             # Database connection pool
│   ├── hooks/                # Custom React hooks
│   ├── services/             # Data fetching logic (e.g., API clients)
│   ├── store/                # State management (Zustand, Redux, etc.)
│   └── types/                # Global TypeScript types and interfaces
│
├── middleware.ts             # 🛡️ Route protection middleware (NextAuth.js)
├── .editorconfig             # Consistent editor settings
├── .eslintrc.js              # ESLint configuration
├── next.config.mjs           # Next.js configuration
└── tsconfig.json             # TypeScript configuration
```

## Key Principles

1.  **Feature-Colocation in `app/`**: For any given page or route in the `app` directory, its specific components should be co-located within a `components` sub-directory. This keeps feature-specific logic self-contained.

2.  **Shared Components in `src/components/`**:

    - `src/components/ui/`: Contains highly reusable, "dumb" UI components like `Button`, `Input`, `Dialog`. These should be generic and application-agnostic.
    - `src/components/common/`: Contains components that are shared across multiple features but might have more business logic than simple UI components.

3.  **Route Groups `(...)`**: Use route groups in the `app` directory to organize sections of your application (e.g., `(auth)`, `(marketing)`, `(main)`) without affecting the URL structure.

4.  **Clear Separation of Concerns**:
    - `lib`: For pure functions and utilities.
    - `hooks`: For custom React hook logic.
    - `services`: For abstracting data-fetching.
    - `store`: For global state.
    - `types`: For shared type definitions.

By following this structure, the project will be easier to understand and maintain as it grows.

## API Route Structure

API routes are defined using Route Handlers within the `src/app/api/` directory. This approach allows you to create backend endpoints for your application.

### 1. Basic Structure

Each API endpoint is a `route.ts` (or `.js`) file that exports functions corresponding to HTTP methods.

**Example: `src/app/api/users/route.ts`**

```typescript
// src/app/api/users/route.ts
import { NextResponse } from "next/server";

// Handles GET requests to /api/users
export async function GET() {
  // Logic to fetch users from a database
  const users = [{ id: 1, name: "John Doe" }];
  return NextResponse.json({ users });
}

// Handles POST requests to /api/users
export async function POST(request: Request) {
  // Logic to create a new user
  const data = await request.json();
  return NextResponse.json({ message: "User created", data }, { status: 201 });
}
```

### 2. Dynamic API Routes

For dynamic segments in your API paths (e.g., fetching a user by ID), use brackets `[]` in the directory name.

**Example: `src/app/api/users/[userId]/route.ts`**

```typescript
// src/app/api/users/[userId]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  // Logic to fetch user by ID
  return NextResponse.json({ userId, name: `User ${userId}` });
}
```

This structure helps in keeping your API clean, organized, and easy to maintain.

## Database Connection

This project uses PostgreSQL for the database. Follow these steps to connect your local environment.

### 1. Environment Variables

Create a `.env.local` file in the root of the project. This file is for local development and should not be committed to version control. Add your database credentials to this file:

```bash
# .env.local
POSTGRES_HOST=your_host
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_dbname
POSTGRES_PORT=5432 # Or your custom port
```

**Note:** You must restart the development server after creating or modifying the `.env.local` file.

### 2. Connection Utility

The database connection is managed by a connection pool located at `src/lib/db.ts`. This utility reads the environment variables from `.env.local` to establish the connection.

### 3. Testing the Connection

To verify that your database connection is configured correctly, run the application and navigate to the `/api/db-test` endpoint. A successful connection will return a JSON object with the current timestamp from the database.
