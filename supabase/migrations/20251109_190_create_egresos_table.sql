begin;

-- Crear tabla de egresos operacionales
do $$ begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='egresos'
  ) then
    create table public.egresos (
      id uuid primary key default gen_random_uuid(),
      empresa_id uuid not null references public.empresas(id) on delete cascade,
      monto numeric(14,2) not null,
      fecha timestamptz not null default now(),
      categoria text not null,
      descripcion text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

-- Índices
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='egresos_empresa_id_idx'
  ) then
    create index egresos_empresa_id_idx on public.egresos(empresa_id);
  end if;
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='egresos_fecha_idx'
  ) then
    create index egresos_fecha_idx on public.egresos(fecha);
  end if;
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='egresos_categoria_idx'
  ) then
    create index egresos_categoria_idx on public.egresos(categoria);
  end if;
end $$;

-- Trigger de updated_at si existe la función
do $$ begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists set_updated_at_on_egresos on public.egresos;
    create trigger set_updated_at_on_egresos
      before update on public.egresos
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- RLS: políticas alineadas a otras tablas
alter table public.egresos enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='egresos' and policyname='egresos_by_empresa'
  ) then
    create policy egresos_by_empresa on public.egresos for all to authenticated using (
      empresa_id = (select empresa_id from public.profiles where id = auth.uid())
    ) with check (
      empresa_id = (select empresa_id from public.profiles where id = auth.uid())
    );
  end if;
end $$;

-- Política service_role amplia
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='egresos' and policyname='egresos_all_service'
  ) then
    create policy egresos_all_service on public.egresos as permissive for all to service_role using (true) with check (true);
  end if;
end $$;

-- Forzar recarga del schema cache (PostgREST)
do $$ begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then
  null;
end $$;

commit;