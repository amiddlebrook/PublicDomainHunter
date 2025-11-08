# Authentication Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Registration failed. Please try again."

**Possible Causes:**
1. Backend is not running
2. Database connection error
3. Password doesn't meet requirements
4. Username or email already exists

**Solutions:**

1. **Check if backend is running:**
   ```bash
   # Start the backend
   python app.py
   # or
   uvicorn app:app --reload
   ```

2. **Verify database is accessible:**
   ```bash
   # Check database connection in .env or .env.production
   # Default for development: sqlite:///./public_domain_hunter.db
   # For production: PostgreSQL connection string
   ```

3. **Password Requirements:**
   - At least 8 characters long
   - At least one uppercase letter (A-Z)
   - At least one lowercase letter (a-z)
   - At least one digit (0-9)
   - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

   Example valid password: `MyP@ssw0rd`

4. **Check if username/email already exists:**
   - Try a different username
   - Try a different email address
   - Check backend logs for specific error messages

### Issue: Login doesn't work

**Possible Causes:**
1. Incorrect username or password
2. Backend endpoint mismatch
3. User account is inactive
4. JWT token configuration issue

**Solutions:**

1. **Verify credentials:**
   - Username is case-sensitive
   - Ensure you're using the username, not the email
   - Try resetting your password if available

2. **Check backend is accessible:**
   ```bash
   # Test the login endpoint directly
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"your-username","password":"your-password"}'
   ```

3. **Verify environment configuration:**
   - Check that BACKEND_URL in wrangler.toml or .dev.vars is correct
   - For local dev: `http://localhost:8000`
   - For production: Your deployed backend URL

### Issue: Google Sign-In button doesn't work

**Possible Causes:**
1. OAuth credentials not configured
2. Redirect URI mismatch
3. KV namespace not created
4. Cloudflare Worker not deployed

**Solutions:**

1. **Configure Google OAuth credentials:**

   For local development:
   ```bash
   # 1. Copy example file
   cp .dev.vars.example .dev.vars

   # 2. Edit .dev.vars and add your credentials
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

   For production:
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```

2. **Create Google OAuth App:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - Local: `http://localhost:8787/auth/callback/google`
     - Production: `https://yourdomain.com/auth/callback/google`

3. **Create KV namespace:**
   ```bash
   wrangler kv:namespace create "SESSIONS"
   wrangler kv:namespace create "SESSIONS" --preview

   # Update wrangler.toml with the IDs from the output
   ```

4. **Deploy/Start the Worker:**
   ```bash
   # For local development
   wrangler dev

   # For production
   wrangler deploy
   ```

**Common Error Messages:**

- **"redirect_uri_mismatch"**: Update the redirect URI in Google Cloud Console
- **"SESSIONS is not defined"**: Create KV namespace (see step 3 above)
- **"OAuth not configured"**: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

### Issue: Session not persisting (logged out on refresh)

**Possible Causes:**
1. Cookies disabled in browser
2. Cookie domain mismatch
3. KV namespace not accessible
4. CORS configuration issue

**Solutions:**

1. **Check browser settings:**
   - Enable cookies in browser settings
   - Disable "Block third-party cookies" for your domain
   - Try in incognito/private mode to test

2. **Verify cookie configuration:**
   - Check browser DevTools > Application > Cookies
   - Look for `session` cookie
   - Verify it has `HttpOnly`, `SameSite=Lax` attributes

3. **Check KV namespace:**
   ```bash
   # List KV namespaces
   wrangler kv:namespace list

   # Test KV access
   wrangler kv:key put --binding=SESSIONS "test" "value"
   wrangler kv:key get --binding=SESSIONS "test"
   ```

## Quick Setup Checklist

### For Username/Password Authentication Only:

- [ ] Backend running (Python/FastAPI)
- [ ] Database accessible (SQLite for dev, PostgreSQL for prod)
- [ ] Frontend built and accessible
- [ ] BACKEND_URL configured correctly
- [ ] Password meets all requirements

### For OAuth (Google/GitHub):

- [ ] All username/password items above
- [ ] KV namespace created and configured in wrangler.toml
- [ ] OAuth app created (Google Cloud Console or GitHub)
- [ ] Redirect URIs configured in OAuth app
- [ ] OAuth credentials set (.dev.vars for local, secrets for production)
- [ ] Cloudflare Worker deployed or running locally

## Testing Authentication

### Test Username/Password Registration:

```bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "MyP@ssw0rd123",
    "full_name": "Test User"
  }'
```

### Test Username/Password Login:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "MyP@ssw0rd123"
  }'
```

### Test OAuth Flow:

1. Start backend: `python app.py`
2. Start worker: `wrangler dev`
3. Visit: `http://localhost:8787/login`
4. Click "Google" or "GitHub" button
5. Complete OAuth flow
6. Should redirect back logged in

## Getting Help

1. Check logs:
   - Backend logs: Check terminal where Python is running
   - Worker logs: Check Wrangler output or Cloudflare dashboard
   - Browser console: Check for JavaScript errors

2. Enable debug mode:
   ```bash
   # For backend
   export LOG_LEVEL=DEBUG
   python app.py

   # For worker
   wrangler dev --log-level debug
   ```

3. Common log locations:
   - Backend: stdout/stderr
   - Worker: Cloudflare dashboard > Workers > Logs
   - Frontend: Browser DevTools > Console

4. Review documentation:
   - See `CLOUDFLARE_AUTH_SETUP.md` for detailed OAuth setup
   - See `SETUP.md` for general setup instructions
   - See `README.md` for project overview

## Still Having Issues?

If you've tried the above solutions and still experiencing problems:

1. Check that all environment variables are set correctly
2. Verify network connectivity between frontend, worker, and backend
3. Test each component independently (backend API, worker, frontend)
4. Check for firewall or CORS issues
5. Review error messages carefully - they often contain specific clues
6. Try creating a new user with a different username/email

## Known Limitations

1. **OAuth requires HTTPS in production** - Use Cloudflare for SSL/TLS
2. **Cookies require same-site** - Frontend and backend should be on same domain or use CORS properly
3. **KV has eventual consistency** - Sessions may take a moment to propagate
4. **Rate limiting not implemented** - Add rate limiting for production use
