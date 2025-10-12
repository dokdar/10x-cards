-- Migration: Disable RLS for development environment
-- Purpose: Remove all Row Level Security policies and disable RLS for local development
-- Affected: Drops all RLS policies and disables RLS on flashcards, generations, and generation_error_logs tables
-- Date: 2024-10-12 12:01:00 UTC
-- IMPORTANT: This migration should NOT be applied to production environment

-- ========================================
-- DISABLE RLS POLICIES FOR PUBLIC.FLASHCARDS
-- ========================================

-- Drop all existing policies for public.flashcards table
drop policy if exists "Allow select for own flashcards" on public.flashcards;
drop policy if exists "Allow insert for own flashcards" on public.flashcards;
drop policy if exists "Allow update for own flashcards" on public.flashcards;
drop policy if exists "Allow delete for own flashcards" on public.flashcards;

-- ========================================
-- DISABLE RLS POLICIES FOR PUBLIC.GENERATIONS
-- ========================================

-- Drop all existing policies for public.generations table
drop policy if exists "Allow select for own generation logs" on public.generations;
drop policy if exists "Allow insert for own generation logs" on public.generations;
drop policy if exists "Allow update for own generation logs" on public.generations;
drop policy if exists "Allow delete for own generation logs" on public.generations;

-- ========================================
-- DISABLE RLS POLICIES FOR PUBLIC.GENERATION_ERROR_LOGS
-- ========================================

-- Drop all existing policies for public.generation_error_logs table
drop policy if exists "Allow select for own error logs" on public.generation_error_logs;
drop policy if exists "Allow insert for own error logs" on public.generation_error_logs;
drop policy if exists "Allow delete for own error logs" on public.generation_error_logs;

-- ========================================
-- DISABLE RLS COMPLETELY FOR DEVELOPMENT
-- ========================================

-- Completely disable RLS on all public tables for development environment
-- This allows full access to all data without user isolation
alter table public.flashcards disable row level security;
alter table public.generations disable row level security;
alter table public.generation_error_logs disable row level security;

-- Note: For production deployment, create a separate migration to re-enable RLS and restore policies

