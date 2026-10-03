# BidPower development instructions

Read `README.md`, `PROJECT_CONTEXT.md` and `PRODUCT_DIRECTION.md` (product source of truth: vocabulary, principles, phases) before making significant changes.
Work phase by phase; do not start the next phase until the user confirms the previous one.

- Preserve existing product direction and UI.
- Keep Customer Quotes separate from Supply Requests.
- Use Supabase RLS; never disable it to fix a query.
- Use migrations for database changes.
- Do not fabricate AI analysis, payments, signatures, invoices or business metrics.
- Keep mobile-first behavior, including iPhone safe areas and iPad layouts.
- Run `npm run typecheck` and `npm run build` after meaningful changes.

- Contexto completo para continuar el trabajo (arquitectura, decisiones, pruebas, trampas y pendientes): `docs/HANDOFF.md`.
