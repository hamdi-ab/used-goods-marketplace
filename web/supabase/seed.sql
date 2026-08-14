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

------------------------------------------------------------------------------
-- T12 demo seeds: exercise every trust-badge state on a fresh `db reset`
-- (issue #16 AC-3): Verified Seller + Phone Verified, Verified Seller + Fayda,
-- Verified Seller alone, and a buyer that renders the "Not verified yet"
-- empty state. A published listing per seller makes the badge set visible on
-- listing cards (AC-2), not only on profile pages. Verification events are
-- written through the audit `verifications` table too, so the T12 read model
-- (profiles.phone_verified / fayda_verified) and the audit log stay in sync.
-- Passwords are demo-only (`demo1234`); change before shared hosting.
------------------------------------------------------------------------------
do $$
declare
  admin_id uuid := '00000000-0000-0000-0000-000000000001';
  seller_phone uuid := '00000000-0000-0000-0000-000000000002';
  seller_fayda uuid := '00000000-0000-0000-0000-000000000003';
  seller_plain uuid := '00000000-0000-0000-0000-000000000004';
  a_buyer uuid := '00000000-0000-0000-0000-000000000005';
  demo_password text := extensions.crypt('demo1234', extensions.gen_salt('bf'));
begin
  -- auth users (the on_auth_user_created trigger creates the profile rows).
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at)
  values
    ('00000000-0000-0000-0000-000000000000', seller_phone, 'authenticated', 'authenticated',
     'amira.sellers@vintch.local', demo_password, now(),
     jsonb_build_object('provider', 'email', 'providers', array['email']),
     jsonb_build_object('full_name', 'Amira Sellers'), now(), now()),
    ('00000000-0000-0000-0000-000000000000', seller_fayda, 'authenticated', 'authenticated',
     'fayad.verified@vintch.local', demo_password, now(),
     jsonb_build_object('provider', 'email', 'providers', array['email']),
     jsonb_build_object('full_name', 'Fayad Verified'), now(), now()),
    ('00000000-0000-0000-0000-000000000000', seller_plain, 'authenticated', 'authenticated',
     'kebede.trader@vintch.local', demo_password, now(),
     jsonb_build_object('provider', 'email', 'providers', array['email']),
     jsonb_build_object('full_name', 'Kebede Trader'), now(), now()),
    ('00000000-0000-0000-0000-000000000000', a_buyer, 'authenticated', 'authenticated',
     'biniam.buyer@vintch.local', demo_password, now(),
     jsonb_build_object('provider', 'email', 'providers', array['email']),
     jsonb_build_object('full_name', 'Biniam Buyer'), now(), now())
  on conflict (id) do nothing;

  -- identity rows (idempotent by user_id).
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select s.id, s.id,
         jsonb_build_object('sub', s.id, 'email', s.email),
         'email', now(), now(), now()
  from (
    values
      (seller_phone, 'amira.sellers@vintch.local'),
      (seller_fayda, 'fayad.verified@vintch.local'),
      (seller_plain, 'kebede.trader@vintch.local'),
      (a_buyer, 'biniam.buyer@vintch.local')
  ) as s(id, email)
  where not exists (select 1 from auth.identities where user_id = s.id);

  -- Promote the demo sellers (role) + trust-badge flags + trust score, and
  -- keep the buyer as a buyer (exercises the "Not verified yet" empty state).
  update public.profiles set
    role = 'seller', full_name = 'Amira Sellers', city = 'Addis Ababa',
    phone = '+251911000002', phone_public = true,
    phone_verified = true, fayda_verified = false, trust_score = 85
  where id = seller_phone;

  update public.profiles set
    role = 'seller', full_name = 'Fayad Verified', city = 'Addis Ababa',
    phone = '+251911000003', phone_public = false,
    phone_verified = false, fayda_verified = true, trust_score = 75
  where id = seller_fayda;

  update public.profiles set
    role = 'seller', full_name = 'Kebede Trader', city = 'Dire Dawa',
    phone = null, phone_public = false,
    phone_verified = false, fayda_verified = false, trust_score = 60
  where id = seller_plain;

  update public.profiles set
    role = 'buyer', full_name = 'Biniam Buyer', city = 'Addis Ababa',
    phone_verified = false, fayda_verified = false, trust_score = 50
  where id = a_buyer;

  -- Audit rows for the verified states (VerificationApproved event).
  insert into public.verifications (user_id, type, status, verifier_id, notes)
  values
    (seller_phone, 'phone', 'verified', admin_id, 'Demo phone verification.'),
    (seller_fayda, 'fayda', 'verified', admin_id, 'Demo Fayda placeholder verification.')
  on conflict on constraint verifications_one_active_per_type do nothing;

  -- One published listing per seller so listing cards render the badge set.
  -- The image_url is a local illustration stand-in for demo only.
  insert into public.listings (id, seller_id, category_id, title, description, price,
                              condition, negotiable, city, sub_city, status, published_at)
  values
    ('10000000-0000-0000-0000-000000000002', seller_phone,
     (select id from public.categories where slug = 'furniture' limit 1),
     'Refinished wooden chair', 'Solid wood, gently restored. Pickup available.', 1500,
     'Lightly Used', false, 'Addis Ababa', null, 'published', now()),
    ('10000000-0000-0000-0000-000000000003', seller_fayda,
     (select id from public.categories where slug = 'furniture' limit 1),
     'Handwoven throw rug', 'Ethiopian handwoven cotton rug, excellent condition.', 2200,
     'Lightly Used', true, 'Addis Ababa', null, 'published', now()),
    ('10000000-0000-0000-0000-000000000004', seller_plain,
     (select id from public.categories where slug = 'furniture' limit 1),
     'Steel bedside table', 'Minimal steel frame bedside table, minor scuffs.', 950,
     'Fair', false, 'Dire Dawa', null, 'published', now())
  on conflict (id) do nothing;

  insert into public.listing_images (listing_id, image_url, display_order, alt_text)
  select l.id, '/images/illustrations/trust-safe-transactions.svg', 0, 'Demo listing image'
  from public.listings l
  where l.seller_id in (seller_phone, seller_fayda, seller_plain)
    and not exists (select 1 from public.listing_images where listing_id = l.id);
end $$;
