-- OAuth2 / SSO Tables

-- OAuth clients
CREATE TABLE IF NOT EXISTS oauth_clients (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  allowed_scopes TEXT[] NOT NULL DEFAULT '{}',
  grant_types TEXT[] NOT NULL DEFAULT '{}',
  access_token_ttl INTEGER NOT NULL DEFAULT 3600,
  refresh_token_ttl INTEGER NOT NULL DEFAULT 2592000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS oauth_clients_tenant_id_idx ON oauth_clients(tenant_id);
CREATE INDEX IF NOT EXISTS oauth_clients_client_id_idx ON oauth_clients(client_id);

-- Authorization codes
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS oauth_authorization_codes_code_idx ON oauth_authorization_codes(code);
CREATE INDEX IF NOT EXISTS oauth_authorization_codes_client_id_idx ON oauth_authorization_codes(client_id);
CREATE INDEX IF NOT EXISTS oauth_authorization_codes_user_id_idx ON oauth_authorization_codes(user_id);

-- OAuth tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  access_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  access_token_expires_at TIMESTAMP NOT NULL,
  refresh_token_expires_at TIMESTAMP,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS oauth_tokens_access_token_idx ON oauth_tokens(access_token);
CREATE INDEX IF NOT EXISTS oauth_tokens_refresh_token_idx ON oauth_tokens(refresh_token);
CREATE INDEX IF NOT EXISTS oauth_tokens_client_id_idx ON oauth_tokens(client_id);
CREATE INDEX IF NOT EXISTS oauth_tokens_user_id_idx ON oauth_tokens(user_id);
