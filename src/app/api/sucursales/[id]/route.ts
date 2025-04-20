import { NextRequest, NextResponse } from 'next/server';
import { SucursalFormValues } from '@/types/empresa';
import { db } from '@/lib/db';

// GET /api/sucursales/[id] - Obtener una sucursal específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de sucursal inválido' },
        { status: 400 }
      );
    }
    
    const url = new URL(req.url);
    const includeEmpresa = url.searchParams.get('include') === 'empresa';
    
    let query;
    
    if (includeEmpresa) {
      query = db.client
        .from('sucursales')
        .select('*, empresas(*)')
        .eq('id', id)
        .single();
    } else {
      query = db.client
        .from('sucursales')
        .select('*')
        .eq('id', id)
        .single();
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }
    
    // Si incluimos la empresa, reformatear la respuesta
    if (includeEmpresa && data.empresas) {
      const empresaData = data.empresas;
      delete data.empresas;
      
      return NextResponse.json({
        ...data,
        empresa: empresaData
      });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error al obtener sucursal:', error);
    return NextResponse.json(
      { error: 'Error al obtener la sucursal' },
      { status: 500 }
    );
  }
}

// PUT /api/sucursales/[id] - Actualizar una sucursal
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de sucursal inválido' },
        { status: 400 }
      );
    }
    
    // Verificar que la sucursal exista
    const { data: sucursalExistente, error: errorSucursal } = await db.client
      .from('sucursales')
      .select('id')
      .eq('id', id)
      .single();
    
    if (errorSucursal || !sucursalExistente) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
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
    
    // Actualizar la sucursal
    const now = new Date().toISOString();
    const { data, error } = await db.client
      .from('sucursales')
      .update({
        nombre: body.nombre,
        direccion: body.direccion,
        telefono: body.telefono,
        email: body.email,
        activo: body.activo,
        modificado_en: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la sucursal' },
      { status: 500 }
    );
  }
}

// DELETE /api/sucursales/[id] - Eliminar una sucursal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de sucursal inválido' },
        { status: 400 }
      );
    }
    
    // Verificar que la sucursal exista
    const { data: sucursalExistente, error: errorSucursal } = await db.client
      .from('sucursales')
      .select('id')
      .eq('id', id)
      .single();
    
    if (errorSucursal || !sucursalExistente) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }
    
    // Eliminar la sucursal
    const { error } = await db.client
      .from('sucursales')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ message: 'Sucursal eliminada correctamente' });
    
  } catch (error) {
    console.error('Error al eliminar sucursal:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la sucursal' },
      { status: 500 }
    );
  }
}