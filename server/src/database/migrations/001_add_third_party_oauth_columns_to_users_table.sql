-- I add OAuth columns so same users table can work for local login and third-party login.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS provider_user_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- I make provider pair unique so one Google/Facebook account map to one app user only.
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_provider_provider_user_id_unique_index
  ON users (auth_provider, provider_user_id)
  WHERE provider_user_id IS NOT NULL;

-- I keep email unique when exists, this help linking old account with new OAuth login.
CREATE UNIQUE INDEX IF NOT EXISTS users_lower_email_address_unique_index
  ON users (LOWER(email_address))
  WHERE email_address IS NOT NULL;
