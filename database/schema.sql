-- DDAS PostgreSQL schema

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ANALYST',
  department_id BIGINT REFERENCES departments(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasets (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS shared_datasets (
  id BIGSERIAL PRIMARY KEY,
  dataset_id BIGINT NOT NULL REFERENCES datasets(id),
  owner_user_id BIGINT NOT NULL REFERENCES users(id),
  recipient_user_id BIGINT NULL REFERENCES users(id),
  recipient_department_id BIGINT NULL REFERENCES departments(id),
  share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('USER', 'DEPARTMENT')),
  shared_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP NULL,
  CHECK (
    (share_type = 'USER' AND recipient_user_id IS NOT NULL AND recipient_department_id IS NULL)
    OR
    (share_type = 'DEPARTMENT' AND recipient_department_id IS NOT NULL AND recipient_user_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS access_requests (
  id BIGSERIAL PRIMARY KEY,
  dataset_id BIGINT NOT NULL REFERENCES datasets(id),
  requester_user_id BIGINT NOT NULL REFERENCES users(id),
  requester_department_id BIGINT NOT NULL REFERENCES departments(id),
  reviewer_user_id BIGINT NULL REFERENCES users(id),
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS dataset_logs (
  id BIGSERIAL PRIMARY KEY,
  dataset_id BIGINT NOT NULL REFERENCES datasets(id),
  actor_user_id BIGINT NOT NULL REFERENCES users(id),
  action VARCHAR(40) NOT NULL,
  meta JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_shared_user
  ON shared_datasets(dataset_id, recipient_user_id, share_type)
  WHERE recipient_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_shared_department
  ON shared_datasets(dataset_id, recipient_department_id, share_type)
  WHERE recipient_department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_datasets_owner_created
  ON datasets(owner_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_datasets_name_search
  ON datasets USING gin (to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_shared_recipient_user
  ON shared_datasets(recipient_user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shared_recipient_dept
  ON shared_datasets(recipient_department_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_access_requests_dataset_status
  ON access_requests(dataset_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS ux_prevent_duplicate_download
  ON dataset_logs(dataset_id, actor_user_id, action)
  WHERE action = 'DOWNLOAD';

INSERT INTO departments(name)
VALUES ('Finance'), ('Marketing'), ('Operations'), ('Engineering'), ('Research')
ON CONFLICT (name) DO NOTHING;
