-- ============================================================
-- Vetas: tablas, reglas de acceso y función para publicar
-- Pegar entero en Supabase > SQL Editor > New query > Run
-- ============================================================

-- Historias
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  color text not null check (color in ('#4f2026', '#23382f', '#24324a', '#3d2640')),
  song text not null check (char_length(song) between 1 and 120),
  thought text not null check (char_length(thought) between 1 and 300),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Salidas de cada historia
create table if not exists public.stops (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  position smallint not null check (position between 0 and 11),
  place text not null check (char_length(place) between 1 and 80),
  body text not null check (char_length(body) between 1 and 1500),
  lat double precision not null check (lat between -35.1 and -34.2),
  lng double precision not null check (lng between -59.2 and -57.85),
  unique (story_id, position)
);

create index if not exists stories_recent_idx on public.stories (created_at desc) where not hidden;
create index if not exists stops_story_idx on public.stops (story_id);

-- Reglas de acceso: el público solo puede leer historias visibles.
-- Nadie puede escribir directo en las tablas.
alter table public.stories enable row level security;
alter table public.stops enable row level security;

drop policy if exists "Leer historias visibles" on public.stories;
create policy "Leer historias visibles"
  on public.stories for select
  to anon, authenticated
  using (not hidden);

drop policy if exists "Leer salidas de historias visibles" on public.stops;
create policy "Leer salidas de historias visibles"
  on public.stops for select
  to anon, authenticated
  using (exists (select 1 from public.stories s where s.id = story_id and not s.hidden));

-- Publicar: valida todo y guarda la historia con sus salidas de una sola vez.
create or replace function public.publish_story(
  p_title text,
  p_color text,
  p_song text,
  p_thought text,
  p_stops jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  stop jsonb;
  stop_count int;
  i int := 0;
begin
  if jsonb_typeof(p_stops) <> 'array' then
    raise exception 'Las salidas tienen que ser una lista.';
  end if;

  stop_count := jsonb_array_length(p_stops);
  if stop_count < 1 or stop_count > 12 then
    raise exception 'Una historia tiene entre 1 y 12 salidas.';
  end if;

  insert into public.stories (title, color, song, thought)
  values (btrim(p_title), p_color, btrim(p_song), btrim(p_thought))
  returning id into new_id;

  for stop in select * from jsonb_array_elements(p_stops) loop
    insert into public.stops (story_id, position, place, body, lat, lng)
    values (
      new_id,
      i,
      btrim(stop ->> 'place'),
      btrim(stop ->> 'text'),
      (stop ->> 'lat')::double precision,
      (stop ->> 'lng')::double precision
    );
    i := i + 1;
  end loop;

  return new_id;
end;
$$;

revoke all on function public.publish_story(text, text, text, text, jsonb) from public;
grant execute on function public.publish_story(text, text, text, text, jsonb) to anon, authenticated;
