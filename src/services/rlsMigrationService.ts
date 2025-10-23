// src/services/rlsMigrationService.ts
import { supabase } from '@/lib/supabase-client';

interface MigrationResult {
  success: boolean;
  message: string;
  error?: string;
}

interface RLSStatus {
  table: string;
  rlsEnabled: boolean;
  policiesCount: number;
  policies: string[];
}

/**
 * Servicio para manejar migraciones de RLS (Row Level Security)
 */
export class RLSMigrationService {
  
  /**
   * Verificar el estado actual de RLS en las tablas
   */
  static async checkRLSStatus(): Promise<RLSStatus[]> {
    try {
      const { data, error } = await supabase.rpc('get_rls_status');
      
      if (error) {
        // Si la función no existe, usar consulta directa
        const tables = [
          'usuarios', 'empresas', 'sucursales', 'sierras', 'afilados',
          'tipos_sierra', 'estados_sierra', 'tipos_afilado', 'roles'
        ];
        
        const results: RLSStatus[] = [];
        
        for (const table of tables) {
          try {
            // Verificar si RLS está habilitado
            const { data: rlsData, error: rlsError } = await supabase
              .from('pg_class')
              .select('relrowsecurity')
              .eq('relname', table)
              .single();
            
            // Obtener políticas
            const { data: policiesData, error: policiesError } = await supabase
              .from('pg_policies')
              .select('policyname')
              .eq('tablename', table);
            
            results.push({
              table,
              rlsEnabled: rlsData?.relrowsecurity || false,
              policiesCount: policiesData?.length || 0,
              policies: policiesData?.map(p => p.policyname) || []
            });
          } catch (err) {
            results.push({
              table,
              rlsEnabled: false,
              policiesCount: 0,
              policies: []
            });
          }
        }
        
        return results;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error al verificar estado de RLS:', error);
      return [];
    }
  }

  /**
   * Aplicar migración para habilitar RLS
   */
  static async enableRLSOnTables(): Promise<MigrationResult> {
    try {
      const tables = [
        'usuarios', 'empresas', 'sucursales', 'sierras', 'afilados',
        'tipos_sierra', 'estados_sierra', 'tipos_afilado', 'roles'
      ];

      for (const table of tables) {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
        });
        
        if (error) {
          return {
            success: false,
            message: `Error al habilitar RLS en ${table}`,
            error: error.message
          };
        }
      }

      return {
        success: true,
        message: 'RLS habilitado exitosamente en todas las tablas'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al habilitar RLS',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear políticas RLS básicas
   */
  static async createBasicRLSPolicies(): Promise<MigrationResult> {
    try {
      const policies = [
        // Política para usuarios - solo pueden ver su propia información
        `CREATE POLICY "usuarios_select_own" ON usuarios FOR SELECT USING (auth.uid()::text = id::text);`,
        
        // Política para empresas - solo administradores pueden ver todas
        `CREATE POLICY "empresas_admin_all" ON empresas FOR ALL USING (is_admin());`,
        
        // Política para sucursales - usuarios pueden ver sucursales de su empresa
        `CREATE POLICY "sucursales_user_empresa" ON sucursales FOR SELECT USING (can_access_empresa(empresa_id));`,
        
        // Política para sierras - usuarios pueden ver sierras de su empresa
        `CREATE POLICY "sierras_user_empresa" ON sierras FOR SELECT USING (can_access_sucursal(sucursal_id));`,
        
        // Política para afilados - usuarios pueden ver afilados de sierras de su empresa
        `CREATE POLICY "afilados_user_empresa" ON afilados FOR SELECT USING (can_access_sierra(sierra_id));`,
        
        // Políticas de solo lectura para tablas de referencia
        `CREATE POLICY "tipos_sierra_read_all" ON tipos_sierra FOR SELECT USING (auth.role() = 'authenticated');`,
        `CREATE POLICY "estados_sierra_read_all" ON estados_sierra FOR SELECT USING (auth.role() = 'authenticated');`,
        `CREATE POLICY "tipos_afilado_read_all" ON tipos_afilado FOR SELECT USING (auth.role() = 'authenticated');`,
        `CREATE POLICY "roles_read_all" ON roles FOR SELECT USING (auth.role() = 'authenticated');`
      ];

      for (const policy of policies) {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        
        if (error) {
          return {
            success: false,
            message: 'Error al crear políticas RLS',
            error: error.message
          };
        }
      }

      return {
        success: true,
        message: 'Políticas RLS creadas exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al crear políticas RLS',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear funciones auxiliares para RLS
   */
  static async createRLSFunctions(): Promise<MigrationResult> {
    try {
      const functions = [
        // Función para verificar si es administrador
        `CREATE OR REPLACE FUNCTION is_admin()
         RETURNS BOOLEAN AS $$
         BEGIN
             RETURN EXISTS (
                 SELECT 1 FROM usuarios u
                 JOIN roles r ON u.rol_id = r.id
                 WHERE u.id::text = auth.uid()::text
                 AND r.nombre = 'administrador'
             );
         END;
         $$ LANGUAGE plpgsql SECURITY DEFINER;`,
        
        // Función para verificar acceso a empresa
        `CREATE OR REPLACE FUNCTION can_access_empresa(empresa_id_param INTEGER)
         RETURNS BOOLEAN AS $$
         BEGIN
             IF is_admin() THEN
                 RETURN TRUE;
             END IF;
             
             RETURN EXISTS (
                 SELECT 1 FROM usuarios u
                 WHERE u.id::text = auth.uid()::text
                 AND u.empresa_id = empresa_id_param
             );
         END;
         $$ LANGUAGE plpgsql SECURITY DEFINER;`,
        
        // Función para verificar acceso a sucursal
        `CREATE OR REPLACE FUNCTION can_access_sucursal(sucursal_id_param INTEGER)
         RETURNS BOOLEAN AS $$
         BEGIN
             IF is_admin() THEN
                 RETURN TRUE;
             END IF;
             
             RETURN EXISTS (
                 SELECT 1 FROM usuarios u
                 JOIN sucursales s ON s.empresa_id = u.empresa_id
                 WHERE u.id::text = auth.uid()::text
                 AND s.id = sucursal_id_param
             );
         END;
         $$ LANGUAGE plpgsql SECURITY DEFINER;`,
        
        // Función para verificar acceso a sierra
        `CREATE OR REPLACE FUNCTION can_access_sierra(sierra_id_param INTEGER)
         RETURNS BOOLEAN AS $$
         BEGIN
             IF is_admin() THEN
                 RETURN TRUE;
             END IF;
             
             RETURN EXISTS (
                 SELECT 1 FROM usuarios u
                 JOIN sucursales s ON s.empresa_id = u.empresa_id
                 JOIN sierras si ON si.sucursal_id = s.id
                 WHERE u.id::text = auth.uid()::text
                 AND si.id = sierra_id_param
             );
         END;
         $$ LANGUAGE plpgsql SECURITY DEFINER;`
      ];

      for (const func of functions) {
        const { error } = await supabase.rpc('exec_sql', { sql: func });
        
        if (error) {
          return {
            success: false,
            message: 'Error al crear funciones RLS',
            error: error.message
          };
        }
      }

      return {
        success: true,
        message: 'Funciones RLS creadas exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al crear funciones RLS',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Aplicar todas las migraciones de RLS
   */
  static async applyAllRLSMigrations(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    // 1. Crear funciones auxiliares
    const functionsResult = await this.createRLSFunctions();
    results.push(functionsResult);

    if (!functionsResult.success) {
      return results;
    }

    // 2. Habilitar RLS en tablas
    const enableResult = await this.enableRLSOnTables();
    results.push(enableResult);

    if (!enableResult.success) {
      return results;
    }

    // 3. Crear políticas RLS
    const policiesResult = await this.createBasicRLSPolicies();
    results.push(policiesResult);

    return results;
  }

  /**
   * Verificar si RLS está correctamente configurado
   */
  static async verifyRLSConfiguration(): Promise<{
    isConfigured: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const status = await this.checkRLSStatus();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar que todas las tablas tengan RLS habilitado
    const tablesWithoutRLS = status.filter(s => !s.rlsEnabled);
    if (tablesWithoutRLS.length > 0) {
      issues.push(`RLS no habilitado en: ${tablesWithoutRLS.map(t => t.table).join(', ')}`);
      recommendations.push('Ejecutar migración para habilitar RLS en todas las tablas');
    }

    // Verificar que las tablas principales tengan políticas
    const mainTables = ['usuarios', 'empresas', 'sucursales', 'sierras', 'afilados'];
    const tablesWithoutPolicies = status.filter(s => 
      mainTables.includes(s.table) && s.policiesCount === 0
    );
    
    if (tablesWithoutPolicies.length > 0) {
      issues.push(`Sin políticas RLS en: ${tablesWithoutPolicies.map(t => t.table).join(', ')}`);
      recommendations.push('Crear políticas RLS para las tablas principales');
    }

    return {
      isConfigured: issues.length === 0,
      issues,
      recommendations
    };
  }
}
