/**
 * Nombres canónicos del escenario de demostración de Configuración de Versiones.
 * La clave incluye año, proceso y código: el código no es único entre procesos.
 */
export const PROCESO_ASIGNACION = 'M02.1.9.1 Asignación Presupuestaria Multianual';
export const PROCESO_PROGRAMACION_UE = 'M02.1.9.2 Programación Multianual Pliego - UE';
/** Año base del escenario; las pantallas del catálogo lo consumen desde aquí. */
export const ANIO_DEMO = '2027';

/** Fecha local de la operación, independiente del Año fiscal de la versión. */
export function fechaOperacionActual(): string {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
}

const NOMBRES_DEMO: Record<string, string> = {
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|1`]: 'Asignación Presupuestaria Multianual versión inicial',
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|2`]: 'Asignación Presupuestaria Multianual versión actualizada',
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|3`]: 'Asignación Presupuestaria Multianual versión actualizada por los Pliegos',
  [`${ANIO_DEMO}|${PROCESO_ASIGNACION}|4`]: 'Asignación Presupuestaria Multianual versión enviada a PCM',
};

export function nombreDemoVersion(anio: string, proceso: string, codigo: string): string | undefined {
  return NOMBRES_DEMO[`${anio}|${proceso}|${codigo}`];
}
