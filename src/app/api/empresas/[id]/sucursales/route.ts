import { NextRequest, NextResponse } from 'next/server';
import { SucursalFormValues } from '@/types/empresa';
import { createServerClient } from '@/lib/supabase-server';

// GET /api/empresas/[id]/sucursales - Obtener todas las sucursales de una empresa
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = parseInt(params.id);
    
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID de empresa inválido' },
        { status: 400 }
      );
    }
    
    // Crear cliente de Supabase para el servidor
    const supabase = createServerClient();
    
    // Verificar que la empresa exista
    const empresaExistente = await supabase
      .from('empresas')
      .select('id')
      .eq('id', empresaId)
      .single();
      
    if (empresaExistente.error || !empresaExistente.data) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const activo = url.searchParams.get('activo');
    
    const offset = (page - 1) * limit;
    
    // Construir consulta
    let query = supabase
      .from('sucursales')
      .select('*', { count: 'exact' })
      .eq('empresa_id', empresaId);
    
    // Agregar filtros según los parámetros
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,direccion.ilike.%${search}%`);
    }
    
    if (activo !== null && activo !== undefined) {
      query = query.eq('activo', activo === 'true');
    }
    
    // Ejecutar consulta con paginación
    const { data, error, count } = await query
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Error al obtener sucursales de la empresa:', error);
    return NextResponse.json(
      { error: 'Error al obtener las sucursales de la empresa' },
      { status: 500 }
    );
  }
}

// POST /api/empresas/[id]/sucursales - Crear una nueva sucursal para una empresa
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = parseInt(params.id);
    
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID de empresa inválido' },
        { status: 400 }
      );
    }
    
    // Crear cliente de Supabase para el servidor
    const supabase = createServerClient();
    
    // Verificar que la empresa exista
    const empresaExistente = await supabase
      .from('empresas')
      .select('id')
      .eq('id', empresaId)
      .single();
      
    if (empresaExistente.error || !empresaExistente.data) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }
    
    const body: Omit<SucursalFormValues, 'empresa_id'> = await req.json();
    
    // Validar los datos de entrada
    if (!body.nombre || !body.direccion || !body.telefono || !body.email) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }
    
    // Insertar la nueva sucursal
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('sucursales')
      .insert({
        empresa_id: empresaId,
        nombre: body.nombre,
        direccion: body.direccion,
        telefono: body.telefono,
        email: body.email,
        activo: body.activo !== undefined ? body.activo : true,
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
    console.error('Error al crear sucursal para la empresa:', error);
    return NextResponse.json(
      { error: 'Error al crear la sucursal para la empresa' },
      { status: 500 }
    );
  }
}