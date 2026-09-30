# BidPower — Product Direction (fuente de verdad)

BidPower **no** compite con QuickBooks ni es software contable. Su misión es ser la mejor herramienta del día a día para contractors y electricistas. El centro de todo es el **PROJECT**.

## Usuarios dentro de un proyecto

1. **Contractor / Electrician** — Crea y controla proyectos; crea Proposals para clientes y Pricing Requests para supply; crea/aprueba POs; controla permisos de empleados; ve costos operativos, presupuesto, committed cost y ganancia estimada; ve qué necesita atención. No necesita contabilidad avanzada.
2. **Employee** — Ve solo proyectos asignados; pide materiales; sube receipts, invoices, packing slips, fotos y notas; genera PO **solo** si el Owner le da permiso (revocable en cualquier momento). Si deja la compañía se desactiva su acceso y se conserva su historial.
3. **Supply** — Recibe Pricing Requests (tipos: Gear, Lighting, Material, Other). Ve Bid Date, planos, PDFs, links, specs y notas. Puede preguntar, subir quote PDF e indicar quote number, total, availability y lead time. **No** ve lo que el contractor cobra al cliente. Empieza por secure link sin cuenta; más adelante Supply Premium.
4. **Customer** — Recibe Proposal; puede aprobar o pedir cambios; ve solo documentos/updates compartidos. **No** ve supplier pricing, PO cost, margin, profit interno ni información operativa privada.

## Vocabulario oficial

No usar "Quote" para todo. Los objetos permanecen separados.

| Flujo | Objeto |
|---|---|
| Employee → | Material Request |
| Contractor → Supply | Pricing Request |
| Contractor → Customer | Proposal |
| Contractor → Supply | Purchase Order |
| Customer → Contractor | Change Request |
| Contractor → Customer | Change Order |

## Principios

1. **Project-first** — todo gira alrededor del proyecto.
2. **Few taps** — tareas diarias en pocos toques.
3. **No duplicate entry** — si ya se conoce project, employee, supplier, items, customer o address, no se vuelve a pedir.
4. **Smart handoff** — una acción prepara la siguiente: Material Request → Pricing Request → Supplier Response → Purchase Order → Receipt → Project Cost.
5. **Context aware** — dentro de "Miami Beach" no se pide seleccionar "Miami Beach".
6. **Permissions over roles** — roles base Owner / Manager / Employee, pero el Owner decide permisos individuales (Request Material, Upload Receipt, Create PO, Send PO, View Costs, View Profit, PO limit, aprobación sobre un monto). Nunca asumir que todo Employee puede crear PO.
7. **External users without training** — Customer y Supply colaboran por secure links, sin app ni cuenta.
8. **Show only what matters** — Owner ve más; Employee menos; Supply solo su request; Customer solo lo compartido.
9. **Needs Attention** — mostrar qué requiere acción (material solicitado, supplier respondió, Pricing Request vence mañana, PO sin receipt, Customer pidió cambio).
10. **Waiting On** — cada objeto indica quién tiene la próxima acción: Supplier, Customer, Employee u Owner.

## Qué NO es BidPower

No construir como core: payroll, taxes, bank reconciliation, bookkeeping completo, chart of accounts, contabilidad completa, inventory ERP, fleet management, CRM complejo, workflows contables avanzados.

## Datos financieros que sí queremos (operativos)

Project budget / contract value, actual cost, committed cost, Purchase Orders, Expenses, estimated profit. Sirven para administrar el proyecto, no para llevar libros.

## Estrategia QuickBooks

BidPower captura y organiza la operación; QuickBooks hace el accounting. Más adelante: exportar/sincronizar Customers, Projects/Jobs, Suppliers/Vendors, Expenses, Purchase Orders, Invoices y Payments cuando corresponda, y resúmenes de costo por proyecto. No construir la integración antes de su fase, pero **no diseñar la arquitectura de forma que la dificulte** (ids estables, entidades separadas, datos operativos limpios).

## Electrical first

Excelente primero para Electrical Contractors y Electrical Supply Houses; luego HVAC, plumbing, roofing y otros. Electrical Intelligence futura: upload plans, lighting fixture count por tipo, device count, gear/riser, panel schedules, breaker counts, feeders, longitudes estimadas de wire/conduit, estimado preliminar de materiales. **Todo resultado es PRELIMINARY** y se verifica con contractor/supply. Nunca fabricar análisis de IA.

## Filosofía de desarrollo

No improvisar features. Antes de agregar una función: ¿el contractor la usa a diario? ¿reduce pasos? ¿evita repetir información? ¿mueve el proyecto hacia adelante? ¿la persona correcta ve solo lo que necesita? ¿pertenece a BidPower o a QuickBooks? Si no cumple, no entra al core.

## Fases

0. **Master Blueprint** — roles, permisos, objetos, estados, workflows, reglas.
1. **Foundation** — Supabase, Auth, Company, Projects, PWA, responsive, datos reales.
2. **Team & Permissions** — invite/deactivate employee, project assignment, permisos individuales, permisos de PO, visibilidad de costos, límites/aprobación.
3. **Materials** — item library, recent, favorites, saved lists, Material Request.
4. **Supplier Pricing** — Pricing Request (Gear/Lighting/Material/Other), Bid Date, PDFs, planos, links, specs, supplier response, preguntas.
5. **Purchasing** — supplier response → PO, aprobación, permisos de compra, receipt/invoice/packing slip obligatorio, actualización de costo.
6. **Customer** — Proposal, secure link, approval, Request Change, version history, Change Request, Change Order.
7. **Project Control** — Needs Attention, Waiting On, Activity, budget, actual cost, committed cost, estimated profit.
8. **Electrical Intelligence** — lighting takeoff, gear, panel schedules, breakers, feeders, longitudes, estimados preliminares.
9. **Supply Premium** — cuenta supply, Pricing Requests entrantes, bid dates, cuentas contractor, quotes enviados, herramientas de análisis de planos.
10. **Accounting Export / QuickBooks** — export/sync de datos financieros operativos. No full accounting.

## Regla de ejecución

Trabajar por fases. No empezar la siguiente hasta que la anterior esté completa, probada, sin bugs críticos y funcionando con datos reales. No reconstruir el repo. Antes de cada cambio importante: revisar la arquitectura actual, confirmar qué existe, reutilizar servicios/componentes, evitar duplicar lógica, mantener multi-tenant por `company_id`, RLS, mobile-first e i18n.
