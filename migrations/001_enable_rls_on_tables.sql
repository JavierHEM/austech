-- migrations/001_enable_rls_on_tables.sql
-- Habilitar RLS en todas las tablas principales

-- Habilitar RLS en la tabla usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla empresas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla sucursales
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla sierras
ALTER TABLE sierras ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla afilados
ALTER TABLE afilados ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla tipos_sierra
ALTER TABLE tipos_sierra ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla estados_sierra
ALTER TABLE estados_sierra ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla tipos_afilado
ALTER TABLE tipos_afilado ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
