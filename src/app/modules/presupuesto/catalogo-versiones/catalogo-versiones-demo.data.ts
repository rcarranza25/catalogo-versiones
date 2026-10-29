/**
 * Nombres canónicos del escenario de demostración de Configuración de Versiones.
 * La clave incluye año, proceso y código: el código no es único entre procesos.
 */
export const PROCESO_ASIGNACION = 'M02.1.9.1 Asignación Presupuestaria Multianual';
export const PROCESO_PROGRAMACION_UE = 'M02.1.9.2 Programación Multianual Pliego - UE';

const NOMBRES_DEMO_2026: Record<string, string> = {
  [`2026|${PROCESO_ASIGNACION}|1`]: 'Asignación Presupuestaria Multianual versión inicial',
  [`2026|${PROCESO_ASIGNACION}|2`]: 'Asignación Presupuestaria Multianual versión actualizada',
  [`2026|${PROCESO_ASIGNACION}|3`]: 'Asignación Presupuestaria Multianual versión actualizada por los Pliegos',
  [`2026|${PROCESO_ASIGNACION}|4`]: 'Asignación Presupuestaria Multianual versión enviada a PCM',
  [`2026|${PROCESO_ASIGNACION}|5`]: 'Asignación Presupuestaria Multianual periodo 2027 - 2029',
  [`2026|${PROCESO_PROGRAMACION_UE}|1`]: 'Programación Multianual Presupuestaria del Pliego y UEs',
};

/** Sólo esta descripción forma parte de las denominaciones actualizadas. */
const DESCRIPCIONES_DEMO_2026: Record<string, string> = {
  [`2026|${PROCESO_PROGRAMACION_UE}|1`]: 'Programación Multianual Presupuestaria del Pliego y UEs usando de insumo la APM aprobada por la PCM.',
};

export type VersionDemoConNombre = {
  anio: string;
  proceso: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  vinculada?: { anio: string; proceso: string; codigo: string; nombre: string };
};

export function nombreDemoVersion(anio: string, proceso: string, codigo: string): string | undefined {
  return NOMBRES_DEMO_2026[`${anio}|${proceso}|${codigo}`];
}

export function descripcionDemoVersion(anio: string, proceso: string, codigo: string): string | undefined {
  return DESCRIPCIONES_DEMO_2026[`${anio}|${proceso}|${codigo}`];
}

/** Actualiza sólo los datos demostrativos solicitados, sin modificar IDs, condiciones ni estados. */
export function sincronizarNombresDemo<T extends VersionDemoConNombre>(registros: T[]): T[] {
  return registros.map(registro => {
    const nombre = nombreDemoVersion(registro.anio, registro.proceso, registro.codigo);
    const descripcion = descripcionDemoVersion(registro.anio, registro.proceso, registro.codigo);
    const vinculada = registro.vinculada;
    const nombreVinculada = vinculada && nombreDemoVersion(vinculada.anio, vinculada.proceso, vinculada.codigo);
    if (
      (!nombre || nombre === registro.nombre)
      && (!descripcion || descripcion === registro.descripcion)
      && (!nombreVinculada || !vinculada || nombreVinculada === vinculada.nombre)
    ) return registro;
    return {
      ...registro,
      ...(nombre ? { nombre } : {}),
      ...(descripcion ? { descripcion } : {}),
      ...(vinculada && nombreVinculada ? { vinculada: { ...vinculada, nombre: nombreVinculada } } : {}),
    };
  });
}
