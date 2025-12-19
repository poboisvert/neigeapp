create or replace function notify_users_on_change()
returns trigger as $$
begin
  insert into notifications (user_id, cote_rue_id, old_etat, new_etat)
  select
    uf.user_id,
    new.cote_rue_id,
    old.etat_deneig,
    new.etat_deneig
  from user_favorites uf
  where uf.cote_rue_id = new.cote_rue_id;

  return new;
end;
$$ language plpgsql;

create trigger deneigement_change_trigger
after update on deneigement_current
for each row
when (old.etat_deneig is distinct from new.etat_deneig)
execute function notify_users_on_change();
