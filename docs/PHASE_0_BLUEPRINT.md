# Project Harbor — Fase 0: Master Blueprint

Documento de diseño. Complementa `PRODUCT_DIRECTION.md`. No hay código asociado.
Las decisiones marcadas **[por confirmar]** usan la recomendación por defecto hasta que el Owner del producto responda.

## 1. Actores y alcance de acceso

| Actor | Acceso | Autenticación |
|---|---|---|
| Owner | Toda la empresa | Cuenta |
| Manager | Operación; costos según permisos | Cuenta |
| Employee | Solo proyectos asignados | Cuenta |
| Supply | Un Pricing Request (y sus aclaraciones) | Secure link (sin cuenta). Premium más adelante |
| Customer | Solo documentos compartidos de un proyecto | Secure link (sin cuenta) |

Toda fila operativa pertenece a `company_id`. Los actores externos nunca leen tablas directamente: solo funciones/vistas que devuelven campos permitidos.

## 2. Permisos individuales

Los roles base dan valores por defecto; el Owner puede ajustar por persona. Plantillas: **Employee básico**, **Employee con compras**, **Manager**.

| Permiso | Owner | Manager | Employee básico | Employee con compras |
|---|---|---|---|---|
| Ver proyectos asignados / todos | todos | todos | asignados | asignados |
| Crear Material Request | sí | sí | sí | sí |
| Subir receipt, invoice, packing slip, fotos, notas | sí | sí | sí | sí |
| Gestionar biblioteca de ítems | sí | sí | no **[por confirmar]** | no |
| Crear Pricing Request | sí | sí | no | no |
| Crear PO | sí | configurable | no | sí |
| Enviar PO | sí | configurable | no | configurable |
| Límite de PO (monto) | ilimitado | configurable | — | configurable (ej. $500) |
| Sobre el límite | — | — | — | requiere aprobación del Owner |
| Ver costos | sí | configurable | no | no |
| Ver ganancia | sí | configurable | no | no |
| Crear Proposal / Change Order | sí | configurable | no | no |
| Gestionar equipo y permisos | sí | no | no | no |

Reglas:
- Revocar un permiso surte efecto de inmediato.
- Desactivar a un miembro corta el acceso y conserva su historial (`is_active = false`, nunca borrar).
- Toda revocación/cambio de permiso queda en auditoría (quién, cuándo, valor anterior).
- Los permisos se aplican en base de datos (función `has_permission` usada por RLS), no solo en la UI.

## 3. Objetos

Objetos separados, sin reutilizar "quote" para todo:

| Objeto | De → Para | Contiene |
|---|---|---|
| Material Request | Employee → Owner/Manager | Líneas de material del proyecto |
| Pricing Request | Contractor → Supply | Líneas, tipo, bid date, archivos, links, specs, notas |
| Supplier Response | Supply → Contractor | Por línea: precio, disponibilidad, lead time, alternativa; quote number, total, PDF |
| Purchase Order | Contractor → Supply | Líneas aceptadas, proveedor, totales |
| Receipt / Invoice / Packing slip | Employee/Owner → PO | Archivos y datos del documento |
| Proposal | Contractor → Customer | Alcance y precio al cliente (versionado) |
| Change Request | Customer → Contractor | Cambio solicitado |
| Change Order | Contractor → Customer | Cambio de alcance/precio a aprobar |

Tipos de Pricing Request: Gear, Lighting, Material, Other.

## 4. Estados y "Waiting on"

Cada objeto guarda `status` y `waiting_on` (`owner`, `employee`, `supplier`, `customer`, `none`).

- **Material Request:** `requested` (waiting: owner) → `reviewed` → `converted` (a Pricing Request o PO) | `rejected` (waiting: employee).
- **Pricing Request:** `draft` → `sent` (waiting: supplier) → `question_open` (según quién deba responder) → `responded` (waiting: owner) → `awarded` | `closed`. Vence en `bid_date`.
- **Purchase Order:** `draft` → `pending_approval` (waiting: owner) → `approved` → `sent` (waiting: supplier) → `received` → `pending_document` (waiting: employee/owner) → `completed`. Existe `po-status.ts`; se reutiliza y se extiende, no se reescribe.
- **Proposal:** `draft` → `sent` (waiting: customer) → `approved` | `changes_requested` (waiting: owner) → nueva versión.
- **Change Request:** `open` (waiting: owner) → `converted_to_change_order` | `declined`.
- **Change Order:** `draft` → `sent` (waiting: customer) → `approved` | `declined`.

