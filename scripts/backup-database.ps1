# Script de backup para la base de datos Austech (PowerShell)
# Uso: .\backup-database.ps1 [descripción]

param(
    [string]$Description = "Backup automático"
)

# Configuración
$BackupDir = ".\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "austech_backup_$Timestamp"

# Colores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

Write-Host "🔒 Sistema de Backup Austech" -ForegroundColor $Blue
Write-Host "==============================" -ForegroundColor $Blue

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde el directorio raíz del proyecto" -ForegroundColor $Red
    exit 1
}

# Crear directorio de backups si no existe
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "📁 Directorio de backups: $BackupDir" -ForegroundColor $Yellow
Write-Host "📅 Timestamp: $Timestamp" -ForegroundColor $Yellow
Write-Host "📝 Descripción: $Description" -ForegroundColor $Yellow
Write-Host ""

# Verificar variables de entorno
$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$SupabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $SupabaseUrl -or -not $SupabaseKey) {
    Write-Host "❌ Error: Variables de entorno de Supabase no encontradas" -ForegroundColor $Red
    Write-Host "💡 Asegúrate de tener un archivo .env.local con:" -ForegroundColor $Yellow
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase" -ForegroundColor $Yellow
    Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima" -ForegroundColor $Yellow
    exit 1
}

Write-Host "✅ Variables de entorno encontradas" -ForegroundColor $Green

# Crear archivo de configuración para el backup
$ConfigData = @{
    backup_id = $BackupName
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    description = $Description
    environment = "development"
    version = "1.0"
    created_by = "backup-script"
    supabase_url = $SupabaseUrl
} | ConvertTo-Json -Depth 3

$ConfigData | Out-File -FilePath "$BackupDir\${BackupName}_config.json" -Encoding UTF8

Write-Host "✅ Archivo de configuración creado" -ForegroundColor $Green

# Crear script de backup usando Node.js
$BackupScript = @'
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
'@

$BackupScript | Out-File -FilePath "$BackupDir\${BackupName}_script.js" -Encoding UTF8

Write-Host "✅ Script de backup creado" -ForegroundColor $Green

# Ejecutar el backup
Write-Host "🔄 Ejecutando backup..." -ForegroundColor $Yellow
node "$BackupDir\${BackupName}_script.js" "$BackupName" "$Description" "$BackupDir\${BackupName}.json"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup completado exitosamente" -ForegroundColor $Green
    
    # Mostrar información del backup
    $BackupFile = "$BackupDir\${BackupName}.json"
    $BackupSize = (Get-Item $BackupFile).Length
    $BackupSizeKB = [math]::Round($BackupSize / 1KB, 2)
    
    Write-Host "📊 Información del backup:" -ForegroundColor $Blue
    Write-Host "   Archivo: ${BackupName}.json" -ForegroundColor $Blue
    Write-Host "   Tamaño: $BackupSizeKB KB" -ForegroundColor $Blue
    Write-Host "   Ubicación: $BackupDir\" -ForegroundColor $Blue
    
    # Crear script de restauración
    $RestoreScript = @"
# Script de restauración para el backup $BackupName
# Uso: .\${BackupName}_restore.ps1

Write-Host "⚠️  ADVERTENCIA: Este script restaurará el backup $BackupName" -ForegroundColor Red
Write-Host "⚠️  Esto sobrescribirá todos los datos existentes en la base de datos" -ForegroundColor Red
`$response = Read-Host "¿Estás seguro de que quieres continuar? (y/N)"

if (`$response -match "^[Yy]$") {
    Write-Host "🔄 Restaurando backup..." -ForegroundColor Yellow
    node "$BackupDir\${BackupName}_restore.js"
} else {
    Write-Host "❌ Restauración cancelada" -ForegroundColor Blue
}
"@

    $RestoreScript | Out-File -FilePath "$BackupDir\${BackupName}_restore.ps1" -Encoding UTF8
    
    # Crear script de restauración en Node.js
    $RestoreNodeScript = @'
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
'@

    $RestoreNodeScript | Out-File -FilePath "$BackupDir\${BackupName}_restore.js" -Encoding UTF8
    
    Write-Host "✅ Script de restauración creado" -ForegroundColor $Green
    Write-Host "📝 Para restaurar este backup, ejecuta:" -ForegroundColor $Blue
    Write-Host "   .\$BackupDir\${BackupName}_restore.ps1" -ForegroundColor $Blue
    
} else {
    Write-Host "❌ Error al crear el backup" -ForegroundColor $Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Backup completado exitosamente" -ForegroundColor $Green
Write-Host "💡 Recuerda:" -ForegroundColor $Yellow
Write-Host "   - Guarda este backup en un lugar seguro" -ForegroundColor $Yellow
Write-Host "   - Haz backup antes de aplicar migraciones RLS" -ForegroundColor $Yellow
Write-Host "   - Prueba la restauración en un entorno de desarrollo" -ForegroundColor $Yellow
