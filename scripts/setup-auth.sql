-- Crear tabla de roles si no existe
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modificado_en TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255),
    rol_id INTEGER REFERENCES roles(id),
    empresa_id INTEGER,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modificado_en TIMESTAMP WITH TIME ZONE
);

-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion) VALUES
('gerente', 'Acceso completo al sistema'),
('administrador', 'Acceso a gestión de datos pero no de usuarios'),
('cliente', 'Acceso limitado a sus propias sierras y afilados')
ON CONFLICT (nombre) DO NOTHING;

-- Crear un trigger para actualizar modificado_en
CREATE OR REPLACE FUNCTION update_modificado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modificado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_modificado_en
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_modificado_en();

CREATE TRIGGER update_roles_modificado_en
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_modificado_en();

-- Crear una política RLS para usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propia información"
    ON usuarios FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Los gerentes pueden ver y modificar todos los usuarios"
    ON usuarios FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            WHERE u.id = auth.uid() AND r.nombre = 'gerente'
        )
    );

-- Crear una política RLS para roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver roles"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo gerentes pueden modificar roles"
    ON roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            WHERE u.id = auth.uid() AND r.nombre = 'gerente'
        )
    );
