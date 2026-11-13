import { AppShellComponent } from './app-shell.component';
import { ProcessMenuNode } from '../process-menu-tree/process-menu-tree.component';

describe('AppShellComponent process catalog visibility', () => {
  const filtrarCatalogos = (catalogo: 'versiones' | 'archivos-apm'): ProcessMenuNode[] =>
    (AppShellComponent.prototype as unknown as {
      filtrarCatalogosDeProcesos: (visible: 'versiones' | 'archivos-apm') => ProcessMenuNode[];
    }).filtrarCatalogosDeProcesos(catalogo);

  const hojasCatalogo = (catalogo: 'versiones' | 'archivos-apm') =>
    filtrarCatalogos(catalogo)[1].children![1].children!;

  it('muestra solo Versiones para la sesión de Carlos', () => {
    expect(hojasCatalogo('versiones').map(nodo => nodo.moduleRoute)).toEqual(['/procesos/catalogo-versiones']);
  });

  it('muestra solo Archivos APM para la sesión de Ana', () => {
    expect(hojasCatalogo('archivos-apm').map(nodo => nodo.moduleRoute)).toEqual(['/procesos/catalogo-archivos-apm']);
  });
});
