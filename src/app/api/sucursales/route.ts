import { NextRequest, NextResponse } from 'next/server';
import { SucursalFormValues } from '@/types/empresa';
import { createServerClient } from '@/lib/supabase-server';

// GET /api/sucursales - Obtener todas las sucursales
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const empresaId = url.searchParams.get('empresa_id');
    const activo = url.searchParams.get('activo');
    
    const offset = (page - 1) * limit;
    
    // Crear cliente de Supabase para el servidor
    const supabase = createServerClient();
    
    // Construir consulta básica
    let query = supabase
      .from('sucursales')
      .select('*, empresas(id, razon_social, rut)', { count: 'exact' });
    
    // Agregar filtros según los parámetros
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,direccion.ilike.%${search}%`);
    }
    
    if (empresaId) {
      query = query.eq('empresa_id', parseInt(empresaId));
    }
    
    if (activo !== null && activo !== undefined) {
      query = query.eq('activo', activo === 'true');
    }
    
    // Ejecutar consulta con paginación y ordenamiento
    const { data, error, count } = await query
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    // Transformar los resultados para incluir la información de la empresa
    const sucursales = data?.map((row: any) => {
      const empresaData = row.empresas;
      delete row.empresas;
      
      return {
        ...row,
        empresa: empresaData ? {
          id: empresaData.id,
          razon_social: empresaData.razon_social,
          rut: empresaData.rut
        } : null
      };
    });
    
    return NextResponse.json({
      data: sucursales || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    return NextResponse.json(
      { error: 'Error al obtener las sucursales' },
      { status: 500 }
    );
  }
}

// POST /api/sucursales - Crear una nueva sucursal
export async function POST(req: NextRequest) {
  try {
    const body: SucursalFormValues = await req.json();
    
    // Validar los datos de entrada
    if (!body.nombre || !body.direccion || !body.telefono || !body.email || !body.empresa_id) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }
    
    // Crear cliente de Supabase para el servidor
    const supabase = createServerClient();
    
    // Verificar que la empresa exista
    const { data: empresaExistente, error: errorEmpresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', body.empresa_id)
      .single();
    
    if (errorEmpresa || !empresaExistente) {
      return NextResponse.json(
        { error: 'La empresa seleccionada no existe' },
        { status: 400 }
      );
    }
    
    // Insertar la nueva sucursal
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('sucursales')
      .insert({
        empresa_id: body.empresa_id,
        nombre: body.nombre,
        direccion: body.direccion,
        telefono: body.telefono,
        email: body.email,
        activo: body.activo,
        creado_en: now,
        modificado_en: now
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    return NextResponse.json(
      { error: 'Error al crear la sucursal' },
      { status: 500 }
    );
  }
}