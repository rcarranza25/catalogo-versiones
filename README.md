# Catálogo de Versiones · SIAF-RP

## Propósito

Este repositorio contiene el prototipo funcional del **Catálogo de Versiones** del SIAF-RP. El catálogo permite configurar y administrar las versiones asociadas al proceso de **Asignación Presupuestaria Multianual (APM)**.

Una versión identifica un año fiscal, un proceso presupuestario, un código y su información descriptiva. Además, permite administrar condiciones funcionales —Editable, Pliego, Vigente, Oficial, Definitiva y Disponible—, la vigencia del registro y, cuando corresponde, su vínculo con una versión de otro proceso.

El proyecto usa datos simulados en el navegador; no se conecta a un backend real ni persiste información fuera de la sesión local del navegador.

## Funcionalidades implementadas

### Bandeja de versiones

- Consulta de versiones en una grilla paginada.
- Búsqueda de texto sobre los valores de la versión.
- Filtros por año, proceso, código, nombre, estado y condiciones de versión.
- Administración de columnas visibles, incluidas las columnas de versión vinculada.
- Registro y edición de versiones desde la bandeja.
- Edición de condiciones en una fila de la grilla. Mientras una fila está en edición, se bloquean búsqueda, filtros, paginación y navegación que podrían perder el borrador.
- Reinicio del escenario de demostración.

### Registro y edición

- Selección de proceso y cálculo del siguiente código correlativo durante el alta.
- Registro de año, proceso, código, nombre, descripción, condiciones y estado.
- Edición de los datos habilitados de una versión existente; año y código no se habilitan en edición.
- Consulta de vigencia como información histórica no editable desde el formulario.
- Selección o retiro de una versión vinculada.
- Confirmaciones para grabar y para cancelar cuando existen cambios pendientes.

### Mensajes

- Alertas de error para validaciones del formulario y de las condiciones editadas en grilla.
- Alerta informativa cuando no existen versiones disponibles para vincular.
- Confirmaciones antes de las operaciones que corresponden.
- Snackbar de éxito después de registrar, actualizar o actualizar condiciones.

## Reglas de negocio implementadas

Estas son las reglas aplicadas actualmente por el código del prototipo.

### Datos obligatorios y formato

- Año, proceso, código, nombre y descripción son obligatorios.
- El año debe tener exactamente cuatro dígitos numéricos.
- El código debe ser numérico y mayor que cero.
- La descripción no puede exceder 500 caracteres.
- En un alta, el código sugerido es el siguiente correlativo disponible para la combinación de año y proceso.

### Unicidad por año y proceso

Para una misma combinación de año y proceso no se permite repetir código, nombre ni descripción.

Las condiciones **Oficial**, **Definitiva**, **Disponible** y **Vigente** solo pueden estar marcadas en una versión del mismo año y proceso. Si se intenta grabar una segunda versión con alguna de esas condiciones, el catálogo identifica la versión existente y bloquea la grabación.

### Restricciones entre condiciones

- Una versión no puede estar Disponible y Editable al mismo tiempo.
- Al marcar Editable, Disponible se desmarca.
- Mientras Editable está marcado, el control Disponible se deshabilita en el formulario.
- La misma validación se aplica durante la edición de condiciones desde la grilla.

### Vigencia y versión vinculada

- Una versión vinculable debe estar activa, marcada como Disponible, pertenecer al mismo año y a un proceso distinto del proceso de la versión en edición.
- No se puede inactivar una versión activa si existe otra versión activa vinculada a ella.
- Al inactivar una versión, la fecha de cierre no puede ser anterior a su fecha de inicio.

## Flujos de interacción

### Consultar, buscar y filtrar

1. Ingresar al Catálogo de Versiones.
2. Usar el buscador para localizar valores de la versión.
3. Abrir Filtros para ajustar año, proceso, código, nombre, estado o condiciones.
4. Aplicar o limpiar filtros. La paginación se reinicia al cambiar el conjunto filtrado.
5. Usar Más opciones para configurar columnas visibles o reiniciar la demostración.

### Registrar o editar una versión

1. Seleccionar **Registrar versión** o una fila existente de la grilla.
2. Completar los datos requeridos y definir las condiciones aplicables.
3. Opcionalmente, seleccionar una versión vinculada elegible.
4. Seleccionar Grabar. Si no hay errores, se muestra la confirmación que corresponda.
5. Confirmar para volver a la bandeja con un mensaje de éxito.
6. Al cancelar con cambios pendientes, confirmar la cancelación.

