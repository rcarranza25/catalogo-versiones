/**
 * Nombres canónicos del escenario de demostración de Configuración de Versiones.
 * La clave incluye año, proceso y código: el código no es único entre procesos.
 */
export const PROCESO_ASIGNACION = 'M02.01.02.01.01 Programación Multianual Presupuestaria (DGPP – MEF) - APM';
export const PROCESO_PROGRAMACION_UE = 'M02.01.02.01.02 Programación Multianual Presupuestal - Pliegos y UE';
export const PROCESO_FORMULACION = 'M02.01.02.02.02 Formulación del Presupuesto Público (DGPP MEF)';
export const PROCESO_PROGRAMACION_PMP = 'M02.01.02.01 Programación Multianual Presupuestaria - PMP';

export type ProcesoVersionDemo = { id: string; codigo: string; nombre: string };

/** Catálogo único de procesos disponible para el registro y sus selectores. */
export const PROCESOS_VERSIONES_DEMO: ProcesoVersionDemo[] = [
  { id: 'pmp', codigo: 'M02.01.02.01', nombre: 'Programación Multianual Presupuestaria - PMP' },
  { id: 'apm', codigo: 'M02.01.02.01.01', nombre: 'Programación Multianual Presupuestaria (DGPP – MEF) - APM' },
  { id: 'pmp-ue', codigo: 'M02.01.02.01.02', nombre: 'Programación Multianual Presupuestal - Pliegos y UE' },
  { id: 'fap', codigo: 'M02.01.02.02.02', nombre: 'Formulación del Presupuesto Público (DGPP MEF)' },
];

const PROCESOS_ANTERIORES: Record<string, string> = {
  'M02.1.9 Programación Multianual Presupuestaria': PROCESO_PROGRAMACION_PMP,
  'M02.1.9.1 Asignación Presupuestaria Multianual': PROCESO_ASIGNACION,
  'M02.1.9.2 Programación Multianual Pliego - UE': PROCESO_PROGRAMACION_UE,
  'M02.1.10 Formulación y Aprobación del Presupuesto': PROCESO_FORMULACION,
  'M02.1.10.1 Formulación del Presupuesto': PROCESO_FORMULACION,
};

/** Convierte valores persistidos de las denominaciones anteriores sin alterar otros procesos. */
export function normalizarProcesoDemo(proceso: string): string {
  return PROCESOS_ANTERIORES[proceso] ?? proceso;
}
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
