# Fendol IMS — Fix Batch: Audit Findings & Ambiguities

> Phase 1 audit complete. Each fix below lists what should be fixed and what is needed to resolve ambiguities before Phase 2 implementation.

---

## Fix 1 — Customer creation: `siteId` field Done

**What should be fixed:**
Add a `siteId` field to customer creation (`src/components/customer/add/add.jsx`). Currently `formData` holds only `fullName`, `phone`, `category`, `address` and posts `{...formData}` to `POST /customers` with no site context. The fix is to add `siteId` to state/payload, show a site selector dropdown when the creator is Super Admin (required), and hide/omit it for other roles — mirroring the existing role-gated pattern in `AddStockModal.jsx:8-62` and `Header` site selector.

**What is needed to be provided for ambiguities to be rectified:**
1. Confirm that `GET /v2/all-site` is the correct source for site options (used elsewhere for Super Admin site pick).
2. Confirm payload field name is `siteId` (vs `site_id` / `site`) and whether it should be omitted entirely for non-Super-Admin (current precedent: omit) or auto-filled from `activeSite.id` / `user.siteId`.
3. Confirm whether the edit flow in `src/components/customer/view-all/view-all.jsx` (Edit Customer modal) should also get the same `siteId` handling, or scope is strictly creation only.
4. Confirm required validation: Super Admin must select before submit (block submit + error toast), non-Super-Admin hidden.

---

## Fix 2 — Edit Store Threshold: updated request body Done

**What should be fixed:**
Update `src/components/store/view-all/EditStoreModal.jsx:36-41` to send the full body expected by `PATCH /api/v1/edit-store-threshold/:id` — `{ name, unit, threshold, weightPerItem }`. Currently the modal already collects all four fields (lines 9-12 validate them) but the payload discards `name`/`unit` and sends only `{ threshold, weightPerItem }`.

**What is needed to be provided for ambiguities to be rectified:**
1. Confirm unit value casing/enum matches backend (`kg`/`g`/`bags`/`packs`/`pieces`/`sachets` as in the dropdown) — no mapping needed.
2. Confirm whether `name` trimming (`name.trim()`) is expected or preserve as-is.
3. No other info needed — UI already complete, change is payload wiring only.

---

## Fix 3 — Hatchery walk-in customer sales

**What should be fixed:**
In Hatchery site context only, allow recording a sale for a walk-in customer where the customer's name is captured as plain text on the sale itself, with no customer record created and no customer ledger entry generated. Today all four sales forms (`dryfish.jsx`, `freshfish.jsx`, `fingerlingsfish.jsx`, `feed.jsx`) require a registered customer via searchable dropdown and always send `customerId`; the customer ledger (`src/components/customer/personal-ledger/personal-ledger.jsx`) and `POST /add-payment` are tightly coupled to a persisted `customerId`.

**What is needed to be provided for ambiguities to be rectified:**
1. Exact payload field name for walk-in name — e.g. `customerName` vs `walkInCustomerName` vs `fullName` vs `customer_name` — and whether to send `customerId: null` or omit `customerId` entirely.
2. Confirm walk-in applies to all four sales types when in Hatchery context, or only specific types (e.g. fingerlings/feed).
3. Confirm ledger suppression is server-side (omitting `customerId` is enough) — no client-side ledger skip needed.
4. Confirm Hatchery context detection should reuse `src/components/shared/sidebar/sidebar.jsx:77-83` logic (`isHatcheryType(siteType)`) based on `activeSite.type` for Super Admin and user site type for others.
5. Provide backend contract example (cURL/JSON) for a walk-in sale so the correct field is used.

---

## Fix 4 — Supplier restructuring Done

**What should be fixed:**
(a) Add a direct field for the raw material(s) a supplier supplies to the Supplier create/edit form (`src/components/finance/supplier/new-supplier.jsx`). Currently it collects `fullName`, `phone`, `supplierType`, `address` and posts `{ name, phone, supplierTypeId, address }` with no material link.
(b) Remove the Supplier Ledger feature entirely — delete `src/components/finance/supplier/supplier-ledger.jsx`, its route `supplier/ledger` in `src/components/finance/financeRouter.jsx:25`, and the `View Ledger` action/nav in `src/components/finance/supplier/view-all-supplier.jsx:489`.

**What is needed to be provided for ambiguities to be rectified:**
1. Raw material field shape — single `rawMaterialId` vs array `rawMaterialIds` (instruction says "raw material(s)" plural suggests multi-select array) and the source endpoint (likely `GET /v2/raw-material` used in feed).
2. Confirm payload key (`rawMaterialIds`, `rawMaterials`, `materials`, etc.) and whether it accepts IDs or names.
3. Confirm scope of ledger removal — also remove stat cards `Total Credits / Total Debits` on the supplier list page (`view-all-supplier.jsx:242-272`) or retain them if backend still returns `summary`? Removal instruction says feature entirely, but list page stats are ledger-derived.
4. Confirm Supplier create/edit should support creating raw materials inline or just selecting existing ones.
5. Confirm no other supplier transaction writes need cleanup beyond the ledger page.

