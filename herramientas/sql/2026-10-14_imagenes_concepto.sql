-- Imágenes por concepto en los presupuestos (Historial v3.30+)
-- Ejecutar UNA vez en el editor SQL de Supabase. Es seguro repetirlo.
alter table barrcan.presupuestos_atrasados add column if not exists imagenes_concepto jsonb;

create table if not exists barrcan.biblioteca_imagenes (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,          -- clave normalizada del concepto o diseño
  concepto_nombre text,
  titulo text,
  categoria text,
  url text not null,
  ruta text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists biblioteca_imagenes_concepto_idx on barrcan.biblioteca_imagenes (concepto) where activo;
alter table barrcan.biblioteca_imagenes enable row level security;
drop policy if exists anon_all_biblioteca_imagenes on barrcan.biblioteca_imagenes;
create policy anon_all_biblioteca_imagenes on barrcan.biblioteca_imagenes for all to anon using (true) with check (true);
grant all on barrcan.biblioteca_imagenes to anon, authenticated, service_role;

-- ══ PARTE 2: poder VER la lista de renders desde Historial ══
-- Sin esta política, la lista del almacenamiento sale vacía aunque las imágenes existan.
drop policy if exists "renders lectura publica" on storage.objects;
create policy "renders lectura publica" on storage.objects for select to anon using (bucket_id = 'renders');
