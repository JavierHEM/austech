# Documentación de Módulos de Salida Masiva y Baja Masiva

## Introducción

Este documento describe la implementación y funcionamiento de los módulos de Salida Masiva y Baja Masiva de sierras en el sistema de gestión de afilado de sierras Austech.

## Módulo de Salida Masiva

El módulo de Salida Masiva permite registrar la salida de múltiples sierras de forma simultánea, optimizando el proceso de entrega de sierras a los clientes.

### Funcionalidades

- Registro de salida masiva de sierras mediante escaneo de códigos de barras
- Verificación automática de que las sierras estén en estado "Lista para retiro" o "En proceso de afilado"
- Actualización automática del estado de las sierras a "Disponible" al registrar la salida
- Posibilidad de registrar salidas de sierras que aún están en proceso de afilado
- Registro de fecha de salida en los afilados correspondientes
- Visualización detallada de las salidas masivas registradas
- Posibilidad de eliminar salidas masivas y revertir los cambios en sierras y afilados

### Flujo de Trabajo

1. Acceder al módulo de Salida Masiva desde el menú principal o el dashboard
2. Seleccionar la sucursal correspondiente
3. Establecer la fecha de salida (por defecto es la fecha actual)
4. Activar el escáner de códigos de barras
5. Escanear las sierras que se entregarán
   - El sistema verifica automáticamente que cada sierra:
     - Exista en la base de datos
     - Esté en estado "Lista para retiro" o "En proceso de afilado"
     - No tenga fecha de salida registrada en su último afilado
   - Si la sierra está en estado "En proceso de afilado", se mostrará una advertencia indicando que se cambiará a "Disponible" al registrar la salida
6. Revisar la lista de sierras escaneadas
7. Registrar la salida masiva
8. El sistema actualiza automáticamente:
   - La fecha de salida en los afilados correspondientes
   - El estado de las sierras a "Disponible"

## Módulo de Baja Masiva

El módulo de Baja Masiva permite marcar múltiples sierras como fuera de servicio de forma simultánea, facilitando el proceso de dar de baja sierras que ya no pueden ser afiladas.

### Funcionalidades

- Registro de baja masiva de sierras mediante escaneo de códigos de barras
- Verificación automática de que las sierras estén activas
- Actualización automática del estado de las sierras a "Fuera de servicio" y marcado como inactivas
- Visualización detallada de las bajas masivas registradas
- Posibilidad de eliminar bajas masivas y revertir los cambios en las sierras

### Flujo de Trabajo

1. Acceder al módulo de Baja Masiva desde el menú principal o el dashboard
2. Establecer la fecha de baja (por defecto es la fecha actual)
3. Activar el escáner de códigos de barras
4. Escanear las sierras que se darán de baja
   - El sistema verifica automáticamente que cada sierra:
     - Exista en la base de datos
     - Esté activa (campo "activo" = TRUE)
5. Revisar la lista de sierras escaneadas
6. Registrar la baja masiva
7. El sistema actualiza automáticamente:
   - El estado de las sierras a "Fuera de servicio"
   - El campo "activo" de las sierras a FALSE

## Consideraciones Técnicas

### Base de Datos

Los módulos utilizan las siguientes tablas:

- `salidas_masivas`: Almacena la información principal de las salidas masivas
- `salida_masiva_afilados`: Relación entre salidas masivas y afilados
- `bajas_masivas`: Almacena la información principal de las bajas masivas
- `baja_masiva_sierras`: Relación entre bajas masivas y sierras, incluyendo el estado anterior de la sierra

### Componentes Principales

- **SalidaMasivaForm**: Formulario para registrar una nueva salida masiva
- **SalidaMasivaList**: Listado de todas las salidas masivas registradas
- **SalidaMasivaDetail**: Detalle de una salida masiva específica
- **BajaMasivaForm**: Formulario para registrar una nueva baja masiva
- **BajaMasivaList**: Listado de todas las bajas masivas registradas
- **BajaMasivaDetail**: Detalle de una baja masiva específica
- **ScannerComponent**: Componente reutilizable para escanear códigos de barras

### Servicios

- **salidaMasivaService**: Funciones para interactuar con la API de salidas masivas
- **bajaMasivaService**: Funciones para interactuar con la API de bajas masivas

## Permisos y Roles

- Los módulos de Salida Masiva y Baja Masiva están disponibles solo para usuarios con roles de Gerente y Administrador
- Los usuarios con rol Cliente no tienen acceso a estos módulos

## Flujo de Trabajo de Afilado y Estados de Sierra

### Estados de Sierra

1. **Disponible**: Estado inicial de una sierra nueva o que ha sido entregada al cliente.
2. **En proceso de afilado**: Estado de una sierra que está siendo afilada.
3. **Lista para retiro**: Estado de una sierra que ha completado el proceso de afilado y está lista para ser entregada al cliente.
4. **Fuera de servicio**: Estado de una sierra que ha sido dada de baja y ya no puede ser utilizada.

### Cambio de Estado en Lista de Sierras

En la lista de sierras, se ha agregado un botón de acción rápida que permite cambiar el estado de una sierra de "En proceso de afilado" a "Lista para retiro" directamente desde la lista, sin necesidad de editar la sierra. Este botón solo aparece para sierras que están en estado "En proceso de afilado".

### Registro de Salida con Sierras en Proceso

El sistema ahora permite registrar la salida de sierras que aún están en estado "En proceso de afilado", cambiándolas automáticamente a "Disponible". Esto es útil cuando el trabajador no ha actualizado el estado de la sierra a "Lista para retiro" pero el cliente ya está listo para retirarla.

## Recomendaciones de Uso

1. Utilizar un escáner de códigos de barras para optimizar el proceso
2. Siempre que sea posible, actualizar el estado de las sierras a "Lista para retiro" cuando se complete el proceso de afilado
3. Utilizar la función de salida masiva para sierras en estado "En proceso de afilado" solo cuando sea necesario
4. Revisar la lista de sierras escaneadas antes de confirmar la operación
5. En caso de error, utilizar la función de eliminar para revertir los cambios
