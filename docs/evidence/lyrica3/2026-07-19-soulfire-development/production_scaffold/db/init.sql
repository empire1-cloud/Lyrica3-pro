CREATE TABLE IF NOT EXISTS personas (
    persona_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    style_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    dna_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
    source TEXT NOT NULL DEFAULT 'user_defined',
    rights_state TEXT NOT NULL DEFAULT 'synthetic',
    consent_receipt_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generations (
    generation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_hash TEXT NOT NULL UNIQUE,
    persona_id TEXT NOT NULL REFERENCES personas(persona_id),
    persona_b_id TEXT REFERENCES personas(persona_id),
    topic TEXT NOT NULL,
    cultural_matrix_id TEXT NOT NULL,
    cultural_matrix_version TEXT NOT NULL,
    model_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
    output_manifest JSONB,
    output_sha256 TEXT,
    rights_receipt_id TEXT,
    error_detail JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_persona ON generations(persona_id, created_at DESC);
