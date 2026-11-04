create table public.training_admins (
  singleton boolean primary key default true check(singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.training_stages (
  id uuid primary key default gen_random_uuid(),
  title text not null check(length(trim(title)) between 1 and 160),
  description text not null default '' check(length(description)<=10000),
  place text not null check(length(trim(place)) between 1 and 300),
  start date not null,
  "end" date not null check("end">=start),
  fee numeric(10,3) not null default 0 check(fee>=0),
  closed boolean not null default false,
  docs jsonb not null default '[]' check(jsonb_typeof(docs)='array' and jsonb_array_length(docs)<=15),
  created_at timestamptz not null default now()
);
create table public.training_applicants (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.training_stages(id) on delete restrict,
  "firstName" text not null check(length(trim("firstName")) between 1 and 80),
  "lastName" text not null check(length(trim("lastName")) between 1 and 80),
  phone text not null check(phone ~ '^\+?[0-9]{8,15}$'),
  birth date not null,
  decision text not null default 'pending' check(decision in ('pending','accepted','rejected')),
  paid boolean not null default false,
  present boolean not null default false,
  fee numeric(10,3) not null check(fee>=0),
  files jsonb not null default '[]' check(jsonb_typeof(files)='array' and jsonb_array_length(files)<=15),
  created_at timestamptz not null default now(),
  unique(stage_id,"firstName","lastName",phone,birth)
);
create index training_applicants_stage_idx on public.training_applicants(stage_id);
create index training_applicants_decision_idx on public.training_applicants(decision);
create table public.training_bootstrap (
  id boolean primary key default true check(id),
  email text not null,
  token_hash text not null,
  used_at timestamptz,
  expires_at timestamptz not null default now()+interval '1 day'
);
alter table public.training_admins enable row level security;
alter table public.training_stages enable row level security;
alter table public.training_applicants enable row level security;
alter table public.training_bootstrap enable row level security;
revoke all on public.training_admins,public.training_stages,public.training_applicants,public.training_bootstrap from anon, authenticated;
grant select on public.training_admins to authenticated;
grant select,insert,update on public.training_stages to authenticated;
grant select,update on public.training_applicants to authenticated;
grant all on public.training_admins,public.training_stages,public.training_applicants,public.training_bootstrap to service_role;
create policy training_admin_self on public.training_admins for select to authenticated using(user_id=(select auth.uid()));
create policy training_stages_read on public.training_stages for select to authenticated using(exists(select 1 from public.training_admins where user_id=(select auth.uid())));
create policy training_stages_insert on public.training_stages for insert to authenticated with check(exists(select 1 from public.training_admins where user_id=(select auth.uid())));
create policy training_stages_update on public.training_stages for update to authenticated using(exists(select 1 from public.training_admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.training_admins where user_id=(select auth.uid())));
create policy training_applicants_read on public.training_applicants for select to authenticated using(exists(select 1 from public.training_admins where user_id=(select auth.uid())));
create policy training_applicants_update on public.training_applicants for update to authenticated using(exists(select 1 from public.training_admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.training_admins where user_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('training-documents','training-documents',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy training_documents_read on storage.objects for select to authenticated using(bucket_id='training-documents' and exists(select 1 from public.training_admins where user_id=(select auth.uid())));
