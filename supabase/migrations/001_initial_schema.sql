-- ============================================================
-- TitanCare Database Schema
-- Migration: 001_initial_schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Clinics ──────────────────────────────────────────────────
create table clinics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  city        text,
  country     text default 'US',
  phone       text,
  created_at  timestamptz not null default now()
);

-- ── Physicians ───────────────────────────────────────────────
create table physicians (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  specialty    text,
  clinic_id    uuid references clinics(id) on delete set null,
  clinic_name  text,  -- denormalized for quick display
  phone        text,
  email        text,
  created_at   timestamptz not null default now()
);

-- ── Patients ─────────────────────────────────────────────────
create table patients (
  id           uuid primary key default gen_random_uuid(),
  first_name   text not null,
  last_name    text not null,
  dob          date,
  physician_id uuid references physicians(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ── Implants ─────────────────────────────────────────────────
create table implants (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references patients(id) on delete cascade,
  model          text,
  serial_number  text,  -- store encrypted at application level
  lot_number     text,
  implant_date   date,
  size_length    numeric(5,2),
  size_girth     numeric(5,2),
  notes          text,
  created_at     timestamptz not null default now()
);

-- ── Access Tokens (NFC/QR) ───────────────────────────────────
create table access_tokens (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id) on delete cascade,
  token       text unique not null,  -- format: XXXX-XXXX (uppercase alphanumeric)
  is_active   boolean not null default true,
  label       text,                  -- e.g. "NFC Card", "QR Code Wallet"
  created_at  timestamptz not null default now(),
  last_used   timestamptz
);

create index idx_access_tokens_token on access_tokens(token);
create index idx_access_tokens_patient on access_tokens(patient_id);

-- ── Documents ────────────────────────────────────────────────
create table documents (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid references patients(id) on delete cascade,
  -- NULL patient_id = shared/default document for all patients
  doc_type      text not null check (
    doc_type in ('mri', 'airport', 'postop', 'implant_sheet', 'faq')
  ),
  storage_path  text not null,  -- path in Supabase Storage bucket
  is_private    boolean not null default false,
  version       int not null default 1,
  uploaded_by   uuid references physicians(id),
  file_name     text,
  file_size     bigint,         -- bytes
  created_at    timestamptz not null default now()
);

create index idx_documents_patient_type on documents(patient_id, doc_type);

-- ── Patient PINs ─────────────────────────────────────────────
create table patient_pins (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid unique not null references patients(id) on delete cascade,
  pin_hash    text not null,   -- HMAC-SHA256 hash, never plain text
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── PIN Sessions ─────────────────────────────────────────────
-- Short-lived session records after successful PIN entry
create table pin_sessions (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '1 hour')
);

create index idx_pin_sessions_patient_expires on pin_sessions(patient_id, expires_at);

-- ── Access Logs ──────────────────────────────────────────────
create table access_logs (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references patients(id) on delete set null,
  token_id    uuid references access_tokens(id) on delete set null,
  doc_type    text,
  ip_hash     text,    -- first 16 chars of SHA-256(ip + secret)
  user_agent  text,
  accessed_at timestamptz not null default now()
);

create index idx_access_logs_patient on access_logs(patient_id);
create index idx_access_logs_date on access_logs(accessed_at desc);

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table patients       enable row level security;
alter table implants       enable row level security;
alter table physicians     enable row level security;
alter table documents      enable row level security;
alter table access_tokens  enable row level security;
alter table patient_pins   enable row level security;
alter table pin_sessions   enable row level security;
alter table access_logs    enable row level security;
alter table clinics        enable row level security;

-- Service role bypasses all RLS (used only in server-side admin client)
-- Anon role (used in middleware token validation) can only read active tokens
create policy "anon_can_validate_tokens"
  on access_tokens for select
  to anon
  using (is_active = true);

-- All other operations require service role (admin API client)
-- No direct patient data exposed to anon role

-- ============================================================
-- Useful Views
-- ============================================================

-- Admin: quick overview of patient + implant status
create view admin_patient_overview as
  select
    p.id,
    p.first_name || ' ' || p.last_name as full_name,
    p.created_at,
    i.model,
    i.implant_date,
    ph.full_name as physician_name,
    at.token,
    at.is_active as card_active,
    at.last_used
  from patients p
  left join implants i on i.patient_id = p.id
  left join physicians ph on ph.id = p.physician_id
  left join access_tokens at on at.patient_id = p.id
  order by p.created_at desc;

-- ============================================================
-- Functions
-- ============================================================

-- Clean up expired PIN sessions automatically
create or replace function cleanup_expired_pin_sessions()
returns void language sql as $$
  delete from pin_sessions where expires_at < now();
$$;

-- Generate a unique patient token in XXXX-XXXX format
create or replace function generate_patient_token()
returns text language plpgsql as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text;
  exists bool;
begin
  loop
    result := '';
    for i in 1..4 loop
      result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
    end loop;
    result := result || '-';
    for i in 1..4 loop
      result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
    end loop;

    select count(*) > 0 into exists from access_tokens where token = result;
    exit when not exists;
  end loop;
  return result;
end;
$$;