Needs Attention (Fase 7) se calcula desde estos campos: material solicitado, supplier respondió, Pricing Request vence mañana, PO sin documento, cliente pidió cambio.

## 5. Visibilidad por actor

| Dato | Owner | Manager | Employee | Supply | Customer |
|---|---|---|---|---|---|
| Precio al cliente / Proposal | sí | según permiso | no | **no** | sí (su Proposal) |
| Costo de supplier / PO | sí | según permiso | no | solo el suyo | **no** |
| Margen / ganancia | sí | según permiso | no | **no** | **no** |
| Presupuesto y costos del proyecto | sí | según permiso | no | no | no |
| Material Request | sí | sí | los suyos | no | no |
| Pricing Request | sí | sí | no | solo el suyo | no |
| Planos/PDFs/specs del request | sí | sí | según asignación | los adjuntos al request | no |
| Documentos compartidos y updates | sí | sí | sí | no | solo los marcados como compartidos |
| Notas internas | sí | sí | sí (proyecto asignado) | no | no |

## 6. Secure links (Supply y Customer)

- Una tabla común de accesos externos: hash del token (nunca el token), objeto, alcance (`view`, `respond`, `approve`), expiración, revocación, último uso.
- Un link por destinatario y objeto; se puede revocar y regenerar.
- Las páginas externas consultan funciones que devuelven solo campos permitidos.
- Aprobación del cliente guarda nombre, fecha/hora y IP. No se fabrican firmas.
- Archivos vía URLs firmadas de corta duración, bajo `company_id/project_id/…`.

## 7. Biblioteca de ítems y listas (eléctrico primero)

- **Ítem:** descripción, categoría (conduit, wire, cajas, fittings, devices, breakers, paneles, lighting, gear, otros), medida/spec, unidad, fabricante y part number opcionales, favorito, último uso, veces usado.
- **Alias:** nombres de campo y de otro idioma ("mud ring", "romex"). Nombre principal libre; no se obliga a traducir **[por confirmar]**.
- **Catálogo base:** solo categorías, medidas típicas y unidades por defecto. **Sin marcas, part numbers ni precios inventados** **[por confirmar]**. La biblioteca real la construye cada empresa.
- **Agregar en 1–2 toques:** búsqueda mientras escribe (favoritos → recientes → biblioteca → base), cantidad y unidad en el mismo paso, texto libre siempre permitido (queda guardado), pegar lista desde email/WhatsApp/Excel, listas guardadas copiables a un proyecto.
- **Precios y part numbers por supplier:** privados de la empresa; nunca se envían a otro supplier ni al cliente.
- **Hand-off:** Material Request → líneas de Pricing Request → respuesta por línea → líneas de PO, manteniendo el ítem de origen.
- Formatos de exportación (PDF/CSV) agrupados por categoría **[por confirmar según cómo se envía hoy la lista al supply]**.

## 8. Preparación para QuickBooks (Fase 10)

- Customers, Projects, Suppliers/Vendors, Expenses y POs son entidades separadas con id estable.
- Campo opcional de id externo por entidad.
- Cada costo tiene proyecto y categoría.
- Se distingue **committed** (PO aprobado) de **actual** (receipt/expense).
- Sin plan de cuentas, ledger ni conciliación.

## 9. Reglas transversales

- Multi-tenant por `company_id`; RLS siempre activo; cambios de esquema solo por migración.
- Mobile-first (safe areas iPhone, layouts iPad); i18n ES/EN/PT en toda UI.
- Sin datos mock donde debe haber datos reales; sin análisis de IA ni métricas fabricadas.
- Resultados de Electrical Intelligence siempre marcados PRELIMINARY.

## 10. Pendientes de decisión

1. Catálogo base sin marcas ni precios.
2. Nombre principal libre + alias.
3. Permiso de biblioteca para empleados (por defecto: solo pedir, el Owner aprueba).
4. Cómo se envía hoy la lista al supply (email, WhatsApp, PDF, llamada).
5. Confirmación de la Fase 1 con Supabase real.

## 11. Estado de implementación

- **Fase 2 (Team & Permissions):** implementada. Migración `20260731000008_phase2_team_permissions.sql`
  (permisos por miembro con plantillas, auditoría, RLS por proyecto asignado y por permiso, invitaciones por token,
  protección del Owner). Aprobación por encima del límite de PO: pendiente, se resuelve en Fase 5.
