// backend/src/controllers/dashboard.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getDashboardData = async (req, res) => {
  try {
    // Obtener el primer día del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    // Obtener fecha de hace 30 días para la tendencia
    const fecha30DiasAtras = new Date();
    fecha30DiasAtras.setDate(fecha30DiasAtras.getDate() - 30);

    // Consultas en paralelo para mejor rendimiento
    const [
      afiladosMes,
      sierrasActivas,
      ultimosAfilados,
      tendenciaAfilados,
      afiladosPorTipo
    ] = await Promise.all([
      // Afilados del mes actual
      prisma.historial.count({
        where: {
          fecha: {
            gte: inicioMes
          },
          ...(req.user.rol !== 'GERENTE' && {
            sierra: {
              sucursalId: req.user.sucursalId
            }
          })
        }
      }),

      // Sierras activas
      prisma.sierra.count({
        where: {
          estado: true,
          ...(req.user.rol !== 'GERENTE' && {
            sucursalId: req.user.sucursalId
          })
        }
      }),

      // Últimos afilados
      prisma.historial.findMany({
        take: 10,
        where: {
          ...(req.user.rol !== 'GERENTE' && {
            sierra: {
              sucursalId: req.user.sucursalId
            }
          })
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
      }),

      // Tendencia de afilados últimos 30 días
      prisma.historial.groupBy({
        by: ['fecha'],
        where: {
          fecha: {
            gte: fecha30DiasAtras
          },
          ...(req.user.rol !== 'GERENTE' && {
            sierra: {
              sucursalId: req.user.sucursalId
            }
          })
        },
        _count: {
          id: true
        }
      }),

      // Afilados por tipo
      prisma.historial.groupBy({
        by: ['tipoAfilado'],
        where: {
          fecha: {
            gte: inicioMes
          },
          ...(req.user.rol !== 'GERENTE' && {
            sierra: {
              sucursalId: req.user.sucursalId
            }
          })
        },
        _count: {
          id: true
        }
      })
    ]);

    // Calcular alertas (sierras con más de 30 días desde su último afilado)
    const alertas = await prisma.sierra.count({
      where: {
        estado: true,
        historial: {
          some: {
            fecha: {
              lt: fecha30DiasAtras
            }
          }
        },
        ...(req.user.rol !== 'GERENTE' && {
          sucursalId: req.user.sucursalId
        })
      }
    });

    // Formatear datos de tendencia
    const tendenciaFormateada = tendenciaAfilados.map(item => ({
      fecha: item.fecha.toISOString().split('T')[0],
      cantidad: item._count.id
    })).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Formatear datos por tipo
    const tiposProcesados = afiladosPorTipo.map(item => ({
      tipo: item.tipoAfilado,
      cantidad: item._count.id
    }));

    res.json({
      afiladosMes,
      sierrasActivas,
      alertas,
      ultimosAfilados,
      tendenciaAfilados: tendenciaFormateada,
      afiladosPorTipo: tiposProcesados
    });

  } catch (error) {
    console.error('Error en getDashboardData:', error);
    res.status(500).json({
      message: 'Error al obtener datos del dashboard'
    });
  }
};

// Obtener datos específicos de una sucursal
export const getDashboardBySucursal = async (req, res) => {
  try {
    const { sucursalId } = req.params;
    
    // Replicar la lógica anterior pero filtrado por sucursal
    // ... código similar al anterior pero con where: { sucursalId: Number(sucursalId) }
    
    const data = {
      // ... datos específicos de la sucursal
    };

    res.json(data);
  } catch (error) {
    console.error('Error en getDashboardBySucursal:', error);
    res.status(500).json({
      message: 'Error al obtener datos del dashboard para la sucursal'
    });
  }
};