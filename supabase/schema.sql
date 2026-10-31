-- Script idempotente: sirve para instalación nueva y para actualizar la versión anterior.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  role text not null default 'user' check (role in ('user', 'moderator')),
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'moderator'));
create unique index if not exists profiles_username_lower on public.profiles (lower(username));
alter table public.profiles enable row level security;
drop policy if exists "perfiles publicos" on public.profiles;
create policy "perfiles publicos" on public.profiles for select using (true);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, username) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user_' || substr(replace(new.id::text,'-',''),1,8))); return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.username_available(name text) returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name)) $$;
grant execute on function public.username_available(text) to anon, authenticated;

create table if not exists public.published_events (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid(),
  title text not null check (char_length(title) between 3 and 120),
  category text not null, event_date date not null, event_time time,
  location text not null, price integer not null default 0,
  description text, instagram text, whatsapp text, tickets_url text,
  created_at timestamptz not null default now(),
  constraint published_events_price_check check (price >= 0),
  constraint published_events_description_check check (description is null or char_length(description) <= 4000),
  constraint published_events_category_check check (category in ('Música', 'Gastronomía', 'Cultura', 'Aventura', 'Fiestas', 'Familiar'))
);
alter table public.published_events add column if not exists image_url text;
alter table public.published_events add column if not exists status text not null default 'pending';
alter table public.published_events alter column status set default 'pending';
alter table public.published_events add column if not exists reviewed_at timestamptz;
alter table public.published_events add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.published_events drop constraint if exists published_events_price_check;
alter table public.published_events add constraint published_events_price_check check (price >= 0);
alter table public.published_events drop constraint if exists published_events_description_check;
alter table public.published_events add constraint published_events_description_check check (description is null or char_length(description) <= 4000);
alter table public.published_events drop constraint if exists published_events_category_check;
alter table public.published_events add constraint published_events_category_check check (category in ('Música', 'Gastronomía', 'Cultura', 'Aventura', 'Fiestas', 'Familiar'));
alter table public.published_events drop constraint if exists published_events_status_check;
alter table public.published_events add constraint published_events_status_check check (status in ('pending', 'approved', 'rejected'));
-- usuarios de la versión anterior: se les asigna un usuario provisorio
insert into public.profiles (id, username) select id, 'user_' || substr(replace(id::text,'-',''),1,8) from auth.users on conflict do nothing;
alter table public.published_events drop constraint if exists published_events_owner_fkey;
alter table public.published_events add constraint published_events_owner_fkey foreign key (owner) references public.profiles(id) on delete cascade;
create or replace function public.is_moderator() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'moderator') $$;
grant execute on function public.is_moderator() to authenticated;
alter table public.published_events enable row level security;
drop policy if exists "todos pueden leer" on public.published_events;
drop policy if exists "usuarios logueados publican" on public.published_events;
drop policy if exists "cada uno borra lo suyo" on public.published_events;
drop policy if exists "moderadores revisan" on public.published_events;
drop policy if exists "moderadores eliminan" on public.published_events;
create policy "eventos publicados visibles" on public.published_events for select using (status = 'approved' or owner = auth.uid() or public.is_moderator());
create policy "usuarios logueados publican" on public.published_events for insert to authenticated
  with check (owner = auth.uid() and status = 'pending' and reviewed_at is null and reviewed_by is null);
