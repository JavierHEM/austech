import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { email, password, nombre_completo, rol_id, activo } = requestData;
    
    // Validaciones básicas
    if (!email || !password || !nombre_completo || !rol_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Crear cliente de Supabase con cookies del servidor
    const supabase = createRouteHandlerClient({ cookies });
    
    // Crear usuario en Auth sin iniciar sesión automáticamente
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
        rol_id
      }
    });
    
    if (authError) {
      console.error('Error al crear usuario en Auth:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }
    
    if (!authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      );
    }
    
    // Esperar un momento para que el trigger tenga tiempo de ejecutarse
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar si el usuario fue creado en la tabla usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    // Si hay un error, significa que el usuario no fue creado en la tabla usuarios
    if (userError) {
      console.error('Error al verificar la creación del usuario en la tabla usuarios:', userError);
      
      // Intentamos actualizar manualmente el usuario en la tabla usuarios
      const { error: updateError } = await supabase
        .from('usuarios')
        .upsert({
          id: authData.user.id,
          email,
          nombre_completo,
          rol_id,
          activo: activo !== false
        });
        
      if (updateError) {
        console.error('Error al actualizar manualmente el usuario:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar el usuario en la tabla usuarios' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      data: authData.user
    });
  } catch (error: any) {
    console.error('Error en el endpoint de creación de usuarios:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
