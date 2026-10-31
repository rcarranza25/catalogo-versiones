import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import type { DocumentsRecordsColumn } from '../../types/documents-records.types';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { FocoDirective } from '../foco/foco.directive';

export type ColumnVisibilityPanelSection = {
  label: string;
  columns: DocumentsRecordsColumn[];
  locked?: boolean;
  /** Columnas fijas dentro de una sección que, por lo demás, es configurable. */
  lockedColumns?: string[];
  /** Presenta la sección como grupo desplegable con selección de todos sus campos. */
  collapsible?: boolean;
  /** Las columnas de la sección se seleccionan siempre como una unidad. */
  selectionMode?: 'individual' | 'grouped';
};

/**
 * Panel lateral modal para mostrar u ocultar columnas de una grilla, agrupadas en
 * Predeterminado / Más columnas / Interno (estas últimas fijas, no desmarcables).
 *
 * Úsalo junto a `siaf-documents-records-table` y sus `DocumentsRecordsColumn`; el
 * componente es controlado (recibe el estado y emite toggles, no decide la visibilidad).
 *
 * @usar
 * - En la bandeja «Documentos y registros» (`siaf-documents-records-page`), desde «Más opciones → Ocultar o mostrar
 *   columnas», para elegir qué columnas se ven en Documentos o en Registros.
 * - En otra grilla con `DocumentsRecordsColumn` cuando el padre guarda un borrador de columnas ocultas y solo lo aplica
 *   con Aplicar (`dirty` habilita el botón).
 * @evitar
 * - Para filtrar filas: usar `siaf-custom-filter`, `siaf-filter-pill` o el buscador de la grilla.
 * - Para elegir registros de un catálogo: usar `siaf-selection-side-nav`.
 * - Para un menú corto de opciones sobre la grilla: usar `siaf-icon-dropdown-menu`.
 * @teclado
 * - **Tab**: al abrir, el foco entra en la X; recorre «Seleccionar todo», las casillas de cada columna y Cancelar /
 *   Aplicar, y da la vuelta sin salir del panel; las de Interno están deshabilitadas y no reciben foco.
 * - **Escape**: cierra el panel (emite `closed`) y el foco vuelve al control que lo abrió.
 * - **Espacio**: marca o desmarca la casilla enfocada (emite `toggleAll` o `toggleColumn`).
 * - **Enter / Espacio**: activan la X y Cancelar (emiten `closed`) y Aplicar (emite `applied`; habilitado solo con
 *   cambios).
 * @accesibilidad
 * - **4.1.2 Nombre, función y valor (A)**: `role="dialog"` con `aria-modal="true"` y `aria-labelledby` al título; la X
 *   se llama «Cerrar» y cada casilla toma su nombre del texto de la columna (`<label>`).
 * - **2.4.3 Orden del foco (A)**: con `siafFoco`, al abrir lleva el foco a la X aunque en la bandeja el panel se pinte
 *   al final de la página, y al cerrar lo devuelve al botón que lo abrió.
 * - **2.1.2 Sin trampas de teclado (A)**: Tab queda dentro mientras está abierto, pero Escape siempre lo cierra.
 * - **1.3.1 Información y relaciones (A)**: título `h2` y los grupos Predeterminado / Más columnas / Interno con `h3`.
 * - **2.4.7 Foco visible (AA)**: sin estilo propio pero sin `outline-none`: la X, Cancelar y las casillas muestran el
 *   anillo nativo del navegador; Aplicar sigue `siaf-button`.
 * - **2.5.8 Tamaño del objetivo (AA)**: cada fila mide 48 px y toda la fila marca la casilla; la X y Cancelar, 40 px.
 * - **1.4.11 Contraste no textual (AA)**: las casillas llevan borde `icon-states-enabled` de 2 px (8.70:1 sobre la
 *   superficie en claro).
 * - **1.4.3 Contraste mínimo (AA)**: título `text-text` sobre `bg-surface` (16.29:1 / 16.53:1); las etiquetas
 *   `text-neutral-medium` van sobre `surface-highest`, que en claro es el blanco de la superficie (14.53:1).
 */
