-- Responsible staff belong to a stage; no public access or organizer-account creation.
create table public.training_staff (
 id uuid primary key default gen_random_uuid(),
 stage_id uuid not null references public.training_stages(id) on delete restrict,
 first_name text not null check(length(trim(first_name)) between 1 and 80),
 last_name text not null check(length(trim(last_name)) between 1 and 80),
 workshop text not null check(length(trim(workshop)) between 1 and 160),
 photo_key text,
 photo_type text check(photo_type in ('image/jpeg','image/png','image/webp')),
 deleted_at timestamptz,
 created_at timestamptz not null default now(),
 check((photo_key is null)=(photo_type is null)),
 check(photo_key is null or (split_part(photo_key,'/',1)=id::text and array_length(string_to_array(photo_key,'/'),1)=2))
);
create index training_staff_stage_idx on public.training_staff(stage_id);
alter table public.training_staff enable row level security;
revoke all on public.training_staff from anon,authenticated;
grant select,insert,update on public.training_staff to authenticated;
grant all on public.training_staff to service_role;
create policy training_staff_read on public.training_staff for select to authenticated using(exists(select 1 from public.training_stages s where s.id=stage_id and s.owner_id=(select auth.uid())));
create policy training_staff_insert on public.training_staff for insert to authenticated with check(exists(select 1 from public.training_stages s where s.id=stage_id and s.owner_id=(select auth.uid())));
create policy training_staff_update on public.training_staff for update to authenticated using(exists(select 1 from public.training_stages s where s.id=stage_id and s.owner_id=(select auth.uid()))) with check(exists(select 1 from public.training_stages s where s.id=stage_id and s.owner_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('training-staff-photos','training-staff-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy training_staff_photos_read on storage.objects for select to authenticated using(bucket_id='training-staff-photos' and exists(select 1 from public.training_staff t join public.training_stages s on s.id=t.stage_id where t.id::text=split_part(name,'/',1) and t.deleted_at is null and s.owner_id=(select auth.uid())));
create policy training_staff_photos_insert on storage.objects for insert to authenticated with check(bucket_id='training-staff-photos' and exists(select 1 from public.training_staff t join public.training_stages s on s.id=t.stage_id where t.id::text=split_part(name,'/',1) and t.deleted_at is null and s.owner_id=(select auth.uid())));
