import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { CatalogConditionEditLockService } from '../../core/state/catalog-condition-edit-lock.service';

export const PRESUPUESTO_ROUTES: Routes = [{
  path: 'procesos/catalogo-versiones',
  loadComponent: () => import('./catalogo-versiones/catalogo-versiones-bandeja.component').then(m => m.CatalogoVersionesBandejaComponent),
  canDeactivate: [() => !inject(CatalogConditionEditLockService).locked()],
}, {
  path: 'procesos/catalogo-versiones/nuevo',
  loadComponent: () => import('./catalogo-versiones/catalogo-versiones-registro.component').then(m => m.CatalogoVersionesRegistroComponent),
}];
