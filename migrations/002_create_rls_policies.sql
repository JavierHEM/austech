-- migrations/002_create_rls_policies.sql
-- Crear políticas RLS para control de acceso basado en roles

-- Políticas para la tabla usuarios
-- Los usuarios solo pueden ver y editar su propia información
CREATE POLICY "usuarios_select_own" ON usuarios
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "usuarios_update_own" ON usuarios
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Los administradores pueden ver todos los usuarios
CREATE POLICY "usuarios_admin_all" ON usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'administrador'
        )
    );

-- Políticas para la tabla empresas
-- Los administradores pueden hacer todo con empresas
CREATE POLICY "empresas_admin_all" ON empresas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'administrador'
        )
    );

-- Los gerentes pueden ver empresas de su empresa
CREATE POLICY "empresas_gerente_view" ON empresas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'gerente'
            AND u.empresa_id = empresas.id
        )
    );

-- Políticas para la tabla sucursales
-- Los administradores pueden hacer todo con sucursales
CREATE POLICY "sucursales_admin_all" ON sucursales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'administrador'
        )
    );

-- Los gerentes pueden ver sucursales de su empresa
CREATE POLICY "sucursales_gerente_view" ON sucursales
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'gerente'
            AND u.empresa_id = sucursales.empresa_id
        )
    );

-- Los clientes pueden ver sucursales de su empresa
CREATE POLICY "sucursales_cliente_view" ON sucursales
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'cliente'
            AND u.empresa_id = sucursales.empresa_id
        )
    );

-- Políticas para la tabla sierras
-- Los administradores pueden hacer todo con sierras
CREATE POLICY "sierras_admin_all" ON sierras
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'administrador'
        )
    );

-- Los gerentes pueden ver sierras de su empresa
CREATE POLICY "sierras_gerente_view" ON sierras
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            JOIN sucursales s ON s.empresa_id = u.empresa_id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'gerente'
            AND sierras.sucursal_id = s.id
        )
    );

-- Los clientes pueden ver sierras de su empresa
CREATE POLICY "sierras_cliente_view" ON sierras
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            JOIN sucursales s ON s.empresa_id = u.empresa_id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'cliente'
            AND sierras.sucursal_id = s.id
        )
    );

-- Políticas para la tabla afilados
-- Los administradores pueden hacer todo con afilados
CREATE POLICY "afilados_admin_all" ON afilados
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'administrador'
        )
    );

-- Los gerentes pueden ver afilados de sierras de su empresa
CREATE POLICY "afilados_gerente_view" ON afilados
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            JOIN sucursales s ON s.empresa_id = u.empresa_id
            JOIN sierras si ON si.sucursal_id = s.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'gerente'
            AND afilados.sierra_id = si.id
        )
    );

-- Los clientes pueden ver afilados de sierras de su empresa
CREATE POLICY "afilados_cliente_view" ON afilados
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            JOIN sucursales s ON s.empresa_id = u.empresa_id
            JOIN sierras si ON si.sucursal_id = s.id
            WHERE u.id::text = auth.uid()::text
            AND r.nombre = 'cliente'
            AND afilados.sierra_id = si.id
        )
    );

-- Políticas para tablas de referencia (solo lectura para todos los usuarios autenticados)
CREATE POLICY "tipos_sierra_read_all" ON tipos_sierra
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "estados_sierra_read_all" ON estados_sierra
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "tipos_afilado_read_all" ON tipos_afilado
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "roles_read_all" ON roles
    FOR SELECT USING (auth.role() = 'authenticated');
