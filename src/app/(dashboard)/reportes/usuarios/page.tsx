'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileSpreadsheet, Info, Eye, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ReporteUsuariosFiltersComponent from '@/components/reportes/ReporteUsuariosFilters';
import { getReporteUsuarios, ReporteUsuariosFilters as ReporteUsuariosFiltersType, Usuario } from '@/services/usuarioService';
import ClienteRestriction from '@/components/auth/ClienteRestriction';
import { useAuth } from '@/hooks/use-auth';

export default function ReporteUsuariosPage() {
  const searchParams = useSearchParams();
  const empresaIdParam = searchParams ? searchParams.get('empresa_id') : null;
  
  const { session, role, loading: authLoading } = useAuth();
  const [reporteItems, setReporteItems] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState<ReporteUsuariosFiltersType | null>(null);
  const [selectedItem, setSelectedItem] = useState<Usuario | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Aplicar filtros iniciales si se proporciona un ID de empresa en la URL (para usuarios con rol cliente)
  useEffect(() => {
    if (empresaIdParam && role === 'cliente') {
      const initialFilters: ReporteUsuariosFiltersType = {
        empresa_id: Number(empresaIdParam),
        activo: true
      };
      
      handleFilter(initialFilters);
    }
  }, [empresaIdParam, role]);

  // Manejar la aplicación de filtros
  const handleFilter = async (filters: ReporteUsuariosFiltersType) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getReporteUsuarios(filters);
      setReporteItems(data);
      setFiltrosAplicados(filters);
    } catch (err: any) {
      console.error('Error al generar reporte:', err);
      setError(err.message || 'Error al generar el reporte');
      setReporteItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar a Excel - Genera el reporte con todos los datos según los filtros aplicados
  const handleExportToExcel = async () => {
    if (!filtrosAplicados) return;
    
    try {
      // Mostrar indicador de carga
      setIsLoading(true);
      
      // Obtener todos los datos directamente del servicio con los filtros actuales
      // Esto asegura que exportamos TODOS los registros, no solo los que se muestran en pantalla
      const allData = await getReporteUsuarios(filtrosAplicados);
      
      if (allData.length === 0) {
        return;
      }
      
      // Formatear datos para Excel
      const dataForExcel = allData.map(item => ({
        'Email': item.email,
        'Nombre Completo': item.nombre_completo || 'Sin nombre',
        'Rol': item.rol_nombre,
        'Empresa': item.empresa_nombre,
        'Fecha Creación': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : 'N/A',
        'Último Acceso': item.last_sign_in_at ? format(new Date(item.last_sign_in_at), 'dd/MM/yyyy') : 'N/A',
        'Estado': item.activo ? 'Activo' : 'Inactivo'
      }));

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
      
      // Configurar formato de celdas para las fechas (dd/mm/aaaa)
      const dateColumns = ['E', 'F']; // Columnas de fecha (E: Fecha Creación, F: Último Acceso)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Iterar sobre las columnas de fecha y aplicar formato
      dateColumns.forEach(col => {
        for (let row = 1; row <= range.e.r; row++) { // Empezar desde 1 para omitir la cabecera
          const cellRef = `${col}${row + 1}`; // +1 porque las filas en XLSX empiezan en 1, pero el rango en 0
          if (worksheet[cellRef]) {
            // Asegurarse de que la celda se trate como texto con formato de fecha
            worksheet[cellRef].z = 'dd/mm/yyyy';
            // Marcar como texto para evitar conversiones automáticas
            worksheet[cellRef].t = 's';
          }
        }
      });

      // Ajustar anchos de columna
      const columnWidths = [
        { wch: 30 }, // Email
        { wch: 25 }, // Nombre Completo
        { wch: 15 }, // Rol
        { wch: 25 }, // Empresa
        { wch: 15 }, // Fecha Creación
        { wch: 15 }, // Último Acceso
        { wch: 10 }  // Estado
      ];
      worksheet['!cols'] = columnWidths;

      // Generar nombre de archivo con fecha
      const fechaHoy = format(new Date(), 'dd-MM-yyyy');
      let fileName = `Reporte_Usuarios_${fechaHoy}.xlsx`;

      // Guardar archivo
      XLSX.writeFile(workbook, fileName);
    } catch (error: any) {
      console.error('Error al exportar a Excel:', error);
      setError(error.message || 'Error al exportar a Excel');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar esqueletos durante la carga
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={index}>
        {Array(7).fill(0).map((_, cellIndex) => (
          <TableCell key={cellIndex}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  // Ver detalles de un usuario
  const handleViewDetails = (item: Usuario) => {
    setSelectedItem(item);
  };

  // Alternar visibilidad de filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Convertimos empresaIdParam a número o undefined para satisfacer el tipo esperado por ClienteRestriction
  const empresaIdNumerico = empresaIdParam ? Number(empresaIdParam) : undefined;
  
  return (
    <ClienteRestriction empresaId={empresaIdNumerico}>
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                <div className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-6 w-6" />
                  Reporte de Usuarios
                </div>
              </CardTitle>
              <CardDescription>
                Visualiza y analiza los usuarios registrados en el sistema
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFilters}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleExportToExcel}
                disabled={reporteItems.length === 0 || isLoading}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Filtros */}
            {showFilters && (
              <ReporteUsuariosFiltersComponent 
                onFilter={handleFilter} 
                isLoading={isLoading} 
                empresaIdFijo={role === 'cliente' ? empresaIdParam : undefined}
              />
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {reporteItems.length === 0 && !isLoading && !error && filtrosAplicados && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>No se encontraron registros con los filtros aplicados.</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="tabla">
              <TabsList>
                <TabsTrigger value="tabla">Tabla</TabsTrigger>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tabla" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        renderSkeletons()
                      ) : reporteItems.length > 0 ? (
                        reporteItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.email}</TableCell>
                            <TableCell>{item.nombre_completo || 'Sin nombre'}</TableCell>
                            <TableCell>{item.rol_nombre}</TableCell>
                            <TableCell>{item.empresa_nombre}</TableCell>
                            <TableCell>
                              {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.activo ? "default" : "secondary"}>
                                {item.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(item)}>
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Detalles del Usuario</DialogTitle>
                                          <DialogDescription>
                                            Información completa del usuario seleccionado
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-4 py-4">
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Email:</h4>
                                            <p className="text-sm">{item.email}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Nombre:</h4>
                                            <p className="text-sm">{item.nombre_completo || 'Sin nombre'}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Rol:</h4>
                                            <p className="text-sm">{item.rol_nombre}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Empresa:</h4>
                                            <p className="text-sm">{item.empresa_nombre}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Fecha de Creación:</h4>
                                            <p className="text-sm">
                                              {item.created_at 
                                                ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: es }) 
                                                : 'N/A'}
                                            </p>
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Último Acceso:</h4>
                                            <p className="text-sm">
                                              {item.last_sign_in_at 
                                                ? format(new Date(item.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: es }) 
                                                : 'N/A'}
                                            </p>
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Estado:</h4>
                                            <Badge variant={item.activo ? "default" : "secondary"}>
                                              {item.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver detalles</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No hay datos disponibles
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="resumen" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Usuarios</CardTitle>
                    <CardDescription>
                      Estadísticas generales de los usuarios según los filtros aplicados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total de Usuarios
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {reporteItems.length}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Usuarios Activos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {reporteItems.filter(item => item.activo).length}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Usuarios Inactivos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {reporteItems.filter(item => !item.activo).length}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ClienteRestriction>
  );
}
