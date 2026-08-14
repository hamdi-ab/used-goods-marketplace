-- Dev seed (app/supabase/seed.sql, run on `supabase db reset`).
-- Bootstraps a single admin account for moderation (DB spec §23).
-- Credentials: admin@vintch.local / admin1234  — change before any shared hosting.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@vintch.local',
  extensions.crypt('admin1234', extensions.gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  jsonb_build_object('full_name', 'Marketplace Admin'),
  now(),
  now()
where not exists (
  select 1 from auth.users where email = 'admin@vintch.local'
);

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'email', 'admin@vintch.local'
  ),
  'email',
  now(),
  now(),
  now()
where not exists (
  select 1 from auth.identities
  where user_id = '00000000-0000-0000-0000-000000000001'
);

-- Promote the auto-created profile (trigger made it a buyer) to admin.
update public.profiles
set role = 'admin', full_name = 'Marketplace Admin'
where id = '00000000-0000-0000-0000-000000000001';