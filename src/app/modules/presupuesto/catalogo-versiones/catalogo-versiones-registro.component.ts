import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SelectionColumn, SelectionSideNavComponent } from '../../../shared/components/selection-side-nav/selection-side-nav.component';
import { AlertComponent } from '../../../shared/ui/alert/alert.component';
import { EmptySectionComponent } from '../../../shared/ui/empty-section/empty-section.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CheckboxComponent } from '../../../shared/ui/checkbox/checkbox.component';
import { DateTimePickerComponent } from '../../../shared/ui/date-time-picker/date-time-picker.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { RadioComponent } from '../../../shared/ui/radio/radio.component';
import { SummaryCardComponent, SummaryCardField } from '../../../shared/ui/summary-card/summary-card.component';
import { TextAreaControlComponent } from '../../../shared/ui/text-area-control/text-area-control.component';
import { TextFieldComponent } from '../../../shared/ui/text-field/text-field.component';
import { descripcionDemoVersion, nombreDemoVersion, sincronizarNombresDemo } from './catalogo-versiones-demo.data';

type ProcesoDemo = { id: string; codigo: string; nombre: string };
type VersionVinculadaDemo = { id: string; anio: string; proceso: string; codigo: string; nombre: string };
type RegistroVersionState = { id: number; anio: string; proceso: string; codigo: string; nombre: string; descripcion: string; editable: boolean; pliego: boolean; vigente: boolean; oficial: boolean; definitiva: boolean; disponible: boolean; estado: string; desde: string; hasta: string; auditadoEn: string; vinculada?: { anio: string; proceso: string; codigo: string; nombre: string; }; };
const SESSION_STORAGE_KEY = 'siaf.catalogo-versiones.session.v1';

