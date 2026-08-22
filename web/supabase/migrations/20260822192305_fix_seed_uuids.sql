-- Fix seed UUIDs: convert invalid 0000-0000-0000-0000 format to valid v4
-- (xxxx-4xxx-8xxx). Seed data IDs weren't proper UUID v4, so zod's
-- .uuid() validator rejected them. This migration re-seeds the demo
-- data with valid UUIDs. Profile IDs are kept as-is (cascading all
-- FKs would be too disruptive; they're not validated by zod).

-- Delete existing demo data (order respects FK constraints)
delete from public.payments where id::text like '30000000-0000-0000-0000-%';
delete from public.reviews where offer_id::text like '30000000-0000-0000-0000-%';
delete from public.offers where id::text like '30000000-0000-0000-0000-%';
delete from public.listing_images where listing_id::text like '20000000-0000-0000-0000-%';
delete from public.listings where id::text like '20000000-0000-0000-0000-%';

-- Re-insert demo listings with valid v4 UUIDs
-- (seller_id references existing profile IDs which remain unchanged)
insert into public.listings (id, seller_id, category_id, title, description, price, condition, negotiable, city, sub_city, status, published_at)
values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000002',
   (select id from public.categories where slug = 'electronics' limit 1),
   'iPhone 13 128GB', 'iPhone 13, 128GB, battery health 92%, Face ID works.', 52000, 'Lightly Used', false,
   'Addis Ababa', 'Bole', 'published', now() - interval '4 days'),
  ('20000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'furniture' limit 1),
   'Sofa set', '3-seater sofa set, comfortable fabric, good condition.', 35000, 'Lightly Used', true,
   'Addis Ababa', 'Kazanchis', 'published', now() - interval '8 days'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000002',
   (select id from public.categories where slug = 'electronics' limit 1),
   'Samsung Galaxy A54', 'Galaxy A54, 128GB, no scratches, with case.', 23000, 'Lightly Used', false,
   'Addis Ababa', 'Piassa', 'published', now() - interval '12 days'),
  ('20000000-0000-4000-8000-000000000016', '00000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'home-appliances' limit 1),
   'Samsung fridge', 'Double-door fridge, energy efficient, minor wear.', 55000, 'Lightly Used', true,
   'Addis Ababa', 'Merkato', 'published', now() - interval '18 days'),
  ('20000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000002',
   (select id from public.categories where slug = 'furniture' limit 1),
   'Wooden bookshelf', 'Tall wooden bookshelf, 5 shelves, sturdy.', 5000, 'Brand New', false,
   'Addis Ababa', 'Piassa', 'published', now() - interval '22 days'),
  ('20000000-0000-4000-8000-000000000023', '00000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'other' limit 1),
   'Boxer motorcycle', '2018 Boxer motorcycle, low mileage, documents ready.', 150000, 'Fair', true,
   'Addis Ababa', 'Bole', 'published', now() - interval '30 days')
on conflict (id) do nothing;

-- Re-insert demo offers with valid v4 UUIDs
insert into public.offers (id, listing_id, buyer_id, amount, message, status)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
   '00000000-0000-0000-0000-000000000005', 26000, 'Hi, would you accept 26000 for the iPhone?', 'accepted'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000008',
   '00000000-0000-0000-0000-000000000005', 35000, 'Is 35000 okay for the sofa set?', 'accepted'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004',
   '00000000-0000-0000-0000-000000000005', 23000, '23000 for the Galaxy A54 if you can deliver.', 'accepted'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000016',
   '00000000-0000-0000-0000-000000000005', 55000, 'Would you take 55000 for the fridge?', 'accepted'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000011',
   '00000000-0000-0000-0000-000000000005', 5000, '5000 for the bookshelf, I can pick it up.', 'accepted'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000023',
   '00000000-0000-0000-0000-000000000005', 150000, '150000 for the Boxer if documents are ready.', 'accepted')
on conflict (id) do nothing;

-- Mark listings as sold
update public.listings
   set status = 'sold', sold_to_buyer_id = '00000000-0000-0000-0000-000000000005'
 where id in ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000008',
              '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000016',
              '20000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000023');

-- Re-insert demo reviews with valid v4 UUIDs
insert into public.reviews (offer_id, seller_id, buyer_id, rating, comment)
values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 5, 'Great seller, iPhone as described.'),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 4, 'Sofa set in good shape, smooth deal.')
on conflict (offer_id) do nothing;

-- Re-insert demo verifications with valid v4 UUIDs
insert into public.verifications (user_id, type, status, notes)
values
  ('00000000-0000-0000-0000-000000000002', 'phone', 'verified', 'Phone verified via SMS.'),
  ('00000000-0000-0000-0000-000000000003', 'fayda', 'verified', 'Fayda ID verified via OIDC.')
on conflict do nothing;

-- Update profile flags
update public.profiles set phone_verified = true where id = '00000000-0000-0000-0000-000000000002';
update public.profiles set fayda_verified = true where id = '00000000-0000-0000-0000-000000000003';