@Component({
  selector: 'siaf-column-visibility-panel',
  standalone: true,
  imports: [FocoDirective, ButtonComponent, IconComponent],
  template: `
    @if (open) {
      <section class="fixed inset-y-0 left-0 right-0 z-50 bg-black/55 pl-0 lg:pl-[65px]" aria-modal="true" role="dialog" aria-labelledby="columns-panel-title" (click)="closed.emit()">
        <aside class="absolute bottom-0 right-0 top-0 flex w-full max-w-[420px] flex-col overflow-hidden bg-surface shadow-siaf-lg" [siafFoco]="open" (siafFocoEscape)="closed.emit()" (click)="$event.stopPropagation()">
          <!-- Sin líneas entre título, contenido y botones, como el resto de los side panels. -->
          <header class="flex h-14 shrink-0 items-center gap-siaf-xs px-siaf-xl">
            <h2 id="columns-panel-title" class="m-0 flex-1 text-base font-bold uppercase tracking-[0.02px] text-text">{{ title }}</h2>
            <button class="inline-flex size-10 items-center justify-center rounded-siaf-md text-text transition hover:bg-surface-muted active:bg-[var(--sys-color-bg-states-dark-pressed)]" type="button" aria-label="Cerrar" (click)="closed.emit()">
              <siaf-icon name="close" [size]="24" />
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto bg-[var(--sys-color-bg-surfaces-surface-highest)] px-siaf-xl py-siaf-md">
            <div class="flex flex-col gap-3">
              <label class="grid cursor-pointer grid-cols-[24px_16px_minmax(0,1fr)] items-center gap-x-3 text-sm text-[var(--sys-color-text-neutral-medium)]">
                <input class="col-start-1 size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [checked]="allSelected" [indeterminate]="allIndeterminate" (change)="toggleAll.emit($event)" />
                <span class="col-span-2">{{ selectAllLabel }}</span>
              </label>
              @if (catalogLayout) {
                @for (column of individualColumns; track column.key) {
                  <label class="grid cursor-pointer grid-cols-[24px_16px_minmax(0,1fr)] items-center gap-x-3 text-sm font-bold uppercase text-[var(--sys-color-text-neutral-medium)] transition hover:bg-surface-muted">
                    <input class="col-start-2 size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [checked]="isColumnVisible(column.key)" (change)="toggleColumn.emit({ key: column.key, event: $event })" />
                    <span class="col-start-3">{{ column.label }}</span>
                  </label>
                }
                @for (section of sections; track section.label) {
                  <section class="grid gap-3">
                    <div class="grid grid-cols-[24px_16px_minmax(0,1fr)] items-center gap-x-3">
                      <button class="col-start-1 inline-flex size-6 shrink-0 items-center justify-center rounded-siaf-sm text-text hover:bg-surface-muted" type="button" [attr.aria-label]="(seccionExpandida(section) ? 'Contraer ' : 'Expandir ') + section.label" (click)="alternarSeccion(section.label)">
                        <siaf-icon [name]="seccionExpandida(section) ? 'keyboard_arrow_down' : 'keyboard_arrow_right'" [size]="20" />
                      </button>
                      <label class="col-span-2 grid min-w-0 cursor-pointer grid-cols-[16px_minmax(0,1fr)] items-center gap-x-3 text-sm font-bold uppercase text-[var(--sys-color-text-neutral-medium)]">
                        <input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [checked]="isSectionSelected(section)" [indeterminate]="isSectionIndeterminate(section)" (change)="toggleSection.emit({ section, event: $event })" />
                        <span>{{ section.label }}</span>
                      </label>
                    </div>
                    @if (seccionExpandida(section)) {
                      <div class="grid gap-3 pl-9">
                        @for (column of section.columns; track column.key) {
                          <label class="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-x-3 text-sm text-[var(--sys-color-text-neutral-medium)]" [class.cursor-pointer]="section.selectionMode !== 'grouped'" [class.hover:bg-surface-muted]="section.selectionMode !== 'grouped'">
                            <input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [checked]="isColumnVisible(column.key)" [disabled]="section.selectionMode === 'grouped'" (change)="toggleColumn.emit({ key: column.key, event: $event })" />
                            <span>{{ column.label }}</span>
                          </label>
                        }
                      </div>
                    }
                  </section>
                }
              } @else if (sections.length) {
                @for (section of sections; track section.label) {
                  <section class="grid gap-siaf-xs">
                    <h3 class="m-0 px-[18px] text-xs font-normal uppercase text-[var(--sys-color-text-neutral-medium)]">{{ section.label }}</h3>
                    @for (column of section.columns; track column.key) {
                      <label class="flex min-h-12 items-center gap-siaf-md px-siaf-md py-siaf-sm text-sm text-[var(--sys-color-text-neutral-medium)]" [class.cursor-pointer]="!columnaBloqueada(section, column.key)" [class.hover:bg-surface-muted]="!columnaBloqueada(section, column.key)">
                        <input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [checked]="isColumnVisible(column.key)" [disabled]="columnaBloqueada(section, column.key)" (change)="toggleColumn.emit({ key: column.key, event: $event })" />
                        {{ column.label }}
                      </label>
                    }
                  </section>
                }
              } @else {
              <section class="grid gap-siaf-xs">
                <h3 class="m-0 px-[18px] text-xs font-normal uppercase text-[var(--sys-color-text-neutral-medium)]">Predeterminado</h3>
                @for (column of defaultColumns; track column.key) {
                  <label class="flex min-h-12 cursor-pointer items-center gap-siaf-md px-siaf-md py-siaf-sm text-sm text-[var(--sys-color-text-neutral-medium)] transition hover:bg-surface-muted">
                    <input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [checked]="isColumnVisible(column.key)" (change)="toggleColumn.emit({ key: column.key, event: $event })" />
                    {{ column.label }}
                  </label>
                }
              </section>
              <section class="grid gap-siaf-xs">
                <h3 class="m-0 px-[18px] text-xs font-normal uppercase text-[var(--sys-color-text-neutral-medium)]">Más columnas</h3>
                @for (column of moreColumns; track column.key) {
                  <label class="flex min-h-12 cursor-pointer items-center gap-siaf-md px-siaf-md py-siaf-sm text-sm text-[var(--sys-color-text-neutral-medium)] transition hover:bg-surface-muted">
                    <input class="size-4 accent-[var(--sys-color-icon-states-enabled)]" type="checkbox" [checked]="isColumnVisible(column.key)" (change)="toggleColumn.emit({ key: column.key, event: $event })" />
                    {{ column.label }}
                  </label>
                }
              </section>
              @if (internalColumns.length) {
                <section class="grid gap-siaf-xs">
                  <h3 class="m-0 px-[18px] text-xs font-normal uppercase text-[var(--sys-color-text-neutral-medium)]">Interno</h3>
                  @for (column of internalColumns; track column.key) {
                    <label class="flex min-h-12 items-center gap-siaf-md px-siaf-md py-siaf-sm text-sm text-text-muted">
                      <input class="size-4" type="checkbox" disabled />
                      {{ column.label }}
                    </label>
                  }
                </section>
              }
              }
            </div>
          </div>

          <footer class="flex shrink-0 items-center justify-end gap-siaf-xs px-siaf-md py-siaf-sm">
            @if (catalogLayout) {
              <button class="inline-flex min-h-10 items-center justify-center rounded-siaf-md border border-[var(--sys-color-border-states-enabled)] px-siaf-md py-siaf-xs text-sm font-medium text-text transition hover:bg-surface-muted" type="button" (click)="reset.emit()">Restablecer</button>
            } @else {
              <button class="inline-flex min-h-10 items-center justify-center rounded-siaf-md border border-[var(--sys-color-border-states-enabled)] px-siaf-md py-siaf-xs text-sm font-medium text-text transition hover:bg-surface-muted" type="button" (click)="closed.emit()">Cancelar</button>
            }
            <siaf-button variant="primary" size="md" [disabled]="!dirty" (click)="applied.emit()">Aplicar</siaf-button>
          </footer>
        </aside>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnVisibilityPanelComponent implements OnChanges {
  @Input() open = false;
  @Input() title = 'Ocultar o mostrar columnas';
  @Input() selectAllLabel = 'Seleccionar todo';
  @Input() allSelected = false;
  @Input() allIndeterminate = false;
  @Input() dirty = false;
  @Input() defaultColumns: DocumentsRecordsColumn[] = [];
  @Input() moreColumns: DocumentsRecordsColumn[] = [];
  @Input() internalColumns: DocumentsRecordsColumn[] = [];
  /** Agrupación opcional para catálogos con secciones distintas a la grilla documental. */
  @Input() sections: ColumnVisibilityPanelSection[] = [];
  /** Diseño con campos sueltos y grupos desplegables del Catálogo de Versiones. */
  @Input() catalogLayout = false;
  @Input() individualColumns: DocumentsRecordsColumn[] = [];
  @Input() isColumnVisible: (columnKey: string) => boolean = () => false;
  @Input() isSectionSelected: (section: ColumnVisibilityPanelSection) => boolean = () => false;
  @Input() isSectionIndeterminate: (section: ColumnVisibilityPanelSection) => boolean = () => false;

  @Output() closed = new EventEmitter<void>();
  @Output() applied = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() toggleAll = new EventEmitter<Event>();
  @Output() toggleColumn = new EventEmitter<{ key: string; event: Event }>();
  @Output() toggleSection = new EventEmitter<{ section: ColumnVisibilityPanelSection; event: Event }>();

  private expandedSections = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue && !changes['open'].previousValue) {
      this.expandedSections = new Set();
    }
  }

  seccionExpandida(section: ColumnVisibilityPanelSection): boolean { return this.expandedSections.has(section.label); }
  alternarSeccion(label: string): void {
    const next = new Set(this.expandedSections);
    next.has(label) ? next.delete(label) : next.add(label);
    this.expandedSections = next;
  }

  columnaBloqueada(section: ColumnVisibilityPanelSection, key: string): boolean {
    return Boolean(section.locked || section.lockedColumns?.includes(key));
  }
}
