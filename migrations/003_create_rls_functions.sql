-- migrations/003_create_rls_functions.sql
-- Crear funciones auxiliares para RLS

-- Función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.id::text = auth.uid()::text
        AND r.nombre = 'administrador'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es gerente
CREATE OR REPLACE FUNCTION is_gerente()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.id::text = auth.uid()::text
        AND r.nombre = 'gerente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es cliente
CREATE OR REPLACE FUNCTION is_cliente()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.id::text = auth.uid()::text
        AND r.nombre = 'cliente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener la empresa_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT u.empresa_id FROM usuarios u
        WHERE u.id::text = auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede acceder a una empresa
CREATE OR REPLACE FUNCTION can_access_empresa(empresa_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Los administradores pueden acceder a todas las empresas
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Los gerentes y clientes solo pueden acceder a su empresa
    RETURN EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id::text = auth.uid()::text
        AND u.empresa_id = empresa_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede acceder a una sucursal
CREATE OR REPLACE FUNCTION can_access_sucursal(sucursal_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Los administradores pueden acceder a todas las sucursales
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Los gerentes y clientes solo pueden acceder a sucursales de su empresa
    RETURN EXISTS (
        SELECT 1 FROM usuarios u
        JOIN sucursales s ON s.empresa_id = u.empresa_id
        WHERE u.id::text = auth.uid()::text
        AND s.id = sucursal_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede acceder a una sierra
CREATE OR REPLACE FUNCTION can_access_sierra(sierra_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Los administradores pueden acceder a todas las sierras
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Los gerentes y clientes solo pueden acceder a sierras de su empresa
    RETURN EXISTS (
        SELECT 1 FROM usuarios u
        JOIN sucursales s ON s.empresa_id = u.empresa_id
        JOIN sierras si ON si.sucursal_id = s.id
        WHERE u.id::text = auth.uid()::text
        AND si.id = sierra_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
