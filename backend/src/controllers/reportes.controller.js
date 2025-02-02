// backend/src/controllers/reportes.controller.js
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export const getPeriodoFechas = (periodo) => {
  const fechaFin = new Date();
  const fechaInicio = new Date();

  switch (periodo) {
    case 'mes':
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
      break;
    case 'trimestre':
      fechaInicio.setMonth(fechaInicio.getMonth() - 3);
      break;
    case 'año':
      fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
      break;
    default:
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
  }

  return { fechaInicio, fechaFin };
};


export const getAfiladosPorSucursal = async (req, res) => {
  try {
    const { periodo } = req.query;
    const { fechaInicio, fechaFin } = getPeriodoFechas(periodo);

    // Obtenemos las sucursales con el conteo de afilados
    const resultado = await prisma.sucursal.findMany({
      select: {
        nombre: true,
        sierras: {
          select: {
            historial: {
              where: {
                fecha: {
                  gte: fechaInicio,
                  lte: fechaFin
                }
              }
            }
          }
        }
      }
    });

    // Procesamos los datos para el formato requerido
    const datosProcesados = resultado.map(sucursal => ({
      sucursal: sucursal.nombre,
      cantidad: sucursal.sierras.reduce((total, sierra) => 
        total + sierra.historial.length, 0
      )
    })).sort((a, b) => b.cantidad - a.cantidad);

    res.json(datosProcesados);
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ 
      message: 'Error al obtener reporte de afilados por sucursal',
      error: error.message 
    });
  }
};

export const getAfiladosPorSierra = async (req, res) => {
  try {
    const { periodo } = req.query;
    const { fechaInicio, fechaFin } = getPeriodoFechas(periodo);

    const afilados = await prisma.historial.groupBy({
      by: ['sierraId'],
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      _count: {
        _all: true
      }
    });

    const sierras = await prisma.sierra.findMany({
      include: {
        tipoSierra: true
      }
    });

    const sierraMap = sierras.reduce((acc, sierra) => {
      acc[sierra.id] = {
        codigo: sierra.codigo,
        tipo: sierra.tipoSierra.nombre
      };
      return acc;
    }, {});

    const resultado = afilados.map(item => ({
      sierra: sierraMap[item.sierraId].codigo,
      tipo: sierraMap[item.sierraId].tipo,
      cantidad: item._count._all
    }));

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener reporte de afilados por sierra' });
  }
};

export const getAfiladosPorFecha = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, agrupacion = 'dia' } = req.query;
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);

    const afilados = await prisma.historial.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    let resultado;
    switch (agrupacion) {
      case 'semana':
        resultado = agruparPorSemana(afilados);
        break;
      case 'mes':
        resultado = agruparPorMes(afilados);
        break;
      default: // día
        resultado = agruparPorDia(afilados);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error en getAfiladosPorFecha:', error);
    res.status(500).json({ 
      message: 'Error al obtener reporte de afilados por fecha',
      error: error.message 
    });
  }
};

// Funciones auxiliares para agrupación
const agruparPorDia = (afilados) => {
  const grupos = afilados.reduce((acc, afilado) => {
    const fecha = afilado.fecha.toISOString().split('T')[0];
    if (!acc[fecha]) {
      acc[fecha] = {
        fecha,
        cantidad: 0
      };
    }
    acc[fecha].cantidad += 1;
    return acc;
  }, {});

  return Object.values(grupos)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
};

const agruparPorSemana = (afilados) => {
  const grupos = afilados.reduce((acc, afilado) => {
    const fecha = new Date(afilado.fecha);
    const inicioSemana = getInicioSemana(fecha);
    const claveSemana = inicioSemana.toISOString().split('T')[0];

    if (!acc[claveSemana]) {
      acc[claveSemana] = {
        fecha: `Semana del ${claveSemana}`,
        cantidad: 0
      };
    }
    acc[claveSemana].cantidad += 1;
    return acc;
  }, {});

  return Object.values(grupos)
    .sort((a, b) => new Date(a.fecha.split(' ')[2]) - new Date(b.fecha.split(' ')[2]));
};

const agruparPorMes = (afilados) => {
  const grupos = afilados.reduce((acc, afilado) => {
    const fecha = afilado.fecha;
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[mes]) {
      acc[mes] = {
        fecha: mes,
        cantidad: 0
      };
    }
    acc[mes].cantidad += 1;
    return acc;
  }, {});

  return Object.values(grupos)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
};

const getInicioSemana = (fecha) => {
  const diaInicio = new Date(fecha);
  diaInicio.setDate(fecha.getDate() - fecha.getDay()); // Domingo como inicio de semana
  diaInicio.setHours(0, 0, 0, 0);
  return diaInicio;
};


