# Single Sign-On (SSO) Implementation Guide

## Overview

Valor Financial Services now includes a full OAuth2/OpenID Connect provider that allows users to sign in to external applications using their Valor credentials.

---

## 🔐 What is SSO?

Single Sign-On (SSO) allows users to log in once to Valor and then access multiple connected applications without re-entering credentials.

**Benefits:**
- Users only need to remember one password
- Centralized user management
- Enhanced security with centralized auth
- Better user experience across multiple apps

---

## 🏗️ Architecture

### Components Created:

1. **Database Tables:**
   - `oauth_clients` - Registered third-party applications
   - `oauth_authorization_codes` - Short-lived auth codes
   - `oauth_tokens` - Access and refresh tokens

2. **API Endpoints:**
   - `/api/oauth/authorize` - Authorization endpoint
   - `/api/oauth/token` - Token exchange endpoint
   - `/api/oauth/userinfo` - User information endpoint
   - `/.well-known/openid-configuration` - OIDC discovery

3. **Utilities:**
   - `lib/sso/jwt.ts` - JWT token creation/verification
   - `lib/sso/oauth-server.ts` - OAuth2 server logic

---

## 🚀 Setup Instructions

### Step 1: Run the SQL Script

The OAuth database tables need to be created. Run this in your Supabase SQL editor:

```bash
# File: scripts/create-sso-tables.sql
```

Navigate to your Supabase project → SQL Editor → Run the script.

### Step 2: Generate JWT Secret

Add a strong JWT secret to your `.env.local`:

```bash
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Set App URL

Ensure your app URL is set (used for OAuth redirects):

```bash
NEXT_PUBLIC_APP_URL=https://valorfs.app
# Or for local development:
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📱 Registering a Client Application

### Method 1: Using the Admin UI (Coming Soon)

Navigate to `/admin/sso-clients` to register new OAuth clients.

### Method 2: Using the Database

Insert an OAuth client directly:

```sql
INSERT INTO oauth_clients (
  id,
  tenant_id,
  client_id,
  client_secret,
  name,
  description,
  redirect_uris,
  allowed_scopes,
  grant_types,
  is_active
) VALUES (
  gen_random_uuid(),
  'your-tenant-id',
  'client_your-app-name',
  'hashed-secret-here', -- Use hashClientSecret() function
  'My External App',
  'External application that needs Valor authentication',
  ARRAY['https://myapp.com/callback', 'https://myapp.com/auth/callback'],
  ARRAY['openid', 'profile', 'email', 'tenant'],
  ARRAY['authorization_code', 'refresh_token'],
  true
);
```

---

## 🔧 OAuth2 Flow (Authorization Code Grant)

### Step-by-Step Flow:

1. **User clicks "Sign in with Valor" on external app**

2. **External app redirects to Valor:**
   ```
   GET https://valorfs.app/api/oauth/authorize?
     response_type=code&
     client_id=client_your-app&
     redirect_uri=https://myapp.com/callback&
     scope=openid profile email&
     state=random-state-string
   ```

3. **User logs into Valor** (if not already logged in)

4. **Valor redirects back with authorization code:**
   ```
   https://myapp.com/callback?
     code=abc123def456&
     state=random-state-string
   ```

5. **External app exchanges code for tokens:**
   ```bash
   POST https://valorfs.app/api/oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&
   code=abc123def456&
   redirect_uri=https://myapp.com/callback&
   client_id=client_your-app&
   client_secret=your-client-secret
   ```

6. **Valor responds with tokens:**
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refresh_token": "a1b2c3d4e5f6...",
     "expires_in": 3600,
     "token_type": "Bearer"
   }
   ```

7. **External app gets user info:**
   ```bash
   GET https://valorfs.app/api/oauth/userinfo
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

8. **Valor responds with user data:**
   ```json
   {
     "sub": "user-id",
     "email": "user@example.com",
     "name": "John Doe",
     "given_name": "John",
     "family_name": "Doe",
     "email_verified": true,
     "tenant": {
       "id": "tenant-id",
       "name": "Acme Insurance",
       "slug": "acme-insurance"
     },
     "role": "AGENT"
   }
   ```

---

## 🎯 Available Scopes

| Scope | Description | Claims Included |
|-------|-------------|-----------------|
| `openid` | Required for OIDC | `sub`, `email_verified` |
| `profile` | User profile info | `name`, `given_name`, `family_name`, `picture` |
| `email` | Email address | `email` |
| `tenant` | Tenant/organization info | `tenant` (id, name, slug) |
| `role` | User role | `role` (AGENT, MANAGER, etc.) |
| `commissions` | Access to commissions API | - |
| `cases` | Access to cases API | - |

