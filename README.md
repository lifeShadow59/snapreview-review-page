# Review Frontend - NextAuth.js Authentication System

A modern, secure authentication system built with NextAuth.js v5, PostgreSQL, and Next.js 15.

## 🔐 Authentication Routes

- **Sign In**: `http://localhost:3000/auth/login`
- **Registration**: `http://localhost:3000/auth/register`
- **Dashboard**: `http://localhost:3000/dashboard` (protected route)

## Features

🔐 **Secure Authentication**

- Password-based authentication with bcrypt hashing
- JWT session management
- Secure middleware-based route protection

🗄️ **Database Integration**

- PostgreSQL database with NextAuth.js adapter
- User accounts, sessions, and verification tokens
- Automatic session cleanup and management

🎨 **Modern UI**

- Responsive design with Tailwind CSS
- Beautiful authentication forms
- User dashboard with session data display

🛡️ **Security Features**

- Protected routes with automatic redirects
- Password validation and confirmation
- SQL injection protection with parameterized queries

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_dbname
POSTGRES_PORT=5432

# NextAuth.js Configuration
NEXTAUTH_SECRET=your_secret_key_here_generate_a_random_string
NEXTAUTH_URL=http://localhost:3000
```

**Generate a secure secret:**

```bash
openssl rand -base64 32
```

### 2. Database Setup

Run the SQL schema to create authentication tables:

```bash
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f src/lib/schema.sql
```

### 3. Install Dependencies

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Authentication Flow

### Registration Process

1. User visits `/auth/register` (http://localhost:3000/auth/register)
2. Fills out registration form (name, email, password)
3. Password is hashed with bcrypt
4. User account is created in PostgreSQL
5. Redirected to sign-in page (`/auth/login`)

### Sign-In Process

1. User visits `/auth/login` (http://localhost:3000/auth/login)
2. Enters credentials (email, password)
3. NextAuth.js validates credentials
4. JWT session is created
5. User is redirected to dashboard (`/dashboard`)

### Protected Routes

- All routes under `/dashboard` are protected
- Middleware automatically redirects unauthenticated users
- Session data is available throughout the application

## API Structure

### Authentication Endpoints

```
POST /api/auth/register      # User registration
GET/POST /api/auth/[...nextauth]  # NextAuth.js handlers
GET /api/user/profile        # Get current user profile
```

### Route Structure

```
/                    # Home page (redirects if authenticated)
/auth/login         # Sign-in page
/auth/register       # Registration page
/dashboard           # Protected dashboard with session data
```

## Database Schema

The application uses four main tables:

- **users**: User accounts and profile information
- **accounts**: OAuth account linking (for future providers)
- **sessions**: Active user sessions
- **verification_tokens**: Email verification and password reset

## Components

### Reusable Components

- `AuthButton`: Smart sign-in/out button
- `SessionProvider`: NextAuth session context wrapper

### Pages

- **Home Page**: Landing page with authentication links
- **Sign In**: Email/password authentication form
- **Sign Up**: User registration form
- **Dashboard**: Protected page displaying session data

## Security Considerations

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens are securely signed
- Route protection via middleware
- SQL injection prevention with parameterized queries
- CSRF protection built into NextAuth.js

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── lib/                   # Utilities and configuration
├── types/                 # TypeScript definitions
└── middleware.ts          # Route protection
```

### Adding OAuth Providers

To add Google OAuth:

1. Update `.env.local`:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

2. Update `src/lib/auth.ts`:

```typescript
import GoogleProvider from "next-auth/providers/google";

// Add to providers array:
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
});
```

## Troubleshooting

### Common Issues

**Database Connection Error:**

- Verify PostgreSQL is running
- Check database credentials in `.env.local`
- Ensure database exists

**NextAuth Configuration Error:**

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain

**Session Not Persisting:**

- Clear browser cookies and localStorage
- Restart development server after env changes

## License

MIT License - Feel free to use this as a starting point for your projects!