export const getEstadisticasGenerales = async (req, res) => {
  try {
    const totalAfilados = await prisma.historial.count();
    
    // Obtenemos los afilados por tipo de una manera diferente
    const afiladosPorTipo = await prisma.historial.groupBy({
      by: ['tipoAfilado'],
      _count: true
    });

    // Transformamos los datos para el gráfico
    const datosAfilados = afiladosPorTipo.map(tipo => ({
      nombre: tipo.tipoAfilado === 'LOMO' ? 'Afilado de Lomo' :
              tipo.tipoAfilado === 'PECHO' ? 'Afilado de Pecho' :
              'Afilado Completo',
      tipoAfilado: tipo.tipoAfilado,
      cantidad: tipo._count
    }));

    const ultimosSieteAfilados = await prisma.historial.findMany({
      take: 7,
      orderBy: {
        fecha: 'desc'
      },
      include: {
        sierra: true,
        usuario: {
          select: {
            nombre: true
          }
        }
      }
    });

    // Agregamos conteo de sierras activas
    const sierrasActivas = await prisma.sierra.count({
      where: {
        estado: true
      }
    });

    res.json({
      totalAfilados,
      afiladosPorTipo: datosAfilados,
      sierrasActivas,
      ultimosAfilados: ultimosSieteAfilados
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener estadísticas generales' });
  }
};

// Funciones de exportación
export const exportarAfiladosPorSucursal = async (req, res) => {
  try {
    const { periodo } = req.query;
    const { fechaInicio, fechaFin } = getPeriodoFechas(periodo);

    const afilados = await prisma.historial.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        sierra: {
          include: {
            sucursal: true,
            tipoSierra: true
          }
        },
        usuario: true
      }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Afilados por Sucursal');

    // Configurar encabezados
    worksheet.columns = [
      { header: 'Sucursal', key: 'sucursal', width: 20 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Sierra', key: 'sierra', width: 15 },
      { header: 'Tipo Sierra', key: 'tipoSierra', width: 15 },
      { header: 'Tipo Afilado', key: 'tipoAfilado', width: 15 },
      { header: 'Usuario', key: 'usuario', width: 20 }
    ];

    // Agregar datos
    afilados.forEach(afilado => {
      worksheet.addRow({
        sucursal: afilado.sierra.sucursal.nombre,
        fecha: afilado.fecha.toLocaleDateString(),
        sierra: afilado.sierra.codigo,
        tipoSierra: afilado.sierra.tipoSierra.nombre,
        tipoAfilado: afilado.tipoAfilado,
        usuario: afilado.usuario.nombre
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=afilados-por-sucursal.xlsx'
    );

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al exportar reporte' });
  }
};

// Implementar las otras funciones de exportación de manera similar...
export const exportarAfiladosPorSierra = async (req, res) => {
  try {
    const { periodo } = req.query;
    const { fechaInicio, fechaFin } = getPeriodoFechas(periodo);

    // Obtener los datos
    const afilados = await prisma.historial.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        sierra: {
          include: {
            tipoSierra: true,
            sucursal: true
          }
        },
        usuario: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    // Crear el libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Afilados por Sierra');

    // Configurar encabezados
    worksheet.columns = [
      { header: 'Código Sierra', key: 'codigoSierra', width: 15 },
      { header: 'Tipo Sierra', key: 'tipoSierra', width: 15 },
      { header: 'Sucursal', key: 'sucursal', width: 20 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Tipo Afilado', key: 'tipoAfilado', width: 15 },
      { header: 'Usuario', key: 'usuario', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 }
    ];

    // Agregar datos
    afilados.forEach(afilado => {
      worksheet.addRow({
        codigoSierra: afilado.sierra.codigo,
        tipoSierra: afilado.sierra.tipoSierra.nombre,
        sucursal: afilado.sierra.sucursal.nombre,
        fecha: new Date(afilado.fecha).toLocaleDateString(),
        tipoAfilado: afilado.tipoAfilado,
        usuario: afilado.usuario.nombre,
        estado: afilado.sierra.estado ? 'Activa' : 'Inactiva'
      });
    });

    // Dar formato a la tabla
    worksheet.getRow(1).font = { bold: true };
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Configurar las cabeceras de la respuesta
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=afilados-por-sierra-${periodo}.xlsx`
    );

    // Enviar el archivo
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('Error al exportar reporte:', error);
    res.status(500).json({
      message: 'Error al exportar reporte de afilados por sierra',
      error: error.message
    });
  }
};

export const exportarAfiladosPorFecha = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, agrupacion } = req.query;
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);

    const afilados = await prisma.historial.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        sierra: {
          include: {
            tipoSierra: true,
            sucursal: true
          }
        },
        usuario: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    // Crear el libro Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Afilados por Fecha');

    // Configurar columnas
    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Sierra', key: 'sierra', width: 15 },
      { header: 'Tipo Sierra', key: 'tipoSierra', width: 15 },
      { header: 'Sucursal', key: 'sucursal', width: 20 },
      { header: 'Tipo Afilado', key: 'tipoAfilado', width: 15 },
      { header: 'Usuario', key: 'usuario', width: 20 },
      { header: 'Observaciones', key: 'observaciones', width: 30 }
    ];

    // Agregar datos
    afilados.forEach(afilado => {
      worksheet.addRow({
        fecha: new Date(afilado.fecha).toLocaleString(),
        sierra: afilado.sierra.codigo,
        tipoSierra: afilado.sierra.tipoSierra.nombre,
        sucursal: afilado.sierra.sucursal.nombre,
        tipoAfilado: afilado.tipoAfilado,
        usuario: afilado.usuario.nombre,
        observaciones: afilado.observaciones || ''
      });
    });

    // Dar formato
    worksheet.getRow(1).font = { bold: true };
    worksheet.eachRow({ includeEmpty: true }, row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Agregar resumen
    const totalRow = worksheet.addRow({
      fecha: 'Total Afilados:',
      sierra: afilados.length
    });
    totalRow.font = { bold: true };

    // Configurar respuesta
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=afilados-${fechaInicio}-a-${fechaFin}.xlsx`
    );

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('Error al exportar:', error);
    res.status(500).json({
      message: 'Error al exportar reporte de afilados por fecha',
      error: error.message
    });
  }
};