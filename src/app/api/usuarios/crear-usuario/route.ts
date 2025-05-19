import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Crear un cliente de Supabase con credenciales de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { email, password, nombre_completo, rol_id, empresa_id, activo } = requestData;
    
    // Validaciones básicas
    if (!email || !password || !nombre_completo || !rol_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    console.log('Creando usuario con datos:', { 
      email, 
      nombre_completo, 
      rol_id, 
      empresa_id: empresa_id || null 
    });
    
    // Crear usuario en Auth
    console.log('Intentando crear usuario con Supabase Admin');
    console.log('URL de Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('¿Tiene clave de servicio?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
        rol_id
      }
    });
    
    if (authError) {
      console.error('Error detallado al crear usuario en Auth:', JSON.stringify(authError));
      return NextResponse.json(
        { error: `Error al crear usuario en Auth: ${authError.message}` },
        { status: 400 }
      );
    }
    
    if (!authData || !authData.user) {
      console.error('No se recibieron datos de usuario después de la creación');
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      );
    }
    
    console.log('Usuario creado exitosamente en Auth:', authData.user.id);
    
    // Esperar un momento para que el trigger tenga tiempo de ejecutarse
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar si el usuario fue creado en la tabla usuarios por el trigger
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    // Si el usuario no fue creado automáticamente por el trigger, lo creamos manualmente
    if (userError) {
      console.log('El trigger no creó el usuario automáticamente, creando manualmente');
      
      const { error: insertError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email,
          nombre_completo,
          rol_id,
          empresa_id: empresa_id || null,
          activo: activo !== false,
          creado_en: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error al crear usuario manualmente:', insertError);
        
        // Intentar eliminar el usuario de Auth si falla la creación en la tabla usuarios
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        
        return NextResponse.json(
          { error: 'Error al crear el usuario en la base de datos' },
          { status: 500 }
        );
      }
    } else {
      // El usuario fue creado por el trigger, pero podría necesitar actualización
      // para campos como empresa_id que no están en el trigger
      if (userData && (empresa_id || activo === false)) {
        console.log('Usuario creado por trigger, actualizando campos adicionales');
        
        const updateData: any = {};
        
        if (empresa_id) {
          updateData.empresa_id = empresa_id;
        }
        
        if (activo === false) {
          updateData.activo = false;
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from('usuarios')
            .update(updateData)
            .eq('id', authData.user.id);
            
          if (updateError) {
            console.error('Error al actualizar campos adicionales:', updateError);
            // No fallamos la operación completa por esto
          }
        }
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