---

## 🔄 Refreshing Tokens

Access tokens expire after 1 hour (configurable). Use the refresh token to get a new access token:

```bash
POST https://valorfs.app/api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=a1b2c3d4e5f6...&
client_id=client_your-app&
client_secret=your-client-secret
```

Response:
```json
{
  "access_token": "new-access-token",
  "refresh_token": "a1b2c3d4e5f6...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

---

## 🛡️ Security Features

### ✅ Implemented:
- **PKCE Support** - Code challenge for public clients
- **Hashed client secrets** - Secrets stored as SHA-256 hashes
- **Short-lived auth codes** - 10 minute expiration
- **Token expiration** - Access tokens expire in 1 hour
- **One-time use codes** - Auth codes can only be used once
- **Redirect URI validation** - Strict URI matching
- **Scope validation** - Only requested scopes granted
- **Structured logging** - All OAuth events logged

### 🔐 Best Practices:
- Always use HTTPS in production
- Store client secrets securely
- Implement state parameter (CSRF protection)
- Use PKCE for mobile/SPA apps
- Rotate refresh tokens periodically
- Monitor token usage for anomalies

---

## 📊 Example: Integrating with Another App

### Node.js Example:

```javascript
const axios = require('axios');

// Step 1: Redirect user to Valor
const authUrl = 'https://valorfs.app/api/oauth/authorize?' + new URLSearchParams({
  response_type: 'code',
  client_id: 'your-client-id',
  redirect_uri: 'https://yourapp.com/callback',
  scope: 'openid profile email tenant',
  state: generateRandomState()
});

// Redirect user: res.redirect(authUrl)

// Step 2: Handle callback
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  // Verify state (CSRF protection)
  if (state !== req.session.oauthState) {
    return res.status(400).send('Invalid state');
  }

  // Exchange code for tokens
  const tokenResponse = await axios.post(
    'https://valorfs.app/api/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://yourapp.com/callback',
      client_id: 'your-client-id',
      client_secret: 'your-client-secret'
    })
  );

  const { access_token, refresh_token } = tokenResponse.data;

  // Get user info
  const userResponse = await axios.get(
    'https://valorfs.app/api/oauth/userinfo',
    {
      headers: { Authorization: `Bearer ${access_token}` }
    }
  );

  const user = userResponse.data;

  // Create session and log user in
  req.session.user = user;
  req.session.accessToken = access_token;
  req.session.refreshToken = refresh_token;

  res.redirect('/dashboard');
});
```

---

## 🧪 Testing the SSO Flow

### 1. Register a Test Client:

Run the SQL to create a test OAuth client (see "Registering a Client Application" above).

### 2. Test the Authorization Flow:

Visit this URL in your browser (replace values):
```
http://localhost:3000/api/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/callback&scope=openid%20profile%20email&state=test123
```

### 3. Check Logs:

All OAuth events are logged with structured logging. Check `logs/combined-*.log` for details.

---

## 📝 TODO / Future Enhancements

- [ ] Admin UI for managing OAuth clients (`/admin/sso-clients`)
- [ ] JWKS endpoint for JWT signature verification
- [ ] Dynamic client registration
- [ ] Consent screen (user must approve scopes)
- [ ] Token revocation endpoint
- [ ] Introspection endpoint
- [ ] OpenID Connect ID tokens
- [ ] Multi-factor authentication requirement
- [ ] Rate limiting on OAuth endpoints
- [ ] OAuth audit log viewer

---

## 🐛 Troubleshooting

### Error: `invalid_client`
- Check that `client_id` and `client_secret` match exactly
- Verify client secret is hashed correctly in database

### Error: `invalid_redirect_uri`
- Ensure redirect URI exactly matches one in `redirect_uris` array
- Check for trailing slashes, http vs https

### Error: `invalid_grant`
- Authorization code may have expired (10 minute limit)
- Code may have already been used
- Client ID doesn't match the one that requested the code

### Access token not working:
- Check token expiration (default 1 hour)
- Verify token in JWT debugger (jwt.io)
- Check Bearer token format in Authorization header

---

## 📚 Standards Compliance

This implementation follows:
- **RFC 6749** - OAuth 2.0 Authorization Framework
- **RFC 7636** - PKCE for OAuth Public Clients
- **OpenID Connect Core 1.0** - OIDC specification

---

## 🎉 You're Done!

Your Valor instance can now act as an identity provider for other applications. Users can sign in to external apps using their Valor credentials.

**Next Steps:**
1. Run the SQL script to create database tables
2. Add JWT_SECRET to your environment variables
3. Register your first OAuth client
4. Test the flow with a sample application

For questions or issues, check the logs in `/logs` directory.
