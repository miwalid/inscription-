-- Staff group slots refer only to the groups of the staff member's own stage.
alter table public.training_staff add column group_index integer check(group_index between 1 and 20);
create function public.validate_training_staff_group() returns trigger language plpgsql security invoker set search_path='' as $$
declare group_count integer;
begin
 if new.group_index is not null then
  select jsonb_array_length(workshops) into group_count from public.training_stages where id=new.stage_id for share;
  if group_count is null or new.group_index<1 or new.group_index>group_count then raise exception 'اختر مجموعة موجودة ضمن تربص المسؤول.';end if;
 end if;
 return new;
end $$;
create trigger training_staff_group_valid before insert or update of stage_id,group_index on public.training_staff for each row execute function public.validate_training_staff_group();
create function public.clear_removed_training_staff_groups() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 update public.training_staff set group_index=null where stage_id=new.id and group_index>jsonb_array_length(new.workshops);
 return new;
end $$;
create trigger training_stage_staff_groups after update of workshops on public.training_stages for each row when(old.workshops is distinct from new.workshops) execute function public.clear_removed_training_staff_groups();
revoke all on function public.validate_training_staff_group() from public,anon;
revoke all on function public.clear_removed_training_staff_groups() from public,anon;
