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

  it('muestra los antecesores al buscar Configuración de versiones', () => {
    const component = fixture.componentInstance;
    component.onQuery('Configuración de versiones');

    const clasificadores = component.filteredNodes[0];
    const catalogos = clasificadores.children![0];
    const versiones = catalogos.children![0];

    expect(clasificadores.label).toBe('Clasificadores y catálogos');
    expect(catalogos.label).toBe('Catálogos');
    expect(versiones.label).toBe('Catálogo de versiones de presupuesto');
    expect(versiones.children![0].label).toBe('Configuración de versiones');
  });

  it('inicia con Clasificadores y catálogos abierto y los siguientes grupos contraídos', () => {
    const component = fixture.componentInstance;
    const clasificadores = CATALOG_PROCESS_MENU_TREE[1];
    const catalogos = clasificadores.children![1];
    const versiones = catalogos.children![0];

    expect(component.isExpanded(clasificadores)).toBeTrue();
    expect(component.isExpanded(catalogos)).toBeFalse();
    expect(component.isExpanded(versiones)).toBeFalse();
  });

  it('muestra únicamente Catálogo de versiones de presupuesto dentro de Catálogos', () => {
    const catalogos = CATALOG_PROCESS_MENU_TREE[1].children![1];

    expect(catalogos.children!.map(node => node.label)).toEqual(['Catálogo de versiones de presupuesto']);
  });

  it('emite la ruta existente al seleccionar Configuración de versiones', () => {
    const component = fixture.componentInstance;
    const selected: string[] = [];
    component.nodeSelected.subscribe(node => selected.push(node.moduleRoute ?? ''));
    const configuracion = CATALOG_PROCESS_MENU_TREE[1].children![1].children![0].children![0];

    component.activate(configuracion);

    expect(selected).toEqual(['/procesos/catalogo-versiones']);
  });
});
