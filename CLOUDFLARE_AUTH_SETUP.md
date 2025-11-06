# Cloudflare-Native Authentication Setup Guide

This guide explains how to set up the Cloudflare-native authentication system with OAuth support for Google and GitHub.

## Overview

The authentication system uses:
- **Cloudflare Workers** for edge authentication handling
- **Cloudflare KV** for session storage
- **OAuth 2.0** for Google and GitHub login
- **FastAPI backend** for user management
- **Hybrid auth** supporting both OAuth and username/password

## Features

- OAuth login with Google and GitHub
- Session management at the edge (Cloudflare KV)
- Automatic user creation from OAuth providers
- Backward compatible with existing username/password auth
- CSRF protection for OAuth flows
- Secure session cookies (HttpOnly, SameSite)

## Prerequisites

1. **Cloudflare Account** with Workers and KV enabled
2. **Google Cloud Project** (for Google OAuth)
3. **GitHub OAuth App** (for GitHub OAuth)
4. **Node.js** and **npm** installed
5. **Wrangler CLI** installed (`npm install -g wrangler`)

## Step 1: Create Cloudflare KV Namespace

Create a KV namespace for session storage:

```bash
# Create production KV namespace
wrangler kv:namespace create "SESSIONS"

# Create preview KV namespace for development
wrangler kv:namespace create "SESSIONS" --preview
```

This will output IDs like:
```
{ binding = "SESSIONS", id = "abc123..." }
{ binding = "SESSIONS", preview_id = "xyz789..." }
```

Update `wrangler.toml` with these IDs:

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-production-kv-id-here"
preview_id = "your-preview-kv-id-here"
```

## Step 2: Set Up Google OAuth

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Select **Web application** as application type
7. Add authorized redirect URIs:
   - For local dev: `http://localhost:8787/auth/callback/google`
   - For production: `https://yourdomain.com/auth/callback/google`
8. Save and copy the **Client ID** and **Client Secret**

### Configure Google OAuth in Cloudflare

For **local development**, create `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```bash
BACKEND_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

For **production**, set secrets using Wrangler:

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

## Step 3: Set Up GitHub OAuth

### Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: Your app name
   - **Homepage URL**: Your app URL
   - **Authorization callback URL**:
     - For local dev: `http://localhost:8787/auth/callback/github`
     - For production: `https://yourdomain.com/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate a new **Client Secret** and copy it

### Configure GitHub OAuth in Cloudflare

For **local development**, add to `.dev.vars`:

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

For **production**, set secrets using Wrangler:

```bash
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

## Step 4: Configure Backend URL

Update `wrangler.toml` with your backend URL:

```toml
[vars]
BACKEND_URL = "https://your-backend.example.com"
```

For local development, this is set in `.dev.vars`:

```bash
BACKEND_URL=http://localhost:8000
```

## Step 5: Test Locally

1. **Start the FastAPI backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start the Cloudflare Worker locally**:
   ```bash
   wrangler dev
   ```

3. **Visit the login page**:
   ```
   http://localhost:8787/login
   ```

4. **Test OAuth flows**:
   - Click "Google" or "GitHub" button
   - Complete OAuth flow
   - You should be redirected back and logged in

## Step 6: Deploy to Production

1. **Update production URLs in OAuth apps**:
   - Update redirect URIs in Google Cloud Console
   - Update callback URL in GitHub OAuth app

2. **Deploy the worker**:
   ```bash
   wrangler deploy
   ```

3. **Set production secrets** (if not already set):
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```

## Authentication Flow

### OAuth Flow (Google/GitHub)

1. User clicks "Sign in with Google/GitHub"
2. Worker generates state token and stores in KV
3. User is redirected to OAuth provider
4. User authorizes the app
5. Provider redirects back to `/auth/callback/{provider}`
6. Worker exchanges code for access token
7. Worker fetches user info from provider
8. Worker calls backend `/api/auth/oauth` to create/update user
9. Worker creates session in KV
10. Worker sets session cookie
11. User is redirected to homepage

### Username/Password Flow (Existing)

1. User enters username and password
2. Frontend calls `/api/auth/login`
3. Backend validates credentials
4. Backend returns JWT token
5. Frontend stores token in localStorage
6. Token is included in subsequent API requests

## Session Management

### Session Structure

Sessions are stored in Cloudflare KV with this structure:

```typescript
{
  userId: string
  email: string
  username: string
  provider: 'password' | 'google' | 'github'
  createdAt: number
  expiresAt: number
}
```

### Session Duration

- Default: 7 days
- Configurable in `cloudflare/auth.ts`

### Session Validation

The Worker automatically validates sessions for all API requests:
- Checks if session cookie exists
- Retrieves session from KV
- Validates expiration
- Adds user info headers to backend requests

## API Endpoints

### Authentication Endpoints (handled by Worker)

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/callback/google` - Google OAuth callback
- `GET /auth/callback/github` - GitHub OAuth callback
- `GET /auth/session` - Get current session
- `POST /auth/logout` - Clear session

### Backend Endpoints (proxied through Worker)

- `POST /api/auth/login` - Username/password login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/oauth` - OAuth user creation/update

## Security Features

### CSRF Protection

- State parameter stored in KV for OAuth flows
- State verified on callback
- State expires after 10 minutes

### Secure Cookies

- `HttpOnly` - Prevents JavaScript access
- `SameSite=Lax` - CSRF protection
- `Secure` - HTTPS only (in production)
- `Max-Age=604800` - 7 days

### Session Expiration

- Sessions auto-expire in KV
- Expiration checked on validation
- Expired sessions automatically deleted

## Troubleshooting

### OAuth redirect URI mismatch

**Error**: `redirect_uri_mismatch`

**Solution**: Ensure the redirect URI in your OAuth app settings exactly matches the one your app uses. Check protocol (http vs https) and port numbers.

### KV namespace not found

**Error**: `SESSIONS is not defined`

**Solution**:
1. Create KV namespace: `wrangler kv:namespace create "SESSIONS"`
2. Update `wrangler.toml` with the correct ID
3. Redeploy: `wrangler deploy`

### Session not persisting

**Issue**: User gets logged out on page refresh

**Solution**:
1. Check browser cookies are enabled
2. Verify `credentials: 'include'` in fetch calls
3. Check cookie domain matches your app domain
4. Ensure cookies are not being blocked by browser settings

### Backend not receiving user info

**Issue**: `X-User-Id` header not present in backend

**Solution**:
1. Verify session exists: `GET /auth/session`
2. Check KV namespace is accessible
3. Verify BACKEND_URL is correct in worker config

## Environment Variables Reference

### Local Development (.dev.vars)

```bash
BACKEND_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Production (Cloudflare Secrets)

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

### wrangler.toml Variables

```toml
[vars]
BACKEND_URL = "https://api.yourdomain.com"

[[kv_namespaces]]
binding = "SESSIONS"
id = "your-production-kv-id"
preview_id = "your-preview-kv-id"
```

## Next Steps

1. **Customize session duration** in `cloudflare/auth.ts`
2. **Add more OAuth providers** (Microsoft, Twitter, etc.)
3. **Implement rate limiting** for auth endpoints
4. **Add email verification** for new OAuth users
5. **Set up monitoring** for auth failures
6. **Configure CORS** properly for your domain

## Support

For issues or questions:
- Check [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- Check [Cloudflare KV docs](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- Review OAuth provider documentation
