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
      <siaf-page-header title="Catálogo de versiones" />

      <section class="w-full p-siaf-md">
        <article class="w-full rounded-siaf-md bg-surface p-siaf-md">
          <header class="flex min-h-10 items-center justify-between gap-siaf-md">
            <h2 class="m-0 text-base font-bold uppercase tracking-[0.02px] text-text">Registro de versiones</h2>
            <div class="flex shrink-0 items-center gap-siaf-xs">
              <siaf-button variant="outline" (click)="cancelar()">Cancelar</siaf-button>
              <siaf-button variant="accent" [disabled]="!puedeGrabar()" (click)="grabar()">Grabar</siaf-button>
            </div>
          </header>

          <div class="mt-siaf-lg grid gap-siaf-lg">
            <section class="grid gap-siaf-md">
              <h3 class="m-0 text-sm font-bold uppercase text-text">Datos de versión</h3>
              <div class="max-w-[294px]"><siaf-input label="Año fiscal" [required]="true" [value]="anio()" (valueChange)="cambiarAnio($any($event))" /></div>
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
                <siaf-input class="md:col-span-1" label="Código" [required]="true" [value]="codigo()" (valueChange)="codigo.set($any($event))" />
                <siaf-input class="md:col-span-2" label="Nombre" [required]="true" [value]="nombre()" (click)="completarDatosVersion()" (valueChange)="nombre.set($any($event))" />
              </div>
              <text-area-control placeholder="Descripción" [required]="true" [maxlength]="500" [value]="descripcion()" (valueChange)="descripcion.set($event)" />
            </section>

            <section class="grid gap-siaf-md">
              <h3 class="m-0 text-sm font-bold uppercase text-text">Condiciones de versión</h3>
              <div class="grid gap-siaf-xs sm:grid-cols-2 lg:grid-cols-6 lg:gap-siaf-lg">
                <siaf-checkbox label="Editable" [checked]="editable()" (checkedChange)="cambiarEditable($event)" />
                <siaf-checkbox label="Pliego" [checked]="pliego()" (checkedChange)="pliego.set($event)" />
                <siaf-checkbox label="Vigente" [checked]="vigente()" (checkedChange)="vigente.set($event)" />
                <siaf-checkbox label="Definitiva" [checked]="definitiva()" (checkedChange)="definitiva.set($event)" />
                <div>
                  <siaf-checkbox label="Disponible" [checked]="disponible()" [disabled]="editable()" (checkedChange)="cambiarDisponible($event)" />
                </div>
              </div>
              @if (conflictoDisponible()) {
                <siaf-alert
                  tone="error"
                  title="No se puede grabar la versión"
                  [description]="mensajeConflictoDisponible()"
                />
              }
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
                  <siaf-alert tone="info" title="No existe versión vinculada" description="No existen versiones disponibles que pueda seleccionar para este proceso." [showClose]="true" (closed)="cerrarAlertaVersionVinculada()" />
                }
              </empty-section>
            }

            <section class="grid gap-siaf-md">
              <h3 class="m-0 text-sm font-bold uppercase text-text">Vigencia de versión</h3>
              <div class="grid items-start gap-siaf-lg md:grid-cols-3">
                <siaf-radio-group label="Estado" name="estado-version" [inline]="true" [disabled]="!esEdicionVersionDos" [options]="estados" [value]="estado()" (valueChange)="estado.set($event)" />
                <siaf-date-time-picker label="Fecha desde" [fullWidth]="true" [defaultToToday]="false" [value]="fechaDesde()" [disabled]="!esEdicion" [hint]="!esEdicion ? 'Será asignada cuando se grabe el registro.' : ''" (valueChange)="fechaDesde.set($event)" />
                <siaf-date-time-picker label="Fecha hasta" [fullWidth]="true" [defaultToToday]="false" [disabled]="true" [hint]="estado() === 'inactivo' ? 'Será asignada cuando se grabe el registro.' : ''" />
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
        title="¿Grabar versión?"
        description="El registro se grabará."
        illustrationSrc="assets/figma/modals/save_1.svg"
        [showIllustration]="true"
        (confirmed)="confirmarGrabacion()"
        (canceled)="cerrarConfirmacionGrabacion()"
        (closed)="cerrarConfirmacionGrabacion()"
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
  readonly codigoEdicion = String(this.registroEdicion?.codigo ?? history.state?.['codigoEdicion'] ?? '');
  readonly esEdicionVersionDos = this.esEdicion && this.codigoEdicion === '2';
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
  readonly estado = signal(this.registroEdicion?.estado.toLowerCase() ?? 'activo'); readonly fechaDesde = signal(this.fechaParaInput(this.registroEdicion?.desde) ?? '');
  readonly puedeGrabar = computed(() => Boolean(
    this.procesoSeleccionado()
    && this.codigo().trim()
    && this.nombre().trim()
    && this.descripcion().trim()
    && this.estado()
    && (!this.esEdicion || this.fechaDesde())
  ));

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
    this.limpiarVersionVinculada();
  }

  completarDatosVersion(): void {
    if (this.esEdicion) return;
    this.nombre.set(this.procesoSeleccionado()?.codigo === 'M02.1.9.2' ? 'Versión Programación APM Aprobada' : 'Versión aprobada PCM');
    this.descripcion.set(this.procesoSeleccionado()?.codigo === 'M02.1.9.2' ? 'Asignación presupuestal periodo 2027-2029' : 'Versión final del presupuesto operativo para el ejercicio fiscal 2026. Integra los ajustes derivados de la proyección de ventas, la optimización integral de costes directos y la redistribución estratégica de recursos en marketing e infraestructura tecnológica. Se contempla una reserva para contingencias ante la volatilidad del tipo de cambio e inflación prevista. Documento formalmente revisado y validado por el área de finanzas para su presentación oficial y aprobación por parte de la alta dirección.');
  }

  grabar(): void {
    if (!this.puedeGrabar()) return;
    this.actualizarRegistrosGrabados();
    const conflicto = this.buscarConflictoDisponible();
    this.conflictoDisponible.set(conflicto);
    if (conflicto) return;
    this.confirmacionGrabacionAbierta.set(true);
  }

  cerrarConfirmacionGrabacion(): void { this.confirmacionGrabacionAbierta.set(false); }

  confirmarGrabacion(): void {
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
      desde: this.fechaRegistro(),
      hasta: this.estado() === 'inactivo' ? this.fechaRegistro() : '-',
      auditadoEn: new Date().toLocaleString('es-PE'),
      vinculada: this.versionVinculadaSeleccionada() ? {
        anio: this.versionVinculadaSeleccionada()!.anio,
        proceso: this.versionVinculadaSeleccionada()!.proceso,
        codigo: this.versionVinculadaSeleccionada()!.codigo,
        nombre: this.versionVinculadaSeleccionada()!.nombre,
      } : this.registroEdicion?.vinculada,
    };
    void this.router.navigateByUrl('/procesos/catalogo-versiones', {
      state: {
        registroVersion: registro,
        edicionVersion: this.esEdicion,
      }
    });
  }

  cambiarEditable(checked: boolean): void { this.editable.set(checked); if (checked) this.disponible.set(false); this.conflictoDisponible.set(null); }
  cambiarDisponible(checked: boolean): void { if (!this.editable()) this.disponible.set(checked); this.conflictoDisponible.set(null); }

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
      return Array.isArray(registros) ? registros as RegistroVersionState[] : [];
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
      && item.nombre === vinculada.nombre
    );
    return registro ? {
      id: String(registro.id), anio: registro.anio, proceso: registro.proceso, codigo: registro.codigo, nombre: registro.nombre,
    } : null;
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

  cancelar(): void { void this.router.navigateByUrl('/procesos/catalogo-versiones'); }
}
