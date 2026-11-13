import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CATALOG_PROCESS_MENU_TREE } from '../../shared/utils/process-tree.util';
import { ProcessMenuTreeComponent } from './process-menu-tree.component';

describe('ProcessMenuTreeComponent', () => {
  let fixture: ComponentFixture<ProcessMenuTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProcessMenuTreeComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProcessMenuTreeComponent);
    fixture.componentRef.setInput('nodes', CATALOG_PROCESS_MENU_TREE);
    fixture.detectChanges();
  });

  it('muestra los antecesores al buscar Catálogo de archivos de la APM', () => {
    const component = fixture.componentInstance;
    component.onQuery('Catálogo de archivos de la APM');

    const clasificadores = component.filteredNodes[0];
    const catalogos = clasificadores.children![0];
    const archivos = catalogos.children![0];

    expect(clasificadores.label).toBe('Clasificadores y catálogos');
    expect(catalogos.label).toBe('Catálogos');
    expect(archivos.label).toBe('Catálogo de archivos de la APM');
  });

  it('inicia con Clasificadores y catálogos abierto y los siguientes grupos contraídos', () => {
    const component = fixture.componentInstance;
    const clasificadores = CATALOG_PROCESS_MENU_TREE[1];
    const catalogos = clasificadores.children![1];
    const archivos = catalogos.children![0];

    expect(component.isExpanded(clasificadores)).toBeTrue();
    expect(component.isExpanded(catalogos)).toBeFalse();
    expect(component.isExpanded(archivos)).toBeFalse();
  });

  it('muestra los catálogos de Versiones y Archivos APM dentro de Catálogos', () => {
    const catalogos = CATALOG_PROCESS_MENU_TREE[1].children![1];

    expect(catalogos.children!.map(node => node.label)).toEqual([
      'Catálogo de Versiones de Presupuesto',
      'Catálogo de archivos de la APM',
    ]);
  });

  it('emite la ruta del catálogo al seleccionar Archivos de la APM', () => {
    const component = fixture.componentInstance;
    const selected: string[] = [];
    component.nodeSelected.subscribe(node => selected.push(node.moduleRoute ?? ''));
    const [versiones, archivos] = CATALOG_PROCESS_MENU_TREE[1].children![1].children!;

    component.activate(versiones);
    component.activate(archivos);

    expect(selected).toEqual(['/procesos/catalogo-versiones', '/procesos/catalogo-archivos-apm']);
  });
});
