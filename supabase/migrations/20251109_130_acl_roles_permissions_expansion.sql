-- ACL expansion: new roles and permissions aligned with business matrix
begin;

-- Ensure additional roles exist
insert into public.roles(key, description) values
  ('administrativo','Administrativo'),
  ('ventas','Ventas'),
  ('inventario','Inventario'),
  ('finanzas','Finanzas'),
  ('auxiliar','Auxiliar')
on conflict (key) do nothing;

-- Function to seed ACL permissions for a given empresa
create or replace function public.seed_acl_permissions_for_empresa(_empresa uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _empresa is null then
    return;
  end if;

  -- Base permission catalog for the empresa
  insert into public.permissions(empresa_id, key, description) values
    (_empresa,'dashboard_view','Ver dashboard'),
    (_empresa,'inventario_read','Consultar inventario'),
    (_empresa,'inventario_write','Registrar ingreso/salida y modificar inventario'),
    (_empresa,'ventas_read','Consultar ventas'),
    (_empresa,'ventas_create','Registrar ventas'),
    (_empresa,'ventas_void','Anular ventas'),
    (_empresa,'alertas_view','Visualización de alertas'),
    (_empresa,'alertas_view_critical','Visualización de alertas críticas'),
    (_empresa,'alertas_configure_thresholds','Configurar topes bajos'),
    (_empresa,'proveedores_read','Consultar proveedores'),
    (_empresa,'proveedores_create','Crear proveedores'),
    (_empresa,'proveedores_delete','Eliminar proveedores'),
    (_empresa,'clientes_read','Consultar clientes'),
    (_empresa,'clientes_create','Crear clientes'),
    (_empresa,'clientes_delete','Eliminar clientes'),
    (_empresa,'finanzas_view','Consulta de datos transaccionales de finanzas'),
    (_empresa,'finanzas_reports_generate','Generar informes'),
    (_empresa,'finanzas_reports_download','Acceso y descarga de reportes'),
    (_empresa,'config_view','Consulta de configuración de la empresa'),
    (_empresa,'manage_users','Administrar usuarios y roles')
  on conflict (empresa_id, key) do nothing;

  -- Map permissions to roles (non-admin)
  -- Administrativo
  insert into public.role_permissions(empresa_id, role, permission_key)
  select _empresa, 'administrativo', p.key from public.permissions p
  where p.empresa_id = _empresa and p.key in (
    'dashboard_view',
    'inventario_read','inventario_write',
    'ventas_read','ventas_create',
    'alertas_view',
    'proveedores_read','proveedores_create',
    'clientes_read','clientes_create',
    'finanzas_view','finanzas_reports_generate',
    'config_view'
  )
  on conflict (empresa_id, role, permission_key) do nothing;

  -- Ventas
  insert into public.role_permissions(empresa_id, role, permission_key)
  select _empresa, 'ventas', p.key from public.permissions p
  where p.empresa_id = _empresa and p.key in (
    'dashboard_view',
    'ventas_read','ventas_create',
    'inventario_read','inventario_write',
    'alertas_view','alertas_view_critical',
    'proveedores_read',
    'clientes_read','clientes_create',
    'finanzas_view'
  )
  on conflict (empresa_id, role, permission_key) do nothing;

  -- Inventario
  insert into public.role_permissions(empresa_id, role, permission_key)
  select _empresa, 'inventario', p.key from public.permissions p
  where p.empresa_id = _empresa and p.key in (
    'dashboard_view',
    'inventario_read','inventario_write',
    'alertas_view','alertas_view_critical'
  )
  on conflict (empresa_id, role, permission_key) do nothing;

  -- Finanzas
  insert into public.role_permissions(empresa_id, role, permission_key)
  select _empresa, 'finanzas', p.key from public.permissions p
  where p.empresa_id = _empresa and p.key in (
    'dashboard_view',
    'finanzas_view','finanzas_reports_generate'
  )
  on conflict (empresa_id, role, permission_key) do nothing;

  -- Auxiliar (similar a Ventas con menos capacidades)
  insert into public.role_permissions(empresa_id, role, permission_key)
  select _empresa, 'auxiliar', p.key from public.permissions p
  where p.empresa_id = _empresa and p.key in (
    'dashboard_view',
    'ventas_read','ventas_create',
    'inventario_read','inventario_write',
    'alertas_view','alertas_view_critical',
    'proveedores_read',
    'clientes_read','clientes_create',
    'finanzas_view'
  )
  on conflict (empresa_id, role, permission_key) do nothing;

  -- Admin: all permissions by convention
  insert into public.role_permissions(empresa_id, role, permission_key)
  select _empresa, 'admin', p.key from public.permissions p
  where p.empresa_id = _empresa
  on conflict (empresa_id, role, permission_key) do nothing;
end;
$$;

-- Seed for all existing empresas
do $$
declare v_empresa uuid;
begin
  for v_empresa in select id from public.empresas loop
    perform public.seed_acl_permissions_for_empresa(v_empresa);
  end loop;
end $$;

commit;