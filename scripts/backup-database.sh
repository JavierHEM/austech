#!/bin/bash

# Script de backup para la base de datos Austech
# Uso: ./backup-database.sh [descripción]

set -e

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DESCRIPTION=${1:-"Backup automático"}
BACKUP_NAME="austech_backup_${TIMESTAMP}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Sistema de Backup Austech${NC}"
echo -e "${BLUE}==============================${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde el directorio raíz del proyecto${NC}"
    exit 1
fi

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📁 Directorio de backups: $BACKUP_DIR${NC}"
echo -e "${YELLOW}📅 Timestamp: $TIMESTAMP${NC}"
echo -e "${YELLOW}📝 Descripción: $DESCRIPTION${NC}"
echo ""

# Verificar variables de entorno
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Error: Variables de entorno de Supabase no encontradas${NC}"
    echo -e "${YELLOW}💡 Asegúrate de tener un archivo .env.local con:${NC}"
    echo -e "${YELLOW}   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase${NC}"
    echo -e "${YELLOW}   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables de entorno encontradas${NC}"

# Crear archivo de configuración para el backup
cat > "$BACKUP_DIR/${BACKUP_NAME}_config.json" << EOF
{
  "backup_id": "$BACKUP_NAME",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "description": "$DESCRIPTION",
  "environment": "development",
  "version": "1.0",
  "created_by": "backup-script",
  "supabase_url": "$NEXT_PUBLIC_SUPABASE_URL"
}
EOF

echo -e "${GREEN}✅ Archivo de configuración creado${NC}"

# Crear script de backup usando Node.js
cat > "$BACKUP_DIR/${BACKUP_NAME}_script.js" << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno de Supabase no encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tablas a respaldar
const tables = [
    'usuarios', 'roles', 'empresas', 'sucursales', 'sierras', 'afilados',
    'tipos_sierra', 'estados_sierra', 'tipos_afilado', 'salidas_masivas', 'bajas_masivas'
];

async function createBackup() {
    console.log('🔄 Iniciando backup de la base de datos...');
    
    const backupData = {
        id: process.argv[2] || 'backup',
        timestamp: new Date().toISOString(),
        description: process.argv[3] || 'Backup automático',
        tables: {},
        metadata: {
            version: '1.0',
            createdBy: 'backup-script',
            environment: 'development'
        }
    };
    
    let totalRecords = 0;
    
    for (const table of tables) {
        try {
            console.log(`📊 Respaldando tabla: ${table}`);
            
            const { data, error } = await supabase
                .from(table)
                .select('*');
            
            if (error) {
                console.warn(`⚠️  Error al respaldar ${table}: ${error.message}`);
                backupData.tables[table] = { error: error.message };
            } else {
                backupData.tables[table] = data || [];
                const recordCount = data ? data.length : 0;
                totalRecords += recordCount;
                console.log(`✅ ${table}: ${recordCount} registros`);
            }
        } catch (err) {
            console.warn(`⚠️  Error al respaldar ${table}: ${err.message}`);
            backupData.tables[table] = { error: err.message };
        }
    }
    
    // Guardar backup
    const backupFile = process.argv[4] || 'backup.json';
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`💾 Backup guardado en: ${backupFile}`);
    console.log(`📈 Total de registros respaldados: ${totalRecords}`);
    console.log('✅ Backup completado exitosamente');
}

createBackup().catch(console.error);
EOF

echo -e "${GREEN}✅ Script de backup creado${NC}"

# Ejecutar el backup
echo -e "${YELLOW}🔄 Ejecutando backup...${NC}"
node "$BACKUP_DIR/${BACKUP_NAME}_script.js" "$BACKUP_NAME" "$DESCRIPTION" "$BACKUP_DIR/${BACKUP_NAME}.json"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup completado exitosamente${NC}"
    
    # Mostrar información del backup
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.json" | cut -f1)
    echo -e "${BLUE}📊 Información del backup:${NC}"
    echo -e "${BLUE}   Archivo: ${BACKUP_NAME}.json${NC}"
    echo -e "${BLUE}   Tamaño: $BACKUP_SIZE${NC}"
    echo -e "${BLUE}   Ubicación: $BACKUP_DIR/${NC}"
    
    # Crear script de restauración
    cat > "$BACKUP_DIR/${BACKUP_NAME}_restore.sh" << EOF
#!/bin/bash

# Script de restauración para el backup $BACKUP_NAME
# Uso: ./${BACKUP_NAME}_restore.sh

echo -e "${RED}⚠️  ADVERTENCIA: Este script restaurará el backup $BACKUP_NAME${NC}"
echo -e "${RED}⚠️  Esto sobrescribirá todos los datos existentes en la base de datos${NC}"
echo -e "${YELLOW}¿Estás seguro de que quieres continuar? (y/N)${NC}"
read -r response

if [[ "\$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🔄 Restaurando backup...${NC}"
    node "$BACKUP_DIR/${BACKUP_NAME}_restore.js"
else
    echo -e "${BLUE}❌ Restauración cancelada${NC}"
fi
EOF

    # Crear script de restauración en Node.js
    cat > "$BACKUP_DIR/${BACKUP_NAME}_restore.js" << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno de Supabase no encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreBackup() {
    const backupFile = process.argv[2] || 'backup.json';
    
    if (!fs.existsSync(backupFile)) {
        console.error(`❌ Error: Archivo de backup no encontrado: ${backupFile}`);
        process.exit(1);
    }
    
    console.log(`🔄 Restaurando backup desde: ${backupFile}`);
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    if (!backupData.tables) {
        console.error('❌ Error: Archivo de backup inválido');
        process.exit(1);
    }
    
    // Restaurar cada tabla
    for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        if (Array.isArray(tableData)) {
            try {
                console.log(`📊 Restaurando tabla: ${tableName}`);
                
                // Limpiar tabla existente
                await supabase.from(tableName).delete().neq('id', 0);
                
                // Insertar datos del backup
                if (tableData.length > 0) {
                    const { error } = await supabase
                        .from(tableName)
                        .insert(tableData);
                    
                    if (error) {
                        console.warn(`⚠️  Error al restaurar ${tableName}: ${error.message}`);
                    } else {
                        console.log(`✅ ${tableName}: ${tableData.length} registros restaurados`);
                    }
                }
            } catch (err) {
                console.warn(`⚠️  Error al restaurar ${tableName}: ${err.message}`);
            }
        }
    }
    
    console.log('✅ Restauración completada exitosamente');
}

restoreBackup().catch(console.error);
EOF

    chmod +x "$BACKUP_DIR/${BACKUP_NAME}_restore.sh"
    
    echo -e "${GREEN}✅ Script de restauración creado${NC}"
    echo -e "${BLUE}📝 Para restaurar este backup, ejecuta:${NC}"
    echo -e "${BLUE}   ./$BACKUP_DIR/${BACKUP_NAME}_restore.sh${NC}"
    
else
    echo -e "${RED}❌ Error al crear el backup${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Backup completado exitosamente${NC}"
echo -e "${YELLOW}💡 Recuerda:${NC}"
echo -e "${YELLOW}   - Guarda este backup en un lugar seguro${NC}"
echo -e "${YELLOW}   - Haz backup antes de aplicar migraciones RLS${NC}"
echo -e "${YELLOW}   - Prueba la restauración en un entorno de desarrollo${NC}"
