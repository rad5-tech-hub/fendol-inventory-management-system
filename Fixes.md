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



Full Test Map — every fix, where it lives, and how to verify
1) Customer siteId on create ----fixed
File: src/components/customer/add/add.jsx:13
Route: /customer/add
- Login as Super Admin → Add Customer shows required Site dropdown (loads GET /v2/all-site). Leaving empty blocks submit with Please select a site.
- Submit → Network POST /customers includes siteId: "uuid" + fullName/phone/category/address.
- Login as Farm Manager / Sales Manager → same route, no Site field, network payload omits siteId entirely (not " ").
- Edit flow (/customer/view-all → ⋯ → Edit) intentionally unchanged (creation-only scope).
2) Edit Store Threshold — full body ----fixed
File: src/components/store/view-all/EditStoreModal.jsx:36
Route: /store/view-all → ⋯ → Edit
- Edit any store item, change Name/Unit/Threshold/Weight Per Item → Update.
- Network PATCH /edit-store-threshold/:id payload must be { name:"baby oku", unit:"kg", threshold:78, weightPerItem:6.3 } (all 4, previously only 2).
3) Hatchery walk-in sales (all 4 sales types) ----fixed
Files: src/components/finance/add-sales/dryfish.jsx:26, freshfish.jsx:15, feed.jsx:13, fingerlingsfish.jsx:15 + receipt.jsx:78
Route: /finance/add-sales → pick Dry/Fresh/Fingerlings/Feed
- Precondition: set Active Site (header pill) to a Hatchery type site (or login as user whose sites include hatchery). On non-hatchery site the checkbox is hidden.
- In step 2, check Walk-in customer (no ledger entry) → searchable dropdown is replaced by plain text Enter walk-in customer name.
- Submit → Network POST /sales omits customerId, includes customerName:"Walk-in Customer" (+ products/discount/description/amountPaid/salesCategoryId/siteId/pondId). No customer record created, receipt shows typed name ( receipt.jsx:78 fallback to customerName when receipt.customer is null). Toggle off → reverts to registered-customer flow with customerId.
4) Supplier — typed raw materials + ledger removal ---fixed
Create/Edit: src/components/finance/supplier/new-supplier.jsx:46
Route: /finance/supplier/new (+ edit via /finance/supplier/view-all → ⋯ → Edit)
- Raw Materials Supplied is now free-text: type Maize → Add → chip appears; add Soya → two chips; × removes. Submitting sends rawMaterials:["Maize","Soya"] (strings, not IDs). No GET /v2/raw-material call on this page anymore.
- Existing suppliers with typed materials prefill as chips on edit.
List: src/components/finance/supplier/view-all-supplier.jsx:40
Route: /finance/supplier/view-all
- Only Total Suppliers stat card (Credit/Debit removed). No Supplier Type dropdown, no Balance filter, no supplier-type API call.
- Search is name/phone only. Table shows MATERIALS column (comma-joined typed names), no BALANCE column, ⋯ menu shows only Edit ( View Ledger removed). Direct nav to /finance/supplier/ledger 404s (file supplier-ledger.jsx deleted).
5) Raw-material siteId hotfix --fixed
Files: src/components/feed/raw-material-inventory/raw-material-inventory.jsx:74, src/components/finance/supplier/new-supplier.jsx:63
Route: /feed/raw-materials
- Login as multi-site user (e.g., Farm Manager with 2+ sites) with no active site selected → page still loads (network GET /v2/raw-material?siteId=all), no toast siteId is required for users with access to multiple sites.
6) Restock Store UI — packs vs weight ---fixed
Create: src/components/store/view-all/AddStockModal.jsx:136
Restock: src/components/store/view-all/RestockStoreModal.jsx:211
Use: src/components/store/view-all/UseStoreModal.jsx:238
Route: /store/view-all → Add Store / Restock / Use
- Add: label Weight per 1 {unit} ({unit}) + helper Weight of one pack… 20 = 20g with live placeholder.
- Restock: labels Total Price for all packs — ₦ (not per pack) + helper, Quantity — number of packs to add + helper, plus live Total weight: 5 × 20 preview (only when weightPerItem exists, decimals allowed on price).
- Use: label Quantity Used — weight amount (1 pack = 20) + helper weight amount, not pack count, ≈ 0.012 packs (0.25 ÷ 20) preview, decimals allowed.
7) Use Feed / Use Store / Mortality → Hatchery (all active batches) --fixed
Files: src/components/feed/inventory/UseFeedModal.jsx:174, src/components/store/view-all/UseStoreModal.jsx:174, src/components/manage-fish/damage-fish/damage-fish.jsx:158
Routes: /feed/inventory/overview → Use Feed; /store/view-all → Use; /manage-fish/damage-fish (Mortality)
- Each has Pond | Hatchery Batch toggle. Choose Hatchery Batch → no batch dropdown, info box Applies to all active hatch batches at this site.
- Submit hatchery branch → Network:
- Store: PUT /use-store-item/:id { quantityUsed:2.90, target:"hatchbatch", siteId:"50bd2d1b-..." }
- Feed: PATCH /use-feed/:id { quantity:6, target:"hatchbatch", siteId? } (siteId only for super admin, omitted otherwise)
- Mortality: POST /log-damage { target:"hatchbatch", actual_quantity:50, remarks:"Fry mortality", siteId? }
Previously sent hatchBatchId and got is not allowed.
8) Sidebar glitch + persistence ----fixed
Files: src/components/shared/sidebar/sidebar.jsx:64,90,226
Scope: every protected route
- Login as Farm Manager and Sales Manager (two restricted roles). Rapidly click 5-6 sidebar headers/items (Fish Operations, Finance, Inventory, Hatchery if visible). Before, farm manager flashed full unfiltered menu on each click due to per-page remount + Collapse transition; now with Collapse replaced by {open && <div>} + module-level cachedSiteDetails the sidebar stays static and only the main styles.content area shows its spinner. Hard-refresh each role to confirm no first-paint FOUC either.
9) Hatchery labels — Fingerlings ----fixed
Files: src/components/hatchery/hatch-batches/view-all/view-all-batches.jsx:405, src/components/hatchery/hatch-batches/summary/hatch-batch-summary.jsx:18
Route: /hatchery/hatch-batches/view-all + summary  /hatchery/hatch-batches/summary/:id
- Table headers Fingerlings Produced / Fingerlings Moved, chart Fingerlings Production Trend, summary cards Fingerlings Produced (Est.) / Fingerlings Moved. Data field fryProduced unchanged, only labels.
10) Sidebar membership fixes --fixed
File: src/components/shared/sidebar/sidebar.jsx:388,432,486
- Feed Management entire section now hidden on isHatcheryContext (previously only sub-items hid, inventory leaked).
- Suppliers card under FINANCE gated by hasPermission(...'supplier') → visible to super_admin/farm_manager/finance, hidden from sales_manager (spec).
- Referral + MLM sections gated by hasPermission(...'referral'/'mlm') → visible only to super_admin, hidden from all others (previously removed entirely).
Verify by logging in as each role:
- sales_manager sees: Sales (New Sales, New Expenses no Finance Ledger), Showcase, Cash Drawer, Customers → no Supplier, Complaints, MLM/Referral, Processing/Feed on hatchery.
- farm_manager sees: all above + Supplier + Ponds/Manage-Fish etc. but no MLM/Referral.
- super_admin sees Supplier + Referral + MLM + everything.
11) Fish process — skip showcase GET --fixed
Files: src/components/fish-processes/process-fish/new-batch.jsx:140,257, src/components/fish-processes/process-fish/batch-processing.jsx:141
Route: /fish-processes/process-fish → move through Washing → Smoking → Drying → Move To Showcase
- At Drying → Showcase (POST /add-fish-to-show-glass) the subsequent GET /fish-process/:id is now skipped (if (!isShowcaseMove) await fetchProcessData), so no 404 fish-process not found toast. Washing→Smoking and Smoking→Drying still fetch and update quantities. Restoring a saved batchProcessId on reload silently clears storage on 404 instead of warning.