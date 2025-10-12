-- Migration: Create tables and RLS policies for 10xCards MVP
-- Purpose: Initialize the complete database schema in public schema with tables, functions, indexes and RLS policies
-- Affected: Creates flashcards, generations, generation_error_logs tables in public schema
-- Date: 2024-10-12 12:00:00 UTC

-- Enable the pgcrypto extension for gen_random_uuid() function
create extension if not exists "pgcrypto";

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to automatically update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ========================================
-- TABLES
-- ========================================

-- Table: public.generations
-- Purpose: Log metadata of successful AI flashcard generation sessions for metrics collection
-- Note: Created first because public.flashcards references this table
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar(100) null,  -- Nullable to support optional model parameter
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

-- Table: public.flashcards
-- Purpose: Store flashcards created by users
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid null references public.generations(id) on delete set null,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar(20) not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: public.generation_error_logs
-- Purpose: Log information about failed AI flashcard generation attempts for diagnostics
create table public.generation_error_logs (
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

-- Trigger for public.flashcards to automatically update updated_at column
create trigger on_flashcard_update
  before update on public.flashcards
  for each row
  execute procedure public.handle_updated_at();

-- Trigger for public.generations to automatically update updated_at column
create trigger on_generation_update
  before update on public.generations
  for each row
  execute procedure public.handle_updated_at();

-- ========================================
-- INDEXES
-- ========================================

-- Index for foreign key user_id in flashcards table for better join performance
create index idx_flashcards_user_id on public.flashcards(user_id);

-- Index for foreign key generation_id in flashcards table for better join performance
create index idx_flashcards_generation_id on public.flashcards(generation_id);

-- Index for foreign key user_id in generations table for better join performance
create index idx_generations_user_id on public.generations(user_id);

-- Index for foreign key user_id in generation_error_logs table for better join performance
create index idx_generation_error_logs_user_id on public.generation_error_logs(user_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS for all public tables to ensure strict data isolation between users
-- The auth.uid() function from Supabase Auth is used to identify the logged-in user

-- RLS for public.flashcards table
alter table public.flashcards enable row level security;

-- Policy: Users can only view their own flashcards
create policy "Allow select for own flashcards" on public.flashcards
  for select using (auth.uid() = user_id);

-- Policy: Users can only insert flashcards for themselves
create policy "Allow insert for own flashcards" on public.flashcards
  for insert with check (auth.uid() = user_id);

-- Policy: Users can only update their own flashcards
create policy "Allow update for own flashcards" on public.flashcards
  for update using (auth.uid() = user_id);

-- Policy: Users can only delete their own flashcards
create policy "Allow delete for own flashcards" on public.flashcards
  for delete using (auth.uid() = user_id);

-- RLS for public.generations table
alter table public.generations enable row level security;

-- Policy: Users can only view their own generation logs
create policy "Allow select for own generation logs" on public.generations
  for select using (auth.uid() = user_id);

-- Policy: Users can only insert generation logs for themselves
create policy "Allow insert for own generation logs" on public.generations
  for insert with check (auth.uid() = user_id);

-- Policy: Users can update their own generation logs (e.g., after review session)
create policy "Allow update for own generation logs" on public.generations
  for update using (auth.uid() = user_id);

-- Policy: Users can only delete their own generation logs
create policy "Allow delete for own generation logs" on public.generations
  for delete using (auth.uid() = user_id);

-- RLS for public.generation_error_logs table
alter table public.generation_error_logs enable row level security;

-- Policy: Users can only view their own error logs
create policy "Allow select for own error logs" on public.generation_error_logs
  for select using (auth.uid() = user_id);

-- Policy: Users can only insert error logs for themselves
create policy "Allow insert for own error logs" on public.generation_error_logs
  for insert with check (auth.uid() = user_id);

-- Policy: Users can only delete their own error logs
-- Note: This table is designed to be append-only, so no UPDATE policy is needed
create policy "Allow delete for own error logs" on public.generation_error_logs
  for delete using (auth.uid() = user_id);

