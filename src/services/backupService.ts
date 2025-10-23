// src/services/backupService.ts
import { supabase } from '@/lib/supabase-client';

interface BackupResult {
  success: boolean;
  message: string;
  backupId?: string;
  error?: string;
  timestamp?: string;
}

interface RestoreResult {
  success: boolean;
  message: string;
  error?: string;
}

interface BackupInfo {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  description: string;
  tables: string[];
}

/**
 * Servicio para manejar backups y restauración de la base de datos
 */
export class BackupService {
  
  /**
   * Crear backup completo de la base de datos
   */
  static async createFullBackup(description: string = 'Backup completo antes de migraciones RLS'): Promise<BackupResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup-${timestamp}`;
      
      // Obtener todas las tablas principales
      const tables = [
        'usuarios', 'roles', 'empresas', 'sucursales', 'sierras', 'afilados',
        'tipos_sierra', 'estados_sierra', 'tipos_afilado', 'salidas_masivas', 'bajas_masivas'
      ];
      
      const backupData: any = {
        id: backupId,
        timestamp: new Date().toISOString(),
        description,
        tables: {},
        metadata: {
          version: '1.0',
          createdBy: 'Sistema de Backup',
          environment: process.env.NODE_ENV || 'development'
        }
      };
      
      // Hacer backup de cada tabla
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*');
          
          if (error) {
            console.warn(`Error al hacer backup de ${table}:`, error);
            backupData.tables[table] = { error: error.message };
          } else {
            backupData.tables[table] = data || [];
          }
        } catch (err) {
          console.warn(`Error al hacer backup de ${table}:`, err);
          backupData.tables[table] = { error: 'Error desconocido' };
        }
      }
      
      // Guardar backup en localStorage (para desarrollo)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`backup-${backupId}`, JSON.stringify(backupData));
        
        // Mantener solo los últimos 5 backups
        const backupKeys = Object.keys(localStorage)
          .filter(key => key.startsWith('backup-'))
          .sort()
          .reverse();
        
        if (backupKeys.length > 5) {
          backupKeys.slice(5).forEach(key => {
            localStorage.removeItem(key);
          });
        }
      }
      
      return {
        success: true,
        message: `Backup creado exitosamente: ${backupId}`,
        backupId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Error al crear backup',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear backup de una tabla específica
   */
  static async createTableBackup(tableName: string): Promise<BackupResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup-${tableName}-${timestamp}`;
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        return {
          success: false,
          message: `Error al hacer backup de ${tableName}`,
          error: error.message
        };
      }
      
      const backupData = {
        id: backupId,
        table: tableName,
        timestamp: new Date().toISOString(),
        data: data || [],
        metadata: {
          version: '1.0',
          createdBy: 'Sistema de Backup',
          environment: process.env.NODE_ENV || 'development'
        }
      };
      
      // Guardar backup en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`backup-${backupId}`, JSON.stringify(backupData));
      }
      
      return {
        success: true,
        message: `Backup de ${tableName} creado exitosamente`,
        backupId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Error al hacer backup de ${tableName}`,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Listar todos los backups disponibles
   */
  static async listBackups(): Promise<BackupInfo[]> {
    if (typeof window === 'undefined') {
      return [];
    }
    
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('backup-'))
      .sort()
      .reverse();
    
    const backups: BackupInfo[] = [];
    
    for (const key of backupKeys) {
      try {
        const backupData = JSON.parse(localStorage.getItem(key) || '{}');
        
        if (backupData.id) {
          backups.push({
            id: backupData.id,
            name: backupData.id,
            timestamp: backupData.timestamp,
            size: this.calculateBackupSize(backupData),
            description: backupData.description || 'Sin descripción',
            tables: Object.keys(backupData.tables || {})
          });
        }
      } catch (err) {
        console.warn(`Error al leer backup ${key}:`, err);
      }
    }
    
    return backups;
  }

  /**
   * Restaurar backup completo
   */
  static async restoreFullBackup(backupId: string): Promise<RestoreResult> {
    try {
      if (typeof window === 'undefined') {
        return {
          success: false,
          message: 'Backup no disponible en el servidor',
          error: 'Solo disponible en el cliente'
        };
      }
      
      const backupData = JSON.parse(localStorage.getItem(`backup-${backupId}`) || '{}');
      
      if (!backupData.id) {
        return {
          success: false,
          message: 'Backup no encontrado',
          error: 'El backup especificado no existe'
        };
      }
      
      // Restaurar cada tabla
      for (const [tableName, tableData] of Object.entries(backupData.tables || {})) {
        if (Array.isArray(tableData)) {
          try {
            // Limpiar tabla existente
            await supabase.from(tableName).delete().neq('id', 0);
            
            // Insertar datos del backup
            if (tableData.length > 0) {
              const { error } = await supabase
                .from(tableName)
                .insert(tableData);
              
              if (error) {
                console.warn(`Error al restaurar ${tableName}:`, error);
              }
            }
          } catch (err) {
            console.warn(`Error al restaurar ${tableName}:`, err);
          }
        }
      }
      
      return {
        success: true,
        message: `Backup ${backupId} restaurado exitosamente`
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Error al restaurar backup',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Restaurar tabla específica desde backup
   */
  static async restoreTableFromBackup(backupId: string, tableName: string): Promise<RestoreResult> {
    try {
      if (typeof window === 'undefined') {
        return {
          success: false,
          message: 'Backup no disponible en el servidor',
          error: 'Solo disponible en el cliente'
        };
      }
      
      const backupData = JSON.parse(localStorage.getItem(`backup-${backupId}`) || '{}');
      
      if (!backupData.id) {
        return {
          success: false,
          message: 'Backup no encontrado',
          error: 'El backup especificado no existe'
        };
      }
      
      const tableData = backupData.tables?.[tableName];
      
      if (!Array.isArray(tableData)) {
        return {
          success: false,
          message: `Tabla ${tableName} no encontrada en el backup`,
          error: 'Datos de tabla no disponibles'
        };
      }
      
      // Limpiar tabla existente
      await supabase.from(tableName).delete().neq('id', 0);
      
      // Insertar datos del backup
      if (tableData.length > 0) {
        const { error } = await supabase
          .from(tableName)
          .insert(tableData);
        
        if (error) {
          return {
            success: false,
            message: `Error al restaurar ${tableName}`,
            error: error.message
          };
        }
      }
      
      return {
        success: true,
        message: `Tabla ${tableName} restaurada exitosamente desde ${backupId}`
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Error al restaurar tabla',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar backup
   */
  static async deleteBackup(backupId: string): Promise<RestoreResult> {
    try {
      if (typeof window === 'undefined') {
        return {
          success: false,
          message: 'Backup no disponible en el servidor',
          error: 'Solo disponible en el cliente'
        };
      }
      
      localStorage.removeItem(`backup-${backupId}`);
      
      return {
        success: true,
        message: `Backup ${backupId} eliminado exitosamente`
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Error al eliminar backup',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Calcular tamaño del backup
   */
  private static calculateBackupSize(backupData: any): string {
    const jsonString = JSON.stringify(backupData);
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Exportar backup como archivo JSON
   */
  static async exportBackup(backupId: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    
    const backupData = localStorage.getItem(`backup-${backupId}`);
    
    if (!backupData) {
      throw new Error('Backup no encontrado');
    }
    
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backupId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Importar backup desde archivo JSON
   */
  static async importBackup(file: File): Promise<RestoreResult> {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      if (!backupData.id) {
        return {
          success: false,
          message: 'Archivo de backup inválido',
          error: 'El archivo no contiene un backup válido'
        };
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`backup-${backupData.id}`, text);
      }
      
      return {
        success: true,
        message: `Backup ${backupData.id} importado exitosamente`
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Error al importar backup',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
