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
              <div class="max-w-[294px]"><siaf-input label="Año fiscal" [required]="true" value="2026" /></div>
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
              <div class="grid gap-siaf-xs sm:grid-cols-2 lg:grid-cols-5 lg:gap-siaf-lg">
                <siaf-checkbox label="Editable" [checked]="editable()" (checkedChange)="editable.set($event)" />
                <siaf-checkbox label="Pliego" [checked]="pliego()" (checkedChange)="pliego.set($event)" />
                <siaf-checkbox label="Vigente" [checked]="vigente()" (checkedChange)="vigente.set($event)" />
                <siaf-checkbox label="Definitiva" [checked]="oficial()" (checkedChange)="oficial.set($event)" />
                <siaf-checkbox label="Disponible" [checked]="disponible()" (checkedChange)="disponible.set($event)" />
              </div>
            </section>

            @if (versionVinculadaSeleccionada()) {
              <section class="grid gap-siaf-md">
                <div class="flex min-h-10 items-center justify-between gap-siaf-md">
                  <h3 class="m-0 text-sm font-bold uppercase text-text">Versión vinculada</h3>
                  <siaf-button variant="accent" icon="search" [iconOnly]="true" ariaLabel="Buscar versión vinculada" [disabled]="true" />
                </div>
                <siaf-summary-card [fields]="camposVersionVinculada()" [bordered]="true" [showIndicator]="true" closeLabel="Quitar versión vinculada" (closed)="retirarVersionVinculada()" />
              </section>
            } @else {
              <empty-section title="Versión vinculada" [message]="mensajeVersion" [disabled]="!procesoSeleccionado()" (actionClicked)="verificarVersionesVinculadas()">
                @if (alertaVersionVinculadaVisible()) {
                  <siaf-alert tone="info" title="No existe versión vinculada" description="No existen versiones disponibles que pueda seleccionar para este proceso." [showClose]="true" (closed)="cerrarAlertaVersionVinculada()" />
                }
              </empty-section>
            }

            <section class="grid gap-siaf-md">
              <h3 class="m-0 text-sm font-bold uppercase text-text">Vigencia de versión</h3>
              <div class="grid items-start gap-siaf-lg md:grid-cols-3">
                <siaf-radio-group label="Estado" name="estado-version" [inline]="true" [disabled]="!esEdicionVersionDos" [options]="estados" [value]="estado()" (valueChange)="estado.set($event)" />
                <siaf-date-time-picker label="Fecha desde" [fullWidth]="true" [value]="fechaDesde()" (valueChange)="fechaDesde.set($event)" />
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
        [rows]="versionesVinculables"
        [selectedIds]="versionVinculadaTemporalIds()"
        [paginated]="true"
        [showTopPagination]="true"
        [showRowsPerPage]="true"
        [pageSize]="10"
        [totalItems]="versionesVinculables.length"
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
  readonly esEdicion = Boolean(history.state?.['edicionVersion']);
  readonly codigoEdicion = String(history.state?.['codigoEdicion'] ?? '');
  readonly esEdicionVersionDos = this.esEdicion && this.codigoEdicion === '2';
  readonly versionCincoActualizada = Boolean(history.state?.['versionCincoActualizada']);
  readonly versionCincoOficial = Boolean(history.state?.['versionCincoOficial']);
  readonly versionCincoDisponible = Boolean(history.state?.['versionCincoDisponible']);
  readonly versionSeisDisponible = Boolean(history.state?.['versionSeisDisponible']);
  readonly nuevoProcesoExistente = Boolean(history.state?.['nuevoProcesoExistente']);

  readonly breadcrumbs = [{ label: 'Inicio', href: '/panel' }, { label: 'Procesos presupuesto' }, { label: 'Clasificadores y catálogos' }, { label: 'Catálogo de Versiones', href: '/procesos/catalogo-versiones' }, { label: 'Registro de versiones' }];
  readonly estados = [{ label: 'Activo', value: 'activo' }, { label: 'Inactivo', value: 'inactivo' }];
  readonly mensajeVersion = 'No se ha seleccionado ninguna versión. Haga clic en el botón para realizar una selección.';
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
  readonly versionesVinculables: VersionVinculadaDemo[] = [{ id: 'version-5', anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '5', nombre: 'Versión Aprobada PCM' }];
  readonly columnasVersionVinculada: SelectionColumn<VersionVinculadaDemo>[] = [
    { key: 'anio', label: 'Año', widthClass: 'w-24' }, { key: 'proceso', label: 'Proceso' }, { key: 'codigo', label: 'Código', widthClass: 'w-24' }, { key: 'nombre', label: 'Nombre' }
  ];
  readonly selectorProcesoAbierto = signal(false);
  readonly selectorVersionVinculadaAbierto = signal(false);
  readonly confirmacionGrabacionAbierta = signal(false);
  readonly busquedaProceso = signal('');
  readonly procesoTemporalIds = signal<string[]>([]);
  readonly procesoSeleccionado = signal<ProcesoDemo | null>(this.esEdicion ? this.procesos[1] : null);
  readonly versionVinculadaTemporalIds = signal<string[]>([]);
  readonly versionVinculadaSeleccionada = signal<VersionVinculadaDemo | null>(null);
  readonly disponibilidadVersionesVerificada = signal(false);
  readonly alertaVersionVinculadaVisible = signal(false);
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
    return version ? [{ label: 'Año', value: version.anio }, { label: 'Proceso', value: version.proceso }, { label: 'Código', value: version.codigo }, { label: 'Nombre', value: version.nombre }] : [];
  });
  readonly codigo = signal(this.esEdicion ? (this.esEdicionVersionDos ? '2' : '5') : '');
  readonly nombre = signal(this.esEdicion ? (this.esEdicionVersionDos ? 'Versión DGPP borrador' : 'Versión aprobada PCM') : '');
  readonly descripcion = signal(this.esEdicion ? (this.esEdicionVersionDos ? 'Asignación presupuestal periodo 2026-2028 para OGTI' : 'Asignación presupuestal periodo 2027-2029') : '');
  readonly editable = signal(this.esEdicionVersionDos ? false : true); readonly pliego = signal(false); readonly vigente = signal(this.esEdicionVersionDos ? false : true);
  readonly oficial = signal(this.esEdicion && !this.esEdicionVersionDos ? this.versionCincoOficial : false);
  readonly disponible = signal(this.esEdicion && !this.esEdicionVersionDos ? this.versionCincoDisponible : false);
  readonly estado = signal('activo'); readonly fechaDesde = signal(this.esEdicionVersionDos ? '2026-07-05' : '2026-08-20');
  readonly puedeGrabar = computed(() => Boolean(
    this.procesoSeleccionado()
    && this.codigo().trim()
    && this.nombre().trim()
    && this.descripcion().trim()
    && this.estado()
    && this.fechaDesde()
    && (this.esEdicion || this.disponibilidadVersionesVerificada())
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
    this.fechaDesde.set(proceso.codigo === 'M02.1.9.2' ? '2026-08-24' : '2026-08-20');
    this.reiniciarVerificacionVersionesVinculadas();
    this.selectorProcesoAbierto.set(false);
  }

  retirarProceso(): void {
    this.procesoSeleccionado.set(null);
    this.procesoTemporalIds.set([]);
    this.busquedaProceso.set('');
    this.codigo.set('');
    this.reiniciarVerificacionVersionesVinculadas();
  }

  verificarVersionesVinculadas(): void {
    if (!this.procesoSeleccionado()) return;

    if (this.procesoSeleccionado()!.codigo === 'M02.1.9.2') {
      this.versionVinculadaTemporalIds.set([]);
      this.selectorVersionVinculadaAbierto.set(true);
      return;
    }

    // Datos ficticios: para el año y proceso de prueba no hay versiones vinculables.
    this.disponibilidadVersionesVerificada.set(true);
    this.alertaVersionVinculadaVisible.set(true);
  }

  cerrarAlertaVersionVinculada(): void { this.alertaVersionVinculadaVisible.set(false); }

  confirmarVersionVinculada(ids: string[]): void {
    const version = this.versionesVinculables.find(item => item.id === ids[0]) ?? null;
    if (!version) return;
    this.versionVinculadaSeleccionada.set(version);
    this.disponibilidadVersionesVerificada.set(true);
    this.selectorVersionVinculadaAbierto.set(false);
  }

  retirarVersionVinculada(): void {
    this.versionVinculadaSeleccionada.set(null);
    this.versionVinculadaTemporalIds.set([]);
    this.disponibilidadVersionesVerificada.set(false);
  }

  completarDatosVersion(): void {
    if (this.esEdicion) return;
    this.nombre.set(this.procesoSeleccionado()?.codigo === 'M02.1.9.2' ? 'Versión Programación APM Aprobada' : 'Versión aprobada PCM');
    this.descripcion.set('Asignación presupuestal periodo 2027-2029');
  }

  grabar(): void {
    if (!this.puedeGrabar()) return;
    this.confirmacionGrabacionAbierta.set(true);
  }

  cerrarConfirmacionGrabacion(): void { this.confirmacionGrabacionAbierta.set(false); }

  confirmarGrabacion(): void {
    this.confirmacionGrabacionAbierta.set(false);
    const esVersionCinco = this.codigo() === '5';
    const esVersionSeis = this.procesoSeleccionado()?.codigo === 'M02.1.9.2' && this.codigo() === '1';
    void this.router.navigateByUrl('/procesos/catalogo-versiones', {
      state: {
        versionRegistrada: true,
        versionActualizada: this.esEdicion || this.versionCincoActualizada,
        versionDosInactiva: this.esEdicionVersionDos && this.estado() === 'inactivo',
        versionCincoOficial: esVersionCinco ? this.oficial() : this.versionCincoOficial,
        // Cuando la versión 6 pasa a Disponible, reemplaza la disponibilidad de la 5.
        versionCincoDisponible: esVersionCinco ? this.disponible() : (esVersionSeis && this.disponible() ? false : this.versionCincoDisponible),
        versionSeisDisponible: esVersionSeis ? this.disponible() : this.versionSeisDisponible,
        nuevoProceso: this.procesoSeleccionado()?.codigo === 'M02.1.9.2' || this.nuevoProcesoExistente,
        mostrarSnackbar: true,
        activeTab: 'records',
      }
    });
  }

  private reiniciarVerificacionVersionesVinculadas(): void {
    this.disponibilidadVersionesVerificada.set(false);
    this.alertaVersionVinculadaVisible.set(false);
    this.versionVinculadaSeleccionada.set(null);
    this.versionVinculadaTemporalIds.set([]);
    this.selectorVersionVinculadaAbierto.set(false);
  }

  cancelar(): void { void this.router.navigateByUrl('/procesos/catalogo-versiones'); }
}
