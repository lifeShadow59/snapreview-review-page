# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your application.

## Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**

   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select Project**

   - Create a new project or select an existing one
   - Note your project name/ID

3. **Enable Google+ API**

   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

4. **Create OAuth 2.0 Credentials**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Give it a name (e.g., "Review Frontend Auth")

5. **Configure Authorized Redirect URIs**

   - Add the following redirect URI:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - For production, also add:
     ```
     https://yourdomain.com/api/auth/callback/google
     ```

6. **Get Your Credentials**
   - Copy your Client ID and Client Secret
   - Keep these secure and never commit them to version control

## Step 2: Environment Variables

Create a `.env.local` file in your project root and add the following:

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_dbname
POSTGRES_PORT=5432

# NextAuth.js Configuration
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_from_step_6
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_step_6
```

## Step 3: Generate NextAuth Secret

Generate a secure secret for NextAuth.js:

```bash
openssl rand -base64 32
```

Use the output as your `NEXTAUTH_SECRET` value.

## Step 4: Test the Integration

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)

3. Click "Continue with Google" to test OAuth flow

## Features Included

- ✅ Google OAuth authentication
- ✅ Automatic user creation in database
- ✅ Email and name extraction (no profile picture)
- ✅ Seamless integration with existing credentials login
- ✅ Proper error handling
- ✅ Session management with JWT

## Security Notes

- Users are created with email and name only (no profile picture stored)
- OAuth users don't have passwords in the database
- Existing users can link their Google account by using the same email
- All authentication flows redirect to `/dashboard` on success

## Troubleshooting

**Error: "redirect_uri_mismatch"**

- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`

**Error: "invalid_client"**

- Double-check your Client ID and Client Secret in `.env.local`
- Ensure there are no extra spaces or characters

**Database errors**

- Make sure your PostgreSQL database is running and accessible
- Verify database credentials in `.env.local`

## Production Deployment

When deploying to production:

1. Update `NEXTAUTH_URL` to your production domain
2. Add production redirect URI to Google Console
3. Use secure environment variable storage (not `.env.local`)
4. Ensure your database allows connections from your production server
