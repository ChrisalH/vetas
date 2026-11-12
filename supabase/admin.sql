-- ============================================================
-- Vetas: acceso de administración
-- 1. Antes de correrlo, creá tu usuario en Authentication > Users.
-- 2. Reemplazá TU_EMAIL@ejemplo.com (abajo de todo) por ese email.
-- 3. Pegalo entero en SQL Editor > New query > Run.
-- ============================================================

-- Quiénes pueden administrar. Nadie puede leer esta tabla desde la página.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

-- Devuelve true si la persona conectada es admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- El admin ve todas las historias, también las ocultas.
drop policy if exists "Admin lee todas las historias" on public.stories;
create policy "Admin lee todas las historias"
  on public.stories for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admin lee todas las salidas" on public.stops;
create policy "Admin lee todas las salidas"
  on public.stops for select
  to authenticated
  using (public.is_admin());

-- El admin puede ocultar, mostrar y borrar historias.
-- Al borrar una historia se borran también sus salidas.
drop policy if exists "Admin edita historias" on public.stories;
create policy "Admin edita historias"
  on public.stories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin borra historias" on public.stories;
create policy "Admin borra historias"
  on public.stories for delete
  to authenticated
  using (public.is_admin());

-- Tu usuario como admin. Cambiá el email por el tuyo.
insert into public.admins (user_id)
select id from auth.users where email = 'dantesalchris@gmail.com'
on conflict do nothing;
