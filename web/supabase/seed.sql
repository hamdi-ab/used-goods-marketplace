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

-----------------------------------------------------------------------------
-- T16 demo seed: a populated Addis Ababa marketplace (issue #20 AC-4) so the
-- browse/search/detail/offer walkthrough has a full catalog to work with.
-- ~58 listings across every category (DB spec §7), spread across the demo
-- sellers above (most on Amira so the phone-verified seller badge shows up
-- across cards) and Addis Ababa sub-cities (Bole, Piassa, Merkato,
-- Kazanchis, Arada, Yeka). A few Dire Dawa rows from Kebede exercise the
-- city filter. IDs are deterministic
-- (20000000-...-00000000000N) so re-running `supabase db reset` stays
-- idempotent (on conflict (id) do nothing). Image URLs are local illustration
-- / photo SVG stand-ins for demo only; swap for real product photos before
-- production hosting.
-----------------------------------------------------------------------------
do $$
declare
  seller_phone uuid := '00000000-0000-0000-0000-000000000002';
  seller_fayda uuid := '00000000-0000-0000-0000-000000000003';
  seller_plain uuid := '00000000-0000-0000-0000-000000000004';
  rec record;
begin
  for rec in select * from (values
    ------------------------------------------------------------------ Electronics
    (1, seller_phone, 'electronics', 'iPhone 12 64GB',
     'Unlocked iPhone 12, 64GB, battery health 87%. Comes with the original cable. Minor scuffs on the back, screen flawless.', 28000, 'Lightly Used', false, 'Bole', 5),
    (2, seller_phone, 'electronics', 'MacBook Air M1 13"',
     'M1 chip, 8GB RAM, 256GB SSD, 42 battery cycles. Charger included. Ready for university or office work.', 62000, 'Lightly Used', true, 'Bole', 9),
    (3, seller_phone, 'electronics', 'Sony WH-1000XM4 headphones',
     'Noise-cancelling over-ear headphones in box with all accessories. Used twice, like new. Great for calls and music.', 15500, 'Brand New', false, 'Kazanchis', 3),
    (4, seller_fayda, 'electronics', 'Samsung Galaxy A54 5G',
     '128GB, dual SIM, box and charger included. Kept in a case since purchase, minor signs of use on the frame.', 25000, 'Lightly Used', false, 'Piassa', 12),
    (5, seller_plain, 'electronics', 'Dell 24" Full HD monitor',
     'Dell P2422H, 24" IPS 1080p, includes HDMI cable. A couple of pixels stuck near the top edge, otherwise clean.', 12000, 'Fair', true, 'Merkato', 20),
    (6, seller_phone, 'electronics', 'JBL Flip 5 speaker',
     'Portable Bluetooth speaker, waterproof. Tiny cosmetic scratch on the mesh. Battery holds a full day of playback.', 6500, 'Lightly Used', false, 'Bole', 7),
    (7, seller_fayda, 'electronics', 'Canon EOS 250D camera',
     'Entry DSLR with 18-55mm lens, extra battery and 32GB SD card. Shutter count 4,200. Perfect for a beginner photographer.', 45000, 'Lightly Used', true, 'Yeka', 15),
    ------------------------------------------------------------------ Furniture
    (8, seller_phone, 'furniture', '3+2 sofa set',
     'Modern grey fabric sofa set, 3-seater plus 2-seater. Bought two years ago, no stains or tears. Available for pickup in Bole.', 38000, 'Lightly Used', true, 'Bole', 30),
    (9, seller_fayda, 'furniture', 'Office desk with drawers',
     'L-shaped wooden office desk with three drawers and cable tray. Solid build, some scratches on the top surface.', 8500, 'Fair', false, 'Kazanchis', 25),
    (10, seller_phone, 'furniture', 'Queen bed frame + mattress',
     'Wooden queen bed frame with brand-new mattress, still sealed. Assembly service can be arranged.', 22000, 'Brand New', true, 'Piassa', 4),
    (11, seller_plain, 'furniture', '5-tier bookshelf',
     'Sturdy 5-tier wooden bookshelf, 180cm tall. Good condition, a few scuffs on the back panel.', 6000, 'Fair', false, 'Merkato', 40),
    (12, seller_phone, 'furniture', 'Dining table + 4 chairs',
     'Round wooden dining table with four upholstered chairs. Slight wobble on one leg that is easily fixed.', 18000, 'Lightly Used', true, 'Bole', 18),
    (13, seller_fayda, 'furniture', 'TV stand with shelves',
     'Low wooden TV stand, 160cm wide with two open shelves. Minor scratches on the top, hardware all included.', 4500, 'Fair', false, 'Yeka', 22),
    (14, seller_phone, 'furniture', 'Leather recliner chair',
     'Brown genuine-leather recliner in excellent condition, no tears. Comfortable lounge chair for a living room corner.', 9800, 'Lightly Used', true, 'Bole', 11),
    ------------------------------------------------------------------ Home Appliances
    (15, seller_phone, 'home-appliances', 'LG 7kg washing machine',
     'Front-loading washing machine, 7kg capacity, 1200 rpm. Runs a full cycle quietly, recently serviced.', 32000, 'Lightly Used', true, 'Bole', 14),
    (16, seller_fayda, 'home-appliances', 'Samsung double-door fridge',
     '486L double-door refrigerator with water dispenser. Still under warranty until 2027. Reason for sale: moving abroad.', 58000, 'Brand New', true, 'Kazanchis', 6),
    (17, seller_phone, 'home-appliances', 'Electric kettle 1.7L',
     'Stainless steel electric kettle, 2200W, boils fast. Used a handful of times, box included.', 2200, 'Brand New', false, 'Piassa', 2),
    (18, seller_plain, 'home-appliances', '4-burner gas cooker',
     'Freestanding 4-burner gas cooker with oven. Works well, oven door seal needs replacing.', 9000, 'Fair', true, 'Merkato', 35),
    (19, seller_phone, 'home-appliances', '1.5HP inverter air conditioner',
     'Inverter split AC, 1.5HP, cooling only. Includes installation. Used one season, filters cleaned monthly.', 45000, 'Brand New', true, 'Bole', 8),
    (20, seller_fayda, 'home-appliances', 'Microwave oven 30L',
     '30L microwave with grill function, 900W. Glass turntable and manual included. No issues.', 9500, 'Lightly Used', false, 'Yeka', 16),
    (21, seller_phone, 'home-appliances', 'Rice cooker 5L',
     '5L electric rice cooker with steamer basket and non-stick pot. Works perfectly, only the measuring cup is lost.', 4000, 'Lightly Used', false, 'Piassa', 10),
    ------------------------------------------------------------------ Vehicles
    (22, seller_phone, 'vehicles', 'Toyota Corolla 2015',
     'Toyota Corolla 2015, 1.8L automatic, 92,000 km. Full service history, new tires. Bought for family, selling due to import.', 2850000, 'Lightly Used', true, 'Bole', 21),
    (23, seller_plain, 'vehicles', 'Bajaj Boxer 150cc',
     'Bajaj Boxer 150, 2019, 23,000 km, always serviced. New chain and sprockets. Transfer documents ready.', 165000, 'Lightly Used', true, 'Merkato', 28),
    (24, seller_fayda, 'vehicles', 'Toyota Vitz 2012',
     'Toyota Vitz 2012 automatic, 118,000 km. Runs well, minor body scratches and a dent on the rear door.', 1450000, 'Fair', true, 'Kazanchis', 33),
    (25, seller_phone, 'vehicles', 'Honda PCX 125cc scooter',
     'Honda PCX 125, 2023, zero kilometers, still crated. White color. Documents in hand.', 310000, 'Brand New', false, 'Bole', 1),
    (26, seller_phone, 'vehicles', 'Maruti Suzuki Celerio 2018',
     'Celerio 2018, 1.0L manual, 64,000 km, single owner. Very economical on fuel. Serviced at the dealer throughout.', 1900000, 'Lightly Used', true, 'Yeka', 17),
    (27, seller_fayda, 'vehicles', 'Mountain bike 26"',
     'Giant 26" mountain bike, 21-speed, disc brakes. New rear tire and brake pads. Rides smooth.', 18000, 'Lightly Used', false, 'Piassa', 13),
    (28, seller_plain, 'vehicles', 'Isuzu pickup 4x4',
     'Isuzu D-Max 4x4, 2016, 145,000 km, diesel. Workhorse in good mechanical condition; cabin AC needs a recharge.', 3200000, 'Fair', true, 'Merkato', 45),
    ------------------------------------------------------------------ Fashion
    (29, seller_phone, 'fashion', 'Mens leather jacket',
     'Genuine black leather jacket, size M. Worn a few times, no tears, lining intact.', 3800, 'Lightly Used', false, 'Bole', 6),
    (30, seller_fayda, 'fashion', 'Womens ankle boots',
     'Brown leather ankle boots, size 38. Never worn outdoors, box included.', 2900, 'Brand New', false, 'Piassa', 3),
    (31, seller_phone, 'fashion', 'Habesha kemis (handwoven)',
     'Handwoven white habesha kemis with intricate embroidered chest and hem. Made-to-order quality, size free fit.', 6500, 'Brand New', true, 'Merkato', 2),
    (32, seller_fayda, 'fashion', 'Nike running shoes 42',
     'Nike Pegasus running shoes, EU 42, used for one race season. Soles have plenty of life left.', 4200, 'Lightly Used', false, 'Bole', 19),
    (33, seller_phone, 'fashion', 'Designer handbag',
     'Genuine leather handbag, taupe, good brand. Small scuff on the corner, hardware still shines.', 5500, 'Lightly Used', true, 'Kazanchis', 9),
    (34, seller_fayda, 'fashion', 'Traditional shemma scarf',
     'Handwoven white and yellow shemma scarf, soft and warm. Perfect as a gift or for weddings.', 1200, 'Brand New', false, 'Arada', 1),
    ------------------------------------------------------------------ Books
    (35, seller_phone, 'books', 'Amharic childrens book set',
     'Set of 8 colorful Amharic children story books with illustrations, ages 4-8. Gently read.', 1500, 'Brand New', false, 'Bole', 5),
    (36, seller_fayda, 'books', 'Computer science textbooks',
     'Bundle of 5 undergraduate CS textbooks: algorithms, databases, networks, OS. Clean, some margin notes.', 3500, 'Fair', true, 'Kazanchis', 24),
    (37, seller_phone, 'books', 'English-Amharic dictionary',
     'Compact English-Amharic dictionary, 45,000 entries. Useful for students and translators.', 800, 'Lightly Used', false, 'Piassa', 12),
    (38, seller_plain, 'books', 'Business & economics books',
     '4 paperback books on economics and small-business management. Good reading condition.', 2400, 'Fair', false, 'Merkato', 30),
    (39, seller_phone, 'books', 'Fiction novels bundle',
     'Bundle of 10 international fiction novels (paperback). Great value for a reading library.', 2000, 'Lightly Used', true, 'Yeka', 20),
    (40, seller_fayda, 'books', 'Medical textbooks set',
     '3 core medical textbooks (anatomy, physiology, pharmacology). 2020-2022 editions, light highlights only.', 8000, 'Lightly Used', true, 'Bole', 26),
    ------------------------------------------------------------------ Sports
    (41, seller_phone, 'sports', 'Wilson basketball',
     'Wilson NCAA game ball, lightly used indoors. Good grip, plenty of bounce left.', 2600, 'Brand New', false, 'Bole', 4),
    (42, seller_fayda, 'sports', 'Folding treadmill',
     'Foldable treadmill, max speed 12 km/h, incline adjust. Used lightly for a year, serviced. Heavy, pickup required.', 65000, 'Lightly Used', true, 'Kazanchis', 27),
    (43, seller_phone, 'sports', '20kg dumbbell set',
     'Adjustable dumbbells with plates up to 20kg total, includes storage rack. Rubber coated.', 9000, 'Lightly Used', false, 'Piassa', 15),
    (44, seller_fayda, 'sports', 'Yoga mat',
     '6mm TPE yoga mat, teal, with carry strap. Barely used, still in the tube.', 1100, 'Brand New', false, 'Merkato', 2),
    (45, seller_phone, 'sports', 'Table tennis table',
     'Full-size indoor table tennis table, 25mm top, folds for storage. Nets and two bats included.', 14000, 'Fair', true, 'Bole', 32),
    (46, seller_plain, 'sports', 'Soccer ball (FIFA quality)',
     'FIFA quality soccer ball, size 5, used a handful of times on grass. No wear to the panels.', 1900, 'Brand New', false, 'Yeka', 8),
    ------------------------------------------------------------------ Baby & Kids
    (47, seller_phone, 'baby-and-kids', '3-in-1 baby stroller',
     '3-in-1 stroller (carrycot, pushchair, car seat) by a trusted brand. One small tear on the canopy, all parts work.', 14500, 'Lightly Used', true, 'Bole', 29),
    (48, seller_fayda, 'baby-and-kids', 'Baby crib + mattress',
     'White wooden crib with adjustable mattress height and brand-new firm mattress. Meets safety standards.', 8000, 'Lightly Used', false, 'Kazanchis', 18),
    (49, seller_phone, 'baby-and-kids', 'Kids bunk bed',
     'Solid wooden bunk bed, white, with a small built-in ladder. Some paint chips on the edges.', 11000, 'Fair', true, 'Piassa', 36),
    (50, seller_fayda, 'baby-and-kids', 'Car seat 0-4 years',
     'Group 0+1 car seat, rear- and forward-facing, ISOFIX compatible. Never in an accident.', 9500, 'Brand New', false, 'Bole', 7),
    (51, seller_phone, 'baby-and-kids', 'Wooden toy set 50 pcs',
     '50-piece natural wooden toy set: blocks, sorting shapes, animals. Safe, non-toxic finish.', 2800, 'Brand New', false, 'Merkato', 3),
    (52, seller_fayda, 'baby-and-kids', 'Baby clothes bundle 0-6m',
     'Bundle of 15 baby outfits, sizes 0-6 months, mix of brands. Washed, in great shape.', 3200, 'Lightly Used', true, 'Yeka', 10),
    ------------------------------------------------------------------ Other
    (53, seller_phone, 'other', 'Acoustic guitar',
     'Yamaha acoustic guitar with soft case and picks. Slight action adjustment needed, otherwise excellent.', 7500, 'Lightly Used', true, 'Bole', 23),
    (54, seller_fayda, 'other', 'Art easel + supplies',
     'Wooden studio easel with a box of paints, brushes and 10 canvases. Great for a new hobbyist.', 4200, 'Brand New', false, 'Kazanchis', 5),
    (55, seller_phone, 'other', 'Luggage set 3 pcs',
     '3-piece spinner luggage set (cabin, medium, large). Light scratches from a few flights, wheels roll smoothly.', 6800, 'Lightly Used', true, 'Piassa', 14),
    (56, seller_plain, 'other', 'Sewing machine',
     'Electric sewing machine with table, several stitch patterns and attachments. Serviced and tested.', 12000, 'Fair', true, 'Merkato', 31),
    (57, seller_phone, 'other', 'DSLR camera bag + tripod',
     'Large padded camera bag plus aluminum tripod. Both in good condition, padding intact.', 5000, 'Lightly Used', false, 'Yeka', 12),
    (58, seller_fayda, 'other', 'Ergonomic office chair',
     'Ergonomic mesh office chair with lumbar support, adjustable height and armrests. One caster replaced.', 6500, 'Fair', false, 'Bole', 21)
  ) as t(k int, seller_id uuid, category_slug text, title text, description text,
        price numeric, condition public.listing_condition, negotiable boolean, sub_city text, age_days int)
  loop
    insert into public.listings (id, seller_id, category_id, title, description, price,
                                 condition, negotiable, city, sub_city, status, published_at)
    values (
      ('20000000-0000-0000-0000-' || lpad(rec.k::text, 12, '0'))::uuid,
      rec.seller_id,
      (select id from public.categories where slug = rec.category_slug limit 1),
      rec.title, rec.description, rec.price, rec.condition, rec.negotiable,
      'Addis Ababa', rec.sub_city, 'published',
      now() - make_interval(days => rec.age_days)
    )
    on conflict (id) do nothing;
  end loop;

  -- One stand-in image per demo listing that does not already have one
  -- (covers the T12 three listings and the ~58 above). Rows are numbered to
  -- rotate between a few local assets so cards look varied during the demo.
  with ranked as (
    select l.id, l.title,
           row_number() over (order by l.id) as rn
    from public.listings l
    where l.seller_id in (seller_phone, seller_fayda, seller_plain)
      and not exists (select 1 from public.listing_images where listing_id = l.id)
  )
  insert into public.listing_images (listing_id, image_url, display_order, alt_text)
  select id,
         (array[
           '/images/illustrations/trust-safe-transactions.svg',
           '/images/photos/photo-modern-apartment.svg',
           '/images/photos/photo-seller-taking-photos.svg',
           '/images/photos/photo-buyer-meeting-seller.svg'
         ])[1 + mod(rn - 1, 4)],
         0,
         coalesce(title, 'Demo listing image')
  from ranked;
end $$;
