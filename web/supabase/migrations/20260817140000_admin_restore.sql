-- #86 (parent #68) - admin restore / promote-user action.
-- Audit P1.19: adminSuspendUser demoted a seller to buyer and archived their
-- listings, but nothing could re-instate the role — combined with the missing
-- become-a-seller flow (#71), a suspended seller could never list again.
--
-- suspended_at marks the suspension so the admin UI can distinguish a
-- suspended seller (Restore button) from an active one (Suspend button), and
-- restore_user_row() re-instates role='seller' and clears the marker. Restore
-- is the admin's explicit re-instate action; the audit frames it as the
-- inverse of the suspend demotion, so it promotes to seller.

alter table public.profiles
  add column if not exists suspended_at timestamptz;