create policy "cada uno borra lo suyo" on public.published_events for delete to authenticated using (owner = auth.uid());
create policy "moderadores revisan" on public.published_events for update to authenticated using (public.is_moderator()) with check (public.is_moderator());
create policy "moderadores eliminan" on public.published_events for delete to authenticated using (public.is_moderator());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images','event-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
drop policy if exists "imagenes publicas" on storage.objects;
drop policy if exists "subir imagenes propias" on storage.objects;
drop policy if exists "borrar imagenes propias" on storage.objects;
create policy "imagenes publicas" on storage.objects for select using (bucket_id = 'event-images');
create policy "subir imagenes propias" on storage.objects for insert to authenticated with check (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "borrar imagenes propias" on storage.objects for delete to authenticated using (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Las calificaciones son publicas, pero un dispositivo solo puede calificar una vez por evento.
create table if not exists public.event_ratings (
  event_id uuid not null references public.published_events(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 20 and 100),
  user_id uuid references auth.users(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (event_id, device_id)
);
alter table public.event_ratings add column if not exists device_id text;
alter table public.event_ratings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.event_ratings alter column device_id set not null;
alter table public.event_ratings drop constraint if exists event_ratings_pkey;
alter table public.event_ratings add constraint event_ratings_pkey primary key (event_id, device_id);
alter table public.event_ratings enable row level security;
drop policy if exists "calificaciones publicas visibles" on public.event_ratings;
drop policy if exists "cada dispositivo califica" on public.event_ratings;
drop policy if exists "cada usuario califica" on public.event_ratings;
create policy "calificaciones publicas visibles" on public.event_ratings for select using (true);
create policy "cada usuario califica" on public.event_ratings for insert to authenticated with check (user_id = auth.uid() and char_length(device_id) between 20 and 100);
create unique index if not exists event_ratings_event_user_unique on public.event_ratings(event_id, user_id) where user_id is not null;
revoke all on public.event_ratings from public, anon, authenticated;
grant select (event_id, device_id, stars) on public.event_ratings to anon, authenticated;
grant insert (event_id, device_id, user_id, stars) on public.event_ratings to authenticated;

create table if not exists public.event_going (
  event_id uuid not null references public.published_events(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 20 and 100),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, device_id)
);
drop policy if exists "asistencia publica visible" on public.event_going;
drop policy if exists "asistencia publica agrega" on public.event_going;
drop policy if exists "asistencia propia elimina" on public.event_going;
drop policy if exists "going crear" on public.event_going;
drop policy if exists "going borrar" on public.event_going;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'event_going' and column_name = 'user_id') then
    alter table public.event_going drop constraint if exists event_going_pkey;
    alter table public.event_going drop column user_id;
  end if;
end $$;
alter table public.event_going add column if not exists device_id text;
alter table public.event_going add column if not exists user_id uuid references auth.users(id) on delete cascade;
update public.event_going set device_id = 'legacy_' || event_id::text where device_id is null;
alter table public.event_going alter column device_id set not null;
create unique index if not exists event_going_event_device_unique on public.event_going(event_id, device_id);
alter table public.event_going enable row level security;
drop policy if exists "asistencia publica visible" on public.event_going;
drop policy if exists "asistencia publica agrega" on public.event_going;
drop policy if exists "asistencia propia elimina" on public.event_going;
drop policy if exists "asistencia autenticada agrega" on public.event_going;
drop policy if exists "asistencia autenticada elimina" on public.event_going;
create policy "asistencia publica visible" on public.event_going for select using (true);
create policy "asistencia autenticada agrega" on public.event_going for insert to authenticated with check (user_id = auth.uid() and char_length(device_id) between 20 and 100);
create policy "asistencia autenticada elimina" on public.event_going for delete to authenticated using (user_id = auth.uid());

create or replace view public.event_stats with (security_invoker = true) as
select e.id as event_id,
  coalesce(avg(r.stars), 0)::numeric as avg_rating,
  count(distinct r.device_id)::integer as ratings,
  count(distinct g.device_id)::integer as going
from public.published_events e
left join public.event_ratings r on r.event_id = e.id
left join public.event_going g on g.event_id = e.id
group by e.id;
grant select on public.event_going, public.event_stats to anon, authenticated;
revoke all on public.event_going from public, anon, authenticated;
grant select (event_id, device_id) on public.event_going to anon, authenticated;
grant insert (event_id, device_id, user_id) on public.event_going to authenticated;
grant delete on public.event_going to authenticated;
