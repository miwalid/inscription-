begin;
create temporary table qa_stage_trash on commit drop as
select gen_random_uuid() as owner, gen_random_uuid() as other,
       gen_random_uuid() as stage, gen_random_uuid() as applicant, gen_random_uuid() as staff;
grant select on qa_stage_trash to authenticated, service_role;

insert into auth.users(id,email,role,aud)
select owner,owner::text||'@example.invalid','authenticated','authenticated' from qa_stage_trash
union all
select other,other::text||'@example.invalid','authenticated','authenticated' from qa_stage_trash;
insert into public.training_admins(user_id)
select owner from qa_stage_trash union all select other from qa_stage_trash;
insert into public.training_stages(id,owner_id,title,place,start,"end",closed)
select stage,owner,'Stage under test','Tunis','2026-12-01','2026-12-02',false from qa_stage_trash;
insert into public.training_applicants(id,stage_id,"firstName","lastName",phone,birth,fee,paid)
select applicant,stage,'Test','Applicant','20000000','2000-01-01',30,true from qa_stage_trash;
insert into public.training_staff(id,stage_id,first_name,last_name,workshop)
select staff,stage,'Test','Staff','Workshop' from qa_stage_trash;

set local role authenticated;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',other)::text from qa_stage_trash),true);
do $$
begin
  update public.training_stages set deleted_at=now() where id=(select stage from qa_stage_trash);
  if found then raise exception 'Foreign stage deletion allowed'; end if;
end $$;

select set_config('request.jwt.claims',(select jsonb_build_object('sub',owner)::text from qa_stage_trash),true);
do $$
begin
  update public.training_stages set deleted_at=now()
    where id=(select stage from qa_stage_trash) and deleted_at is null;
  if not found then raise exception 'Owner deletion failed'; end if;
end $$;

set local role service_role;
do $$ declare stage_id_to_test uuid := (select stage from qa_stage_trash); begin
  begin
    insert into public.training_applicants(stage_id,"firstName","lastName",phone,birth,fee)
    values(stage_id_to_test,'Late','Applicant','20000001','2000-01-01',30);
    raise exception 'Registration on deleted stage allowed';
  exception when raise_exception then
    if sqlerrm <> 'التربص غير موجود أو تم حذفه.' then raise; end if;
  end;
end $$;

set local role authenticated;
do $$
begin
  update public.training_stages set deleted_at=null
    where id=(select stage from qa_stage_trash) and deleted_at is not null and not closed;
  if not found then raise exception 'Owner restoration or preservation of open status failed'; end if;
  if not exists(select 1 from public.training_applicants where id=(select applicant from qa_stage_trash) and paid)
  then raise exception 'Applicant or payment was lost'; end if;
  if not exists(select 1 from public.training_staff where id=(select staff from qa_stage_trash))
  then raise exception 'Staff member was lost'; end if;
end $$;

set local role service_role;
insert into public.training_applicants(stage_id,"firstName","lastName",phone,birth,fee)
select stage,'Late','Applicant','20000001','2000-01-01',30 from qa_stage_trash;
rollback;
select 'PASS: organizer isolation, deletion, registration blocking, restoration and related records' as test_result;
