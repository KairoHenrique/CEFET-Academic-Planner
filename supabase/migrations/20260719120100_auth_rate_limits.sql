CREATE TABLE IF NOT EXISTS auth_rate_limits (
    ip_address VARCHAR(45) PRIMARY KEY,
    points INT NOT NULL DEFAULT 0,
    last_request_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_until TIMESTAMPTZ
);

-- Utilizada para bloquear uma conta específica caso errem a senha muitas vezes
CREATE TABLE IF NOT EXISTS auth_account_lockout (
    cpf VARCHAR(11) PRIMARY KEY,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ
);
