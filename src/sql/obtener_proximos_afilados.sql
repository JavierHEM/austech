-- Función para obtener los próximos afilados estimados por empresa
CREATE OR REPLACE FUNCTION public.obtener_proximos_afilados_por_empresa(empresa_id_param integer)
RETURNS TABLE(
  id uuid,
  codigo_barras text,
  tipo text,
  fecha_estimada date,
  dias_restantes integer
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ultimo_afilado AS (
    SELECT 
      s.id AS sierra_id,
      s.codigo_barras AS sierra_codigo,
      ts.nombre AS tipo_sierra,
      MAX(a.fecha_afilado) AS ultima_fecha,
      COALESCE(ts.dias_entre_afilados, 30) AS dias_entre_afilados
    FROM 
      sierras s
      JOIN tipos_sierra ts ON s.tipo_sierra_id = ts.id
      LEFT JOIN afilados a ON s.id = a.sierra_id
    WHERE 
      s.empresa_id = empresa_id_param
      AND s.activo = true
    GROUP BY 
      s.id, s.codigo, ts.nombre, ts.dias_entre_afilados
  )
  SELECT 
    ua.sierra_id::uuid AS id,
    ua.sierra_codigo AS codigo,
    ua.tipo_sierra AS tipo,
    (ua.ultima_fecha + (ua.dias_entre_afilados || ' days')::interval)::date AS fecha_estimada,
    EXTRACT(DAY FROM ((ua.ultima_fecha + (ua.dias_entre_afilados || ' days')::interval) - CURRENT_DATE))::integer AS dias_restantes
  FROM 
    ultimo_afilado ua
  WHERE 
    ua.ultima_fecha IS NOT NULL
  ORDER BY 
    dias_restantes ASC;
END;
$$;
