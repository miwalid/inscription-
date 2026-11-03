-- Existing dossiers remain unspecified until the organizer records their sex.
alter table public.training_applicants add column gender text check(gender in ('male','female'));
