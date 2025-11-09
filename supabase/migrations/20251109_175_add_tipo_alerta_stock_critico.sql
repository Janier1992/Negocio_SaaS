-- Agregar valor faltante al enum tipo_alerta si no existe
-- Evita errores al filtrar/insertar alertas de "stock_critico"

begin;

do $$
declare
  exists_value boolean;
begin
  select exists(
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'tipo_alerta' and e.enumlabel = 'stock_critico'
  ) into exists_value;

  if not exists_value then
    alter type public.tipo_alerta add value 'stock_critico';
  end if;
end $$;

commit;