begin;

-- Remove objects that still reference user_id before changing the table.
drop view if exists public.event_stats;
drop policy if exists "ratings crear" on public.event_ratings;
drop policy if exists "ratings editar" on public.event_ratings;
drop policy if exists "ratings borrar" on public.event_ratings;
drop policy if exists "calificaciones publicas visibles" on public.event_ratings;
drop policy if exists "cada usuario califica" on public.event_ratings;
drop policy if exists "cada usuario actualiza" on public.event_ratings;
drop policy if exists "cada dispositivo califica" on public.event_ratings;

alter table public.event_ratings add column if not exists device_id text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'event_ratings'
      and column_name = 'user_id'
  ) then
    update public.event_ratings
      set device_id = 'legacy_rating_' || event_id::text || '_' || user_id::text
      where device_id is null;

    alter table public.event_ratings drop constraint if exists event_ratings_pkey;
    alter table public.event_ratings drop column user_id;
  end if;
end $$;

alter table public.event_ratings alter column device_id set not null;
alter table public.event_ratings drop constraint if exists event_ratings_pkey;
alter table public.event_ratings
  add constraint event_ratings_pkey primary key (event_id, device_id);

alter table public.event_ratings enable row level security;
create policy "calificaciones publicas visibles"
  on public.event_ratings for select using (true);
create policy "cada dispositivo califica"
  on public.event_ratings for insert to anon, authenticated
  with check (char_length(device_id) between 20 and 100);

grant select, insert on public.event_ratings to anon, authenticated;

create or replace view public.event_stats as
select
  e.id as event_id,
  coalesce(avg(r.stars), 0)::numeric as avg_rating,
  count(distinct r.device_id)::integer as ratings,
  count(distinct g.device_id)::integer as going
from public.published_events e
left join public.event_ratings r on r.event_id::text = e.id::text
left join public.event_going g on g.event_id::text = e.id::text
group by e.id;

grant select on public.event_going, public.event_stats to anon, authenticated;

commit;
