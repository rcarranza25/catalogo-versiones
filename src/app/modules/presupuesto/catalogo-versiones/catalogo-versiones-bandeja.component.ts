import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DocumentHistoryPanelComponent, DocumentHistorySummary } from '../../../shared/components/document-history-panel/document-history-panel.component';
import { FilterPillComponent } from '../../../shared/components/filter-pill/filter-pill.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { RecordsSearchToolbarComponent } from '../../../shared/components/records-search-toolbar/records-search-toolbar.component';
import { RecordsTabItem, RecordsTabsComponent } from '../../../shared/components/records-tabs/records-tabs.component';
import { TableControlsComponent } from '../../../shared/components/table-controls/table-controls.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { IconDropdownMenuComponent } from '../../../shared/ui/icon-dropdown-menu/icon-dropdown-menu.component';
import { StatusTagComponent } from '../../../shared/ui/status-tag/status-tag.component';
import { SnackbarComponent } from '../../../shared/ui/snackbar/snackbar.component';
import { SideNavComponent } from '../../../shared/ui/side-nav/side-nav.component';
import { DateTimePickerComponent } from '../../../shared/ui/date-time-picker/date-time-picker.component';
import { TextFieldComponent } from '../../../shared/ui/text-field/text-field.component';
import { TooltipDirective } from '../../../shared/ui/tooltip/tooltip.directive';
import { ColumnVisibilityPanelComponent, ColumnVisibilityPanelSection } from '../../../shared/ui/column-visibility-panel/column-visibility-panel.component';
import type { DocumentsRecordsColumn } from '../../../shared/types/documents-records.types';

type VersionRow = { id: number; anio: string; proceso: string; codigo: string; nombre: string; editable: boolean; pliego: boolean; vigente: boolean; oficial: boolean; disponible: boolean; estado: string; desde: string; hasta: string; vinculada?: { anio: string; proceso: string; codigo: string; nombre: string; }; };
type VersionDocumentRow = { id: number; documento: string; numero: string; tipoAccion: string; estado: string; sistema: string; fecha: string; entidad: string; };

