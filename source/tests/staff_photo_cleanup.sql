begin;
create temporary table qa_photo_ctx on commit drop as select (select user_id from public.training_admins order by created_at limit 1) actor,gen_random_uuid() other,gen_random_uuid() stage_a,gen_random_uuid() stage_b,gen_random_uuid() staff_a,gen_random_uuid() staff_b;
grant select on qa_photo_ctx to authenticated;
insert into auth.users(id,email,role,aud) select other,'qa-photo-'||other::text||'@example.invalid','authenticated','authenticated' from qa_photo_ctx;
insert into public.training_admins(user_id) select other from qa_photo_ctx;
insert into public.training_stages(id,title,place,start,"end",owner_id) select stage_a,'QA photo A','test',date '2026-12-05',date '2026-12-06',actor from qa_photo_ctx union all select stage_b,'QA photo B','test',date '2026-12-05',date '2026-12-06',other from qa_photo_ctx;
insert into public.training_staff(id,stage_id,first_name,last_name,workshop,photo_key,photo_type) select staff_a,stage_a,'test','A','workshop',staff_a::text||'/saved','image/png' from qa_photo_ctx union all select staff_b,stage_b,'test','B','workshop',null,null from qa_photo_ctx;
-- Synthetic metadata only. Evaluate the stored DELETE predicate without issuing DELETE,
-- which Supabase correctly restricts to its Storage API. ROLLBACK below.
insert into storage.objects(bucket_id,name) select 'training-staff-photos',staff_a::text||'/temporary' from qa_photo_ctx union all select 'training-staff-photos',staff_a::text||'/saved' from qa_photo_ctx union all select 'training-staff-photos',staff_b::text||'/temporary' from qa_photo_ctx;
set local role authenticated;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',actor,'role','authenticated')::text from qa_photo_ctx),true);
do $$ declare q record;predicate text;allowed boolean;begin
 select * into q from qa_photo_ctx;
 select pg_get_expr(polqual,polrelid) into predicate from pg_policy where polname='training_staff_photos_cleanup' and polrelid='storage.objects'::regclass;
 if predicate is null then raise exception 'Cleanup policy missing';end if;
 execute 'select ('||predicate||') from storage.objects where bucket_id=''training-staff-photos'' and name=$1' into allowed using q.staff_a::text||'/temporary';
 if allowed is distinct from true then raise exception 'Own temporary file cleanup denied';end if;
 execute 'select ('||predicate||') from storage.objects where bucket_id=''training-staff-photos'' and name=$1' into allowed using q.staff_a::text||'/saved';
 if allowed is distinct from false then raise exception 'Referenced portrait was deletable';end if;
end $$;
reset role;
do $$ declare q record;predicate text;allowed boolean;begin
 select * into q from qa_photo_ctx;
 select pg_get_expr(polqual,polrelid) into predicate from pg_policy where polname='training_staff_photos_cleanup' and polrelid='storage.objects'::regclass;
 execute 'select ('||predicate||') from storage.objects where bucket_id=''training-staff-photos'' and name=$1' into allowed using q.staff_b::text||'/temporary';
 if allowed is distinct from false then raise exception 'Foreign file cleanup allowed';end if;
end $$;
rollback;
select 'PASS: only own unattached photo deletable; saved and foreign photos protected; no persistent changes' as test_result;
