import { Injectable, signal } from '@angular/core';

/** Estado compartido del bloqueo temporal al editar condiciones de una versión. */
@Injectable({ providedIn: 'root' })
export class CatalogConditionEditLockService {
  readonly locked = signal(false);

  setLocked(locked: boolean): void {
    this.locked.set(locked);
  }
}
