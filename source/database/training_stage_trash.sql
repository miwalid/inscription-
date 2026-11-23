-- Keep the stage and its related records available for restoration.
alter table public.training_stages add column deleted_at timestamptz;

-- An upload may finish after the public registration form has checked the stage.
-- Serialize the final insert with the stage update that moves it to the trash.
create function public.reject_deleted_training_stage_registration()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  perform 1 from public.training_stages
    where id=new.stage_id and deleted_at is null
    for share;
  if not found then
    raise exception 'التربص غير موجود أو تم حذفه.';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_deleted_training_stage_registration() from public,anon,authenticated;
create trigger reject_deleted_training_stage_registration
before insert on public.training_applicants
for each row execute function public.reject_deleted_training_stage_registration();
