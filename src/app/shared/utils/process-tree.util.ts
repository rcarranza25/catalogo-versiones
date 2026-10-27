/**
 * Árbol maestro de procesos + utilidad de búsqueda de ruta.
 * Vive en shared/utils/ (no en layout/) porque lo consumen tanto piezas
 * del shell (layout/process-menu-tree, layout/create-document) como
 * utilidades transversales de shared (breadcrumbs.util) — shared no debe
 * depender de layout, así que la fuente de verdad va acá.
 */
export interface ProcessMenuNode {
  id: string;
  label: string;
  selected?: boolean;
  // Solo debe marcarse en nodos raiz: la vista inicial muestra hasta el segundo nivel.
  expanded?: boolean;
  // Ruta de la página principal del módulo (documentos y registros)
  moduleRoute?: string;
  // Si un nodo tiene estas propiedades, Crear documento puede completar documento/tipo y navegar.
  createRoute?: string;
  documentOptions?: string[];
  documentCreateOptions?: Array<{
    label: string;
    route?: string;
    actionTypes?: string[];
  }>;
  actionTypeOptions?: string[];
  /**
   * Marca un nodo como módulo planificado pero aún no implementado.
   * El menú lo renderiza con texto atenuado y badge "Próximamente",
   * y el click no navega (solo expande si tiene hijos).
   */
  comingSoon?: boolean;
  /** Rótulo editorial que agrupa las hojas siguientes dentro de una rama. */
  groupLabel?: string;
  /** Conserva nodos para rutas y migas, pero evita que esta opción los despliegue en el menú. */
  showChildren?: boolean;
  /** Sangría adicional, en píxeles, para el contenido desplegado de una rama. */
  childrenPadding?: number;
  children?: ProcessMenuNode[];
}

/**
 * Árbol de procesos del taller. Solo «Registro de cuentas bancarias» está implementado (con datos simulados); el resto
 * son ejemplos de cómo se ve un proceso planificado («Próximamente»). Para sumar un proceso: una hoja con
 * `moduleRoute` (Documentos y registros) y otra para sus consultas, y sus rutas en `app.routes.ts`.
 *
 * IDs consumidos por componentes externos (migas de pan con `findProcessPathById`):
 *   - registro-cuentas-bancarias-documentos
 *   - registro-cuentas-bancarias-consultas
 */
export const DEFAULT_PROCESS_TREE: ProcessMenuNode[] = [
  {
    id: 'procesos-presupuesto',
    label: 'Procesos presupuesto',
    showChildren: false,
    children: [
      {
        id: 'programacion-presupuestaria',
        label: 'Programación presupuestaria',
        comingSoon: true,
      },
      {
        id: 'registro-cuentas-bancarias',
        label: 'Registro de cuentas bancarias',
        children: [
          {
            id: 'registro-cuentas-bancarias-documentos',
            label: 'Documentos y registros de cuentas bancarias',
            moduleRoute: '/procesos/registro-cuentas-bancarias',
            createRoute: '/procesos/registro-cuentas-bancarias/solicitud',
            documentOptions: ['Solicitud de Registro de Cuenta Bancaria'],
            documentCreateOptions: [
              {
                label: 'Solicitud de Registro de Cuenta Bancaria',
                route: '/procesos/registro-cuentas-bancarias/solicitud',
                actionTypes: ['Creación'],
              },
            ],
            actionTypeOptions: ['Creación'],
          },
          {
            id: 'registro-cuentas-bancarias-consultas',
            label: 'Consultas y reportes de cuentas bancarias',
            moduleRoute: '/procesos/registro-cuentas-bancarias/consultas',
          },
        ],
      },
    ],
  },
  {
    id: 'clasificadores-catalogos',
    label: 'Clasificadores y catálogos',
    // Es la única sección que aparece desplegada al abrir el menú, tal como
    // en el flujo de navegación de Clasificadores y catálogos.
    expanded: true,
    children: [
      {
        id: 'clasificadores',
        label: 'Clasificadores',
        children: [{ id: 'clasificadores-presupuestarios', label: 'Clasificadores presupuestarios', comingSoon: true }],
      },
      {
        id: 'catalogos',
        label: 'Catálogos',
        children: [
          {
            id: 'catalogo-reportes-apm',
            label: 'Catálogo de reportes de la APM',
            groupLabel: 'Gestión de asignación presupuestaria multianual',
            comingSoon: true,
            children: [
              { id: 'catalogo-reportes-apm-documentos', label: 'Documentos y registros de reportes', comingSoon: true },
            ],
          },
          {
            id: 'catalogo-modificacion-apm',
            label: 'Catálogo de modificación de la APM',
            comingSoon: true,
            children: [
              { id: 'catalogo-modificacion-apm-documentos', label: 'Documentos y registros de modificación', comingSoon: true },
            ],
          },
          {
            id: 'catalogo-versiones',
            label: 'Catálogo de versiones',
            childrenPadding: 32,
            children: [
              {
                id: 'catalogo-versiones-documentos',
                label: 'Documentos y registros de versiones',
                comingSoon: true,
              },
              {
                id: 'catalogo-versiones-consultas',
                label: 'Consultas y reportes de versiones',
                comingSoon: true,
              },
              {
                id: 'catalogo-versiones-configurador',
                label: 'Configurador de versiones',
                // Es la entrada funcional del módulo y muestra la grilla de
                // versiones ya implementada.
                moduleRoute: '/procesos/catalogo-versiones',
              },
            ],
          },
          {
            id: 'catalogo-archivos-apm',
            label: 'Catálogo de archivos de la APM',
            comingSoon: true,
            children: [
              { id: 'catalogo-archivos-apm-documentos', label: 'Documentos y registros de archivos', comingSoon: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'consultas-reportes',
    label: 'Consultas y reportes',
    children: [
      { id: 'consultas-reportes-presupuesto', label: 'Consultas y reportes presupuestales', comingSoon: true },
    ],
  },
];

export function findProcessPathById(id: string, nodes: readonly ProcessMenuNode[] = DEFAULT_PROCESS_TREE): ProcessMenuNode[] {
  for (const node of nodes) {
    if (node.id === id) {
      return [node];
    }

    const childPath = findProcessPathById(id, node.children || []);

    if (childPath.length > 0) {
      return [node, ...childPath];
    }
  }

  return [];
}

/**
 * Árbol del menú "Ajustes" (módulo de administración). Lo pinta el mismo `siaf-process-menu-tree`
 * que el menú de procesos, con otros textos. En el taller no hay módulo de administración: las hojas
 * van como «Próximamente» y no navegan.
 */
export const ADMIN_MENU_TREE: ProcessMenuNode[] = [
  {
    id: 'administracion',
    label: 'Administración',
    expanded: true,
    children: [
      {
        id: 'usuarios-accesos',
        label: 'Usuarios y accesos',
        expanded: true,
        children: [
          { id: 'gestion-usuarios', label: 'Gestión de usuarios', comingSoon: true },
          { id: 'perfiles-funcionales', label: 'Perfiles funcionales', comingSoon: true },
        ],
      },
      {
        id: 'organizacion',
        label: 'Organización',
        children: [
          { id: 'entidades', label: 'Entidades', comingSoon: true },
          { id: 'unidades', label: 'Unidades orgánicas', comingSoon: true },
        ],
      },
    ],
  },
];
