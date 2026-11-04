-- Give every dossier a unique reference, including existing registrations.
-- The code is a reference, not a credential: organizer lookups still use owner RLS.
alter table public.training_applicants
  add column personal_code text not null
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
    constraint training_applicants_personal_code_format check (personal_code ~ '^[A-F0-9]{12}$')
    constraint training_applicants_personal_code_key unique;