@Component({
  selector: 'siaf-catalogo-versiones-registro',
  standalone: true,
  imports: [BreadcrumbComponent, PageHeaderComponent, AlertComponent, EmptySectionComponent, SelectionSideNavComponent, ButtonComponent, CheckboxComponent, DateTimePickerComponent, ModalComponent, RadioComponent, SummaryCardComponent, TextAreaControlComponent, TextFieldComponent],
  template: `
    <main class="min-h-[calc(100vh-56px)] overflow-x-hidden bg-[var(--sys-color-bg-surfaces-surface-lowest)] text-text">
      <siaf-breadcrumb [items]="breadcrumbs" />
      <siaf-page-header title="CONFIGURACIÓN DE VERSIONES" />

      <section class="w-full p-siaf-md">
        <article class="w-full rounded-siaf-md bg-surface p-siaf-md">
          <header class="flex min-h-10 items-center justify-between gap-siaf-md">
            <h2 class="m-0 text-base font-bold uppercase tracking-[0.02px] text-text">{{ esEdicion ? 'EDITAR REGISTRO DE VERSIÓN' : 'AGREGAR REGISTRO DE VERSIÓN' }}</h2>
            <div class="flex shrink-0 items-center gap-siaf-xs">
              <siaf-button variant="outline" (click)="cancelar()">Cancelar</siaf-button>
              <siaf-button variant="accent" [loading]="grabando()" (click)="grabar()">Grabar</siaf-button>
            </div>
          </header>

          <div class="mt-siaf-lg grid gap-siaf-lg">
            @if (mensajeValidacion()) {
              <siaf-alert tone="error" [title]="mensajeValidacion()" />
            }
            <section class="grid gap-siaf-md">
              <h3 class="m-0 text-sm font-bold uppercase text-text">Datos de versión</h3>
              <div class="max-w-[294px]"><siaf-input label="Año fiscal" [required]="true" [autoSuccess]="false" [disabled]="esEdicion" [error]="errorAnio()" [value]="anio()" (valueChange)="cambiarAnio($any($event))" (blurred)="validarAnioAlSalir()" /></div>
              @if (procesoSeleccionado()) {
                <section class="grid gap-siaf-md">
                  <div class="flex min-h-10 items-center justify-between gap-siaf-md">
                    <h3 class="m-0 text-sm font-bold uppercase text-text">Proceso</h3>
                    <siaf-button
                      variant="accent"
                      icon="search"
                      [iconOnly]="true"
                      ariaLabel="Buscar proceso"
                      [disabled]="true"
                    />
                  </div>
                  <siaf-summary-card
                    [fields]="camposProcesoSeleccionado()"
                    [bordered]="true"
                    [showIndicator]="true"
                    [showClose]="true"
                    closeLabel="Quitar proceso"
                    (closed)="retirarProceso()"
                  />
                </section>
              } @else {
                <empty-section title="Proceso" message="No se ha seleccionado ningún proceso. Haga clic en el botón para realizar una selección." (actionClicked)="abrirSelectorProceso()" />
              }
              <div class="grid gap-siaf-lg md:grid-cols-3">
                <siaf-input class="md:col-span-1" label="Código" [required]="true" [autoSuccess]="false" [disabled]="esEdicion" [error]="errorCodigo()" [value]="codigo()" (valueChange)="cambiarCodigo($any($event))" (blurred)="validarCodigoAlSalir()" />
                <siaf-input class="md:col-span-2" label="Nombre" [required]="true" [autoSuccess]="false" [disabled]="!procesoSeleccionado()" [error]="errorNombre()" [value]="nombre()" (click)="completarDatosVersion()" (valueChange)="cambiarNombre($any($event))" />
              </div>
              <text-area-control placeholder="Descripción" [required]="true" [autoSuccess]="false" [error]="errorDescripcion()" [maxlength]="500" [value]="descripcion()" (valueChange)="cambiarDescripcion($event)" />
            </section>

            <section class="grid gap-siaf-md">
              <h3 class="m-0 text-sm font-bold uppercase text-text">Condiciones de versión</h3>
              <div class="grid grid-cols-1 gap-siaf-xs sm:grid-cols-2 lg:grid-cols-3 lg:gap-siaf-lg 2xl:grid-cols-6">
                <siaf-checkbox label="Editable" [checked]="editable()" (checkedChange)="cambiarEditable($event)" />
                <siaf-checkbox label="Pliego" [checked]="pliego()" (checkedChange)="pliego.set($event)" />
                <siaf-checkbox label="Vigente" [checked]="vigente()" (checkedChange)="vigente.set($event)" />
                <siaf-checkbox label="Oficial" [checked]="oficial()" (checkedChange)="oficial.set($event)" />
                <siaf-checkbox label="Definitiva" [checked]="definitiva()" (checkedChange)="definitiva.set($event)" />
                <div>
                  <siaf-checkbox label="Disponible" [checked]="disponible()" [disabled]="editable()" (checkedChange)="cambiarDisponible($event)" />
                </div>
              </div>
            </section>

            @if (versionVinculadaSeleccionada()) {
              <section class="grid gap-siaf-md">
                <div class="flex min-h-10 items-center justify-between gap-siaf-md">
                  <h3 class="m-0 text-sm font-bold uppercase text-text">Versión vinculada</h3>
                  <siaf-button variant="accent" icon="search" [iconOnly]="true" ariaLabel="Buscar versión vinculada" (click)="abrirSelectorVersionVinculada()" />
                </div>
                <siaf-summary-card [fields]="camposVersionVinculada()" [bordered]="true" [showIndicator]="true" [showClose]="true" closeLabel="Quitar versión vinculada" (closed)="retirarVersionVinculada()" />
              </section>
            } @else {
              <empty-section title="Versión vinculada" message="No se ha seleccionado ninguna versión. Haga clic en el botón para realizar una selección." [disabled]="!procesoSeleccionado()" (actionClicked)="abrirSelectorVersionVinculada()">
                @if (!versionesVinculables().length && alertaVersionVinculadaVisible()) {
                  <siaf-alert tone="info" title="No existen versiones disponibles para vincular." [showClose]="true" (closed)="cerrarAlertaVersionVinculada()" />
                }
              </empty-section>
            }

            <section class="grid gap-siaf-md">
              <h3 class="m-0 text-sm font-bold uppercase text-text">Vigencia de versión</h3>
              <div class="grid items-start gap-siaf-lg md:grid-cols-3">
                <siaf-radio-group label="Estado" name="estado-version" [inline]="true" [disabled]="!esEdicion" [options]="estados" [value]="estado()" (valueChange)="estado.set($event)" />
                <siaf-date-time-picker label="Fecha desde" [fullWidth]="true" [defaultToToday]="false" [value]="fechaDesde()" [disabled]="true" [hint]="!esEdicion ? 'Será asignada cuando se grabe el registro.' : ''" />
                <siaf-date-time-picker label="Fecha hasta" [fullWidth]="true" [defaultToToday]="false" [value]="fechaHasta()" [disabled]="true" [hint]="!esEdicion && estado() === 'inactivo' ? 'Será asignada cuando se grabe el registro.' : ''" />
              </div>
            </section>
          </div>
        </article>
      </section>

      <siaf-selection-side-nav
        title="Selección de procesos"
        mode="single"
        idKey="id"
        [open]="selectorProcesoAbierto()"
        [columns]="columnasProceso"
        [rows]="procesosFiltrados()"
        [searchValue]="busquedaProceso()"
        [selectedIds]="procesoTemporalIds()"
        [paginated]="true"
        [showTopPagination]="true"
        [showRowsPerPage]="true"
        [pageSize]="10"
        [totalItems]="procesos.length"
        [totalPages]="1"
        (searchChange)="busquedaProceso.set($event)"
        (selectionChange)="procesoTemporalIds.set($event)"
        (accepted)="confirmarProceso($event)"
        (closed)="cerrarSelectorProceso()"
      />

      <siaf-selection-side-nav
        title="Selección de versiones"
        mode="single"
        idKey="id"
        [open]="selectorVersionVinculadaAbierto()"
        [columns]="columnasVersionVinculada"
        [rows]="versionesVinculables()"
        [selectedIds]="versionVinculadaTemporalIds()"
        [paginated]="true"
        [showTopPagination]="true"
        [showRowsPerPage]="true"
        [pageSize]="10"
        [totalItems]="versionesVinculables().length"
        [totalPages]="1"
        (selectionChange)="versionVinculadaTemporalIds.set($event)"
        (accepted)="confirmarVersionVinculada($event)"
        (closed)="selectorVersionVinculadaAbierto.set(false)"
      />

      <siaf-modal
        [open]="confirmacionGrabacionAbierta()"
        variant="custom"
        title="¿Está seguro de grabar la versión de presupuesto?"
        description=""
        illustrationSrc="assets/figma/modals/save_1.svg"
        [showIllustration]="true"
        (confirmed)="confirmarGrabacion()"
        (canceled)="cerrarConfirmacionGrabacion()"
        (closed)="cerrarConfirmacionGrabacion()"
      />

      <siaf-modal
        [open]="confirmacionCancelacionAbierta()"
        variant="custom"
        [title]="tituloConfirmacionCancelacion()"
        [description]="descripcionConfirmacionCancelacion()"
        illustrationSrc="assets/figma/modals/cancel.svg"
        [showIllustration]="true"
        (confirmed)="confirmarCancelacion()"
        (canceled)="cerrarConfirmacionCancelacion()"
        (closed)="cerrarConfirmacionCancelacion()"
      />
    </main>
  `,
  styles: `
    :host ::ng-deep siaf-breadcrumb nav,
    :host ::ng-deep siaf-page-header header { padding-left: var(--sys-padding-base-md, 16px); padding-right: var(--sys-padding-base-md, 16px); }
    :host ::ng-deep siaf-breadcrumb nav { height: auto; min-height: 40px; padding-top: var(--sys-padding-base-md, 16px); padding-bottom: var(--sys-padding-base-md, 16px); }
    :host ::ng-deep siaf-page-header header { padding-top: var(--sys-padding-base-md, 16px); padding-bottom: var(--sys-padding-base-md, 16px); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoVersionesRegistroComponent {
  private readonly router = inject(Router);
  private readonly registroEdicion = history.state?.['registroVersion'] as RegistroVersionState | undefined;
  readonly esEdicion = Boolean(history.state?.['edicionVersion'] && this.registroEdicion);
  readonly versionCincoActualizada = Boolean(history.state?.['versionCincoActualizada']);
  readonly versionCincoOficial = Boolean(history.state?.['versionCincoOficial']);
  readonly versionCincoDefinitiva = Boolean(history.state?.['versionCincoDefinitiva']);
  readonly versionCincoEditable = Boolean(history.state?.['versionCincoEditable']);
  readonly versionCincoPliego = Boolean(history.state?.['versionCincoPliego']);
  readonly versionCincoVigente = Boolean(history.state?.['versionCincoVigente']);
  readonly versionCincoDisponible = Boolean(history.state?.['versionCincoDisponible']);
  readonly versionSeisDisponible = Boolean(history.state?.['versionSeisDisponible']);
  readonly nuevoProcesoExistente = Boolean(history.state?.['nuevoProcesoExistente']);

  readonly breadcrumbs = [{ label: 'Inicio', href: '/panel' }, { label: 'Procesos presupuesto' }, { label: 'Clasificadores y catálogos' }, { label: 'Catálogo de versiones', href: '/procesos/catalogo-versiones' }, { label: 'Registro de versiones' }];
  readonly estados = [{ label: 'Activo', value: 'activo' }, { label: 'Inactivo', value: 'inactivo' }];
  readonly procesos: ProcesoDemo[] = [
    { id: 'pmp', codigo: 'M02.1.9', nombre: 'Programación Multianual Presupuestaria' },
    { id: 'apm', codigo: 'M02.1.9.1', nombre: 'Asignación Presupuestaria Multianual' },
    { id: 'pmp-ue', codigo: 'M02.1.9.2', nombre: 'Programación Multianual Pliego - UE' },
    { id: 'fap', codigo: 'M02.1.10', nombre: 'Formulación y Aprobación del Presupuesto' },
  ];
  readonly columnasProceso: SelectionColumn<ProcesoDemo>[] = [
    { key: 'codigo', label: 'Código', widthClass: 'w-40' },
    { key: 'nombre', label: 'Nombre' },
  ];
  readonly columnasVersionVinculada: SelectionColumn<VersionVinculadaDemo>[] = [
    { key: 'anio', label: 'Año', widthClass: 'w-24' },
    { key: 'proceso', label: 'Proceso' },
    { key: 'codigo', label: 'Código', widthClass: 'w-24' },
    { key: 'nombre', label: 'Nombre' },
  ];
  readonly selectorProcesoAbierto = signal(false);
  readonly selectorVersionVinculadaAbierto = signal(false);
  readonly confirmacionGrabacionAbierta = signal(false);
  readonly confirmacionCancelacionAbierta = signal(false);
  readonly grabando = signal(false);
  readonly intentoGrabacion = signal(false);
  readonly anioValidado = signal(false);
  readonly codigoValidado = signal(false);
  readonly mensajeValidacion = signal('');
  readonly busquedaProceso = signal('');
  readonly procesoTemporalIds = signal<string[]>([]);
  readonly procesoSeleccionado = signal<ProcesoDemo | null>(this.esEdicion ? this.procesos.find(proceso => this.registroEdicion?.proceso.startsWith(`${proceso.codigo} `)) ?? null : null);
  readonly anio = signal(this.registroEdicion?.anio ?? '2026');
  readonly registrosGrabados = signal<RegistroVersionState[]>(this.cargarRegistrosGrabados());
  readonly versionVinculadaSeleccionada = signal<VersionVinculadaDemo | null>(this.versionVinculadaInicial());
  readonly versionVinculadaId = signal(this.versionVinculadaSeleccionada()?.id ?? '');
  readonly versionVinculadaTemporalIds = signal<string[]>([]);
  readonly alertaVersionVinculadaVisible = signal(false);
  readonly conflictoDisponible = signal<RegistroVersionState | null>(null);
  readonly tituloConfirmacionCancelacion = computed(() => this.esEdicion ? '¿Está seguro(a) de cancelar la modificación?' : '¿Está seguro(a) de cancelar el registro?');
  readonly descripcionConfirmacionCancelacion = computed(() => this.esEdicion ? 'Se perderán los cambios realizados.' : 'Se perderán los datos ingresados.');
  readonly procesosFiltrados = computed(() => {
    const termino = this.busquedaProceso().trim().toLowerCase();
    return !termino ? this.procesos : this.procesos.filter(({ codigo, nombre }) => `${codigo} ${nombre}`.toLowerCase().includes(termino));
  });
  readonly camposProcesoSeleccionado = computed<SummaryCardField[]>(() => {
    const proceso = this.procesoSeleccionado();
    return proceso ? [
      { label: 'Código', value: proceso.codigo },
      { label: 'Nombre', value: proceso.nombre },
    ] : [];
  });
  readonly camposVersionVinculada = computed<SummaryCardField[]>(() => {
    const version = this.versionVinculadaSeleccionada();
    return version ? [
      { label: 'Año', value: version.anio },
      { label: 'Proceso', value: version.proceso },
      { label: 'Código', value: version.codigo },
      { label: 'Nombre', value: version.nombre },
    ] : [];
  });
  readonly versionesVinculables = computed<VersionVinculadaDemo[]>(() => {
    const proceso = this.procesoSeleccionado();
    if (!proceso) return [];
    const procesoActual = `${proceso.codigo} ${proceso.nombre}`;
    return this.registrosGrabados()
      .filter(registro => registro.disponible && registro.estado === 'Activo' && registro.anio === this.anio() && registro.proceso !== procesoActual)
      .map(registro => ({ id: String(registro.id), anio: registro.anio, proceso: registro.proceso, codigo: registro.codigo, nombre: registro.nombre }));
  });
  readonly opcionesVersionesVinculables = computed(() => this.versionesVinculables().map(version => ({ value: version.id, label: `${version.codigo} — ${version.nombre}` })));
  readonly mensajeConflictoDisponible = computed(() => {
    const conflicto = this.conflictoDisponible();
    return conflicto
      ? `La versión ${conflicto.codigo} — ${conflicto.nombre} de este proceso ya se encuentra disponible. Retire esa condición antes de establecer otra versión como disponible.`
      : '';
  });
  readonly codigo = signal(this.registroEdicion?.codigo ?? '');
  readonly nombre = signal(this.registroEdicion?.nombre ?? '');
  readonly descripcion = signal(this.registroEdicion?.descripcion ?? '');
  // Una alta inicia con Vigente activo; en edición se conserva lo registrado.
  readonly editable = signal(this.registroEdicion?.editable ?? false); readonly pliego = signal(this.registroEdicion?.pliego ?? false); readonly vigente = signal(this.registroEdicion?.vigente ?? true);
  readonly oficial = signal(this.registroEdicion?.oficial ?? false);
  readonly definitiva = signal(this.registroEdicion?.definitiva ?? false);
  readonly disponible = signal(this.registroEdicion?.disponible ?? false);
  readonly estado = signal(this.registroEdicion?.estado.toLowerCase() ?? 'activo');
  readonly fechaDesde = signal(this.fechaParaInput(this.registroEdicion?.desde) ?? '');
  readonly fechaHasta = signal(this.fechaParaInput(this.registroEdicion?.hasta) ?? '');
  readonly errorAnio = computed(() => this.errorDeCampo('anio'));
  readonly errorCodigo = computed(() => this.errorDeCampo('codigo'));
  readonly errorNombre = computed(() => this.errorDeCampo('nombre'));
  readonly errorDescripcion = computed(() => this.errorDeCampo('descripcion'));

  abrirSelectorProceso(): void {
    this.busquedaProceso.set('');
    this.procesoTemporalIds.set(this.procesoSeleccionado() ? [this.procesoSeleccionado()!.id] : []);
    this.selectorProcesoAbierto.set(true);
  }

  cerrarSelectorProceso(): void { this.selectorProcesoAbierto.set(false); }

  confirmarProceso(ids: string[]): void {
    const proceso = this.procesos.find(item => item.id === ids[0]) ?? null;
    if (!proceso) return;
    this.procesoSeleccionado.set(proceso);
    // Cada proceso tiene su propia secuencia de versiones: el proceso existente conserva el 5;
    // para los demás procesos, el primer registro comienza en 1.
    this.codigo.set(proceso.codigo === 'M02.1.9.1' ? '5' : '1');
    this.limpiarVersionVinculada();
    this.selectorProcesoAbierto.set(false);
  }

  retirarProceso(): void {
    this.procesoSeleccionado.set(null);
    this.procesoTemporalIds.set([]);
    this.busquedaProceso.set('');
    this.codigo.set('');
    this.limpiarVersionVinculada();
  }

  seleccionarVersionVinculada(id: string): void {
    const version = this.versionesVinculables().find(item => item.id === id) ?? null;
    this.versionVinculadaId.set(version?.id ?? '');
    this.versionVinculadaSeleccionada.set(version);
  }

  abrirSelectorVersionVinculada(): void {
    if (!this.procesoSeleccionado()) return;
    this.actualizarRegistrosGrabados();
    if (!this.versionesVinculables().length) {
      this.alertaVersionVinculadaVisible.set(true);
      return;
    }
    this.alertaVersionVinculadaVisible.set(false);
    this.versionVinculadaTemporalIds.set(this.versionVinculadaId() ? [this.versionVinculadaId()] : []);
    this.selectorVersionVinculadaAbierto.set(true);
  }

  confirmarVersionVinculada(ids: string[]): void {
    this.seleccionarVersionVinculada(ids[0] ?? '');
    this.selectorVersionVinculadaAbierto.set(false);
  }

  retirarVersionVinculada(): void { this.limpiarVersionVinculada(); }

  cerrarAlertaVersionVinculada(): void { this.alertaVersionVinculadaVisible.set(false); }

  cambiarAnio(value: string): void {
    this.anio.set(value);
    this.anioValidado.set(false);
    this.mensajeValidacion.set('');
    this.limpiarVersionVinculada();
  }

  cambiarCodigo(value: string): void { this.codigo.set(value); this.codigoValidado.set(false); this.mensajeValidacion.set(''); }
  cambiarNombre(value: string): void { this.nombre.set(value); this.mensajeValidacion.set(''); }
  cambiarDescripcion(value: string): void { this.descripcion.set(value); this.mensajeValidacion.set(''); }
  validarAnioAlSalir(): void {
    this.anioValidado.set(true);
    const mensaje = this.anio().trim() && !this.esAnioValido() ? 'El año debe ser un valor numérico de cuatro dígitos.' : '';
    this.mensajeValidacion.set(mensaje);
  }
  validarCodigoAlSalir(): void {
    this.codigoValidado.set(true);
    const mensaje = this.codigo().trim() && !this.esCodigoValido() ? 'El código debe ser un valor numérico mayor que cero.' : '';
    this.mensajeValidacion.set(mensaje);
  }

  completarDatosVersion(): void {
    if (this.esEdicion) return;
    const proceso = this.procesoSeleccionado();
    if (!proceso) return;
    this.nombre.set(nombreDemoVersion(this.anio(), `${proceso.codigo} ${proceso.nombre}`, this.codigo()) ?? '');
    this.descripcion.set(descripcionDemoVersion(this.anio(), `${proceso.codigo} ${proceso.nombre}`, this.codigo()) ?? 'Versión final del presupuesto operativo para el ejercicio fiscal 2026. Integra ajustes derivados de la proyección de ventas, la optimización de costes directos y la redistribución de recursos en marketing e infraestructura tecnológica. Contempla una reserva para contingencias ante la volatilidad del tipo de cambio y la inflación prevista. Documento revisado y validado por el área de finanzas para su presentación y aprobación por la alta dirección.');
  }

  grabar(): void {
    if (this.grabando()) return;
    this.intentoGrabacion.set(true);
    this.actualizarRegistrosGrabados();
    const mensaje = this.validarParaGrabar();
    this.mensajeValidacion.set(mensaje);
    if (mensaje) return;
    if (this.esEdicion) { this.confirmarGrabacion(); return; }
    this.confirmacionGrabacionAbierta.set(true);
  }

  cerrarConfirmacionGrabacion(): void { this.confirmacionGrabacionAbierta.set(false); }

  confirmarGrabacion(): void {
    if (this.grabando()) return;
    const mensaje = this.validarParaGrabar();
    this.mensajeValidacion.set(mensaje);
    if (mensaje) { this.confirmacionGrabacionAbierta.set(false); return; }
    this.grabando.set(true);
    this.confirmacionGrabacionAbierta.set(false);
    const proceso = this.procesoSeleccionado()!;
    const registro: RegistroVersionState = {
      id: this.registroEdicion?.id ?? Date.now(),
      anio: this.anio().trim(),
      proceso: `${proceso.codigo} ${proceso.nombre}`,
      codigo: this.codigo().trim(),
      nombre: this.nombre().trim(),
      descripcion: this.descripcion().trim(),
      editable: this.editable(),
      pliego: this.pliego(),
      vigente: this.vigente(),
      oficial: this.oficial(),
      definitiva: this.definitiva(),
      disponible: this.disponible(),
      estado: this.estado() === 'inactivo' ? 'Inactivo' : 'Activo',
      // En edición la vigencia es un dato histórico: se visualiza, pero no se modifica.
      desde: this.esEdicion ? this.registroEdicion!.desde : this.fechaRegistro(),
      hasta: this.esEdicion ? this.registroEdicion!.hasta : (this.estado() === 'inactivo' ? this.fechaRegistro() : '-'),
      auditadoEn: new Date().toLocaleString('es-PE'),
      vinculada: this.versionVinculadaSeleccionada() ? {
        anio: this.versionVinculadaSeleccionada()!.anio,
        proceso: this.versionVinculadaSeleccionada()!.proceso,
        codigo: this.versionVinculadaSeleccionada()!.codigo,
        nombre: this.versionVinculadaSeleccionada()!.nombre,
      } : undefined,
    };
    void this.router.navigateByUrl('/procesos/catalogo-versiones', {
      state: {
        registroVersion: registro,
        edicionVersion: this.esEdicion,
        mensajeResultado: this.esEdicion ? 'Registro actualizado con éxito' : 'La versión de presupuesto se registró correctamente.',
      }
    });
  }

  cambiarEditable(checked: boolean): void { this.editable.set(checked); if (checked) this.disponible.set(false); this.limpiarMensajeValidacion(); }
  cambiarDisponible(checked: boolean): void { if (!this.editable()) this.disponible.set(checked); this.limpiarMensajeValidacion(); }

  private limpiarVersionVinculada(): void {
    this.versionVinculadaSeleccionada.set(null);
    this.versionVinculadaId.set('');
    this.versionVinculadaTemporalIds.set([]);
    this.selectorVersionVinculadaAbierto.set(false);
    this.alertaVersionVinculadaVisible.set(false);
    this.conflictoDisponible.set(null);
  }

  private cargarRegistrosGrabados(): RegistroVersionState[] {
    try {
      const registros = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? '[]');
      const normalizados = Array.isArray(registros) ? sincronizarNombresDemo(registros as RegistroVersionState[]) : [];
      if (normalizados.length) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalizados));
      return normalizados;
    } catch {
      return [];
    }
  }

  private actualizarRegistrosGrabados(): void {
    this.registrosGrabados.set(this.cargarRegistrosGrabados());
  }

  private versionVinculadaInicial(): VersionVinculadaDemo | null {
    const vinculada = this.registroEdicion?.vinculada;
    if (!vinculada) return null;
    const registro = this.registrosGrabados().find(item =>
      item.anio === vinculada.anio
      && item.proceso === vinculada.proceso
      && item.codigo === vinculada.codigo
    );
    // La relación actual debe seguir visible y conservarse aunque la versión
    // vinculada no esté entre los registros disponibles de la sesión.
    return registro ? {
      id: String(registro.id), anio: registro.anio, proceso: registro.proceso, codigo: registro.codigo, nombre: registro.nombre,
    } : {
      id: `vinculada-${vinculada.anio}-${vinculada.proceso}-${vinculada.codigo}`,
      anio: vinculada.anio,
      proceso: vinculada.proceso,
      codigo: vinculada.codigo,
      nombre: vinculada.nombre,
    };
  }

  private errorDeCampo(field: 'anio' | 'codigo' | 'nombre' | 'descripcion'): string {
    const required = this.intentoGrabacion() && (
      (field === 'anio' && !this.anio().trim())
      || (field === 'codigo' && !this.codigo().trim())
      || (field === 'nombre' && !this.nombre().trim())
      || (field === 'descripcion' && !this.descripcion().trim())
    );
    if (required) return ' ';
    if (field === 'anio' && (this.anioValidado() || this.intentoGrabacion()) && this.anio().trim() && !this.esAnioValido()) return 'El año debe ser un valor numérico de cuatro dígitos.';
    if (field === 'codigo' && (this.codigoValidado() || this.intentoGrabacion()) && this.codigo().trim() && !this.esCodigoValido()) return 'El código debe ser un valor numérico mayor que cero.';
    if (field === 'descripcion' && this.descripcion().length > 500) return 'La descripción no puede exceder los 500 caracteres.';
    return '';
  }

  private esAnioValido(): boolean { return /^\d{4}$/.test(this.anio().trim()); }
  private esCodigoValido(): boolean { return /^\d+$/.test(this.codigo().trim()) && Number(this.codigo().trim()) > 0; }
  private procesoActual(): string { const proceso = this.procesoSeleccionado(); return proceso ? `${proceso.codigo} ${proceso.nombre}` : ''; }
  private validarParaGrabar(): string {
    if (!this.procesoSeleccionado()) return 'Debe seleccionar un proceso.';
    if (!this.anio().trim() || !this.codigo().trim() || !this.nombre().trim() || !this.descripcion().trim()) return 'Debe completar los campos obligatorios.';
    if (this.descripcion().length > 500) return 'La descripción no puede exceder los 500 caracteres.';
    if (!this.esAnioValido()) return 'El año debe ser un valor numérico de cuatro dígitos.';
    if (!this.esCodigoValido()) return 'El código debe ser un valor numérico mayor que cero.';

    const proceso = this.procesoActual(); const idActual = this.registroEdicion?.id;
    const comparables = this.registrosGrabados().filter(registro => registro.id !== idActual && registro.anio.trim() === this.anio().trim() && registro.proceso === proceso);
    if (comparables.some(registro => registro.codigo === this.codigo().trim())) return 'Ya existe una versión registrada con el mismo año, proceso y código.';
    if (comparables.some(registro => registro.nombre === this.nombre().trim())) return 'Ya existe una versión con el mismo nombre para el año y el proceso seleccionados.';
    if (comparables.some(registro => registro.descripcion === this.descripcion().trim())) return 'Ya existe una versión con la misma descripción para el año y el proceso seleccionados.';
    if (this.definitiva() && comparables.some(registro => registro.definitiva)) return 'Ya existe una versión marcada como Definitiva para el año y el proceso seleccionados.';
    if (this.disponible() && comparables.some(registro => registro.disponible)) return 'Ya existe una versión marcada como Disponible para el año y el proceso seleccionados.';
    if (this.vigente() && comparables.some(registro => registro.vigente)) return 'Ya existe una versión marcada como Vigente para el año y el proceso seleccionados.';
    const mensajeInactivacion = this.mensajeInactivacionBloqueada();
    if (mensajeInactivacion) return mensajeInactivacion;
    return '';
  }

  /** RN-GEN-0009: una baja no puede dejar activa una versión que la referencia. */
  private mensajeInactivacionBloqueada(): string {
    if (!this.esEdicion || this.registroEdicion?.estado !== 'Activo' || this.estado() !== 'inactivo') return '';

    const referenciasActivas = this.registrosGrabados().filter(registro =>
      registro.id !== this.registroEdicion!.id
      && registro.estado === 'Activo'
      && !!registro.vinculada
      && registro.vinculada.anio === this.registroEdicion!.anio
      && registro.vinculada.proceso === this.registroEdicion!.proceso
      && registro.vinculada.codigo === this.registroEdicion!.codigo
    );

    if (!referenciasActivas.length) return '';
    const identificaciones = referenciasActivas.map(registro => `«${registro.codigo} — ${registro.nombre}»`);
    return identificaciones.length === 1
      ? `No se puede inactivar la versión porque está vinculada a la versión activa ${identificaciones[0]}.`
      : `No se puede inactivar la versión porque está vinculada a las versiones activas ${identificaciones.join(', ')}.`;
  }
  private limpiarMensajeValidacion(): void { this.conflictoDisponible.set(null); this.mensajeValidacion.set(''); }
  private tieneCambiosPendientes(): boolean {
    const proceso = this.procesoActual();
    const vinculada = this.versionVinculadaSeleccionada();
    const mismaVinculada = (actual?: RegistroVersionState['vinculada']) =>
      (!vinculada && !actual) || (!!vinculada && !!actual
        && vinculada.anio === actual.anio && vinculada.proceso === actual.proceso
        && vinculada.codigo === actual.codigo && vinculada.nombre === actual.nombre);
    if (!this.esEdicion) {
      return Boolean(this.anio().trim() !== '2026' || proceso || this.codigo().trim() || this.nombre().trim() || this.descripcion().trim()
        || this.editable() || this.pliego() || this.disponible() || this.definitiva() || this.vigente() !== true
        || this.estado() !== 'activo' || this.fechaDesde() || vinculada);
    }
    const inicial = this.registroEdicion!;
    return this.anio().trim() !== inicial.anio
      || proceso !== inicial.proceso
      || this.codigo().trim() !== inicial.codigo
      || this.nombre().trim() !== inicial.nombre
      || this.descripcion().trim() !== inicial.descripcion
      || this.editable() !== inicial.editable || this.pliego() !== inicial.pliego
      || this.vigente() !== inicial.vigente || this.oficial() !== inicial.oficial
      || this.definitiva() !== inicial.definitiva || this.disponible() !== inicial.disponible
      || this.estado() !== inicial.estado.toLowerCase()
      || this.fechaDesde() !== (this.fechaParaInput(inicial.desde) ?? '')
      || !mismaVinculada(inicial.vinculada);
  }

  private buscarConflictoDisponible(): RegistroVersionState | null {
    if (!this.disponible() || this.estado() !== 'activo') return null;
    const proceso = this.procesoSeleccionado();
    if (!proceso) return null;
    const procesoActual = `${proceso.codigo} ${proceso.nombre}`;
    const idActual = this.registroEdicion?.id;
    return this.registrosGrabados().find(registro =>
      registro.id !== idActual
      && registro.disponible
      && registro.estado === 'Activo'
      && registro.anio.trim() === this.anio().trim()
      && registro.proceso === procesoActual
    ) ?? null;
  }

  private fechaParaVista(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
  }

  /** La fecha de vigencia nace al grabar, no durante la captura de una alta. */
  private fechaRegistro(): string {
    if (this.esEdicion) return this.fechaParaVista(this.fechaDesde());
    return this.procesoSeleccionado()?.codigo === 'M02.1.9.2' && this.codigo().trim() === '1'
      ? '25/09/2026'
      : '20/08/2026';
  }

  private fechaParaInput(fecha: string | undefined): string | null {
    if (!fecha || fecha === '-') return null;
    const [dia, mes, anio] = fecha.split('/');
    return anio && mes && dia ? `${anio}-${mes}-${dia}` : null;
  }

  cancelar(): void {
    if (this.tieneCambiosPendientes()) { this.confirmacionCancelacionAbierta.set(true); return; }
    void this.router.navigateByUrl('/procesos/catalogo-versiones');
  }
  cerrarConfirmacionCancelacion(): void { this.confirmacionCancelacionAbierta.set(false); }
  confirmarCancelacion(): void { this.confirmacionCancelacionAbierta.set(false); void this.router.navigateByUrl('/procesos/catalogo-versiones'); }
}
