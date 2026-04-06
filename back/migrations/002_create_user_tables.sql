-- 사용자
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('teacher', 'student', 'operator')),
  phone         VARCHAR(20),
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role)  WHERE deleted_at IS NULL;

-- 학원
CREATE TABLE IF NOT EXISTS academies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  code          VARCHAR(10)  NOT NULL UNIQUE,
  address       TEXT,
  owner_id      UUID         NOT NULL REFERENCES users(id),
  suneung_date  DATE,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_academies_code     ON academies(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_academies_owner_id ON academies(owner_id);

-- 학원 멤버
CREATE TABLE IF NOT EXISTS academy_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id  UUID        NOT NULL REFERENCES academies(id),
  user_id     UUID        NOT NULL REFERENCES users(id),
  role        VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student', 'operator')),
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at     TIMESTAMPTZ,
  UNIQUE (academy_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_members_academy ON academy_members(academy_id);
CREATE INDEX IF NOT EXISTS idx_academy_members_user    ON academy_members(user_id);

-- JWT 리프레시 토큰
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
