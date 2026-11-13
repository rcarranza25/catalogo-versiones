import type { PerfilItem } from '../core/api/auth-api.service';

/**
 * Usuarios de demostración del taller. Entran con su DNI y la contraseña común.
 *
 * - Ana (configurador) registra y edita Archivos de la APM.
 * - Carlos (configurador) registra y edita Versiones.
 *
 * Son datos de ejemplo: no hay contraseñas reales ni se validan contra un servidor.
 */
export const CONTRASENA_DEMO = 'Archivos2027';

export interface UsuarioDemo {
  id: string;
  dni: string;
  email: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  /** Qué muestra en el panel de usuarios del login. */
  descripcion: string;
  /** Destino del flujo demo tras autenticar al usuario. */
  rutaInicial?: string;
  /** Catálogo que se muestra en el árbol de Procesos para esta sesión demo. */
  catalogoProcesos: 'versiones' | 'archivos-apm';
  perfiles: PerfilItem[];
}

const ENTIDAD = {
  entidad: 'Ministerio de Economía y Finanzas',
  entidadId: 'ent-mef',
  entidadCodigo: '0001',
  entidadSiglas: 'DGPP',
  ue: null,
  ueId: null,
  ueSiglas: null,
  unidad: null,
  unidadSigla: null,
  unidadId: 'uo-oga',
  procedimiento: 'Registro de cuentas bancarias',
  procedimientoCodigo: 'RCB',
  nivelAmbito: 'PLIEGO' as const,
  entidadAmbitoId: 'amb-gn',
  entidadAmbitoCodigo: 'GN',
};

function perfil(id: string, rolCodigo: 'CREADOR' | 'APROBADOR', rol: string, perfilFuncional: string): PerfilItem {
  return { id, ...ENTIDAD, rol, rolCodigo, perfilFuncional };
}

export const USUARIOS_DEMO: UsuarioDemo[] = [
  {
    id: 'usr-ana',
    dni: '11111111',
    email: 'ana.torres@taller.pe',
    nombres: 'Ana',
    apellidoPaterno: 'Torres',
    apellidoMaterno: 'Díaz',
    descripcion: 'Configurador: Registra y edita archivos de la APM',
    rutaInicial: '/panel',
    catalogoProcesos: 'archivos-apm',
    // Conserva el código funcional CREADOR para las reglas existentes del demo.
    perfiles: [perfil('perfil-ana-configurador', 'CREADOR', 'Configurador', 'Configurador de Archivos APM')],
  },
  {
    id: 'usr-carlos-versiones',
    dni: '22222222',
    email: 'carlos.vega@taller.pe',
    nombres: 'Carlos',
    apellidoPaterno: 'Vega',
    apellidoMaterno: 'Ríos',
    descripcion: 'Configurador: Registra y edita versiones',
    rutaInicial: '/panel',
    catalogoProcesos: 'versiones',
    perfiles: [perfil('perfil-carlos-configurador-versiones', 'CREADOR', 'Configurador', 'Configurador de versiones')],
  },
];

/** Actor histórico para solicitudes preexistentes; no es un usuario habilitado para ingresar al demo. */
export const ACTOR_APROBADOR_HISTORIAL: UsuarioDemo = {
  id: 'hist-aprobador',
  dni: '',
  email: '',
  nombres: 'Luis',
  apellidoPaterno: 'Ramírez',
  apellidoMaterno: 'Soto',
  descripcion: '',
  catalogoProcesos: 'archivos-apm',
  perfiles: [],
};

export function buscarUsuarioPorPerfil(perfilId: string): { usuario: UsuarioDemo; perfil: PerfilItem } | null {
  for (const usuario of USUARIOS_DEMO) {
    const encontrado = usuario.perfiles.find((p) => p.id === perfilId);
    if (encontrado) return { usuario, perfil: encontrado };
  }
  return null;
}