---

## Fix 5 — Restock Store UI: packs vs. weight clarity Done

**What should be fixed:**
Make three quantity concepts unambiguous in the store flow:
- **Creation** (`AddStockModal.jsx:53-58`): `weightPerItem` is weight of one pack/unit (e.g. one "Salt" pack = 20g), `unit` names the pack unit — label currently "Weight per store item" is vague.
- **Top-up/restock** (`RestockStoreModal.jsx:138-145`): `quantity` is number of packs added, `price` is total price for whole purchase — label "Number of Items (unit)" is not explicit enough.
- **Use** (`UseStoreModal.jsx:142-148`): `quantityUsed` is weight amount (referencing `weightPerItem`), not pack count — label "Quantity (unit)" directly misleads user into entering pack count.

**What is needed to be provided for ambiguities to be rectified:**
1. Confirm `weightPerItem` weight unit — is it always grams, or does it follow the store item's weight semantics? Example uses 20g but unit dropdown includes `kg`/`g`/`bags`/`packs`. Need to know suffix to display (e.g. "(in grams)" vs "(in weight unit)").
2. Confirm desired helper text/placeholders — e.g. creation "Weight per 1 pack (e.g. 20 = 20g per pack)", top-up "Number of packs added", "Total price for all packs (₦)", use "Weight amount used (e.g. 0.25 — not pack count, references weightPerItem)".
3. Confirm whether to add computed preview (e.g. `total weight = quantity × weightPerItem`) to reinforce understanding.
4. Confirm whether `Use` quantity validation should allow decimals (it currently does) — correct for weight, wrong for pack count, so no change expected.

---

## Fix 6 — Hatchery-site option on Use Feed / Use Store / Mortality Done

**What should be fixed:**
Add an option to attribute usage/mortality to a Hatchery site / ongoing hatch batch instead of only a pond. Today all three flows are pond-only:
- `src/components/feed/inventory/UseFeedModal.jsx:143-148` sends `PATCH /use-feed/:id { pondId, quantity }`.
- `src/components/store/view-all/UseStoreModal.jsx:142-147` sends `PUT /use-store-item/:id { pondId, quantityUsed }`.
- `src/components/manage-fish/damage-fish/damage-fish.jsx:130` sends `POST /log-damage { stageId_from, actual_quantity, remarks }`.
Each fetches ponds via `GET /fish-stages?siteId=...` with no hatch alternative.

**What is needed to be provided for ambiguities to be rectified:**
1. Backend payload key for hatchery attribution — `hatchBatchId` vs `batchId` vs `hatchbatchNo` vs `nurseryId` vs `siteId + batchId`. Need contract for all three endpoints.
2. Confirm hatch batch source — `GET /v2/hatch-batches` (active/ongoing only) and filtering criteria (e.g. `status: active`).
3. Confirm UX: radio/toggle "Pond vs. Hatchery Batch" replacing the pond dropdown when Hatchery selected, with batch dropdown populated from ongoing batches.
4. Confirm whether this option is always visible or only when current context is Hatchery or when ongoing batches exist.
5. Confirm `Mortality` endpoint `POST /log-damage` accepts hatch batch payload — or if a different endpoint is used for hatchery mortality.
6. Provide example payloads for all three flows when attributed to Hatchery.

---

## Fix 7 — Sidebar menu glitch on restricted roles Done

**What should be fixed:**
For roles with a restricted menu set (e.g. `sales_manager` sees only Sales/Showcase/Cash Drawer/Customers per spec), clicking a sidebar item briefly shows the full/unfiltered menu before snapping back to the filtered set. Root is in `src/components/shared/sidebar/sidebar.jsx:65-170` where `hasPermission(userTypes, resource)` gates every section, `userSiteDetails` is fetched async (initial `[]` → `hasHatcherySite=false` → first paint hides hatchery, then recompute), and `useLayoutEffect` vs `useEffect` + Bootstrap `Collapse` (`transitionDuration: "0s"`) causes layout thrash and flash of unfiltered content.

**What is needed to be provided for ambiguities to be rectified:**
1. Confirm roles to test against — at least two differently-restricted fixtures (e.g. `sales_manager` vs `store_keeper` vs `finance`) to verify the fix.
2. Confirm whether the prior "fragile CSS module selectors / Bootstrap Collapse timing / useEffect vs useLayoutEffect" fix already applied (code now uses `styles.navs` and `useLayoutEffect` for expansion) is considered insufficient or if the glitch persists after that change.
3. Confirm desired behavior during async hatchery site resolution — suppress menu render until `userSiteDetails` resolved (skeleton/hidden) vs. synchronous fallback using `user.userSites` objects when string IDs not yet hydrated.
4. Confirm whether initial `userTypes` hydration from `sessionStorage` (sync in `authReducer.js:22`) is reliable or if a race with `ProtectedRoute` redirect contributes to the flash.

---
