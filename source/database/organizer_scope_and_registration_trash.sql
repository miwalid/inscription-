-- Each approved organizer manages only their own stages.
alter table public.training_admins drop constraint training_admins_pkey;
alter table public.training_admins add primary key(user_id);
alter table public.training_admins drop constraint training_admins_user_id_key;
alter table public.training_stages add column owner_id uuid references auth.users(id) on delete restrict;
do $$ begin
 if exists(select 1 from public.training_stages where owner_id is null) then
  if (select count(*) from public.training_admins)<>1 then raise exception 'Existing stages require an explicit owner mapping';end if;
  update public.training_stages set owner_id=(select user_id from public.training_admins) where owner_id is null;
 end if;
end $$;
alter table public.training_stages alter column owner_id set default auth.uid();
alter table public.training_stages alter column owner_id set not null;
create index training_stages_owner_idx on public.training_stages(owner_id);
alter policy training_stages_read on public.training_stages using(owner_id=(select auth.uid()) and exists(select 1 from public.training_admins where user_id=(select auth.uid())));
alter policy training_stages_insert on public.training_stages with check(owner_id=(select auth.uid()) and exists(select 1 from public.training_admins where user_id=(select auth.uid())));
alter policy training_stages_update on public.training_stages using(owner_id=(select auth.uid()) and exists(select 1 from public.training_admins where user_id=(select auth.uid()))) with check(owner_id=(select auth.uid()) and exists(select 1 from public.training_admins where user_id=(select auth.uid())));
alter policy training_applicants_read on public.training_applicants using(exists(select 1 from public.training_stages s where s.id=stage_id and s.owner_id=(select auth.uid())));
alter policy training_applicants_update on public.training_applicants using(exists(select 1 from public.training_stages s where s.id=stage_id and s.owner_id=(select auth.uid()))) with check(exists(select 1 from public.training_stages s where s.id=stage_id and s.owner_id=(select auth.uid())));
alter policy training_documents_read on storage.objects using(bucket_id='training-documents' and exists(select 1 from public.training_applicants a join public.training_stages s on s.id=a.stage_id where a.id::text=split_part(name,'/',1) and s.owner_id=(select auth.uid())));
-- Soft deletion preserves the dossier for restoration by its organizer.
alter table public.training_applicants add column deleted_at timestamptz;
alter table public.training_applicants drop constraint "training_applicants_stage_id_firstName_lastName_phone_birth_key";
create unique index training_applicants_active_identity_idx on public.training_applicants(stage_id,"firstName","lastName",phone,birth) where deleted_at is null;
revoke delete on public.training_applicants from anon,authenticated;
