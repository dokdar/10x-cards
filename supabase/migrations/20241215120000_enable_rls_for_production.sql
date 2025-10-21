-- Migration: Enable RLS for production environment
-- Purpose: Re-enable Row Level Security policies for all tables to ensure proper data isolation
-- Affected: Enables RLS and creates comprehensive CRUD policies for flashcards, generations, and generation_error_logs tables
-- Date: 2024-12-15 12:00:00 UTC
-- IMPORTANT: This migration should be applied to production environment to ensure data security

-- ========================================
-- ENABLE RLS FOR PUBLIC.FLASHCARDS TABLE
-- ========================================

-- Enable Row Level Security for flashcards table
-- This ensures that users can only access their own flashcards
alter table public.flashcards enable row level security;

-- Policy: Allow authenticated users to select their own flashcards
-- Rationale: Users should only see flashcards they created
create policy "flashcards_select_own" on public.flashcards
  for select 
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow anonymous users to select flashcards (if needed for public access)
-- Rationale: This can be used for public flashcard collections or demos
create policy "flashcards_select_anon" on public.flashcards
  for select 
  to anon
  using (false); -- Set to true if anonymous access is needed

-- Policy: Allow authenticated users to insert flashcards for themselves
-- Rationale: Users can only create flashcards under their own user_id
create policy "flashcards_insert_own" on public.flashcards
  for insert 
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from inserting flashcards
-- Rationale: Only authenticated users should be able to create flashcards
create policy "flashcards_insert_anon" on public.flashcards
  for insert 
  to anon
  with check (false);

-- Policy: Allow authenticated users to update their own flashcards
-- Rationale: Users should be able to edit their own flashcards
create policy "flashcards_update_own" on public.flashcards
  for update 
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from updating flashcards
-- Rationale: Only authenticated users should be able to modify flashcards
create policy "flashcards_update_anon" on public.flashcards
  for update 
  to anon
  using (false);

-- Policy: Allow authenticated users to delete their own flashcards
-- Rationale: Users should be able to remove their own flashcards
create policy "flashcards_delete_own" on public.flashcards
  for delete 
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Prevent anonymous users from deleting flashcards
-- Rationale: Only authenticated users should be able to delete flashcards
create policy "flashcards_delete_anon" on public.flashcards
  for delete 
  to anon
  using (false);

-- ========================================
-- ENABLE RLS FOR PUBLIC.GENERATIONS TABLE
-- ========================================

-- Enable Row Level Security for generations table
-- This ensures that users can only access their own generation logs
alter table public.generations enable row level security;

-- Policy: Allow authenticated users to select their own generation logs
-- Rationale: Users should only see their own AI generation history
create policy "generations_select_own" on public.generations
  for select 
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Prevent anonymous users from selecting generation logs
-- Rationale: Generation logs contain user-specific data and should not be publicly accessible
create policy "generations_select_anon" on public.generations
  for select 
  to anon
  using (false);

-- Policy: Allow authenticated users to insert generation logs for themselves
-- Rationale: Users can only create generation logs under their own user_id
create policy "generations_insert_own" on public.generations
  for insert 
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from inserting generation logs
-- Rationale: Only authenticated users should be able to create generation logs
create policy "generations_insert_anon" on public.generations
  for insert 
  to anon
  with check (false);

-- Policy: Allow authenticated users to update their own generation logs
-- Rationale: Users should be able to update generation logs after review sessions
create policy "generations_update_own" on public.generations
  for update 
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from updating generation logs
-- Rationale: Only authenticated users should be able to modify generation logs
create policy "generations_update_anon" on public.generations
  for update 
  to anon
  using (false);

-- Policy: Allow authenticated users to delete their own generation logs
-- Rationale: Users should be able to remove their own generation history
create policy "generations_delete_own" on public.generations
  for delete 
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Prevent anonymous users from deleting generation logs
-- Rationale: Only authenticated users should be able to delete generation logs
create policy "generations_delete_anon" on public.generations
  for delete 
  to anon
  using (false);

-- ========================================
-- ENABLE RLS FOR PUBLIC.GENERATION_ERROR_LOGS TABLE
-- ========================================

-- Enable Row Level Security for generation_error_logs table
-- This ensures that users can only access their own error logs
alter table public.generation_error_logs enable row level security;

-- Policy: Allow authenticated users to select their own error logs
-- Rationale: Users should only see their own generation error history
create policy "generation_error_logs_select_own" on public.generation_error_logs
  for select 
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Prevent anonymous users from selecting error logs
-- Rationale: Error logs contain user-specific data and should not be publicly accessible
create policy "generation_error_logs_select_anon" on public.generation_error_logs
  for select 
  to anon
  using (false);

-- Policy: Allow authenticated users to insert error logs for themselves
-- Rationale: Users can only create error logs under their own user_id
create policy "generation_error_logs_insert_own" on public.generation_error_logs
  for insert 
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from inserting error logs
-- Rationale: Only authenticated users should be able to create error logs
create policy "generation_error_logs_insert_anon" on public.generation_error_logs
  for insert 
  to anon
  with check (false);

-- Policy: Prevent all users from updating error logs
-- Rationale: Error logs should be immutable for audit purposes
-- Note: No update policies are created as this table is designed to be append-only
create policy "generation_error_logs_update_none" on public.generation_error_logs
  for update 
  to authenticated, anon
  using (false);

-- Policy: Allow authenticated users to delete their own error logs
-- Rationale: Users should be able to remove their own error history if needed
create policy "generation_error_logs_delete_own" on public.generation_error_logs
  for delete 
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Prevent anonymous users from deleting error logs
-- Rationale: Only authenticated users should be able to delete error logs
create policy "generation_error_logs_delete_anon" on public.generation_error_logs
  for delete 
  to anon
  using (false);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- The following queries can be used to verify that RLS is properly enabled:
-- 
-- Check if RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('flashcards', 'generations', 'generation_error_logs');
--
-- List all policies for verification:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('flashcards', 'generations', 'generation_error_logs')
-- ORDER BY tablename, policyname;