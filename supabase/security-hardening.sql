-- Endurecimiento para produccion. Ejecutar despues de schema.sql.
-- Requiere que las acciones de asistencia remota pertenezcan al usuario
-- autenticado; el device_id solo evita duplicados y no autoriza borrados.

begin;

-- Retira la funcionalidad de métricas y su información almacenada.
drop table if exists public.event_clicks cascade;

alter table public.event_going add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.event_ratings add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists event_ratings_event_user_unique on public.event_ratings(event_id, user_id) where user_id is not null;
drop policy if exists "asistencia publica agrega" on public.event_going;
drop policy if exists "asistencia propia elimina" on public.event_going;
drop policy if exists "asistencia autenticada agrega" on public.event_going;
drop policy if exists "asistencia autenticada elimina" on public.event_going;
create policy "asistencia autenticada agrega"
  on public.event_going for insert to authenticated
  with check (user_id = auth.uid() and char_length(device_id) between 20 and 100);
create policy "asistencia autenticada elimina"
  on public.event_going for delete to authenticated
  using (user_id = auth.uid());

-- Evita que el cliente pueda modificar o eliminar calificaciones existentes.
drop policy if exists "cada dispositivo califica" on public.event_ratings;
drop policy if exists "cada dispositivo califica una vez" on public.event_ratings;
drop policy if exists "cada usuario califica" on public.event_ratings;
create policy "cada usuario califica"
  on public.event_ratings for insert to authenticated
  with check (user_id = auth.uid() and char_length(device_id) between 20 and 100);

-- Limpia cualquier política heredada y vuelve a aplicar el conjunto mínimo.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename in ('profiles', 'published_events', 'event_ratings', 'event_going')
  loop
    execute format('drop policy %I on public.%I', existing_policy.policyname, existing_policy.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.published_events enable row level security;
alter table public.event_ratings enable row level security;
alter table public.event_going enable row level security;

create policy "perfiles publicos" on public.profiles for select using (true);
create policy "eventos publicados visibles" on public.published_events for select
  using (status = 'approved' or owner = auth.uid() or public.is_moderator());
create policy "usuarios logueados publican" on public.published_events for insert to authenticated
  with check (owner = auth.uid() and status = 'pending' and reviewed_at is null and reviewed_by is null);
create policy "cada uno borra lo suyo" on public.published_events for delete to authenticated
  using (owner = auth.uid());
create policy "moderadores revisan" on public.published_events for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());
create policy "moderadores eliminan" on public.published_events for delete to authenticated
  using (public.is_moderator());
create policy "calificaciones publicas visibles" on public.event_ratings for select using (true);
create policy "cada usuario califica" on public.event_ratings for insert to authenticated
  with check (user_id = auth.uid() and char_length(device_id) between 20 and 100);
create policy "asistencia publica visible" on public.event_going for select using (true);
create policy "asistencia autenticada agrega" on public.event_going for insert to authenticated
  with check (user_id = auth.uid() and char_length(device_id) between 20 and 100);
create policy "asistencia autenticada elimina" on public.event_going for delete to authenticated
  using (user_id = auth.uid());

create or replace view public.event_stats with (security_invoker = true) as
select e.id as event_id,
  coalesce(avg(r.stars), 0)::numeric as avg_rating,
  count(distinct r.device_id)::integer as ratings,
  count(distinct g.device_id)::integer as going
from public.published_events e
left join public.event_ratings r on r.event_id = e.id
left join public.event_going g on g.event_id = e.id
group by e.id;
revoke all on public.event_ratings, public.event_going from public, anon, authenticated;
grant select (event_id, device_id, stars) on public.event_ratings to anon, authenticated;
grant insert (event_id, device_id, user_id, stars) on public.event_ratings to authenticated;
grant select (event_id, device_id) on public.event_going to anon, authenticated;
grant insert (event_id, device_id, user_id) on public.event_going to authenticated;
grant delete on public.event_going to authenticated;
grant select on public.event_stats to anon, authenticated;

commit;
