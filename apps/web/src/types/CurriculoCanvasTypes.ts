export type TipoNodoCurricular = 'materia' | 'unidad' | 'tema' | 'concepto';
export type OrigenNodoCurricular = 'materia' | 'usuario' | 'ia';
export type RevisionNodoCurricular = 'original' | 'nuevo' | 'modificado' | 'pendiente_revision';
export type EstadoConcepto = 'visto' | 'planeado' | 'con_contenido' | 'sin_contenido';

export interface ContenidoCurricular {
  id: string;
  descripcion: string;
  origen: OrigenNodoCurricular;
  revisionEstado: RevisionNodoCurricular;
}

export interface NodoCurricular {
  id: string;
  tipo: TipoNodoCurricular;
  nombre: string;
  origen: OrigenNodoCurricular;
  revisionEstado: RevisionNodoCurricular;
  estadoConcepto?: EstadoConcepto;
  contenido: ContenidoCurricular[];
  hijos: NodoCurricular[];
}