@Component({
  selector: 'siaf-catalogo-versiones-bandeja',
  standalone: true,
  imports: [BreadcrumbComponent, ButtonComponent, ColumnVisibilityPanelComponent, DocumentHistoryPanelComponent, FilterPillComponent, IconComponent, IconDropdownMenuComponent, PageHeaderComponent, PaginationComponent, RecordsSearchToolbarComponent, RecordsTabsComponent, SnackbarComponent, SideNavComponent, StatusTagComponent, TableControlsComponent, DateTimePickerComponent, TextFieldComponent, TooltipDirective],
  template: `
    <main class="min-h-[calc(100vh-56px)] overflow-x-hidden bg-[var(--sys-color-bg-surfaces-surface-lowest)] text-text">
      <div class="w-full">
        <siaf-breadcrumb [items]="breadcrumbs" />
        <siaf-page-header title="Catálogo de versiones" subtitle="Documentos y registros" [subtitleOverline]="true" />
        <siaf-records-tabs
          ariaLabel="Documentos y registros"
          [tabs]="tabsItems"
          [activeId]="activeTab()"
          (activeIdChange)="seleccionarPestana($event)"
        />

        <section class="w-full p-siaf-md">
          @if (activeTab() === 'documents') {
            <article class="flex w-full min-w-0 flex-col rounded-siaf-md bg-surface">
              <header class="flex h-14 items-center px-siaf-md pt-siaf-md">
                <h2 class="m-0 text-base font-bold uppercase tracking-[0.02px] text-text">Documentos existentes</h2>
              </header>

              <div class="flex min-w-0 flex-col gap-siaf-xs p-siaf-md">
                <siaf-records-search-toolbar [value]="documentSearch()" placeholder="Buscar" (valueChange)="documentSearch.set($any($event))">
                  <ng-container actions>
                    <span class="inline-flex size-9 items-center justify-center text-text" role="img" aria-label="Agrupación"><siaf-icon name="layers" [size]="24" /></span>
                    <span class="inline-flex size-9 items-center justify-center text-text" role="img" aria-label="Favoritos"><siaf-icon name="star_border" [size]="24" /></span>
                    <siaf-icon-dropdown-menu icon="more_vert" ariaLabel="Más opciones" [items]="[]" />
                  </ng-container>
                </siaf-records-search-toolbar>

                <div class="flex flex-wrap items-center gap-siaf-xs" aria-label="Filtros de documentos">
                  <siaf-filter-pill label="Estado" [options]="documentStatusOptions" [selectedValue]="documentStatusFilter()" (selectedValueChange)="documentStatusFilter.set($event)" />
                  <siaf-filter-pill label="Tipo de acción" [options]="documentActionOptions" [selectedValue]="documentActionFilter()" (selectedValueChange)="documentActionFilter.set($event)" />
                  @if (documentExtraFilterVisible()) {
                    <siaf-filter-pill label="Sistema" [options]="documentSystemOptions" [selectedValue]="documentSystemFilter()" (selectedValueChange)="documentSystemFilter.set($event)" />
                  }
                  <siaf-icon-dropdown-menu icon="add" ariaLabel="Agregar filtro de documentos" [items]="documentAdditionalFilters" (selected)="agregarFiltroDocumento($event)" />
                </div>

                <div class="flex items-center justify-between px-siaf-sm py-siaf-xs">
                  <input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" aria-label="Seleccionar documentos" />
                  <span class="text-xs text-text-muted">1-{{ filteredDocuments().length }} de {{ filteredDocuments().length }}</span>
                </div>

                <div class="min-w-0 max-w-full overflow-x-auto rounded-siaf-sm" aria-label="Grilla de documentos">
                  <table class="w-[1120px] min-w-full border-collapse text-left text-sm">
                    <thead class="bg-surface-high text-[10px] font-bold uppercase text-text">
                      <tr class="h-10 border-b border-[var(--sys-color-divider-default)]">
                        <th class="w-12 px-siaf-sm"><span class="sr-only">Seleccionar</span></th>
                        <th class="w-[230px] px-siaf-md">Documento</th>
                        <th class="w-[90px] px-siaf-md">Número</th>
                        <th class="w-[130px] px-siaf-md">Tipo de acción</th>
                        <th class="w-[110px] px-siaf-md">Estado</th>
                        <th class="w-[130px] px-siaf-md">Sistema</th>
                        <th class="w-[140px] px-siaf-md">Fecha de registro</th>
                        <th class="w-[250px] px-siaf-md">Entidad</th>
                        <th class="w-12 px-siaf-sm"><span class="sr-only">Historial</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of filteredDocuments(); track row.id) {
                        <tr class="h-[58px] border-b border-[var(--sys-color-divider-default)] hover:bg-[var(--sys-color-bg-states-light-hover)]">
                          <td class="px-siaf-sm"><input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [attr.aria-label]="'Seleccionar documento ' + row.numero" /></td>
                          <td class="px-siaf-md">{{ row.documento }}</td>
                          <td class="px-siaf-md">{{ row.numero }}</td>
                          <td class="px-siaf-md">{{ row.tipoAccion }}</td>
                          <td class="px-siaf-md"><span class="rounded-siaf-sm bg-[#2d877f] px-2 py-1 text-xs text-white">{{ row.estado }}</span></td>
                          <td class="px-siaf-md">{{ row.sistema }}</td>
                          <td class="px-siaf-md">{{ row.fecha }}</td>
                          <td class="whitespace-normal px-siaf-md leading-[normal]">{{ row.entidad }}</td>
                          <td class="px-siaf-sm text-center">
                            <button
                              class="inline-flex size-9 items-center justify-center rounded-siaf-sm text-text hover:bg-surface-muted"
                              type="button"
                              aria-label="Historial de documento"
                              siafTooltip="Historial de documento"
                              tooltipMode="always"
                              (click)="abrirHistorialDocumento(row)"
                            ><siaf-icon name="history" [size]="20" /></button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <siaf-pagination position="Bottom" [rowPage]="true" [page]="1" [pageSize]="25" [totalItems]="filteredDocuments().length" [totalPages]="1" />
              </div>
            </article>
          } @else {
          <article class="flex w-full min-w-0 flex-col rounded-siaf-md bg-surface">
            <header class="flex h-14 items-center justify-between gap-siaf-md px-siaf-md pt-siaf-md">
              <h2 class="m-0 text-base font-bold uppercase tracking-[0.02px] text-text">Versiones</h2>
              <siaf-button variant="accent" icon="add" [iconOnly]="true" ariaLabel="Agregar versión" (click)="crearVersion()" />
            </header>

            <div class="flex min-w-0 flex-col gap-siaf-xs p-siaf-md">
              <siaf-records-search-toolbar [value]="search()" placeholder="Buscar" (valueChange)="search.set($any($event))">
                <ng-container actions>
                  <span class="inline-flex size-9 items-center justify-center text-text" role="img" aria-label="Agrupación"><siaf-icon name="layers" [size]="24" /></span>
                  <span class="inline-flex size-9 items-center justify-center text-text" role="img" aria-label="Favoritos"><siaf-icon name="star_border" [size]="24" /></span>
                  <siaf-icon-dropdown-menu icon="more_vert" ariaLabel="Más opciones" [items]="optionsMenu" (selected)="manejarMasOpciones($event)" />
                </ng-container>
              </siaf-records-search-toolbar>

              <div class="flex flex-wrap items-center gap-siaf-xs" aria-label="Filtros de registros">
                <siaf-filter-pill label="Estado" [options]="recordStatusOptions" [selectedValue]="estado()" (selectedValueChange)="estado.set($event)" />
                <siaf-filter-pill label="Año" [options]="recordYearOptions()" [selectedValue]="anio()" (selectedValueChange)="anio.set($event)" />
                @if (recordExtraFilterVisible()) {
                  <siaf-filter-pill label="Proceso" [options]="recordProcessOptions()" [selectedValue]="procesoFiltro()" (selectedValueChange)="procesoFiltro.set($event)" />
                }
                <siaf-icon-dropdown-menu icon="add" ariaLabel="Agregar filtro de registros" [items]="recordAdditionalFilters" (selected)="agregarFiltroRegistro($event)" />
              </div>

              <siaf-table-controls
                [checked]="allSelected()" [indeterminate]="someSelected()" [selectedCount]="selectedIds().size"
                [page]="1" [pageSize]="10" [totalItems]="filteredRows().length" [totalPages]="1"
                [showEditAction]="true" [editDisabled]="!puedeEditarSeleccion()"
                (selectionChange)="toggleAll($event)" (edit)="editarVersion()" />

              <!-- Solo esta caja admite scroll horizontal; no se propaga al shell ni a los controles. -->
              <div class="min-w-0 max-w-full overflow-x-auto rounded-siaf-sm" aria-label="Grilla de versiones">
                <table class="border-collapse text-left text-sm" [class.w-[1649px]]="!columnasExtendidas()" [class.min-w-[1649px]]="!columnasExtendidas()" [class.w-[2220px]]="columnasExtendidas()" [class.min-w-[2220px]]="columnasExtendidas()">
                  <thead class="bg-surface-high text-[10px] font-bold uppercase text-text">
                    <tr class="h-10 border-b border-[var(--sys-color-divider-default)]">
                      <th rowspan="2" class="w-12 px-siaf-sm"><input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" aria-label="Seleccionar versiones" [checked]="allSelected()" (change)="toggleAll($any($event.target).checked)" /></th>
                      <th rowspan="2" class="w-[120px] px-siaf-md text-center">Año</th><th rowspan="2" class="w-[220px] px-siaf-md text-center">Proceso</th><th rowspan="2" class="w-[110px] px-siaf-md text-center">Código</th><th rowspan="2" class="w-[255px] px-siaf-md">Nombre</th>
                      <th colspan="5" class="border-x border-[var(--sys-color-divider-strong)] px-siaf-md text-center">Condiciones de versión</th>
                      @if (columnasExtendidas()) { <th colspan="4" class="border-r border-[var(--sys-color-divider-strong)] px-siaf-md text-center">Versión vinculada</th> }
                      <th rowspan="2" class="w-[120px] px-siaf-md text-center">Estado</th><th rowspan="2" class="w-[120px] px-siaf-md text-center">Fecha desde</th><th rowspan="2" class="w-[120px] px-siaf-md text-center">Fecha hasta</th>
                    </tr>
                    <tr class="h-10 border-b border-[var(--sys-color-divider-default)]"><th class="w-[110px] border-l border-[var(--sys-color-divider-strong)] px-siaf-md text-center">Editable</th><th class="w-[110px] px-siaf-md text-center">Pliego</th><th class="w-[110px] px-siaf-md text-center">Vigente</th><th class="w-[110px] px-siaf-md text-center">Definitiva</th><th class="w-[110px] border-r border-[var(--sys-color-divider-strong)] px-siaf-md text-center">Disponible</th>@if (columnasExtendidas()) { <th class="w-[95px] px-siaf-md text-center">Año</th><th class="w-[230px] px-siaf-md text-center">Proceso</th><th class="w-[95px] px-siaf-md text-center">Código</th><th class="w-[220px] border-r border-[var(--sys-color-divider-strong)] px-siaf-md text-center">Nombre</th> }</tr>
                  </thead>
                  <tbody>
                    @for (row of filteredRows(); track row.id) {
                      <tr class="h-[58px] border-b border-[var(--sys-color-divider-default)] hover:bg-[var(--sys-color-bg-states-light-hover)]" [style.background-color]="selectedIds().has(row.id) ? 'var(--sys-color-bg-surfaces-highlight)' : null">
                        <td class="px-siaf-sm"><input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [attr.aria-label]="'Seleccionar versión ' + row.codigo" [checked]="selectedIds().has(row.id)" (change)="toggleRow(row.id)" /></td>
                        <td class="px-siaf-md">{{ row.anio }}</td><td class="w-[220px] whitespace-normal px-siaf-md leading-[normal]">{{ row.proceso }}</td><td class="px-siaf-md">{{ row.codigo }}</td><td class="px-siaf-md">{{ row.nombre }}</td>
                        @for (condition of [row.editable, row.pliego, row.vigente, row.oficial, row.disponible]; track $index) { <td class="border-[var(--sys-color-divider-default)] px-siaf-md text-center" [class.border-l]="$index === 0" [class.border-r]="$index === 4">@if (condition) { <siaf-icon name="check" [size]="24" /> }</td> }
                        @if (columnasExtendidas()) { <td class="px-siaf-md">{{ row.vinculada?.anio ?? '' }}</td><td class="whitespace-normal px-siaf-md leading-[normal]">{{ row.vinculada?.proceso ?? '' }}</td><td class="px-siaf-md">{{ row.vinculada?.codigo ?? '' }}</td><td class="border-r border-[var(--sys-color-divider-strong)] whitespace-normal px-siaf-md leading-[normal]">{{ row.vinculada?.nombre ?? '' }}</td> }
                        <td class="px-siaf-md"><siaf-status-tag [tone]="row.estado === 'Inactivo' ? 'default' : 'info'" appearance="soft" size="small" icon="check_circle">{{ row.estado }}</siaf-status-tag></td><td class="px-siaf-md">{{ row.desde }}</td><td class="px-siaf-md text-center">{{ row.hasta }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <siaf-pagination position="Bottom" [rowPage]="true" [page]="1" [pageSize]="10" [totalItems]="filteredRows().length" [totalPages]="1" />
            </div>
          </article>
          }
        </section>
      </div>
      <siaf-side-nav
        title="Búsqueda"
        [open]="filtrosPanelAbierto()"
        confirmLabel="Aplicar"
        [confirmDisabled]="false"
        (confirmed)="aplicarFiltros()"
        (canceled)="limpiarFiltros()"
        (closed)="cerrarFiltros()"
      >
        <div class="grid gap-siaf-lg">
          <siaf-input type="select" label="Año" [autoSuccess]="false" [options]="opcionesAnio" [value]="anioFiltro()" (valueChange)="anioFiltro.set($any($event))" />
          <siaf-input type="select" label="Proceso" [autoSuccess]="false" [options]="opcionesProceso" [value]="procesoFiltro()" (valueChange)="procesoFiltro.set($any($event))" />
          <siaf-input type="select" label="Código" [autoSuccess]="false" [options]="opcionesCodigo" [value]="codigoFiltro()" (valueChange)="codigoFiltro.set($any($event))" />
          <siaf-input type="select" label="Nombre" [autoSuccess]="false" [options]="opcionesNombre" [value]="nombreFiltro()" (valueChange)="nombreFiltro.set($any($event))" />
          <siaf-input type="select" label="Estado" [autoSuccess]="false" [options]="opcionesEstado" [value]="estadoFiltro()" (valueChange)="estadoFiltro.set($any($event))" />

          <section class="grid gap-siaf-sm">
            <h3 class="m-0 text-[10px] font-medium uppercase text-text-muted">Filtro por rango de fecha</h3>
            <div class="grid grid-cols-2 gap-siaf-xs">
              <siaf-date-time-picker label="Fecha desde" [defaultToToday]="false" [fullWidth]="true" [value]="fechaDesdeFiltro()" (valueChange)="fechaDesdeFiltro.set($event)" />
              <siaf-date-time-picker label="Fecha hasta" [defaultToToday]="false" [fullWidth]="true" [value]="fechaHastaFiltro()" (valueChange)="fechaHastaFiltro.set($event)" />
            </div>
          </section>

          <section class="grid gap-siaf-md">
            <h3 class="m-0 text-[10px] font-medium uppercase text-text-muted">Condiciones de versión</h3>
            <siaf-input type="select" label="Editable" [autoSuccess]="false" [options]="opcionesCondicion" [value]="editableFiltro()" (valueChange)="editableFiltro.set($any($event))" />
            <siaf-input type="select" label="Pliego" [autoSuccess]="false" [options]="opcionesCondicion" [value]="pliegoFiltro()" (valueChange)="pliegoFiltro.set($any($event))" />
            <siaf-input type="select" label="Vigente" [autoSuccess]="false" [options]="opcionesCondicion" [value]="vigenteFiltro()" (valueChange)="vigenteFiltro.set($any($event))" />
          <siaf-input type="select" label="Definitiva" [autoSuccess]="false" [options]="opcionesCondicion" [value]="oficialFiltro()" (valueChange)="oficialFiltro.set($any($event))" />
            <siaf-input type="select" label="Disponible" [autoSuccess]="false" [options]="opcionesCondicion" [value]="disponibleFiltro()" (valueChange)="disponibleFiltro.set($any($event))" />
          </section>
        </div>
      </siaf-side-nav>
      <siaf-column-visibility-panel
        [open]="columnasPanelAbierto()"
        [allSelected]="todasColumnasSeleccionadas()"
        [dirty]="columnasPanelModificado()"
        [sections]="seccionesColumnas"
        [isColumnVisible]="columnaBorradorVisible"
        (closed)="cerrarPanelColumnas()"
        (applied)="aplicarColumnas()"
        (toggleAll)="seleccionarTodasColumnas($event)"
        (toggleColumn)="alternarColumna($event.key, $event.event)"
      />
      <siaf-document-history-panel
        [open]="documentHistoryOpen()"
        [summary]="documentHistorySummary()"
        (closed)="documentHistoryOpen.set(false)"
      />
      <div class="fixed bottom-siaf-lg left-1/2 z-50 w-[calc(100%-32px)] max-w-[430px] -translate-x-1/2">
        <siaf-snackbar
          [open]="snackbarVisible()"
          tone="success"
          [message]="mensajeSnackbar"
          (closed)="snackbarVisible.set(false)"
        />
      </div>
    </main>
  `,
  styles: `
    :host ::ng-deep siaf-breadcrumb nav,
    :host ::ng-deep siaf-page-header header {
      padding-left: var(--sys-padding-base-md, 16px);
      padding-right: var(--sys-padding-base-md, 16px);
    }

    :host ::ng-deep siaf-breadcrumb nav {
      height: auto;
      min-height: 40px;
      padding-top: var(--sys-padding-base-md, 16px);
      padding-bottom: var(--sys-padding-base-md, 16px);
    }

    :host ::ng-deep siaf-page-header header {
      padding-top: var(--sys-padding-base-md, 16px);
      padding-bottom: var(--sys-padding-base-md, 16px);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoVersionesBandejaComponent {
  private readonly router = inject(Router);
  // La bandeja inicia mostrando solo las versiones activas. Al aplicar «Todos»
  // desde el filtro, el valor vacío desactiva esta restricción y expone también
  // las versiones inactivas, incluida la versión borrador recién editada.
  readonly search = signal(''); readonly versionDosInactiva = signal(Boolean(history.state?.['versionDosInactiva'])); readonly estado = signal('Activo'); readonly anio = signal(''); readonly added = signal(Boolean(history.state?.['versionRegistrada'])); readonly actualizada = signal(Boolean(history.state?.['versionActualizada'])); readonly versionCincoOficial = signal(Boolean(history.state?.['versionCincoOficial'])); readonly versionCincoDisponible = signal(Boolean(history.state?.['versionCincoDisponible'])); readonly versionSeisDisponible = signal(Boolean(history.state?.['versionSeisDisponible'])); readonly nuevoProceso = signal(Boolean(history.state?.['nuevoProceso'])); readonly snackbarVisible = signal(Boolean(history.state?.['mostrarSnackbar'])); readonly selectedIds = signal<Set<number>>(new Set());
  readonly filtrosPanelAbierto = signal(false);
  readonly activeTab = signal<'documents' | 'records'>(history.state?.['activeTab'] === 'records' ? 'records' : 'documents');
  readonly documentSearch = signal('');
  readonly documentStatusFilter = signal('');
  readonly documentActionFilter = signal('');
  readonly documentSystemFilter = signal('');
  readonly documentExtraFilterVisible = signal(false);
  readonly recordExtraFilterVisible = signal(false);
  readonly documentHistoryOpen = signal(false);
  readonly documentHistorySummary = signal<DocumentHistorySummary>({ solicitudId: '', document: '', number: '', actionType: '' });
  readonly columnasPanelAbierto = signal(false);
  readonly columnasExtendidas = signal(false);
  readonly columnasBorrador = signal<Set<string>>(new Set(['anio', 'proceso', 'codigo', 'nombre', 'editable', 'pliego', 'vigente', 'oficial', 'disponible', 'estado', 'desde', 'hasta']));
  private readonly columnasIniciales = new Set(['anio', 'proceso', 'codigo', 'nombre', 'editable', 'pliego', 'vigente', 'oficial', 'disponible', 'estado', 'desde', 'hasta']);
  readonly anioFiltro = signal(''); readonly procesoFiltro = signal(''); readonly codigoFiltro = signal(''); readonly nombreFiltro = signal(''); readonly estadoFiltro = signal(''); readonly fechaDesdeFiltro = signal(''); readonly fechaHastaFiltro = signal(''); readonly editableFiltro = signal(''); readonly pliegoFiltro = signal(''); readonly vigenteFiltro = signal(''); readonly oficialFiltro = signal(''); readonly disponibleFiltro = signal('');
  readonly mensajeSnackbar = this.actualizada() && !this.nuevoProceso() ? 'Registro actualizado con éxito' : 'Registro agregado con éxito';
  readonly breadcrumbs = [{ label: 'Inicio', href: '/panel' }, { label: 'Procesos presupuesto' }, { label: 'Clasificadores y catálogos' }, { label: 'Catálogo de Versiones' }];
  /** Esta pantalla representa el listado de registros; no crea documentos desde el catálogo. */
  readonly tabsItems: RecordsTabItem[] = [{ id: 'documents', label: 'Documentos' }, { id: 'records', label: 'Registros' }];
  readonly optionsMenu = [{ label: 'Ocultar o mostrar columnas', value: 'columns' }];
  readonly documentStatusOptions = [{ label: 'Aceptado', value: 'Aceptado' }];
  readonly documentActionOptions = [{ label: 'Creación', value: 'Creación' }];
  readonly documentSystemOptions = [{ label: 'Presupuesto', value: 'Presupuesto' }];
  readonly documentAdditionalFilters = [{ label: 'Sistema', value: 'system' }];
  readonly recordStatusOptions = [{ label: 'Todos', value: '' }, { label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }];
  readonly recordYearOptions = computed(() => [...new Set(this.displayedRows().map(row => row.anio))].map(year => ({ label: year, value: year })));
  readonly recordProcessOptions = computed(() => [...new Set(this.displayedRows().map(row => row.proceso))].map(process => ({ label: process, value: process })));
  readonly recordAdditionalFilters = [{ label: 'Proceso', value: 'process' }];
  readonly seccionesColumnas: ColumnVisibilityPanelSection[] = [
    { label: 'Campos generales', locked: true, columns: this.columnas(['anio', 'Año'], ['proceso', 'Proceso'], ['codigo', 'Código'], ['nombre', 'Nombre']) },
    { label: 'Condiciones de versión', columns: this.columnas(['editable', 'Editable'], ['pliego', 'Pliego'], ['vigente', 'Vigente'], ['oficial', 'Definitiva'], ['disponible', 'Disponible']) },
    { label: 'Versión vinculada', columns: this.columnas(['vinculadaAnio', 'Año'], ['vinculadaProceso', 'Proceso'], ['vinculadaCodigo', 'Código'], ['vinculadaNombre', 'Nombre']) },
    { label: 'Vigencia de versión', columns: this.columnas(['estado', 'Estado'], ['desde', 'Fecha desde'], ['hasta', 'Fecha hasta']) }
  ];
  readonly opcionesAnio = [{ label: 'Todos', value: '' }, { label: '2026', value: '2026' }];
  readonly opcionesProceso = [{ label: 'Todos', value: '' }, { label: 'M02.1.9.1', value: 'M02.1.9.1' }, { label: 'M02.1.9.2', value: 'M02.1.9.2' }];
  readonly opcionesCodigo = [{ label: 'Todos', value: '' }, { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }];
  readonly opcionesNombre = [{ label: 'Todos', value: '' }, { label: 'Versión aprobada PCM', value: 'Versión aprobada PCM' }, { label: 'Versión DGPP borrador', value: 'Versión DGPP borrador' }];
  readonly opcionesEstado = [{ label: 'Todos', value: 'todos' }, { label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }];
  readonly opcionesCondicion = [{ label: 'Todos', value: '' }, { label: 'Sí', value: 'true' }, { label: 'No', value: 'false' }];
  readonly rows: VersionRow[] = [
    { id: 1, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '1', nombre: 'Versión DGPP', editable: true, pliego: false, vigente: false, oficial: false, disponible: false, estado: 'Activo', desde: '05/07/2026', hasta: '-' },
    { id: 2, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '2', nombre: 'Versión DGPP borrador', editable: false, pliego: false, vigente: false, oficial: false, disponible: false, estado: 'Activo', desde: '05/07/2026', hasta: '-' },
    { id: 3, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '3', nombre: 'Versión Conciliada por el Pliego', editable: true, pliego: true, vigente: false, oficial: false, disponible: false, estado: 'Activo', desde: '15/07/2026', hasta: '-' },
    { id: 4, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '4', nombre: 'Versión aprobada MEF', editable: false, pliego: false, vigente: false, oficial: false, disponible: false, estado: 'Activo', desde: '20/08/2026', hasta: '-' },
  ];
  readonly documents: VersionDocumentRow[] = [
    { id: 4, documento: 'Documento autogenerado', numero: '0004', tipoAccion: 'Creación', estado: 'Aceptado', sistema: 'Presupuesto', fecha: '15/06/2024', entidad: '009 Ministerio de Economía y Finanzas' },
    { id: 3, documento: 'Documento autogenerado', numero: '0003', tipoAccion: 'Creación', estado: 'Aceptado', sistema: 'Presupuesto', fecha: '20/01/2024', entidad: '009 Ministerio de Economía y Finanzas' },
    { id: 2, documento: 'Documento autogenerado', numero: '0002', tipoAccion: 'Creación', estado: 'Aceptado', sistema: 'Presupuesto', fecha: '15/12/2023', entidad: '009 Ministerio de Economía y Finanzas' },
    { id: 1, documento: 'Documento autogenerado', numero: '0001', tipoAccion: 'Creación', estado: 'Aceptado', sistema: 'Presupuesto', fecha: '20/11/2023', entidad: '009 Ministerio de Economía y Finanzas' },
  ];
  readonly filteredDocuments = computed(() => {
    const term = this.documentSearch().trim().toLowerCase();
    return this.documents.filter(row =>
      (!term || Object.values(row).some(value => String(value).toLowerCase().includes(term)))
      && (!this.documentStatusFilter() || row.estado === this.documentStatusFilter())
      && (!this.documentActionFilter() || row.tipoAccion === this.documentActionFilter())
      && (!this.documentSystemFilter() || row.sistema === this.documentSystemFilter())
    );
  });
  readonly nuevaVersion = computed<VersionRow>(() => ({ id: 5, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '5', nombre: 'Versión aprobada PCM', editable: true, pliego: false, vigente: true, oficial: this.versionCincoOficial(), disponible: this.versionCincoDisponible(), estado: 'Activo', desde: '20/08/2026', hasta: '-' }));
  readonly nuevaVersionProceso = computed<VersionRow>(() => ({ id: 6, anio: '2026', proceso: 'M02.1.9.2 Programación Multianual Pliego - UE', codigo: '1', nombre: 'Versión Programación APM Aprobada', editable: true, pliego: false, vigente: true, oficial: false, disponible: this.versionSeisDisponible(), estado: 'Activo', desde: '24/08/2026', hasta: '-', vinculada: { anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '5', nombre: 'Versión Aprobada PCM' } }));
  readonly displayedRows = computed(() => {
    const rows = this.rows.slice().reverse().map(row => row.id === 2 && this.versionDosInactiva() ? { ...row, estado: 'Inactivo', hasta: '09/09/2026' } : row);
    return this.added() ? [...(this.nuevoProceso() ? [this.nuevaVersionProceso()] : []), this.nuevaVersion(), ...rows] : rows;
  });
  readonly filteredRows = computed(() => {
    const term = this.search().toLowerCase();
    const fechaIso = (fecha: string) => fecha === '-' ? '' : fecha.split('/').reverse().join('-');
    const condicion = (valor: boolean, filtro: string) => !filtro || String(valor) === filtro;
    return this.displayedRows().filter(row =>
      (!term || Object.values(row).some(valor => String(valor).toLowerCase().includes(term)))
      && (!this.estado() || row.estado === this.estado())
      && (!this.anio() || row.anio === this.anio())
      && (!this.procesoFiltro() || row.proceso === this.procesoFiltro())
      && (!this.codigoFiltro() || row.codigo === this.codigoFiltro())
      && (!this.nombreFiltro() || row.nombre === this.nombreFiltro())
      && (!this.fechaDesdeFiltro() || fechaIso(row.desde) >= this.fechaDesdeFiltro())
      && (!this.fechaHastaFiltro() || fechaIso(row.hasta) <= this.fechaHastaFiltro())
      && condicion(row.editable, this.editableFiltro())
      && condicion(row.pliego, this.pliegoFiltro())
      && condicion(row.vigente, this.vigenteFiltro())
      && condicion(row.oficial, this.oficialFiltro())
      && condicion(row.disponible, this.disponibleFiltro())
    );
  });
  readonly allSelected = computed(() => this.filteredRows().length > 0 && this.filteredRows().every(r => this.selectedIds().has(r.id)));
  readonly someSelected = computed(() => !this.allSelected() && this.filteredRows().some(r => this.selectedIds().has(r.id)));
  abrirFiltros(): void {
    this.snackbarVisible.set(false);
    this.anioFiltro.set(this.anio()); this.estadoFiltro.set(this.estado() || 'todos');
    this.filtrosPanelAbierto.set(true);
  }
  cerrarFiltros(): void { this.filtrosPanelAbierto.set(false); }
  limpiarFiltros(): void {
    this.anioFiltro.set(''); this.procesoFiltro.set(''); this.codigoFiltro.set(''); this.nombreFiltro.set(''); this.estadoFiltro.set('todos'); this.fechaDesdeFiltro.set(''); this.fechaHastaFiltro.set(''); this.editableFiltro.set(''); this.pliegoFiltro.set(''); this.vigenteFiltro.set(''); this.oficialFiltro.set(''); this.disponibleFiltro.set('');
  }
  aplicarFiltros(): void { this.snackbarVisible.set(false); this.anio.set(this.anioFiltro()); this.estado.set(this.estadoFiltro() === 'todos' ? '' : this.estadoFiltro()); this.cerrarFiltros(); }
  agregarFiltroDocumento(filter: string): void { if (filter === 'system') this.documentExtraFilterVisible.set(true); }
  agregarFiltroRegistro(filter: string): void { if (filter === 'process') this.recordExtraFilterVisible.set(true); }
  manejarMasOpciones(opcion: string): void { if (opcion === 'columns') { this.snackbarVisible.set(false); this.columnasPanelAbierto.set(true); } }
  cerrarPanelColumnas(): void { this.columnasPanelAbierto.set(false); this.columnasBorrador.set(new Set(this.columnasExtendidas() ? this.todasLasColumnas : this.columnasIniciales)); }
  readonly columnaBorradorVisible = (key: string): boolean => this.columnasBorrador().has(key);
  readonly todasColumnasSeleccionadas = computed(() => this.todasLasColumnas.every(key => this.columnasBorrador().has(key)));
  readonly columnasPanelModificado = computed(() => this.todasLasColumnas.some(key => this.columnasBorrador().has(key) !== (this.columnasExtendidas() || this.columnasIniciales.has(key))));
  seleccionarTodasColumnas(event: Event): void { const checked = (event.target as HTMLInputElement).checked; this.columnasBorrador.set(checked ? new Set(this.todasLasColumnas) : new Set(this.columnasIniciales)); }
  alternarColumna(key: string, event: Event): void { const next = new Set(this.columnasBorrador()); (event.target as HTMLInputElement).checked ? next.add(key) : next.delete(key); this.columnasBorrador.set(next); }
  aplicarColumnas(): void { this.snackbarVisible.set(false); this.columnasExtendidas.set(this.todasLasColumnas.every(key => this.columnasBorrador().has(key))); this.columnasPanelAbierto.set(false); }
  private columnas(...items: [string, string][]): DocumentsRecordsColumn[] { return items.map(([key, label]) => ({ key, label, visibility: 'visible', group: 'more' })); }
  private readonly todasLasColumnas = ['anio', 'proceso', 'codigo', 'nombre', 'editable', 'pliego', 'vigente', 'oficial', 'disponible', 'vinculadaAnio', 'vinculadaProceso', 'vinculadaCodigo', 'vinculadaNombre', 'estado', 'desde', 'hasta'];
  crearVersion(): void { void this.router.navigateByUrl('/procesos/catalogo-versiones/nuevo', { state: { versionCincoActualizada: this.actualizada(), versionCincoOficial: this.versionCincoOficial(), versionCincoDisponible: this.versionCincoDisponible(), versionSeisDisponible: this.versionSeisDisponible() } }); }
  puedeEditarSeleccion = (): boolean => this.selectedIds().size === 1 && (this.selectedIds().has(5) || this.selectedIds().has(2));
  editarVersion(): void {
    if (!this.puedeEditarSeleccion()) return;
    const codigoEdicion = this.selectedIds().has(2) ? '2' : '5';
    void this.router.navigateByUrl('/procesos/catalogo-versiones/nuevo', { state: { edicionVersion: true, codigoEdicion, versionCincoActualizada: this.actualizada(), versionCincoOficial: this.versionCincoOficial(), versionCincoDisponible: this.versionCincoDisponible(), versionSeisDisponible: this.versionSeisDisponible(), nuevoProcesoExistente: this.nuevoProceso() } });
  }
  toggleRow(id: number): void { const next = new Set(this.selectedIds()); next.has(id) ? next.delete(id) : next.add(id); this.selectedIds.set(next); }
  toggleAll(checked: boolean): void { const next = new Set(this.selectedIds()); this.filteredRows().forEach(r => checked ? next.add(r.id) : next.delete(r.id)); this.selectedIds.set(next); }
  seleccionarPestana(tab: string): void {
    this.activeTab.set(tab === 'records' ? 'records' : 'documents');
    this.documentHistoryOpen.set(false);
  }
  abrirHistorialDocumento(row: VersionDocumentRow): void {
    this.documentHistorySummary.set({
      solicitudId: '', document: row.documento, number: row.numero, actionType: row.tipoAccion,
      staticRows: row.numero === '0002'
        ? [{ usuario: 'JUAN DOE PEREZ', rol: 'DGPP', fecha: '19/02/2026', hora: '08:00:59', estado: 'ACEPTADO', comentario: '' }]
        : [],
    });
    this.documentHistoryOpen.set(true);
  }
}
