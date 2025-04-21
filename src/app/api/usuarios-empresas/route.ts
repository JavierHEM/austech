import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Obtener todas las relaciones usuario-empresa
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('usuarios_empresas')
      .select(`
        id,
        usuario_id,
        empresa_id,
        usuarios:usuario_id (id, email, user_metadata),
        empresas:empresa_id (id, nombre)
      `);

    if (error) {
      console.error('Error al obtener relaciones usuario-empresa:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en GET /api/usuarios-empresas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Crear una nueva relación usuario-empresa
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuario_id, empresa_id } = body;

    if (!usuario_id || !empresa_id) {
      return NextResponse.json(
        { error: 'Se requieren usuario_id y empresa_id' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Verificar si la relación ya existe
    const { data: existingData, error: existingError } = await supabase
      .from('usuarios_empresas')
      .select('*')
      .eq('usuario_id', usuario_id)
      .eq('empresa_id', empresa_id)
      .maybeSingle();

    if (existingError) {
      console.error('Error al verificar relación existente:', existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    // Si la relación ya existe, devolver error
    if (existingData) {
      return NextResponse.json(
        { error: 'Esta relación usuario-empresa ya existe' },
        { status: 400 }
      );
    }

    // Crear la nueva relación
    const { data, error } = await supabase
      .from('usuarios_empresas')
      .insert([{ usuario_id, empresa_id }])
      .select();

    if (error) {
      console.error('Error al crear relación usuario-empresa:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/usuarios-empresas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Eliminar una relación usuario-empresa
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la relación' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('usuarios_empresas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar relación usuario-empresa:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en DELETE /api/usuarios-empresas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
