import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DocumentHistoryPanelComponent, DocumentHistorySummary } from '../../../shared/components/document-history-panel/document-history-panel.component';
import { FilterPillComponent } from '../../../shared/components/filter-pill/filter-pill.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { RecordsSearchToolbarComponent } from '../../../shared/components/records-search-toolbar/records-search-toolbar.component';
import { RecordsTabItem } from '../../../shared/components/records-tabs/records-tabs.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { IconDropdownMenuComponent } from '../../../shared/ui/icon-dropdown-menu/icon-dropdown-menu.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { StatusTagComponent } from '../../../shared/ui/status-tag/status-tag.component';
import { SnackbarComponent } from '../../../shared/ui/snackbar/snackbar.component';
import { SideNavComponent } from '../../../shared/ui/side-nav/side-nav.component';
import { DateTimePickerComponent } from '../../../shared/ui/date-time-picker/date-time-picker.component';
import { TextFieldComponent } from '../../../shared/ui/text-field/text-field.component';
import { TooltipDirective } from '../../../shared/ui/tooltip/tooltip.directive';
import { ColumnVisibilityPanelComponent, ColumnVisibilityPanelSection } from '../../../shared/ui/column-visibility-panel/column-visibility-panel.component';
import type { DocumentsRecordsColumn } from '../../../shared/types/documents-records.types';

type VersionRow = { id: number; anio: string; proceso: string; codigo: string; nombre: string; descripcion: string; editable: boolean; pliego: boolean; vigente: boolean; oficial: boolean; definitiva: boolean; disponible: boolean; estado: string; desde: string; hasta: string; auditadoEn: string; vinculada?: { anio: string; proceso: string; codigo: string; nombre: string; }; };
type VersionDocumentRow = { id: number; documento: string; numero: string; tipoAccion: string; estado: string; sistema: string; fecha: string; entidad: string; };

/** Estado deliberadamente mínimo para iniciar una demostración nueva. */
const BASE_VERSION_ROWS: VersionRow[] = [
  { id: 1, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '1', nombre: 'Versión DGPP', descripcion: 'Versión inicial del proceso.', editable: true, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false, estado: 'Activo', desde: '05/07/2026', hasta: '-', auditadoEn: '05/07/2026 08:00' },
  { id: 2, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '2', nombre: 'Versión DGPP borrador', descripcion: 'Borrador para revisión.', editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false, estado: 'Activo', desde: '05/07/2026', hasta: '-', auditadoEn: '05/07/2026 09:00' },
  { id: 3, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '3', nombre: 'Versión Conciliada por el Pliego', descripcion: 'Versión conciliada.', editable: true, pliego: true, vigente: false, oficial: false, definitiva: false, disponible: false, estado: 'Activo', desde: '15/07/2026', hasta: '-', auditadoEn: '15/07/2026 10:00' },
  { id: 4, anio: '2026', proceso: 'M02.1.9.1 Asignación Presupuestaria Multianual', codigo: '4', nombre: 'Versión aprobada MEF', descripcion: 'Versión aprobada.', editable: false, pliego: false, vigente: false, oficial: false, definitiva: false, disponible: false, estado: 'Activo', desde: '20/08/2026', hasta: '-', auditadoEn: '20/08/2026 11:00' },
];
const DEMO_STORAGE_KEY = 'siaf.catalogo-versiones.demo.v2';
const LEGACY_STORAGE_KEY = 'siaf.catalogo-versiones.rows';
const SESSION_STORAGE_KEY = 'siaf.catalogo-versiones.session.v1';

