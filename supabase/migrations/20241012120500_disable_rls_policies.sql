-- Migration: Disable RLS policies for app tables
-- Purpose: Remove all Row Level Security policies from app.flashcards, app.generations, and app.generation_error_logs
-- Affected: Drops all existing RLS policies but keeps RLS enabled on tables
-- Date: 2024-10-12 12:05:00 UTC

-- ========================================
-- DISABLE RLS POLICIES FOR APP.FLASHCARDS
-- ========================================

-- Drop all existing policies for app.flashcards table
drop policy if exists "Allow select for own flashcards" on app.flashcards;
drop policy if exists "Allow insert for own flashcards" on app.flashcards;
drop policy if exists "Allow update for own flashcards" on app.flashcards;
drop policy if exists "Allow delete for own flashcards" on app.flashcards;

-- ========================================
-- DISABLE RLS POLICIES FOR APP.GENERATIONS
-- ========================================

-- Drop all existing policies for app.generations table
drop policy if exists "Allow select for own generation logs" on app.generations;
drop policy if exists "Allow insert for own generation logs" on app.generations;
drop policy if exists "Allow delete for own generation logs" on app.generations;

-- ========================================
-- DISABLE RLS POLICIES FOR APP.GENERATION_ERROR_LOGS
-- ========================================

-- Drop all existing policies for app.generation_error_logs table
drop policy if exists "Allow select for own error logs" on app.generation_error_logs;
drop policy if exists "Allow insert for own error logs" on app.generation_error_logs;
drop policy if exists "Allow delete for own error logs" on app.generation_error_logs;

-- ========================================
-- DISABLE RLS COMPLETELY FOR DEVELOPMENT
-- ========================================

-- Completely disable RLS on all app tables for development environment
-- This allows full access to all data without user isolation
alter table app.flashcards disable row level security;
alter table app.generations disable row level security;
alter table app.generation_error_logs disable row level security;

-- Note: For production deployment, create a separate migration to re-enable RLS and restore policies
