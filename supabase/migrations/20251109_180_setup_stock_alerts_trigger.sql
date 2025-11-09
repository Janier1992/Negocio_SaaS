-- Configura función y trigger para generar alertas de stock bajo/critico automáticamente
-- Requisitos: tabla public.productos con columnas empresa_id, id, nombre, codigo, stock, stock_minimo
-- Tabla public.alertas con columnas empresa_id, tipo, titulo, mensaje, producto_id, leida, created_at

begin;

-- Función que upsertea alertas de stock según umbrales
create or replace function public.fn_upsert_stock_alert()
returns trigger as $$
declare
  v_empresa uuid;
  v_producto uuid;
  v_nombre text;
  v_codigo text;
  v_stock int;
  v_min int;
  v_tipo public.tipo_alerta;
  v_titulo text;
  v_mensaje text;
begin
  v_empresa := coalesce(new.empresa_id, old.empresa_id);
  v_producto := coalesce(new.id, old.id);
  v_nombre := coalesce(new.nombre, old.nombre);
  v_codigo := coalesce(new.codigo, old.codigo);
  v_stock := coalesce(new.stock, old.stock, 0);
  v_min := coalesce(new.stock_minimo, old.stock_minimo, 0);

  -- Si no hay empresa o no hay mínimos configurados, no generar alerta
  if v_empresa is null or v_min is null or v_min <= 0 then
    -- Si había alertas activas y ahora dejó de aplicar umbral, marcarlas como leídas
    update public.alertas set leida = true
    where empresa_id = v_empresa and producto_id = v_producto and leida = false and tipo in ('stock_bajo','stock_critico');
    return null;
  end if;

  -- Determinar tipo según umbral (crítico = <= 50% del mínimo)
  if v_stock <= greatest(0, floor(v_min / 2.0)) then
    v_tipo := 'stock_critico';
  elsif v_stock <= v_min then
    v_tipo := 'stock_bajo';
  else
    -- Estado normal: marcar alertas previas como leídas si existían
    update public.alertas set leida = true
    where empresa_id = v_empresa and producto_id = v_producto and leida = false and tipo in ('stock_bajo','stock_critico');
    return null;
  end if;

  v_titulo := case when v_tipo = 'stock_critico' then 'Stock Crítico'
                   else 'Stock Bajo' end;
  v_mensaje := format('Producto: %s (%s) | Stock actual: %s | Mínimo: %s', coalesce(v_nombre,'Sin nombre'), coalesce(v_codigo,'-'), v_stock, v_min);

  -- Si existe alerta activa del mismo tipo para el producto, actualizar mensaje/fecha
  if exists (
    select 1 from public.alertas a
    where a.empresa_id = v_empresa and a.producto_id = v_producto and a.tipo = v_tipo and coalesce(a.leida,false) = false
  ) then
    update public.alertas
    set titulo = v_titulo,
        mensaje = v_mensaje,
        created_at = now()
    where empresa_id = v_empresa and producto_id = v_producto and tipo = v_tipo and coalesce(leida,false) = false;
  else
    insert into public.alertas (empresa_id, tipo, titulo, mensaje, producto_id, leida, created_at)
    values (v_empresa, v_tipo, v_titulo, v_mensaje, v_producto, false, now());
  end if;

  -- Además, si existe alerta de otro tipo activa para el mismo producto, marcarla como leída
  update public.alertas
  set leida = true
  where empresa_id = v_empresa and producto_id = v_producto and coalesce(leida,false) = false and tipo <> v_tipo and tipo in ('stock_bajo','stock_critico');

  return null;
end;
$$ language plpgsql security definer;

-- Trigger en INSERT/UPDATE de productos para evaluar alertas
drop trigger if exists trg_upsert_stock_alert on public.productos;
create trigger trg_upsert_stock_alert
after insert or update of stock, stock_minimo on public.productos
for each row execute function public.fn_upsert_stock_alert();

commit;