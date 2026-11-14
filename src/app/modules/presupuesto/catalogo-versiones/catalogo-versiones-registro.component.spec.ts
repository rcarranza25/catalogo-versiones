import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { CatalogoVersionesRegistroComponent } from './catalogo-versiones-registro.component';
import { fechaOperacionActual, PROCESO_ASIGNACION, PROCESO_PROGRAMACION_PMP } from './catalogo-versiones-demo.data';

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

  it('bloquea los datos de una versión inactiva hasta reactivarla', async () => {
    history.replaceState({ edicionVersion: true, registroVersion: {
      id: 97, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '7', nombre: 'Versión inactiva', descripcion: 'Descripción inactiva',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Inactivo', desde: '01/01/2026', hasta: '02/01/2026', auditadoEn: '02/01/2026 08:00',
    } }, '', '/');
    const { component } = await crearComponente();

    expect(component.edicionInactiva()).toBeTrue();
    component.cambiarNombre('Cambio no permitido');
    expect((component as any).validarParaGrabar()).toContain('No se pueden modificar');
    component.estado.set('activo');
    expect(component.edicionInactiva()).toBeFalse();
    component.grabar();
    expect(component.confirmacionGrabacionAbierta()).toBeTrue();
  });

  it('reactiva una versión con una nueva fecha desde y sin fecha hasta al confirmar', async () => {
    history.replaceState({ edicionVersion: true, registroVersion: {
      id: 96, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '6', nombre: 'Versión inactiva para reactivar', descripcion: 'Descripción inactiva',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Inactivo', desde: '01/01/2026', hasta: '02/01/2026', auditadoEn: '02/01/2026 08:00',
    } }, '', '/');
    const { component, router } = await crearComponente();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.cambiarEstado('activo');

    component.grabar();

    expect(component.confirmacionGrabacionAbierta()).toBeTrue();
    expect(component.fechaDesde()).toBe('2026-01-01');
    expect(component.fechaHasta()).toBe('2026-01-02');

    component.confirmarGrabacion();

    expect(navegar).toHaveBeenCalledWith('/procesos/catalogo-versiones', jasmine.objectContaining({
      state: jasmine.objectContaining({
        registroVersion: jasmine.objectContaining({ estado: 'Activo', desde: fechaOperacionActual(), hasta: '-' }),
      }),
    }));
  });

  it('no modifica las fechas de una reactivación cuando se cancela el modal de grabación', async () => {
    history.replaceState({ edicionVersion: true, registroVersion: {
      id: 95, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '5', nombre: 'Versión inactiva cancelada', descripcion: 'Descripción inactiva',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Inactivo', desde: '03/01/2026', hasta: '04/01/2026', auditadoEn: '04/01/2026 08:00',
    } }, '', '/');
    const { component, router } = await crearComponente();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.cambiarEstado('activo');

    component.grabar();
    component.cerrarConfirmacionGrabacion();

    expect(component.fechaDesde()).toBe('2026-01-03');
    expect(component.fechaHasta()).toBe('2026-01-04');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('normaliza una versión activa persistida con fecha hasta como una reactivación previa', async () => {
    sessionStorage.setItem('siaf.catalogo-versiones.session.v1', JSON.stringify([{
      id: 94, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '4', nombre: 'Versión reactivada', descripcion: 'Descripción reactivada',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Activo', desde: '05/07/2026', hasta: '14/11/2026', auditadoEn: '14/11/2026 08:00',
    }]));

    const { component } = await crearComponente();

    expect(component.registrosGrabados()[0].desde).toBe('14/11/2026');
    expect(component.registrosGrabados()[0].hasta).toBe('-');
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

      component.grabar();

      expect(component.confirmacionGrabacionAbierta()).toBeTrue();
      expect(component.tituloConfirmacionGrabacion()).toBe('¿Está seguro de grabar la versión de presupuesto?');
      expect(component.descripcionConfirmacionGrabacion()).toBe('');
      expect(navegar).not.toHaveBeenCalled();

      component.confirmarGrabacion();

      expect(navegar).toHaveBeenCalledWith('/procesos/catalogo-versiones', jasmine.objectContaining({
        state: jasmine.objectContaining({
          registroVersion: jasmine.objectContaining({ vigente }),
        }),
      }));
    });
  });

  it('muestra una alerta informativa al inactivar una versión activa con condiciones únicas y conserva sus valores al grabar', async () => {
    history.replaceState({ edicionVersion: true, registroVersion: {
      id: 201, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '8', nombre: 'Versión vigente', descripcion: 'Descripción vigente',
      editable: false, pliego: false, vigente: true, oficial: true, definitiva: false, disponible: false,
      estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
    } }, '', '/');
    const { component, router } = await crearComponente();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.estado.set('inactivo');

    expect(component.mostrarAlertaInactivacion()).toBeTrue();
    expect(component.mensajeConfirmacionInactivacion()).toContain('Vigente, Oficial');

    component.grabar();

    expect(component.confirmacionGrabacionAbierta()).toBeTrue();
    expect(component.tituloConfirmacionGrabacion()).toBe('¿Desea guardar los cambios?');
    expect(component.descripcionConfirmacionGrabacion()).toBe('Los cambios realizados en la versión de presupuesto quedarán registrados.');
    expect(navegar).not.toHaveBeenCalled();

    component.confirmarGrabacion();

    expect(navegar).toHaveBeenCalledWith('/procesos/catalogo-versiones', jasmine.objectContaining({
      state: jasmine.objectContaining({
        registroVersion: jasmine.objectContaining({ estado: 'Inactivo', vigente: true, oficial: true }),
      }),
    }));
  });

  it('permite cerrar la alerta de inactivación y continuar con el guardado', async () => {
    history.replaceState({ edicionVersion: true, registroVersion: {
      id: 202, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '9', nombre: 'Versión definitiva', descripcion: 'Descripción definitiva',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: true, disponible: false,
      estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
    } }, '', '/');
    const { component, router } = await crearComponente();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.estado.set('inactivo');
    component.cerrarAlertaInactivacion();

    expect(component.mostrarAlertaInactivacion()).toBeFalse();
    expect(navegar).not.toHaveBeenCalled();
    expect(component.estado()).toBe('inactivo');

    component.grabar();

    expect(component.confirmacionGrabacionAbierta()).toBeTrue();
    expect(navegar).not.toHaveBeenCalled();

    component.confirmarGrabacion();

    expect(navegar).toHaveBeenCalled();
  });

  it('inactiva sin advertencia una versión que no tiene condiciones únicas', async () => {
    history.replaceState({ edicionVersion: true, registroVersion: {
      id: 203, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '10', nombre: 'Versión sin condición', descripcion: 'Descripción sin condición',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
    } }, '', '/');
    const { component, router } = await crearComponente();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.estado.set('inactivo');

    component.grabar();

    expect(component.mostrarAlertaInactivacion()).toBeFalse();
    expect(component.confirmacionGrabacionAbierta()).toBeTrue();
    expect(navegar).not.toHaveBeenCalled();

    component.confirmarGrabacion();

    expect(navegar).toHaveBeenCalled();
  });

  it('cierra el modal de edición sin guardar ni descartar los cambios del formulario', async () => {
    history.replaceState({ edicionVersion: true, registroVersion: {
      id: 206, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '13', nombre: 'Versión original', descripcion: 'Descripción original',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
    } }, '', '/');
    const { component, router } = await crearComponente();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.cambiarNombre('Versión modificada');

    component.grabar();
    component.cerrarConfirmacionGrabacion();

    expect(component.confirmacionGrabacionAbierta()).toBeFalse();
    expect(component.nombre()).toBe('Versión modificada');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('prioriza el bloqueo de una versión activa vinculada sobre la advertencia de inactivación', async () => {
    sessionStorage.setItem('siaf.catalogo-versiones.session.v1', JSON.stringify([{
      id: 204, anio: '2027', proceso: PROCESO_PROGRAMACION_PMP, codigo: '11', nombre: 'Versión dependiente', descripcion: 'Descripción dependiente',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false,
      estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
      vinculada: { anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '12', nombre: 'Versión de origen' },
    }]));
    history.replaceState({ edicionVersion: true, registroVersion: {
      id: 205, anio: '2027', proceso: PROCESO_ASIGNACION, codigo: '12', nombre: 'Versión de origen', descripcion: 'Descripción de origen',
      editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: true,
      estado: 'Activo', desde: '01/01/2026', hasta: '-', auditadoEn: '01/01/2026 08:00',
    } }, '', '/');
    const { component, router } = await crearComponente();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.estado.set('inactivo');

    component.grabar();

    expect(component.mostrarAlertaInactivacion()).toBeFalse();
    expect(component.mensajeValidacion()).toContain('No se puede inactivar la versión porque está vinculada');
    expect(navegar).not.toHaveBeenCalled();
  });
});
