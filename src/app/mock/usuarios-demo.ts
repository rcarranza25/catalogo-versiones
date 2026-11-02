import type { PerfilItem } from '../core/api/auth-api.service';

/**
 * Usuarios de demostración del taller. Entran con su DNI y la contraseña común.
 *
 * - Ana (configurador) registra y edita versiones.
 *
 * Son datos de ejemplo: no hay contraseñas reales ni se validan contra un servidor.
 */
export const CONTRASENA_DEMO = 'Versiones2027*';

export interface UsuarioDemo {
  id: string;
  dni: string;
  email: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  /** Qué muestra en el panel de usuarios del login. */
  descripcion: string;
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
    descripcion: 'Configurador: Registra y edita versiones',
    // Conserva el código funcional CREADOR para las reglas existentes del
    // demo; la denominación visible es exclusiva del Catálogo de Versiones.
    perfiles: [perfil('perfil-ana-configurador', 'CREADOR', 'Configurador', 'Configurador de versiones')],
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
  perfiles: [],
};

export function buscarUsuarioPorPerfil(perfilId: string): { usuario: UsuarioDemo; perfil: PerfilItem } | null {
  for (const usuario of USUARIOS_DEMO) {
    const encontrado = usuario.perfiles.find((p) => p.id === perfilId);
    if (encontrado) return { usuario, perfil: encontrado };
  }
  return null;
}
