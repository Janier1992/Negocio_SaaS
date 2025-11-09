-- Expand app_role enum to include extended roles used in UI
begin;

do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'administrativo'
  ) then
    alter type public.app_role add value 'administrativo';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'ventas'
  ) then
    alter type public.app_role add value 'ventas';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'inventario'
  ) then
    alter type public.app_role add value 'inventario';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'finanzas'
  ) then
    alter type public.app_role add value 'finanzas';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'auxiliar'
  ) then
    alter type public.app_role add value 'auxiliar';
  end if;
end $$;

commit;