@Component({
  selector: 'siaf-catalogo-versiones-bandeja',
  standalone: true,
  imports: [BreadcrumbComponent, ButtonComponent, ColumnVisibilityPanelComponent, DocumentHistoryPanelComponent, FilterPillComponent, IconComponent, IconDropdownMenuComponent, ModalComponent, PageHeaderComponent, PaginationComponent, RecordsSearchToolbarComponent, SnackbarComponent, SideNavComponent, StatusTagComponent, DateTimePickerComponent, TextFieldComponent, TooltipDirective],
  template: `
    <main class="min-h-[calc(100vh-56px)] overflow-x-hidden bg-[var(--sys-color-bg-surfaces-surface-lowest)] text-text">
      <div class="w-full">
        <siaf-breadcrumb [items]="breadcrumbs" />
        <siaf-page-header title="Catálogo de versiones" />
        <section class="w-full p-siaf-md">
          @if (false) {
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
            <header class="flex h-14 items-center px-siaf-md pt-siaf-md">
              <h2 class="m-0 text-base font-bold uppercase tracking-[0.02px] text-text">Versiones</h2>
              <siaf-button class="ml-auto" variant="accent" icon="add" [iconOnly]="true" ariaLabel="Registrar versión" (click)="crearVersion()" />
            </header>

            <div class="flex min-w-0 flex-col gap-siaf-xs p-siaf-md">
              <siaf-records-search-toolbar [value]="search()" placeholder="Buscar" (valueChange)="search.set($any($event))">
                <ng-container actions>
                  <siaf-button variant="text" icon="filter_list" [iconOnly]="true" ariaLabel="Filtros" [activated]="filtrosPanelAbierto()" (click)="abrirFiltros()" />
                  <siaf-icon-dropdown-menu icon="more_vert" ariaLabel="Más opciones" [items]="optionsMenu" (selected)="manejarMasOpciones($event)" />
                </ng-container>
              </siaf-records-search-toolbar>

              <!-- Solo esta caja admite scroll horizontal; no se propaga al shell ni a los controles. -->
              <div class="min-w-0 max-w-full overflow-x-auto rounded-siaf-sm" aria-label="Grilla de versiones">
                <table class="table-fixed border-collapse text-left text-sm" [style.width.px]="2860" [style.min-width.px]="2860">
                  <!-- En una tabla fixed los anchos del segundo encabezado no determinan columnas: este colgroup es la fuente única de verdad. -->
                  <colgroup>
                    @if (columnaVisible('anio')) { <col [style.width.px]="90" /> }
                    @if (columnaVisible('proceso')) { <col [style.width.px]="280" /> }
                    @if (columnaVisible('codigo')) { <col [style.width.px]="80" /> }
                    @if (columnaVisible('nombre')) { <col [style.width.px]="280" /> }
                    @if (columnaVisible('descripcion')) { <col [style.width.px]="320" /> }
                    @for (condition of condicionesVisibles(); track condition) { <col [style.width.px]="100" /> }
                    @for (column of vinculadasVisibles(); track column) { <col [style.width.px]="anchoColumnaVinculadaPx(column)" /> }
                    @if (columnaVisible('estado')) { <col [style.width.px]="170" /> }
                    @if (columnaVisible('desde')) { <col [style.width.px]="120" /> }
                    @if (columnaVisible('hasta')) { <col [style.width.px]="120" /> }
                  </colgroup>
                  <thead class="bg-surface-high text-[10px] font-bold uppercase text-text">
                    <tr class="h-10 border-b border-[var(--sys-color-divider-default)]">
                      @if (columnaVisible('anio')) { <th rowspan="2" class="w-[90px] px-siaf-md text-left">Año</th> } @if (columnaVisible('proceso')) { <th rowspan="2" class="w-[280px] px-siaf-md text-left">Proceso</th> } @if (columnaVisible('codigo')) { <th rowspan="2" class="w-[80px] px-siaf-md text-left">Código</th> } @if (columnaVisible('nombre')) { <th rowspan="2" class="w-[280px] px-siaf-md text-left">Nombre</th> } @if (columnaVisible('descripcion')) { <th rowspan="2" class="w-[320px] px-siaf-md text-left">Descripción</th> }
                      @if (condicionesVisibles().length) { <th [attr.colspan]="condicionesVisibles().length" class="condiciones-versiones-grupo px-siaf-md text-center">Condiciones de versión</th> }
                      @if (vinculadasVisibles().length) { <th [attr.colspan]="vinculadasVisibles().length" class="border-r border-[var(--sys-color-divider-strong)] px-siaf-md text-center">Versión vinculada</th> }
                      @if (columnaVisible('estado')) { <th rowspan="2" class="w-[170px] min-w-[170px] px-siaf-md text-left">Estado</th> } @if (columnaVisible('desde')) { <th rowspan="2" class="w-[120px] px-siaf-md text-left">Fecha desde</th> } @if (columnaVisible('hasta')) { <th rowspan="2" class="w-[120px] px-siaf-md text-left">Fecha hasta</th> }
                    </tr>
                    <tr class="h-10 border-b border-[var(--sys-color-divider-default)]">@for (condition of condicionesVisibles(); track condition) { <th class="w-[100px] px-siaf-md text-left" [class.condicion-divider-inicio]="condition === 'editable'" [class.condicion-divider-fin]="condition === 'disponible'">{{ etiquetaColumna(condition) }}</th> } @for (column of vinculadasVisibles(); track column) { <th [class]="anchoColumnaVinculada(column)">{{ etiquetaColumna(column) }}</th> }</tr>
                  </thead>
                  <tbody>
                    @for (row of filteredRows(); track row.id) {
                      <tr class="h-[58px] cursor-pointer border-b border-[var(--sys-color-divider-default)] hover:bg-[var(--sys-color-bg-states-light-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sys-color-border-states-focus)]" role="button" tabindex="0" [attr.aria-label]="'Editar versión ' + row.codigo" (click)="editarVersion(row)" (keydown.enter)="editarVersion(row)" (keydown.space)="$event.preventDefault(); editarVersion(row)">
                        @if (columnaVisible('anio')) { <td class="px-siaf-sm">{{ row.anio }}</td> }
                        @if (columnaVisible('proceso')) { <td class="whitespace-normal px-siaf-sm leading-[normal]">{{ row.proceso }}</td> }
                        @if (columnaVisible('codigo')) { <td class="px-siaf-sm">{{ row.codigo }}</td> }
                        @if (columnaVisible('nombre')) { <td class="whitespace-normal px-siaf-sm leading-[normal]">{{ row.nombre }}</td> }
                        @if (columnaVisible('descripcion')) { <td class="whitespace-normal px-siaf-sm leading-[normal]">{{ row.descripcion }}</td> }
                        @for (condition of condicionesVisibles(); track condition) { <td class="px-siaf-sm text-center" [class.condicion-divider-inicio]="condition === 'editable'" [class.condicion-divider-fin]="condition === 'disponible'">@if ($any(row)[condition]) { <siaf-icon name="check" [size]="24" /> }</td> }
                        @for (column of vinculadasVisibles(); track column) { <td [class]="claseCeldaVinculada(column)">{{ valorVinculado(row, column) }}</td> }
                        @if (columnaVisible('estado')) { <td class="px-siaf-sm"><siaf-status-tag [tone]="row.estado === 'Inactivo' ? 'default' : 'info'" appearance="soft" size="small" [icon]="row.estado === 'Inactivo' ? 'info' : 'check_circle'">{{ row.estado }}</siaf-status-tag></td> } @if (columnaVisible('desde')) { <td class="px-siaf-sm">{{ row.desde }}</td> } @if (columnaVisible('hasta')) { <td class="px-siaf-sm text-center">{{ row.hasta }}</td> }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <siaf-pagination position="Bottom" [rowPage]="true" [page]="1" [pageSize]="10" [totalItems]="persistedFilteredRows().length" [totalPages]="1" />
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

          <section class="grid gap-siaf-md">
            <h3 class="m-0 text-[10px] font-medium uppercase text-text-muted">Versión vinculada</h3>
            <siaf-input type="select" label="Año" [autoSuccess]="false" [options]="opcionesVinculadaAnio()" [value]="vinculadaAnioFiltro()" (valueChange)="vinculadaAnioFiltro.set($any($event))" />
            <siaf-input type="select" label="Proceso" [autoSuccess]="false" [options]="opcionesVinculadaProceso()" [value]="vinculadaProcesoFiltro()" (valueChange)="vinculadaProcesoFiltro.set($any($event))" />
            <siaf-input type="select" label="Código" [autoSuccess]="false" [options]="opcionesVinculadaCodigo()" [value]="vinculadaCodigoFiltro()" (valueChange)="vinculadaCodigoFiltro.set($any($event))" />
            <siaf-input type="select" label="Nombre" [autoSuccess]="false" [options]="opcionesVinculadaNombre()" [value]="vinculadaNombreFiltro()" (valueChange)="vinculadaNombreFiltro.set($any($event))" />
          </section>

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
            <siaf-input type="select" label="Oficial" [autoSuccess]="false" [options]="opcionesCondicion" [value]="oficialFiltro()" (valueChange)="oficialFiltro.set($any($event))" />
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
      <siaf-modal
        [open]="confirmacionGrabacionAbierta()"
        variant="custom"
        title="¿Grabar versión?"
        description="El registro se grabará."
        illustrationSrc="assets/figma/modals/save_1.svg"
        [showIllustration]="true"
        (confirmed)="confirmarGrabacionEdicion()"
        (canceled)="cerrarConfirmacionGrabacion()"
        (closed)="cerrarConfirmacionGrabacion()"
      />
      <siaf-modal
        [open]="confirmacionReinicioDemoAbierta()"
        variant="custom"
        title="¿Reiniciar demo?"
        description="Se eliminarán los registros guardados de este catálogo y se restaurarán los cuatro registros base."
        cancelLabel="Cancelar"
        confirmLabel="Reiniciar"
        confirmVariant="primary"
        (confirmed)="confirmarReinicioDemo()"
        (canceled)="cerrarConfirmacionReinicioDemo()"
        (closed)="cerrarConfirmacionReinicioDemo()"
      />
      <siaf-modal
        [open]="confirmacionCancelacionFilaAbierta()"
        variant="custom"
        [title]="tituloConfirmacionCancelacionFila()"
        description="Se perderán los datos ingresados."
        cancelLabel="Cancelar"
        confirmLabel="Aceptar"
        confirmVariant="primary"
        (confirmed)="confirmarCancelacionFila()"
        (canceled)="cerrarConfirmacionCancelacionFila()"
        (closed)="cerrarConfirmacionCancelacionFila()"
      />
      <div class="fixed bottom-siaf-lg left-1/2 z-50 w-[calc(100%-32px)] max-w-[430px] -translate-x-1/2">
        <siaf-snackbar
          [open]="snackbarVisible()"
          tone="success"
          [message]="mensajeSnackbar()"
          (closed)="snackbarVisible.set(false)"
        />
      </div>
    </main>
  `,
  styles: `
    .descripcion-resumida {
      display: -webkit-box;
      max-width: 288px;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .descripcion-disparador {
      cursor: pointer;
      border: 0;
      background: transparent;
      padding: 0;
      text-align: left;
      color: inherit;
      font: inherit;
    }

    .descripcion-disparador:focus-visible {
      outline: 2px solid var(--sys-color-border-states-focus);
      outline-offset: 2px;
      border-radius: var(--sys-radius-sm, 4px);
    }

    .descripcion-completa-popover {
      margin: 0;
      max-height: 280px;
      overflow-y: auto;
      white-space: pre-wrap;
      user-select: text;
      line-height: 1.45;
    }

    /* Delimitan el grupo de condiciones con el mismo divider tenue de la tabla.
       La regla explícita evita que el borde colapsado herede el negro del navegador. */
    .condiciones-versiones-grupo {
      border-inline: 1px solid var(--sys-color-divider-default) !important;
    }

    .condicion-divider-inicio {
      border-left: 1px solid var(--sys-color-divider-default) !important;
    }

    .condicion-divider-fin {
      border-right: 1px solid var(--sys-color-divider-default) !important;
    }

    :host ::ng-deep siaf-input.version-vinculada-codigo {
      display: block;
      width: 100%;
      min-width: 0;
    }

    :host ::ng-deep text-area-control textarea {
      height: 48px;
      max-height: 48px;
      overflow-y: auto;
    }

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
  // La bandeja inicia mostrando solo las versiones activas. «Todos» expone
  // también las bajas lógicas sin perder sus fechas ni demás datos.
  readonly search = signal(''); readonly estado = signal('Activo'); readonly anio = signal(''); readonly snackbarVisible = signal(false); readonly selectedIds = signal<Set<number>>(new Set());
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
  readonly editingId = signal<number | null>(null);
  readonly draft = signal<VersionRow | null>(null);
  readonly filaNueva = signal<VersionRow | null>(null);
  readonly nombreAutocompletado = signal(false);
  readonly descripcionAutocompletada = signal(false);
  readonly procesoNombreAutocompletado = signal<string | null>(null);
  readonly procesoDescripcionAutocompletada = signal<string | null>(null);
  readonly nombreEditadoManualmente = signal(false);
  readonly descripcionEditadaManualmente = signal(false);
  readonly confirmacionGrabacionAbierta = signal(false);
  readonly confirmacionReinicioDemoAbierta = signal(false);
  readonly confirmacionCancelacionFilaAbierta = signal(false);
  readonly descripcionPopoverId = signal<number | null>(null);
  readonly editError = signal('');
  readonly columnasPanelAbierto = signal(false);
  readonly columnasExtendidas = signal(true);
  readonly columnasBorrador = signal<Set<string>>(new Set(['anio', 'proceso', 'codigo', 'nombre', 'editable', 'pliego', 'vigente', 'oficial', 'definitiva', 'disponible', 'vinculadaAnio', 'vinculadaProceso', 'vinculadaCodigo', 'vinculadaNombre', 'estado', 'desde', 'hasta']));
  readonly columnasVisibles = signal<Set<string>>(new Set(this.columnasBorrador()));
  private readonly columnasIniciales = new Set(['anio', 'proceso', 'codigo', 'nombre', 'editable', 'pliego', 'vigente', 'oficial', 'definitiva', 'disponible', 'vinculadaAnio', 'vinculadaProceso', 'vinculadaCodigo', 'vinculadaNombre', 'estado', 'desde', 'hasta']);
  readonly anioFiltro = signal(''); readonly procesoFiltro = signal(''); readonly codigoFiltro = signal(''); readonly nombreFiltro = signal(''); readonly estadoFiltro = signal(''); readonly vinculadaAnioFiltro = signal(''); readonly vinculadaProcesoFiltro = signal(''); readonly vinculadaCodigoFiltro = signal(''); readonly vinculadaNombreFiltro = signal(''); readonly fechaDesdeFiltro = signal(''); readonly fechaHastaFiltro = signal(''); readonly editableFiltro = signal(''); readonly pliegoFiltro = signal(''); readonly vigenteFiltro = signal(''); readonly oficialFiltro = signal(''); readonly disponibleFiltro = signal('');
  readonly mensajeSnackbar = signal('');
  readonly tituloConfirmacionCancelacionFila = computed(() => this.editingId() !== null && this.esFilaNueva(this.editingId()!) ? '¿Está seguro(a) de cancelar el registro?' : '¿Está seguro(a) de cancelar la edición?');
  readonly breadcrumbs = [{ label: 'Inicio', href: '/panel' }, { label: 'Procesos presupuesto' }, { label: 'Clasificadores y catálogos' }, { label: 'Catálogo de versiones' }];
  /** Esta pantalla representa el listado de registros; no crea documentos desde el catálogo. */
  readonly tabsItems: RecordsTabItem[] = [{ id: 'documents', label: 'Documentos' }, { id: 'records', label: 'Registros' }];
  readonly optionsMenu = [{ label: 'Ocultar o mostrar columnas', value: 'columns', divider: true }, { label: 'Reiniciar demo', value: 'reset-demo', icon: 'restart_alt' }];
  readonly documentStatusOptions = [{ label: 'Aceptado', value: 'Aceptado' }];
  readonly documentActionOptions = [{ label: 'Creación', value: 'Creación' }];
  readonly documentSystemOptions = [{ label: 'Presupuesto', value: 'Presupuesto' }];
  readonly documentAdditionalFilters = [{ label: 'Sistema', value: 'system' }];
  readonly recordStatusOptions = [{ label: 'Todos', value: 'todos' }, { label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }];
  readonly recordYearOptions = computed(() => [...new Set(this.displayedRows().map(row => row.anio))].map(year => ({ label: year, value: year })));
  readonly recordProcessOptions = computed(() => [...new Set(this.displayedRows().map(row => row.proceso))].map(process => ({ label: process, value: process })));
  readonly recordAdditionalFilters = [{ label: 'Proceso', value: 'process' }];
  readonly seccionesColumnas: ColumnVisibilityPanelSection[] = [
    { label: 'Campos generales', locked: true, columns: this.columnas(['anio', 'Año'], ['proceso', 'Proceso'], ['codigo', 'Código'], ['nombre', 'Nombre'], ['descripcion', 'Descripción']) },
    { label: 'Condiciones de versión', columns: this.columnas(['editable', 'Editable'], ['pliego', 'Pliego'], ['vigente', 'Vigente'], ['oficial', 'Oficial'], ['definitiva', 'Definitiva'], ['disponible', 'Disponible']) },
    { label: 'Versión vinculada', columns: this.columnas(['vinculadaAnio', 'Año'], ['vinculadaProceso', 'Proceso'], ['vinculadaCodigo', 'Código'], ['vinculadaNombre', 'Nombre']) },
    { label: 'Vigencia de versión', columns: this.columnas(['estado', 'Estado'], ['desde', 'Fecha desde'], ['hasta', 'Fecha hasta']) }
  ];
  readonly opcionesAnio = [{ label: 'Todos', value: '' }, { label: '2026', value: '2026' }];
  readonly opcionesProceso = [{ label: 'Todos', value: '' }, { label: 'M02.1.9.1', value: 'M02.1.9.1' }, { label: 'M02.1.9.2', value: 'M02.1.9.2' }];
  readonly opcionesProcesoEdicion = [
    { label: 'M02.1.9 Programación Multianual Presupuestaria', value: 'M02.1.9 Programación Multianual Presupuestaria' },
    { label: 'M02.1.9.1 Asignación Presupuestaria Multianual', value: 'M02.1.9.1 Asignación Presupuestaria Multianual' },
    { label: 'M02.1.9.2 Programación Multianual Pliego - UE', value: 'M02.1.9.2 Programación Multianual Pliego - UE' },
    { label: 'M02.1.10 Formulación y Aprobación del Presupuesto', value: 'M02.1.10 Formulación y Aprobación del Presupuesto' },
  ];
  readonly opcionesCodigo = [{ label: 'Todos', value: '' }, { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }];
  readonly opcionesNombre = [{ label: 'Todos', value: '' }, { label: 'Versión aprobada PCM', value: 'Versión aprobada PCM' }, { label: 'Versión DGPP borrador', value: 'Versión DGPP borrador' }];
  readonly opcionesEstado = [{ label: 'Todos', value: 'todos' }, { label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }];
  readonly opcionesEstadoEdicion = [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }];
  readonly opcionesCondicion = [{ label: 'Todos', value: '' }, { label: 'Sí', value: 'true' }, { label: 'No', value: 'false' }];
  readonly rows = signal<VersionRow[]>(structuredClone(BASE_VERSION_ROWS));
  constructor() {
    if (typeof localStorage === 'undefined') return;
    try {
      // La demostración siempre parte de sus cuatro registros base. Limpiamos
      // los datos persistidos por versiones anteriores para que una prueba no
      // agregue filas (por ejemplo, el código 5) al siguiente inicio.
      localStorage.removeItem(DEMO_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch { /* Si el almacenamiento no está disponible, la base ya tiene cuatro registros. */ }

    try {
      const filasSesion = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? 'null');
      if (Array.isArray(filasSesion) && filasSesion.length >= BASE_VERSION_ROWS.length) this.rows.set(filasSesion as VersionRow[]);
    } catch { /* Sin sesión previa, se conservan los cuatro registros iniciales. */ }

    const registro = history.state?.['registroVersion'] as VersionRow | undefined;
    if (registro) {
      this.rows.update(rows => {
        const index = rows.findIndex(row => row.id === registro.id);
        return index >= 0 ? rows.map(row => row.id === registro.id ? registro : row) : [...rows, registro];
      });
      this.mensajeSnackbar.set(history.state?.['edicionVersion'] ? 'Registro actualizado con éxito' : 'Registro agregado con éxito');
      this.snackbarVisible.set(true);
      this.persistirRows();
    }
  }
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
  readonly displayedRows = computed(() => {
    const rows = this.rows().slice().reverse();
    return this.filaNueva() ? [this.filaNueva()!, ...rows] : rows;
  });
  readonly opcionesVinculadaAnio = computed(() => this.opcionesVinculadas(this.displayedRows().map(row => row.vinculada?.anio)));
  readonly opcionesVinculadaProceso = computed(() => this.opcionesVinculadas(this.displayedRows().map(row => row.vinculada?.proceso)));
  readonly opcionesVinculadaCodigo = computed(() => this.opcionesVinculadas(this.displayedRows().map(row => row.vinculada?.codigo)));
  readonly opcionesVinculadaNombre = computed(() => this.opcionesVinculadas(this.displayedRows().map(row => row.vinculada?.nombre)));
  readonly filteredRows = computed(() => {
    const term = this.search().toLowerCase();
    const fechaIso = (fecha: string) => fecha === '-' ? '' : fecha.split('/').reverse().join('-');
    const condicion = (valor: boolean, filtro: string) => !filtro || String(valor) === filtro;
    return this.displayedRows().filter(row =>
      (!term || Object.values(row).some(valor => String(valor).toLowerCase().includes(term)))
      // Sin selección la bandeja conserva la vista inicial de versiones activas.
      // «Todos» es una selección explícita: conserva su chip y recupera también
      // las versiones inactivas, incluidas las que se acabaron de desactivar.
      && (this.estado() === 'todos' || (!this.estado() ? row.estado !== 'Inactivo' : row.estado === this.estado()))
      && (!this.anio() || row.anio === this.anio())
      && (!this.procesoFiltro() || row.proceso === this.procesoFiltro())
      && (!this.codigoFiltro() || row.codigo === this.codigoFiltro())
      && (!this.nombreFiltro() || row.nombre === this.nombreFiltro())
      && (!this.vinculadaAnioFiltro() || row.vinculada?.anio === this.vinculadaAnioFiltro())
      && (!this.vinculadaProcesoFiltro() || row.vinculada?.proceso === this.vinculadaProcesoFiltro())
      && (!this.vinculadaCodigoFiltro() || row.vinculada?.codigo === this.vinculadaCodigoFiltro())
      && (!this.vinculadaNombreFiltro() || row.vinculada?.nombre === this.vinculadaNombreFiltro())
      && (!this.fechaDesdeFiltro() || fechaIso(row.desde) >= this.fechaDesdeFiltro())
      && (!this.fechaHastaFiltro() || fechaIso(row.hasta) <= this.fechaHastaFiltro())
      && condicion(row.editable, this.editableFiltro())
      && condicion(row.pliego, this.pliegoFiltro())
      && condicion(row.vigente, this.vigenteFiltro())
      && condicion(row.oficial, this.oficialFiltro())
      && condicion(row.disponible, this.disponibleFiltro())
    );
  });
  // La fila en alta se muestra para editarse, pero aún no es un registro de la
  // bandeja: no debe alterar los contadores ni la paginación hasta grabarse.
  readonly persistedFilteredRows = computed(() => this.filteredRows().filter(row => !this.esFilaNueva(row.id)));
  readonly versionesVinculables = computed(() => {
    const current = this.draft();
    return this.rows().filter(row =>
      row.id !== current?.id
      && row.disponible
      && !row.editable
      && row.estado === 'Activo'
      && (!current?.anio || row.anio === current.anio)
      && (!current?.proceso || row.proceso !== current.proceso)
    );
  });
  readonly opcionesVersionesVinculables = computed(() => {
    const draft = this.draft();
    const options: Array<{ label: string; value: string; disabled?: boolean }> = this.versionesVinculables().map(row => ({ label: `${row.codigo} — ${row.nombre}`, value: String(row.id) }));
    const linked = draft?.vinculada;
    if (linked) {
      const linkedRow = this.rows().find(row => this.esMismaVersionVinculada(row, linked));
      if (linkedRow && !options.some(option => option.value === String(linkedRow.id))) {
        options.unshift({ label: `${linked.codigo} — ${linked.nombre}`, value: String(linkedRow.id), disabled: true });
      }
      if (!linkedRow) {
        options.unshift({ label: `${linked.codigo} — ${linked.nombre}`, value: this.claveVinculoManual(linked), disabled: true });
      }
    }
    return options.length ? options : [{ label: 'No hay versiones disponibles para vincular.', value: '__sin-versiones__', disabled: true }];
  });
  readonly allSelected = computed(() => this.filteredRows().length > 0 && this.filteredRows().every(r => this.selectedIds().has(r.id)));
  readonly someSelected = computed(() => !this.allSelected() && this.filteredRows().some(r => this.selectedIds().has(r.id)));
  abrirFiltros(): void {
    this.snackbarVisible.set(false);
    // La vista inicial excluye inactivos; el panel debe reflejar ese filtro implícito.
    this.anioFiltro.set(this.anio()); this.estadoFiltro.set(this.estado());
    this.filtrosPanelAbierto.set(true);
  }
  cerrarFiltros(): void { this.filtrosPanelAbierto.set(false); }
  limpiarFiltros(): void {
    this.anioFiltro.set(''); this.procesoFiltro.set(''); this.codigoFiltro.set(''); this.nombreFiltro.set(''); this.estadoFiltro.set('todos'); this.vinculadaAnioFiltro.set(''); this.vinculadaProcesoFiltro.set(''); this.vinculadaCodigoFiltro.set(''); this.vinculadaNombreFiltro.set(''); this.fechaDesdeFiltro.set(''); this.fechaHastaFiltro.set(''); this.editableFiltro.set(''); this.pliegoFiltro.set(''); this.vigenteFiltro.set(''); this.oficialFiltro.set(''); this.disponibleFiltro.set('');
  }
  aplicarFiltros(): void { this.snackbarVisible.set(false); this.anio.set(this.anioFiltro()); this.estado.set(this.estadoFiltro()); this.cerrarFiltros(); }
  agregarFiltroDocumento(filter: string): void { if (filter === 'system') this.documentExtraFilterVisible.set(true); }
  agregarFiltroRegistro(filter: string): void { if (filter === 'process') this.recordExtraFilterVisible.set(true); }
  manejarMasOpciones(opcion: string): void {
    if (opcion === 'columns') { this.snackbarVisible.set(false); this.columnasPanelAbierto.set(true); }
    if (opcion === 'reset-demo') this.confirmacionReinicioDemoAbierta.set(true);
  }
  cerrarConfirmacionReinicioDemo(): void { this.confirmacionReinicioDemoAbierta.set(false); }
  confirmarReinicioDemo(): void {
    this.rows.set(structuredClone(BASE_VERSION_ROWS));
    if (typeof localStorage !== 'undefined') { localStorage.removeItem(DEMO_STORAGE_KEY); localStorage.removeItem(LEGACY_STORAGE_KEY); }
    this.filaNueva.set(null); this.draft.set(null); this.editingId.set(null); this.selectedIds.set(new Set());
    this.reiniciarAutocompletado(); this.editError.set(''); this.search.set(''); this.anio.set(''); this.estado.set('Activo');
    this.snackbarVisible.set(false); this.confirmacionReinicioDemoAbierta.set(false);
  }
  cerrarPanelColumnas(): void { this.columnasPanelAbierto.set(false); this.columnasBorrador.set(new Set(this.columnasVisibles())); }
  readonly columnaBorradorVisible = (key: string): boolean => this.columnasBorrador().has(key);
  readonly columnaVisible = (key: string): boolean => this.columnasVisibles().has(key);
  readonly todasColumnasSeleccionadas = computed(() => this.todasLasColumnas.every(key => this.columnasBorrador().has(key)));
  readonly columnasPanelModificado = computed(() => this.todasLasColumnas.some(key => this.columnasBorrador().has(key) !== this.columnasVisibles().has(key)));
  seleccionarTodasColumnas(event: Event): void { const checked = (event.target as HTMLInputElement).checked; this.columnasBorrador.set(checked ? new Set(this.todasLasColumnas) : new Set(this.columnasIniciales)); }
  alternarColumna(key: string, event: Event): void { const next = new Set(this.columnasBorrador()); (event.target as HTMLInputElement).checked ? next.add(key) : next.delete(key); this.columnasBorrador.set(next); }
  aplicarColumnas(): void { this.snackbarVisible.set(false); this.columnasVisibles.set(new Set(this.columnasBorrador())); this.columnasExtendidas.set(this.todasLasColumnas.every(key => this.columnasBorrador().has(key))); this.columnasPanelAbierto.set(false); }
  private columnas(...items: [string, string][]): DocumentsRecordsColumn[] { return items.map(([key, label]) => ({ key, label, visibility: 'visible', group: 'more' })); }
  private opcionesVinculadas(values: Array<string | undefined>): { label: string; value: string }[] {
    const unique = [...new Set(values.filter((value): value is string => Boolean(value)))];
    return [{ label: 'Todos', value: '' }, ...unique.map(value => ({ label: value, value }))];
  }
  /** Los cambios viven durante la sesión actual; login la reinicia a cuatro filas. */
  private persistirRows(): void {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.rows()));
  }
  readonly condicionesVisibles = computed(() => ['editable', 'pliego', 'vigente', 'oficial', 'definitiva', 'disponible'].filter(key => this.columnaVisible(key)));
  readonly vinculadasVisibles = computed(() => ['vinculadaAnio', 'vinculadaProceso', 'vinculadaCodigo', 'vinculadaNombre'].filter(key => this.columnaVisible(key)));
  etiquetaColumna(key: string): string { return ({ editable: 'Editable', pliego: 'Pliego', vigente: 'Vigente', oficial: 'Oficial', definitiva: 'Definitiva', disponible: 'Disponible', vinculadaAnio: 'Año', vinculadaProceso: 'Proceso', vinculadaCodigo: 'Código', vinculadaNombre: 'Nombre' } as Record<string, string>)[key] ?? key; }
  anchoColumnaVinculadaPx(key: string): number { return ({ vinculadaAnio: 80, vinculadaProceso: 300, vinculadaCodigo: 120, vinculadaNombre: 300 } as Record<string, number>)[key] ?? 0; }
  anchoColumnaVinculada(key: string): string { return `px-siaf-md text-left${key === 'vinculadaNombre' ? ' border-r border-[var(--sys-color-divider-strong)]' : ''}`; }
  claseCeldaVinculada(key: string): string { return `min-w-0 px-siaf-sm${key === 'vinculadaProceso' ? ' whitespace-normal leading-[normal]' : ''}${key === 'vinculadaNombre' ? ' border-r border-[var(--sys-color-divider-strong)] whitespace-nowrap' : ''}`; }
  valorVinculado(row: VersionRow, key: string): string { const link = this.editingId() === row.id ? this.draft()?.vinculada : row.vinculada; return ({ vinculadaAnio: link?.anio, vinculadaProceso: link?.proceso, vinculadaCodigo: link?.codigo, vinculadaNombre: link?.nombre } as Record<string, string | undefined>)[key] ?? ''; }
  private readonly todasLasColumnas = ['anio', 'proceso', 'codigo', 'nombre', 'editable', 'pliego', 'vigente', 'oficial', 'definitiva', 'disponible', 'vinculadaAnio', 'vinculadaProceso', 'vinculadaCodigo', 'vinculadaNombre', 'estado', 'desde', 'hasta'];
  crearVersion(): void { void this.router.navigateByUrl('/procesos/catalogo-versiones/nuevo'); }
  esFilaNueva(id: number): boolean { return this.filaNueva()?.id === id; }
  alternarDescripcionPopover(id: number): void {
    this.descripcionPopoverId.update(current => current === id ? null : id);
  }
  cerrarDescripcionPopover(): void { this.descripcionPopoverId.set(null); }
  editarVersion(row: VersionRow): void {
    void this.router.navigateByUrl('/procesos/catalogo-versiones/nuevo', {
      state: { edicionVersion: true, registroVersion: structuredClone(row) }
    });
  }
  updateDraft(field: 'anio' | 'proceso' | 'codigo' | 'nombre' | 'descripcion' | 'estado', value: string, desdeAutocompletado = false): void {
    const draft = this.draft();
    if (!draft) return;
    const isNew = this.esFilaNueva(draft.id);
    const next = { ...draft, [field]: value } as VersionRow;
    if (isNew && field === 'proceso' && value !== draft.proceso) this.retirarAutocompletadosDeProcesoAnterior(draft.proceso, next);
    if (isNew && (field === 'anio' || field === 'proceso')) {
      next.codigo = this.siguienteCodigo(next.anio, next.proceso);
      // Vigente inicia marcado solo cuando no hay otra versión vigente para
      // la combinación de Año y Proceso que acaba de seleccionarse.
      if (next.vigente && this.mensajeConflictoVigente(next)) next.vigente = false;
    }
    if (isNew && field === 'nombre' && !desdeAutocompletado) this.nombreEditadoManualmente.set(true);
    if (isNew && field === 'descripcion' && !desdeAutocompletado) this.descripcionEditadaManualmente.set(true);
    this.draft.set(next);
    this.editError.set(this.mensajeConflictoVigente(next) || this.mensajeInactivacionBloqueada(next));
  }
  autocompletarNombre(): void {
    const draft = this.draft();
    const ejemplo = draft ? this.ejemploDeProceso(draft.proceso) : undefined;
    if (!draft || !ejemplo || !this.esFilaNueva(draft.id) || this.nombreAutocompletado() || draft.nombre.trim()) return;
    this.nombreAutocompletado.set(true);
    this.procesoNombreAutocompletado.set(draft.proceso);
    this.updateDraft('nombre', ejemplo.nombre, true);
  }
  autocompletarDescripcion(): void {
    const draft = this.draft();
    const ejemplo = draft ? this.ejemploDeProceso(draft.proceso) : undefined;
    if (!draft || !ejemplo || !this.esFilaNueva(draft.id) || this.descripcionAutocompletada() || draft.descripcion.trim()) return;
    this.descripcionAutocompletada.set(true);
    this.procesoDescripcionAutocompletada.set(draft.proceso);
    this.updateDraft('descripcion', ejemplo.descripcion, true);
  }
  updateCondition(condition: string, checked: boolean): void {
    const draft = this.draft();
    if (!draft) return;
    if (condition === 'disponible' && checked && draft.editable) { this.editError.set('Disponible no puede marcarse mientras Editable esté seleccionado.'); return; }
    if (condition === 'vigente' && checked && this.mensajeConflictoVigente({ ...draft, vigente: true })) { this.editError.set('Solo puede existir una versión vigente por proceso y año.'); return; }
    this.draft.set({ ...draft, [condition]: checked, ...(condition === 'editable' && checked ? { disponible: false } : {}) } as VersionRow);
    this.editError.set(this.mensajeConflictoVigente(this.draft()!) || this.mensajeInactivacionBloqueada(this.draft()!));
  }
  motivoGrabacion = (): string => {
    const draft = this.draft(); const id = this.editingId();
    if (!draft || id === null) return '';
    if (this.editError()) return this.editError();
    const motivoBaja = this.mensajeInactivacionBloqueada(draft);
    if (motivoBaja) return motivoBaja;
    if (!draft.anio.trim()) return 'Debe completar el Año.';
    if (!draft.proceso) return 'Debe seleccionar un Proceso.';
    if (!draft.codigo.trim()) return 'Debe completar el Código.';
    if (!draft.nombre.trim()) return 'Debe completar el Nombre.';
    if (!draft.descripcion.trim()) return 'Debe completar la Descripción.';
    if (!this.esFilaNueva(id)) {
      const original = this.rows().find(row => row.id === id);
      if (original && JSON.stringify(draft) === JSON.stringify(original)) return 'Realice al menos un cambio para grabar.';
    }
    return '';
  };
  puedeGrabarEdicion = (): boolean => !!this.draft() && !this.motivoGrabacion();
  solicitarCancelacionFila(): void { if (this.editingId() !== null) this.confirmacionCancelacionFilaAbierta.set(true); }
  cerrarConfirmacionCancelacionFila(): void { this.confirmacionCancelacionFilaAbierta.set(false); }
  confirmarCancelacionFila(): void {
    const id = this.editingId();
    if (id === null) return;
    if (this.esFilaNueva(id)) this.filaNueva.set(null);
    this.confirmacionCancelacionFilaAbierta.set(false); this.draft.set(null); this.editingId.set(null);
    this.reiniciarAutocompletado(); this.editError.set(''); this.selectedIds.set(new Set());
  }
  solicitarGrabacionEdicion(): void {
    if (!this.puedeGrabarEdicion()) return;
    this.confirmacionGrabacionAbierta.set(true);
  }
  cerrarConfirmacionGrabacion(): void { this.confirmacionGrabacionAbierta.set(false); }
  confirmarGrabacionEdicion(): void {
    if (!this.puedeGrabarEdicion()) return;
    this.confirmacionGrabacionAbierta.set(false);
    const draft = this.draft()!;
    const original = this.rows().find(row => row.id === draft.id);
    const saved = {
      ...draft,
      // Una baja lógica conserva la fecha de inicio y registra la fecha local
      // del sistema como cierre solo al cambiar desde Activo. Volver a Activo
      // retira el cierre y editar una baja existente conserva su fecha.
      hasta: draft.estado === 'Inactivo' ? (original?.estado === 'Inactivo' ? draft.hasta : this.fechaSistema()) : '-',
      auditadoEn: new Date().toLocaleString('es-PE')
    };
    const isNew = this.esFilaNueva(saved.id);
    const index = this.rows().findIndex(row => row.id === saved.id);
    this.rows.update(rows => index >= 0 ? rows.map(row => row.id === saved.id ? saved : row) : [...rows, saved]);
    this.filaNueva.set(null); this.persistirRows(); this.editingId.set(null); this.draft.set(null); this.reiniciarAutocompletado(); this.editError.set(''); this.selectedIds.set(new Set()); this.mensajeSnackbar.set(isNew ? 'Registro agregado con éxito' : 'Registro actualizado con éxito'); this.snackbarVisible.set(true);
  }
  valorSeleccionVinculada(): string {
    const linked = this.draft()?.vinculada;
    if (!linked) return '';
    const version = this.rows().find(row => this.esMismaVersionVinculada(row, linked));
    return version ? String(version.id) : this.claveVinculoManual(linked);
  }
  seleccionarVersionVinculada(id: string): void {
    const version = this.versionesVinculables().find(row => String(row.id) === id);
    const draft = this.draft();
    if (!version || !draft) return;
    this.draft.set({ ...draft, vinculada: { anio: version.anio, proceso: version.proceso, codigo: version.codigo, nombre: version.nombre } });
    this.editError.set(this.mensajeConflictoVigente(this.draft()!) || this.mensajeInactivacionBloqueada(this.draft()!));
  }
  private reiniciarAutocompletado(): void {
    this.nombreAutocompletado.set(false); this.descripcionAutocompletada.set(false);
    this.procesoNombreAutocompletado.set(null); this.procesoDescripcionAutocompletada.set(null);
    this.nombreEditadoManualmente.set(false); this.descripcionEditadaManualmente.set(false);
  }
  private retirarAutocompletadosDeProcesoAnterior(procesoAnterior: string, next: VersionRow): void {
    if (this.procesoNombreAutocompletado() === procesoAnterior && !this.nombreEditadoManualmente()) {
      next.nombre = '';
      this.nombreAutocompletado.set(false);
      this.procesoNombreAutocompletado.set(null);
    }
    if (this.procesoDescripcionAutocompletada() === procesoAnterior && !this.descripcionEditadaManualmente()) {
      next.descripcion = '';
      this.descripcionAutocompletada.set(false);
      this.procesoDescripcionAutocompletada.set(null);
    }
  }
  private ejemploDeProceso(proceso: string): { nombre: string; descripcion: string } | undefined {
    const ejemplos: Record<string, { nombre: string; descripcion: string }> = {
      'M02.1.9.1 Asignación Presupuestaria Multianual': {
        nombre: 'Versión aprobada PCM',
        descripcion: 'Versión final del presupuesto operativo para el ejercicio fiscal 2026. Integra ajustes derivados de la proyección de ventas, la optimización de costes directos y la redistribución de recursos en marketing e infraestructura tecnológica. Contempla una reserva para contingencias ante la volatilidad del tipo de cambio y la inflación prevista. Documento revisado y validado por el área de finanzas para su presentación y aprobación por la alta dirección.'
      },
      'M02.1.9.2 Programación Multianual Pliego - UE': {
        nombre: 'Versión Programación APM Aprobada',
        descripcion: 'Asignación presupuestal periodo 2027-2029'
      }
    };
    return ejemplos[proceso];
  }
  private siguienteCodigo(anio: string, proceso: string): string {
    if (!anio.trim() || !proceso) return '';
    const maximo = this.rows().filter(row => row.anio === anio && row.proceso === proceso).reduce((max, row) => Math.max(max, Number.parseInt(row.codigo, 10) || 0), 0);
    return String(maximo + 1);
  }
  private mensajeConflictoVigente(row: VersionRow): string {
    return row.vigente && row.anio.trim() && row.proceso && this.rows().some(other => other.id !== row.id && other.anio === row.anio && other.proceso === row.proceso && other.vigente)
      ? 'Solo puede existir una versión vigente por proceso y año.' : '';
  }
  private mensajeInactivacionBloqueada(row: VersionRow): string {
    if (row.estado !== 'Inactivo') return '';
    const tieneVinculoActivo = this.rows().some(other => other.id !== row.id && other.estado === 'Activo' && !!other.vinculada && this.esMismaVersionVinculada(row, other.vinculada));
    return tieneVinculoActivo ? 'No se puede inactivar la versión porque está vinculada por una versión activa.' : '';
  }
  private fechaSistema(): string { return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()); }
  private esMismaVersionVinculada(row: VersionRow, linked: NonNullable<VersionRow['vinculada']>): boolean {
    return row.anio === linked.anio && row.proceso === linked.proceso && row.codigo === linked.codigo && row.nombre === linked.nombre;
  }
  private claveVinculoManual(linked: NonNullable<VersionRow['vinculada']>): string { return `linked:${linked.anio}:${linked.proceso}:${linked.codigo}:${linked.nombre}`; }
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