### Editar condiciones desde la grilla

1. Seleccionar **Editar condición de versión** en una fila.
2. Modificar los controles de condición disponibles para esa fila.
3. Aceptar para solicitar la grabación; el sistema valida antes de persistir.
4. Si la validación falla, se conserva el borrador para corregirlo y se muestra el mensaje de error.
5. Cancelar descarta el borrador; si hubo cambios que podían grabarse, se solicita confirmación.

## Datos de demostración

### Versiones base

La demostración inicia con cuatro versiones activas del año fiscal **2027** para el proceso **M02.1.9.1 Asignación Presupuestaria Multianual**:

| Código | Nombre de demostración | Condición inicial destacada |
| --- | --- | --- |
| 1 | Asignación Presupuestaria Multianual versión inicial | Ninguna |
| 2 | Asignación Presupuestaria Multianual versión actualizada | Ninguna |
| 3 | Asignación Presupuestaria Multianual versión actualizada por los Pliegos | Pliego |
| 4 | Asignación Presupuestaria Multianual versión enviada a PCM | Ninguna |

Los registros y filtros del catálogo se guardan durante la sesión mediante `sessionStorage`. El reinicio de la demostración recupera el escenario base. El inicio de sesión también limpia las claves de sesión del catálogo de versiones para comenzar un nuevo recorrido de demostración.

### Usuarios demo

El login compartido incluye una persona configuradora para Versiones: **Carlos Vega Ríos**. Su ruta inicial es el Catálogo de Versiones. Las credenciales no se publican en esta documentación.

## Estructura técnica

| Archivo | Responsabilidad |
| --- | --- |
| `src/app/modules/presupuesto/catalogo-versiones/catalogo-versiones-bandeja.component.ts` | Bandeja, búsqueda, filtros, paginación, columnas, edición de condiciones, persistencia de sesión y mensajes de resultado. |
| `src/app/modules/presupuesto/catalogo-versiones/catalogo-versiones-registro.component.ts` | Alta y edición, validaciones, selector de proceso, vínculo entre versiones, vigencia y confirmaciones. |
| `src/app/modules/presupuesto/catalogo-versiones/catalogo-versiones-demo.data.ts` | Año, procesos y nombres canónicos del escenario demo. |
| `src/app/modules/presupuesto/catalogo-versiones/catalogo-versiones-bandeja.component.spec.ts` | Pruebas de bandeja, filtros, reinicio y edición de condiciones. |
| `src/app/modules/presupuesto/catalogo-versiones/catalogo-versiones-registro.component.spec.ts` | Pruebas del formulario y sus escenarios de registro. |
| `src/app/modules/presupuesto/presupuesto.routes.ts` | Rutas de bandeja y formulario del catálogo. |
| `src/app/core/state/catalog-condition-edit-lock.service.ts` | Bloqueo temporal de navegación mientras se editan condiciones. |
| `src/app/mock/usuarios-demo.ts` | Personas de demostración, perfiles y destino inicial del flujo demo. |
| `src/app/features/login/login.component.ts` | Selección de usuario demo, inicio de sesión y navegación posterior a la autenticación. |

Rutas funcionales principales:

| Ruta | Pantalla |
| --- | --- |
| `/procesos/catalogo-versiones` | Bandeja de versiones |
| `/procesos/catalogo-versiones/nuevo` | Registro o edición de versión |

## Ejecución local

### Requisitos

- Node.js 24.x.
- npm 10 o superior.

### Instalación y arranque

```bash
npm ci
npm start
```

Abrir <http://127.0.0.1:4200/login> e iniciar sesión con uno de los usuarios de demostración disponibles en la pantalla de login.

Para utilizar otro puerto:

```bash
npm start -- --port 4300
```

### Verificación técnica

```bash
# Compilación de desarrollo
npx ng build --configuration development

# Pruebas unitarias
npx ng test --watch=false --browsers=ChromeHeadless
```

## Consideraciones del prototipo

- La información del catálogo es simulada y vive en el navegador durante la demostración.
- Las rutas, validaciones y reglas descritas en este documento corresponden al código actual del prototipo.
- Este README documenta exclusivamente el Catálogo de Versiones; no describe los flujos funcionales de otros catálogos.
