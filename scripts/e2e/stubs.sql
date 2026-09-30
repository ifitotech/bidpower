-- Minimal stand-ins for what Supabase provides (auth schema, roles, storage tables).
create extension if not exists "uuid-ossp"; create extension if not exists pgcrypto;
do $$ begin
 if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
 if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
 if not exists (select from pg_roles where rolname='authenticator') then create role authenticator noinherit login password 'auth-pass'; end if;
 if not exists (select from pg_roles where rolname='shim') then create role shim superuser login password 'shim-pass'; end if;
end $$;
grant anon, authenticated to authenticator;
create schema if not exists auth; create schema if not exists storage;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'anon') $$;
create or replace function auth.email() returns text language sql stable as $$ select email from auth.users where id = auth.uid() $$;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
grant usage on schema auth, storage, public to anon, authenticated;
grant select on auth.users to authenticated;
grant all on all tables in schema storage to authenticated;
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated;
