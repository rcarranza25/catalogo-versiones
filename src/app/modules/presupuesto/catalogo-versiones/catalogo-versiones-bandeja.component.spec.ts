import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PROCESO_ASIGNACION, PROCESO_FORMULACION, PROCESO_PROGRAMACION_UE } from './catalogo-versiones-demo.data';
import { CatalogoVersionesBandejaComponent } from './catalogo-versiones-bandeja.component';

const FILTERS_STORAGE_KEY = 'siaf.catalogo-versiones.filters.v1';

describe('CatalogoVersionesBandejaComponent', () => {
  beforeEach(() => {
    sessionStorage.clear();
    history.replaceState({}, '', '/');
  });

  async function crearComponente() {
    await TestBed.configureTestingModule({
      imports: [CatalogoVersionesBandejaComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(CatalogoVersionesBandejaComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('inicia la demo con APM, Año 2027 y Estado Activo', async () => {
    const component = await crearComponente();

    expect(component.anio()).toBe('2027');
    expect(component.estado()).toBe('Activo');
    expect(component.procesoFiltro()).toBe(PROCESO_ASIGNACION);
    expect(component.filtrosAplicados()).toContain(`Proceso: ${PROCESO_ASIGNACION}`);
    expect(component.persistedFilteredRows()).toHaveSize(4);
    component.abrirFiltros();
    expect(component.procesoFiltro()).toBe(PROCESO_ASIGNACION);
  });

  it('reinicia demo restaurando APM como filtro inicial', async () => {
    const component = await crearComponente();
    component.cambiarProcesoFiltro(PROCESO_PROGRAMACION_UE);
    component.aplicarFiltros();

    component.confirmarReinicioDemo();

    expect(component.procesoFiltro()).toBe(PROCESO_ASIGNACION);
    expect(component.persistedFilteredRows()).toHaveSize(4);
    expect(sessionStorage.getItem(FILTERS_STORAGE_KEY)).toBeNull();
  });

  it('permite retirar chips individuales y borrar los filtros aplicados', async () => {
    const component = await crearComponente();

    expect(component.filtrosActivos().map(filtro => filtro.label)).toEqual(['Año', 'Proceso', 'Estado']);
    component.quitarFiltroAplicado('proceso');
    expect(component.filtrosActivos().map(filtro => filtro.label)).toEqual(['Año', 'Estado']);

    component.borrarFiltrosAplicados();
    expect(component.filtrosActivos()).toEqual([]);
    expect(component.anio()).toBe('');
    expect(component.estado()).toBe('');
  });

  it('normaliza procesos y vínculos persistidos con las denominaciones anteriores', async () => {
    const procesoAnterior = 'M02.1.9.1 Asignación Presupuestaria Multianual';
    const vinculadaAnterior = 'M02.1.9.2 Programación Multianual Pliego - UE';
    sessionStorage.setItem('siaf.catalogo-versiones.session.v1', JSON.stringify(Array.from({ length: 4 }, (_, index) => ({
      id: index + 1, anio: '2027', proceso: procesoAnterior, codigo: String(index + 1), nombre: `Versión ${index + 1}`,
      descripcion: 'Registro persistido.', editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Activo', desde: '05/07/2026', hasta: '-', auditadoEn: '05/07/2026 08:00',
      ...(index === 0 ? { vinculada: { anio: '2027', proceso: vinculadaAnterior, codigo: '1', nombre: 'Versión vinculada' } } : {}),
    }))));
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ anio: '2027', proceso: 'M02.1.10 Formulación y Aprobación del Presupuesto', codigo: '', nombre: '', estado: 'Activo', editable: '', pliego: '', vigente: '', oficial: '', definitiva: '', disponible: '' }));

    const component = await crearComponente();

    expect(component.rows()[0].proceso).toBe(PROCESO_ASIGNACION);
    expect(component.rows()[0].vinculada?.proceso).toBe(PROCESO_PROGRAMACION_UE);
    expect(component.procesoFiltro()).toBe(PROCESO_FORMULACION);
  });

  it('aplica el proceso de una alta exitosa, reemplaza el anterior y conserva los demás filtros', async () => {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({
      anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '', nombre: '', estado: 'Activo',
      editable: '', pliego: '', vigente: '', oficial: '', definitiva: '', disponible: '',
    }));
    history.replaceState({
      edicionVersion: false,
      registroVersion: {
        id: 99, anio: '2028', proceso: PROCESO_PROGRAMACION_UE, codigo: '1', nombre: 'Nueva versión UE', descripcion: 'Registro creado correctamente.',
        editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
        estado: 'Activo', desde: '05/07/2026', hasta: '-', auditadoEn: '05/07/2026 08:00',
      },
    }, '', '/');

    const component = await crearComponente();

    expect(component.procesoFiltro()).toBe(PROCESO_PROGRAMACION_UE);
    expect(component.anio()).toBe('2028');
    expect(component.filtrosAplicados()).toContain(`Proceso: ${PROCESO_PROGRAMACION_UE}`);
    expect(component.persistedFilteredRows().map(row => row.id)).toEqual([99]);
    expect(component.pagina()).toBe(1);
    expect(JSON.parse(sessionStorage.getItem(FILTERS_STORAGE_KEY)!).proceso).toBe(PROCESO_PROGRAMACION_UE);
    expect(JSON.parse(sessionStorage.getItem(FILTERS_STORAGE_KEY)!).anio).toBe('2028');
  });

  it('muestra las versiones APM al volver de una alta APM y precarga el panel con ese proceso', async () => {
    history.replaceState({
      edicionVersion: false,
      registroVersion: {
        id: 100, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '5', nombre: 'Nueva versión APM', descripcion: 'Registro APM creado correctamente.',
        editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
        estado: 'Activo', desde: '05/07/2026', hasta: '-', auditadoEn: '05/07/2026 08:00',
      },
    }, '', '/');

    const component = await crearComponente();

    expect(component.procesoFiltro()).toBe(PROCESO_ASIGNACION);
    expect(component.filtrosAplicados()).toContain(`Proceso: ${PROCESO_ASIGNACION}`);
    expect(component.persistedFilteredRows()).toHaveSize(5);
    component.abrirFiltros();
    expect(component.procesoFiltro()).toBe(PROCESO_ASIGNACION);
  });

  it('no reemplaza el proceso filtrado al volver de una edición', async () => {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({
      anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '', nombre: '', estado: 'Activo',
      editable: '', pliego: '', vigente: '', oficial: '', definitiva: '', disponible: '',
    }));
    history.replaceState({
      edicionVersion: true,
      registroVersion: {
        id: 1, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '1', nombre: 'Versión actualizada', descripcion: 'Registro editado.',
        editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
        estado: 'Activo', desde: '05/07/2026', hasta: '-', auditadoEn: '05/07/2026 08:00',
      },
    }, '', '/');

    const component = await crearComponente();

    expect(component.procesoFiltro()).toBe(PROCESO_ASIGNACION);
  });

  it('bloquea los controles de la bandeja mientras edita condiciones y los libera al cancelar', async () => {
    const component = await crearComponente();
    const row = component.rows()[0];
    component.alternarEdicionCondiciones(row, new MouseEvent('click'));

    expect(component.condicionesEnEdicion()).toBeTrue();
    expect(component.filtrosPanelAbierto()).toBeFalse();
    const paginaInicial = component.pagina();
    component.abrirFiltros();
    component.cambiarPagina(1);
    component.cambiarProcesoFiltro(PROCESO_PROGRAMACION_UE);
    expect(component.filtrosPanelAbierto()).toBeFalse();
    expect(component.pagina()).toBe(paginaInicial);
    expect(component.procesoFiltro()).toBe(PROCESO_ASIGNACION);

    component.confirmarCancelacionCondiciones();
    expect(component.condicionesEnEdicion()).toBeFalse();
    expect(component.rows()[0].vigente).toBeFalse();
  });

  it('mantiene el bloqueo tras una validación fallida y lo libera al grabar', async () => {
    const component = await crearComponente();
    const row = component.rows()[0];
    component.alternarEdicionCondiciones(row, new MouseEvent('click'));
    component.borradorCondiciones.set({ ...row, editable: true, disponible: true });
    component.confirmarGrabacionCondiciones();

    expect(component.condicionesEnEdicion()).toBeTrue();
    expect(component.errorCondiciones()).toContain('Disponible');

    component.borradorCondiciones.set({ ...row, vigente: true });
    component.confirmarGrabacionCondiciones();
    expect(component.condicionesEnEdicion()).toBeFalse();
    expect(component.rows()[0].vigente).toBeTrue();
  });
});
