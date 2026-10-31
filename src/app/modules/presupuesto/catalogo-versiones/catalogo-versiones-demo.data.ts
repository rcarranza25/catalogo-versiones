/**
 * Nombres canónicos del escenario de demostración de Configuración de Versiones.
 * La clave incluye año, proceso y código: el código no es único entre procesos.
 */
export const PROCESO_ASIGNACION = 'M02.1.9.1 Asignación Presupuestaria Multianual';
export const PROCESO_PROGRAMACION_UE = 'M02.1.9.2 Programación Multianual Pliego - UE';
/** Año base del escenario; las pantallas del catálogo lo consumen desde aquí. */
export const ANIO_DEMO = '2027';

const NOMBRES_DEMO: Record<string, string> = {
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|1`]: 'Asignación Presupuestaria Multianual versión inicial',
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|2`]: 'Asignación Presupuestaria Multianual versión actualizada',
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|3`]: 'Asignación Presupuestaria Multianual versión actualizada por los Pliegos',
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|4`]: 'Asignación Presupuestaria Multianual versión enviada a PCM',
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|5`]: 'Asignación Presupuestaria Multianual periodo 2027 - 2029',
  [`${ANIO_DEMO}|${PROCESO_PROGRAMACION_UE}|1`]: 'Programación Multianual Presupuestaria del Pliego y UEs',
};

/** Textos de ayuda de los dos ejemplos guiados de la demostración. */
const DESCRIPCIONES_DEMO: Record<string, string> = {
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|5`]: 'Versión final del presupuesto operativo para el ejercicio fiscal 2026. Integra ajustes derivados de la proyección de ventas, la optimización de costes directos y la redistribución de recursos en marketing e infraestructura tecnológica. Contempla una reserva para contingencias ante la volatilidad del tipo de cambio y la inflación prevista. Documento revisado y validado por el área de finanzas para su presentación y aprobación por la alta dirección.',
  [`${ANIO_DEMO}|${PROCESO_PROGRAMACION_UE}|1`]: 'Programación Multianual Presupuestaria del Pliego y UEs usando de insumo la APM aprobada por la PCM.',
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
  return NOMBRES_DEMO[`${anio}|${proceso}|${codigo}`];
}

export function descripcionDemoVersion(anio: string, proceso: string, codigo: string): string | undefined {
  return DESCRIPCIONES_DEMO[`${anio}|${proceso}|${codigo}`];
}

/** Actualiza sólo los datos demostrativos solicitados, sin modificar IDs, condiciones ni estados. */
export function sincronizarNombresDemo<T extends VersionDemoConNombre>(registros: T[]): T[] {
  return registros.map(registro => {
    const nombre = nombreDemoVersion(registro.anio, registro.proceso, registro.codigo);
    const descripcion = descripcionDemoVersion(registro.anio, registro.proceso, registro.codigo);
    const vinculada = registro.vinculada;
    const nombreVinculada = vinculada && nombreDemoVersion(vinculada.anio, vinculada.proceso, vinculada.codigo);
    // Los textos guardados por el usuario prevalecen sobre cualquier ayuda del
    // demo; sólo se completa información ausente al migrar una sesión antigua.
    const completarNombre = Boolean(nombre && !registro.nombre?.trim());
    const completarDescripcion = Boolean(descripcion && !registro.descripcion?.trim());
    const completarNombreVinculada = Boolean(nombreVinculada && vinculada && !vinculada.nombre?.trim());
    if (!completarNombre && !completarDescripcion && !completarNombreVinculada) return registro;
    return {
      ...registro,
      ...(completarNombre && nombre ? { nombre } : {}),
      ...(completarDescripcion && descripcion ? { descripcion } : {}),
      ...(completarNombreVinculada && vinculada && nombreVinculada ? { vinculada: { ...vinculada, nombre: nombreVinculada } } : {}),
    };
  });
}
