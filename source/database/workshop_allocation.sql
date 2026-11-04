-- Per-stage workshops and assignments. Existing owner-scoped RLS remains in force.
alter table public.training_stages add column workshops jsonb not null default '[]'::jsonb check(jsonb_typeof(workshops)='array' and jsonb_array_length(workshops)<=20);
alter table public.training_applicants add column workshop_index integer check(workshop_index between 1 and 20);
create function public.assign_training_workshops(p_stage_id uuid,p_workshops jsonb,p_assignments jsonb,p_scope text)
returns void language plpgsql security invoker set search_path='' as $$
declare k integer; n integer; expected integer; changed integer;
begin
 if auth.uid() is null then raise exception 'يلزم تسجيل دخول المنظم.';end if;
 perform 1 from public.training_stages where id=p_stage_id and owner_id=auth.uid() for update;
 if not found then raise exception 'التربص غير متاح لهذا الحساب.';end if;
 if p_scope is null or p_scope not in ('accepted','confirmed','all') then raise exception 'اختيار المشاركين غير صالح.';end if;
 if p_workshops is null or jsonb_typeof(p_workshops)<>'array' then raise exception 'قائمة الورشات غير صالحة.';end if;
 k=jsonb_array_length(p_workshops);
 if k<1 or k>20 or exists(select 1 from jsonb_array_elements(p_workshops) w where jsonb_typeof(w)<>'object' or coalesce(length(trim(w->>'name')),0) not between 1 and 60 or coalesce(w->>'color','')!~*'^#[0-9a-f]{6}$') then raise exception 'أكمل أسماء الورشات وألوانها.';end if;
 if (select count(distinct trim(w->>'name')) from jsonb_array_elements(p_workshops) w)<>k or (select count(distinct lower(w->>'color')) from jsonb_array_elements(p_workshops) w)<>k then raise exception 'أسماء الورشات وألوانها يجب أن تكون مختلفة.';end if;
 if p_assignments is null or jsonb_typeof(p_assignments)<>'array' then raise exception 'التوزيع غير صالح.';end if;
 n=jsonb_array_length(p_assignments);
 if n<1 or n>10000 then raise exception 'عدد المشاركين غير صالح.';end if;
 -- Stage lock also serializes registration inserts through their FK lock.
 perform 1 from public.training_applicants where stage_id=p_stage_id for update;
 select count(*) into expected from public.training_applicants a where a.stage_id=p_stage_id and a.deleted_at is null and (p_scope='all' or a.decision='accepted' and (p_scope<>'confirmed' or a.paid));
 if n<>expected or (select count(distinct x.id) from jsonb_to_recordset(p_assignments) as x(id uuid,gender text,workshop_index integer))<>n then raise exception 'تغيرت قائمة المشاركين. حدّث الصفحة وأعد المعاينة.';end if;
 if exists(select 1 from jsonb_to_recordset(p_assignments) as x(id uuid,gender text,workshop_index integer) left join public.training_applicants a on a.id=x.id and a.stage_id=p_stage_id and a.deleted_at is null and (p_scope='all' or a.decision='accepted' and (p_scope<>'confirmed' or a.paid)) where a.id is null or x.gender is null or x.gender not in ('male','female') or a.gender is distinct from x.gender or x.workshop_index is null or x.workshop_index not between 1 and k) then raise exception 'تغيرت بيانات المشاركين أو التوزيع غير صالح. أعد المعاينة.';end if;
 -- Verify balance on the server, including workshops with zero participants.
 if exists(with counts as(select i,count(x.id) as total,count(x.id) filter(where x.gender='male') as males,count(x.id) filter(where x.gender='female') as females from generate_series(1,k) i left join jsonb_to_recordset(p_assignments) as x(id uuid,gender text,workshop_index integer) on x.workshop_index=i group by i) select 1 from counts having max(total)-min(total)>1 or max(males)-min(males)>1 or max(females)-min(females)>1) then raise exception 'التوزيع غير متوازن في العدد أو الجنس.';end if;
 update public.training_stages set workshops=p_workshops where id=p_stage_id;
 update public.training_applicants set workshop_index=null where stage_id=p_stage_id and workshop_index is not null;
 update public.training_applicants a set workshop_index=x.workshop_index from jsonb_to_recordset(p_assignments) as x(id uuid,gender text,workshop_index integer) where a.id=x.id and a.stage_id=p_stage_id;
 get diagnostics changed=row_count;if changed<>n then raise exception 'تعذر حفظ التوزيع كاملاً.';end if;
end $$;
revoke all on function public.assign_training_workshops(uuid,jsonb,jsonb,text) from public,anon;
grant execute on function public.assign_training_workshops(uuid,jsonb,jsonb,text) to authenticated;
