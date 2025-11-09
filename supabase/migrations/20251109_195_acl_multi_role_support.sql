-- Multi-role support for permission checks
begin;

create or replace function public.has_permission(_user_id uuid, _permission_key text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_empresa uuid;
  v_rol text;
begin
  select empresa_id, rol::text into v_empresa, v_rol from public.profiles where id = _user_id;
  if v_empresa is null then
    return false;
  end if;
  -- Admin: acceso total
  if v_rol = 'admin' then
    return true;
  end if;
  return exists (
    select 1 from public.role_permissions rp
    where rp.empresa_id = v_empresa
      and rp.permission_key = _permission_key
      and rp.role in (
        select ur.role from public.user_roles ur where ur.user_id = _user_id
        union select v_rol
      )
  );
end $$;

create or replace function public.get_user_permissions(_user_id uuid)
returns table(permission_key text) language plpgsql stable security definer set search_path = public as $$
declare
  v_empresa uuid;
  v_rol text;
begin
  select empresa_id, rol::text into v_empresa, v_rol from public.profiles where id = _user_id;
  if v_empresa is null then
    return;
  end if;
  if v_rol = 'admin' then
    return query select key from public.permissions where empresa_id = v_empresa;
  else
    return query
      select distinct rp.permission_key
      from public.role_permissions rp
      where rp.empresa_id = v_empresa
        and rp.role in (
          select ur.role from public.user_roles ur where ur.user_id = _user_id
          union select v_rol
        );
  end if;
end $$;

commit;