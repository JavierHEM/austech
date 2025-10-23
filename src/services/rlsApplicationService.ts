// src/services/rlsApplicationService.ts
import { supabase } from '@/lib/supabase-client';

interface ApplicationResult {
  success: boolean;
  message: string;
  error?: string;
  details?: any;
}

/**
 * Servicio para aplicar migraciones RLS de manera segura
 */
export class RLSApplicationService {
  
  /**
   * Verificar el estado actual de RLS
   */
  static async checkRLSStatus(): Promise<ApplicationResult> {
    try {
      // Intentar obtener información básica de las tablas
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', [
          'usuarios', 'roles', 'empresas', 'sucursales', 'sierras', 
          'afilados', 'tipos_sierra', 'estados_sierra', 'tipos_afilado'
        ]);

      if (error) {
        return {
          success: false,
          message: 'Error al verificar estado de RLS',
          error: error.message
        };
      }

      return {
        success: true,
        message: `Estado verificado: ${tables?.length || 0} tablas encontradas`,
        details: { tables: tables?.map(t => t.table_name) || [] }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al verificar estado de RLS',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear funciones auxiliares para RLS
   */
  static async createRLSFunctions(): Promise<ApplicationResult> {
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

      let successCount = 0;
      const errors: string[] = [];

      for (const func of functions) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: func });
          if (error) {
            errors.push(`Error en función: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          errors.push(`Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
      }

      if (successCount === functions.length) {
        return {
          success: true,
          message: `Todas las funciones RLS creadas exitosamente (${successCount}/${functions.length})`
        };
      } else {
        return {
          success: false,
          message: `Solo ${successCount}/${functions.length} funciones creadas`,
          error: errors.join('; ')
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al crear funciones RLS',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Habilitar RLS en todas las tablas
   */
  static async enableRLSOnTables(): Promise<ApplicationResult> {
    try {
      const tables = [
        'usuarios', 'empresas', 'sucursales', 'sierras', 'afilados',
        'tipos_sierra', 'estados_sierra', 'tipos_afilado', 'roles'
      ];

      let successCount = 0;
      const errors: string[] = [];

      for (const table of tables) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
          });
          
          if (error) {
            errors.push(`Error en ${table}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          errors.push(`Error inesperado en ${table}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
      }

      if (successCount === tables.length) {
        return {
          success: true,
          message: `RLS habilitado en todas las tablas (${successCount}/${tables.length})`
        };
      } else {
        return {
          success: false,
          message: `RLS habilitado en ${successCount}/${tables.length} tablas`,
          error: errors.join('; ')
        };
      }
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
  static async createBasicRLSPolicies(): Promise<ApplicationResult> {
    try {
      const policies = [
        // Política para usuarios - solo pueden ver su propia información
        `CREATE POLICY "usuarios_select_own" ON usuarios
         FOR SELECT USING (auth.uid()::text = id::text);`,
        
        // Política para empresas - solo administradores pueden ver todas
        `CREATE POLICY "empresas_admin_all" ON empresas
         FOR ALL USING (is_admin());`,
        
        // Política para sucursales - usuarios pueden ver sucursales de su empresa
        `CREATE POLICY "sucursales_user_empresa" ON sucursales
         FOR SELECT USING (can_access_empresa(empresa_id));`,
        
        // Política para sierras - usuarios pueden ver sierras de su empresa
        `CREATE POLICY "sierras_user_empresa" ON sierras
         FOR SELECT USING (can_access_sucursal(sucursal_id));`,
        
        // Política para afilados - usuarios pueden ver afilados de sierras de su empresa
        `CREATE POLICY "afilados_user_empresa" ON afilados
         FOR SELECT USING (can_access_sierra(sierra_id));`,
        
        // Políticas de solo lectura para tablas de referencia
        `CREATE POLICY "tipos_sierra_read_all" ON tipos_sierra
         FOR SELECT USING (auth.role() = 'authenticated');`,
        `CREATE POLICY "estados_sierra_read_all" ON estados_sierra
         FOR SELECT USING (auth.role() = 'authenticated');`,
        `CREATE POLICY "tipos_afilado_read_all" ON tipos_afilado
         FOR SELECT USING (auth.role() = 'authenticated');`,
        `CREATE POLICY "roles_read_all" ON roles
         FOR SELECT USING (auth.role() = 'authenticated');`
      ];

      let successCount = 0;
      const errors: string[] = [];

      for (const policy of policies) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: policy });
          if (error) {
            errors.push(`Error en política: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          errors.push(`Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
      }

      if (successCount === policies.length) {
        return {
          success: true,
          message: `Todas las políticas RLS creadas exitosamente (${successCount}/${policies.length})`
        };
      } else {
        return {
          success: false,
          message: `Solo ${successCount}/${policies.length} políticas creadas`,
          error: errors.join('; ')
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al crear políticas RLS',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Verificar configuración RLS
   */
  static async verifyRLSConfiguration(): Promise<ApplicationResult> {
    try {
      // Intentar verificar que las funciones existen
      const { data: functions, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname')
        .in('proname', ['is_admin', 'can_access_empresa', 'can_access_sucursal', 'can_access_sierra']);

      if (funcError) {
        return {
          success: false,
          message: 'Error al verificar funciones RLS',
          error: funcError.message
        };
      }

      const functionCount = functions?.length || 0;
      const expectedFunctions = 4;

      if (functionCount === expectedFunctions) {
        return {
          success: true,
          message: `RLS configurado correctamente: ${functionCount}/${expectedFunctions} funciones encontradas`,
          details: { functions: functions?.map(f => f.proname) || [] }
        };
      } else {
        return {
          success: false,
          message: `RLS no configurado completamente: ${functionCount}/${expectedFunctions} funciones encontradas`,
          error: `Faltan ${expectedFunctions - functionCount} funciones`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al verificar configuración RLS',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Aplicar todas las migraciones RLS
   */
  static async applyAllRLSMigrations(): Promise<ApplicationResult[]> {
    const results: ApplicationResult[] = [];

    // 1. Verificar estado
    const statusResult = await this.checkRLSStatus();
    results.push(statusResult);

    if (!statusResult.success) {
      return results;
    }

    // 2. Crear funciones
    const functionsResult = await this.createRLSFunctions();
    results.push(functionsResult);

    if (!functionsResult.success) {
      return results;
    }

    // 3. Habilitar RLS
    const enableResult = await this.enableRLSOnTables();
    results.push(enableResult);

    if (!enableResult.success) {
      return results;
    }

    // 4. Crear políticas
    const policiesResult = await this.createBasicRLSPolicies();
    results.push(policiesResult);

    // 5. Verificar configuración
    const verifyResult = await this.verifyRLSConfiguration();
    results.push(verifyResult);

    return results;
  }
}
