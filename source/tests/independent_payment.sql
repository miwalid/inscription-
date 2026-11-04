begin;
create temporary table qa_context on commit drop as select (select user_id from public.training_admins order by created_at limit 1) as actor,gen_random_uuid() as other,gen_random_uuid() as stage_a,gen_random_uuid() as stage_b,gen_random_uuid() as app_a,gen_random_uuid() as app_b,gen_random_uuid() as obj_a,gen_random_uuid() as obj_b;
grant select on qa_context to authenticated;
insert into auth.users(id,email,role,aud) select other,'qa-'||other::text||'@example.invalid','authenticated','authenticated' from qa_context;
insert into public.training_admins(user_id) select other from qa_context;
insert into public.training_stages(id,title,place,start,"end",fee,owner_id) select stage_a,'اختبار أ','اختبار',date '2026-12-05',date '2026-12-06',30,actor from qa_context union all select stage_b,'اختبار ب','اختبار',date '2026-12-05',date '2026-12-06',30,other from qa_context;
insert into public.training_applicants(id,stage_id,"firstName","lastName",phone,birth,fee,decision,paid) select app_a,stage_a,'تجربة','أ','20000000',date '2000-01-01',30,'accepted',true from qa_context union all select app_b,stage_b,'تجربة','ب','20000001',date '2000-01-01',30,'accepted',true from qa_context;
insert into storage.objects(id,bucket_id,name) select obj_a,'training-documents',app_a::text||'/qa-document' from qa_context union all select obj_b,'training-documents',app_b::text||'/qa-document' from qa_context;
set local role authenticated;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',actor,'role','authenticated')::text from qa_context),true);
do $$ declare q record; n integer; blocked boolean; own_id uuid; d text; p boolean; begin
 select * into q from qa_context;
 foreach d in array array['pending','accepted','rejected'] loop
  foreach p in array array[false,true] loop
   update public.training_applicants set decision=d,paid=p where id=q.app_a;
   if not exists(select 1 from public.training_applicants where id=q.app_a and decision=d and paid=p) then raise exception 'Independent payment roundtrip failed';end if;
  end loop;
 end loop;
 update public.training_applicants set decision='pending' where id=q.app_a;
 if not (select paid from public.training_applicants where id=q.app_a) then raise exception 'Decision erased existing payment';end if;
 update public.training_applicants set decision='accepted',paid=true where id=q.app_a;

 if (select count(*) from public.training_stages where id=q.stage_a)<>1 or (select count(*) from public.training_stages where id=q.stage_b)<>0 then raise exception 'Stage isolation failed';end if;
 if (select count(*) from public.training_applicants where id=q.app_a)<>1 or (select count(*) from public.training_applicants where id=q.app_b)<>0 then raise exception 'Applicant isolation failed';end if;
 if (select count(*) from storage.objects where id=q.obj_a)<>1 or (select count(*) from storage.objects where id=q.obj_b)<>0 then raise exception 'Document isolation failed';end if;
 update public.training_applicants set deleted_at=now() where id=q.app_b;get diagnostics n=row_count;if n<>0 then raise exception 'Foreign deletion allowed';end if;
 update public.training_stages set title='forbidden' where id=q.stage_b;get diagnostics n=row_count;if n<>0 then raise exception 'Foreign stage update allowed';end if;
 blocked=false;begin update public.training_stages set owner_id=q.other where id=q.stage_a;exception when insufficient_privilege then blocked=true;end;if not blocked then raise exception 'Owner reassignment allowed';end if;
 blocked=false;begin insert into public.training_stages(title,place,start,"end",owner_id) values('forbidden','test',date '2026-12-05',date '2026-12-06',q.other);exception when insufficient_privilege then blocked=true;end;if not blocked then raise exception 'Forged ownership allowed';end if;
 insert into public.training_stages(title,place,start,"end") values('own creation','test',date '2026-12-05',date '2026-12-06') returning owner_id into own_id;if own_id<>q.actor then raise exception 'Owner default failed';end if;
 update public.training_applicants set deleted_at=now() where id=q.app_a;
 if not (select deleted_at is not null from public.training_applicants where id=q.app_a) then raise exception 'Soft delete failed';end if;
 update public.training_applicants set deleted_at=null where id=q.app_a;
 if not (select deleted_at is null and paid and fee=30 from public.training_applicants where id=q.app_a) then raise exception 'Restore failed';end if;
end $$;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',other,'role','authenticated')::text from qa_context),true);
do $$ declare q record;n integer;begin
 select * into q from qa_context;
 if (select count(*) from public.training_stages where id=q.stage_b)<>1 or (select count(*) from public.training_stages where id=q.stage_a)<>0 then raise exception 'Reverse stage isolation failed';end if;
 if (select count(*) from public.training_applicants where id=q.app_b)<>1 or (select count(*) from public.training_applicants where id=q.app_a)<>0 then raise exception 'Reverse applicant isolation failed';end if;
 if (select count(*) from storage.objects where id=q.obj_b)<>1 or (select count(*) from storage.objects where id=q.obj_a)<>0 then raise exception 'Reverse document isolation failed';end if;
 update public.training_applicants set deleted_at=now() where id=q.app_a;get diagnostics n=row_count;if n<>0 then raise exception 'Reverse deletion isolation failed';end if;
 update public.training_applicants set deleted_at=now() where id=q.app_b;get diagnostics n=row_count;if n<>1 then raise exception 'Other owner cannot delete own';end if;
end $$;
reset role;
do $$ declare q record;blocked boolean:=false;begin
 select * into q from qa_context;
 update public.training_applicants set deleted_at=now() where id=q.app_a;
 insert into public.training_applicants(stage_id,"firstName","lastName",phone,birth,fee) values(q.stage_a,'تجربة','أ','20000000',date '2000-01-01',30);
 begin update public.training_applicants set deleted_at=null where id=q.app_a;exception when unique_violation then blocked=true;end;
 if not blocked then raise exception 'Duplicate restore allowed';end if;
end $$;
rollback;
select 'PASS: all six decision/payment combinations, payment preserved on decision change, organizer isolation, soft deletion and restoration' as test_result;
