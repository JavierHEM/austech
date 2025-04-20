import { Sierra } from './sierra';

export interface BajaMasiva {
  id: number;
  usuario_id: string;
  fecha_baja: string;
  observaciones: string | null;
  creado_en: string;
  modificado_en: string;
}

export interface BajaMasivaConRelaciones extends BajaMasiva {
  sierras?: Sierra[];
}

export interface BajaMasivaDetalle {
  id: number;
  baja_masiva_id: number;
  sierra_id: number;
  estado_anterior: boolean;
}

export interface BajaMasivaInput {
  fecha_baja: string;
  observaciones?: string;
  sierras_ids: number[];
}
