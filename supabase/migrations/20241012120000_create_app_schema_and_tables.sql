-- Migration: Create app schema and tables for 10xCards MVP
-- Purpose: Initialize the complete database schema including app schema, tables, functions, indexes and RLS policies
-- Affected: Creates app schema with flashcards, generations, generation_error_logs tables
-- Date: 2024-10-12 12:00:00 UTC

-- Create the app schema to isolate application-specific objects
create schema if not exists app;

-- Enable the pgcrypto extension for gen_random_uuid() function
create extension if not exists "pgcrypto";

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to automatically update the updated_at column
create or replace function app.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ========================================
-- TABLES
-- ========================================

-- Table: app.generations
-- Purpose: Log metadata of successful AI flashcard generation sessions for metrics collection
-- Note: Created first because app.flashcards references this table
create table app.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar(100) not null,
  source_text_hash varchar(100) not null,
  source_text_length integer not null check (source_text_length >= 1000 and source_text_length <= 10000),
  generated_count integer not null,
  accepted_unedited_count integer null,
  accepted_edited_count integer null,
  rejected_count integer not null,
  generation_duration integer not null, -- Duration in milliseconds
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: app.flashcards
-- Purpose: Store flashcards created by users
create table app.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid null references app.generations(id) on delete set null,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar(20) not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: app.generation_error_logs
-- Purpose: Log information about failed AI flashcard generation attempts for diagnostics
create table app.generation_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar(100) null,
  source_text_hash varchar(100) null,
  source_text_length integer null check (source_text_length >= 1000 and source_text_length <= 10000),
  error_code text null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger for app.flashcards to automatically update updated_at column
create trigger on_flashcard_update
  before update on app.flashcards
  for each row
  execute procedure app.handle_updated_at();

-- Trigger for app.generations to automatically update updated_at column
create trigger on_generation_update
  before update on app.generations
  for each row
  execute procedure app.handle_updated_at();

-- ========================================
-- INDEXES
-- ========================================

-- Index for foreign key user_id in flashcards table for better join performance
create index idx_flashcards_user_id on app.flashcards(user_id);

-- Index for foreign key generation_id in flashcards table for better join performance
create index idx_flashcards_generation_id on app.flashcards(generation_id);

-- Index for foreign key user_id in generations table for better join performance
create index idx_generations_user_id on app.generations(user_id);

-- Index for foreign key user_id in generation_error_logs table for better join performance
create index idx_generation_error_logs_user_id on app.generation_error_logs(user_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS for all app tables to ensure strict data isolation between users
-- The auth.uid() function from Supabase Auth is used to identify the logged-in user

-- RLS for app.flashcards table
alter table app.flashcards enable row level security;

-- Policy: Users can only view their own flashcards
create policy "Allow select for own flashcards" on app.flashcards
  for select using (auth.uid() = user_id);

-- Policy: Users can only insert flashcards for themselves
create policy "Allow insert for own flashcards" on app.flashcards
  for insert with check (auth.uid() = user_id);

-- Policy: Users can only update their own flashcards
create policy "Allow update for own flashcards" on app.flashcards
  for update using (auth.uid() = user_id);

-- Policy: Users can only delete their own flashcards
create policy "Allow delete for own flashcards" on app.flashcards
  for delete using (auth.uid() = user_id);

-- RLS for app.generations table
alter table app.generations enable row level security;

-- Policy: Users can only view their own generation logs
create policy "Allow select for own generation logs" on app.generations
  for select using (auth.uid() = user_id);

-- Policy: Users can only insert generation logs for themselves
create policy "Allow insert for own generation logs" on app.generations
  for insert with check (auth.uid() = user_id);

-- Policy: Users can only delete their own generation logs
-- Note: This table is designed to be append-only, so no UPDATE policy is needed
create policy "Allow delete for own generation logs" on app.generations
  for delete using (auth.uid() = user_id);

-- RLS for app.generation_error_logs table
alter table app.generation_error_logs enable row level security;

-- Policy: Users can only view their own error logs
create policy "Allow select for own error logs" on app.generation_error_logs
  for select using (auth.uid() = user_id);

-- Policy: Users can only insert error logs for themselves
create policy "Allow insert for own error logs" on app.generation_error_logs
  for insert with check (auth.uid() = user_id);

-- Policy: Users can only delete their own error logs
-- Note: This table is designed to be append-only, so no UPDATE policy is needed
create policy "Allow delete for own error logs" on app.generation_error_logs
  for delete using (auth.uid() = user_id);
