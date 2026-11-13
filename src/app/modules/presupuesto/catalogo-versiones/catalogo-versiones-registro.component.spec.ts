import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { CatalogoVersionesRegistroComponent } from './catalogo-versiones-registro.component';
import { PROCESO_ASIGNACION, PROCESO_PROGRAMACION_PMP } from './catalogo-versiones-demo.data';

describe('CatalogoVersionesRegistroComponent', () => {
  beforeEach(() => { sessionStorage.clear(); history.replaceState({}, '', '/'); });

  async function crearComponente() {
    await TestBed.configureTestingModule({
      imports: [CatalogoVersionesRegistroComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CatalogoVersionesRegistroComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, router: TestBed.inject(Router) };
  }

  it('inicia una alta con Vigente desmarcado', async () => {
    const { component } = await crearComponente();

    expect(component.esEdicion).toBeFalse();
    expect(component.vigente()).toBeFalse();
  });

  it('no hereda Vigente de un estado de navegación residual al crear', async () => {
    history.replaceState({
      registroVersion: {
        id: 98, anio: '2026', proceso: PROCESO_PROGRAMACION_PMP, codigo: '98', nombre: 'Versión residual', descripcion: 'Descripción residual',
        editable: false, pliego: false, vigente: true, oficial: false, definitiva: false, disponible: false,
        estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
      },
      edicionVersion: false,
    }, '', '/');
    const { component } = await crearComponente();

    expect(component.esEdicion).toBeFalse();
    expect(component.vigente()).toBeFalse();
  });

  it('conserva el valor guardado de Vigente al editar', async () => {
    history.replaceState({
      edicionVersion: true,
      registroVersion: {
        id: 99, anio: '2026', proceso: PROCESO_PROGRAMACION_PMP, codigo: '99', nombre: 'Versión existente', descripcion: 'Descripción existente',
        editable: false, pliego: false, vigente: true, oficial: false, definitiva: false, disponible: false,
        estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
      },
    }, '', '/');
    const { component } = await crearComponente();

    expect(component.esEdicion).toBeTrue();
    expect(component.vigente()).toBeTrue();
  });

  it('mantiene el proceso seleccionado al editar aunque se emita el cierre de su tarjeta', async () => {
    history.replaceState({
      edicionVersion: true,
      registroVersion: {
        id: 100, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '1', nombre: 'Versión existente', descripcion: 'Descripción existente',
        editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
        estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
      },
    }, '', '/');
    const { component } = await crearComponente();

    component.retirarProceso();

    expect(component.procesoSeleccionado()?.id).toBe('apm');
    expect(component.codigo()).toBe('1');
  });

  it('normaliza el proceso y la versión vinculada cargados desde la sesión', async () => {
    sessionStorage.setItem('siaf.catalogo-versiones.session.v1', JSON.stringify([{
      id: 1, anio: '2027', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '1', nombre: 'Versión persistida', descripcion: 'Descripción persistida',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Activo', desde: '05/07/2026', hasta: '-', auditadoEn: '05/07/2026 08:00',
      vinculada: { anio: '2027', proceso: 'M02.1.9.2 Programación Multianual Pliego - UE', codigo: '1', nombre: 'Versión vinculada' },
    }, {
      id: 2, anio: '2027', proceso: 'M02.1.9 Programación Multianual Presupuestaria', codigo: '2', nombre: 'Versión PMP persistida', descripcion: 'Descripción PMP persistida',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Activo', desde: '05/07/2026', hasta: '-', auditadoEn: '05/07/2026 08:00',
    }]));

    const { component } = await crearComponente();

    expect(component.registrosGrabados()[0].proceso).toBe('M02.01.02.01.01 Programación Multianual Presupuestaria (DGPP – MEF) - APM');
    expect(component.registrosGrabados()[0].vinculada?.proceso).toBe('M02.01.02.01.02 Programación Multianual Presupuestal - Pliegos y UE');
    expect(component.registrosGrabados()[1].proceso).toBe(PROCESO_PROGRAMACION_PMP);
  });

  [false, true].forEach(vigente => {
    it(`guarda una alta con Vigente ${vigente ? 'seleccionado' : 'desmarcado'}`, async () => {
      const { component, router } = await crearComponente();
      const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
      component.confirmarProceso(['pmp']);
      component.cambiarCodigo(vigente ? '102' : '101');
      component.cambiarNombre(vigente ? 'Versión vigente de prueba' : 'Versión no vigente de prueba');
      component.cambiarDescripcion(vigente ? 'Registro con la condición vigente.' : 'Registro sin la condición vigente.');
      component.vigente.set(vigente);

      component.confirmarGrabacion();

      expect(navegar).toHaveBeenCalledWith('/procesos/catalogo-versiones', jasmine.objectContaining({
        state: jasmine.objectContaining({
          registroVersion: jasmine.objectContaining({ vigente }),
        }),
      }));
    });
  });
});
