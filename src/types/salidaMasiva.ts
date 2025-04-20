import { Afilado } from './afilado';
import { Sucursal } from './sucursal';

export interface SalidaMasiva {
  id: number;
  usuario_id: string;
  sucursal_id: number;
  fecha_salida: string;
  observaciones: string | null;
  creado_en: string;
}

export interface SalidaMasivaConRelaciones extends SalidaMasiva {
  sucursal?: Sucursal;
  afilados?: Afilado[];
}

export interface SalidaMasivaDetalle {
  id: number;
  salida_masiva_id: number;
  afilado_id: number;
}

export interface SalidaMasivaInput {
  sucursal_id: number;
  fecha_salida: string;
  observaciones?: string;
  afilados_ids: number[];
}
