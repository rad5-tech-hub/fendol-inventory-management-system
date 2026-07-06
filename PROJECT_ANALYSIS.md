# Fendol Inventory Management System — Full Project Analysis

## 1. Project Overview

| Attribute | Value |
|---|---|
| **Project Name** | Fendol Inventory Management System |
| **Owner** | Fendol Fish Limited |
| **Repository** | `fendol-inventory-management-system` |
| **Type** | PWA (Progressive Web App) — Inventory/POS system |
| **Target** | Fish farming operations (ponds, feed, fish processing, sales, finance, hatchery) |
| **Build Tool** | Vite 8 |
| **Entry** | `src/index.jsx` → renders `<App>` in Redux `<Provider>` + `<BrowserRouter>` |
| **Output** | `dist/` |
| **Node** | `>=18` |
| **License** | MIT (inferred from `package.json`) |
| **Auth storage** | `sessionStorage` (token key: `authToken`), `localStorage` (active site key: `fendol_active_site`) |

## 2. Technology Stack

| Category | Library | Version (range) | Purpose |
|---|---|---|---|
| **Framework** | React | ^18.3.1 | UI library |
| **Build** | Vite | ^8.0.14 | Bundler/dev server |
| **Vite Plugin** | @vitejs/plugin-react | ^4.3.4 | Fast Refresh/JSX transform |
| **Routing** | react-router-dom | ^6.26.1 | Client-side routing (v6) |
| **State** | Redux | ^4.2.1 | Global state (auth only) |
| **Redux** | react-redux | ^8.1.3 | React bindings |
| **Redux** | redux-thunk | ^2.4.2 | Async actions |
| **HTTP** | axios | ^1.7.7 | API client |
| **UI** | bootstrap | ^5.3.3 | CSS framework |
| **UI** | react-bootstrap | ^2.10.4 | React Bootstrap components |
| **Icons** | react-icons | ^5.4.0 | Icon library (Fa, Bs, Io, Gi families) |
| **Charts** | recharts | ^2.13.3 | Dashboard charts (used in some dashboards) |
| **Charts** | chart.js | ^4.4.6 | Secondary charting |
| **Charts** | react-chartjs-2 | ^5.2.0 | Chart.js React bindings |
| **Notifications** | react-toastify | ^11.1.0 | Toast notifications |
| **Pagination** | react-paginate | ^8.2.0 | Client-side pagination |
| **JWT Decode** | jwt-decode | ^4.0.0 | Client-side token parsing |
| **CSS Modules** | SCSS Modules | (built-in) | Scoped CSS with variables |
| **Tooltips** | react-tooltip | ^5.28.0 | Tooltips |
| **Printing** | (custom) | — | Thermal-printer-friendly receipts |

**Not used (dead dependencies — installed but never imported):**
- `@tanstack/react-query` — all data fetching uses raw `useEffect` + `axios`
- `react-bootstrap-typeahead` — custom search dropdowns used instead
- `react-datepicker` — native `<input type="date">` used instead
- `styled-components` — CSS approach is SCSS modules
- Testing libs (`@testing-library/react`, etc.) — zero test coverage

## 3. Project Structure

```
fendol-inventory-management-system/
├── index.html                  # Vite entry HTML
├── vite.config.js              # Vite configuration (outDir: dist)
├── package.json
├── .env                        # Dev env vars
├── .env.example                # Template
├── .env.production             # Production env vars
├── .env.staging                # Staging env vars
├── PROJECT_ANALYSIS.md         # This file
├── skill.md                    # Agent operating guide
├── README.md
├── dist/                       # Build output (gitignored)
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── robots.txt
│   ├── favicon.ico
│   ├── logo192.png / logo512.png / logos.png
└── src/
    ├── index.jsx               # App bootstrap / SW registration
    ├── serviceWorkerRegistration.js
    ├── assests/
    │   └── logo.png
    ├── components/
    │   ├── router.jsx           # Top-level route definitions
    │   ├── protect-routes.jsx   # Auth guard + RBAC wrapper
    │   ├── permissions/
    │   │   ├── permissions.js   # RBAC permission matrix
    │   │   └── permissions.test.js
    │   ├── shared/
    │   │   ├── style.scss
    │   │   ├── api/apiLink.jsx  # Axios instances (Api + ApiV2)
    │   │   ├── login/
    │   │   ├── header/
    │   │   ├── sidebar/
    │   │   ├── data-table/DataTable.jsx
    │   │   ├── custom-dropdown/CustomDropdown.jsx
    │   │   ├── portal-dropdown/PortalDropdown.jsx
    │   │   ├── confirm-modal/ (ConfirmModal.jsx + useConfirm.jsx)
    │   │   ├── skeleton/Skeleton.jsx
    │   │   ├── site-selector/SiteSelector.jsx
    │   │   └── reduxForProtectingRoute/
    │   │       ├── store.js
    │   │       ├── actions/ (types.js + authActions.js)
    │   │       └── reducers/ (rootReducer.js + authReducer.js)
    │   ├── dashboard/           # Main KPI dashboard
    │   ├── admin/               # User management
    │   ├── customer/            # CRM
    │   ├── feed/                # Feed (inventory, production, raw materials)
    │   ├── ponds/               # Pond/stage management
    │   ├── manage-fish/         # Fish lifecycle
    │   ├── fish-processes/      # Processing batches
    │   ├── products/            # Product catalog
    │   ├── store/               # Store inventory
    │   ├── finance/             # Sales, expenses, ledger, cash, supplier, staff
    │   ├── showcase/            # Whole/broken fish showcase
    │   ├── damage-loss/         # Damage/loss records
    │   ├── site-management/     # Site CRUD + performance
    │   ├── batch-dashboard/     # Batch processing dashboard
    │   ├── hatchery/            # Hatchery (batches, broodstock, fry, transfers)
    │   ├── complaints/          # Complaint system
    │   ├── referral/            # Referral system
    │   └── mlm/                 # Multi-level marketing
    └── __tests__/               # Jest tests
```

**Total: ~180+ source files** across 18 feature modules + 8 shared components + config.

## 4. Entry Points

### `index.html` (Vite root)
- `<script type="module" src="/src/index.jsx">` — Vite entry
- `<div id="root">` mount point
- CSP header: `upgrade-insecure-requests`
- PWA manifest linked

### `src/index.jsx`
```jsx
import store from './components/shared/reduxForProtectingRoute/store';
import { Provider } from 'react-redux';
import App from './components/router';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
serviceWorkerRegistration.register();
```

## 5. Routing Architecture (`src/components/router.jsx`)

Top-level `<Routes>` with `<Route>` elements using `element` prop (v6 style):

| Path | Component | Protected | Notes |
|---|---|---|---|
| `/` | `Login` | No | Redirect if already logged in |
| `/dashboard` | `Dashboard` | Yes (`dashboard`) | Main KPI dashboard |
| `/admin/*` | `AdminNavigations` | Yes (`admin`) | User/role management |
| `/customer/*` | `CustomerNavigations` | Yes (`customer`) | CRM |
| `/ponds/*` | `ProductStagesNavigations` | Yes (`ponds`) | Pond management |
| `/manage-fish/*` | `ManageNavigations` | Yes (`manage-fish`) | Fish lifecycle |
| `/fish-processes/*` | `ProcessNavigations` | Yes (`fish-processes`) | Processing |
| `/products/*` | `ProductNavigations` | Yes (`products`) | Product catalog |
| `/feed/*` | `FeedNavigations` | Yes (`feed`) | Feed management |
| `/store/*` | `StoreNavigations` | Yes (`store`) | Store inventory |
| `/damage-loss` | `DamageLoss` | Yes (`damage-loss`) | Damage/loss records |
| `/complaints` | `Complaints` | Yes (`complaints`) | Make complaint |
| `/complaints/all` | `AllComplaints` | Yes (`complaints:view-all`) | View all complaints |
| `/finance/*` | `FinanceNavigations` | Yes (`finance:add-sales`) | Finance |
| `/showcase/*` | `ShowcaseNavigations` | Yes (`showcase`) | Fish showcase |
| `/site-management/*` | `SiteManagementNavigations` | Yes (`site-management`) | Site management |
| `/batch-dashboard/*` | `BatchDashboardNavigations` | Yes (`batch-dashboard`) | Batch dashboard |
| `/hatchery/*` | `HatcheryNavigations` | Yes (`hatchery`) | Hatchery operations |
| `/referral/*` | `ReferralNavigations` | Yes (`referral`) | Referral system |
| `/mlm/*` | `MlmNavigations` | Yes (`mlm`) | Multi-level marketing |

**RBAC**: Routes specify a `requiredResource` prop. `<RoleRoute>` enforces via `hasPermission()` from `permissions.js`. If denied, redirects to highest-permission landing page.

### Sub-Router Detail

**Admin** (`adminRoutes.jsx`):
- `add-new-admin` → `AddNew` (create/edit admins)
- `view-all` → `ViewAll` (list admins)

**Customer** (`customerRoute.jsx`):
- `add` → `AddCustomer`
- `view-all` → `ViewAllCustomers`
- `personal-ledger` → `PersonalLedger`

**Ponds** (`productStagesRouter.jsx`):
- `create` → `CreateStages` (create pond)
- `view-all-ponds` → `ViewAllStages`

**Manage Fish** (`manageRoute.jsx`):
- `create-fish-type` → `AddSpecies`
- `add-fish` → `AddFish`
- `move-fish` → `MoveFish`
- `harvest-fish` → `HarvestFish`
- `damage-fish` → `DamageFish`
- `view-all-histories` → `ViewAllHistory`
- `sampling` → `Sampling`
- `mortality` → `Mortality`
- `site-transfers` → `ViewFish` (incoming)
- `site-transfers/transfer` → `TransferFish`
- `site-transfers/history` → `History`

**Fish Processes** (`processRouter.jsx`):
- `process-fish` → `NewBatchFish`
- `view-summary` → `ViewSummary`

**Products** (`productRouter.jsx`):
- `create-products` → `CreateProducts`
- `view-all` → `ViewAllProducts`

**Feed** (`feedRouter.jsx`):
- `dashboard` → `FeedDashboard` (placeholder)
- `raw-materials` → `RawMaterialInventory`
- `view-all` → `UpdateFeedInventory`
- `inventory-history` → `InventoryHistory`
- `production/create` → `CreateFeedBatch`
- `production/history` → `FeedProductionHistory`
- `production/detail/:batchNumber` → `FeedProductionBatchDetail`
- `inventory` and `inventory/overview` → `FeedInventory`
- `inventory/ledger/:feedName` → `FeedLedger`
- `inventory/use` → `FeedInventoryUse`
- `inventory/top-up` → `FeedInventoryTopUp`

**Store** (`storeRouter.jsx`):
- `view-all` → `UpdateStoreInventory`
- `inventory-history` → `InventoryHistory`
- `stock/use` → `StoreStockUse` (placeholder)
- `stock/top-up` → `StoreStockTopUp` (placeholder)

**Finance** (`financeRouter.jsx`):
- `add-sales` → `AddSales`
- `add-expenses` → `AddExpense`
- `ledger` → `FinanceLedger`
- `cash-drawer` → `CashDrawer`
- `supplier/new` → `NewSupplier`
- `supplier/view-all` → `ViewAllSupplier`
- `supplier/ledger` → `SupplierLedger`
- `supplier/dashboard` → `SupplierDashboard` (placeholder)
- `staff/directory` → `StaffDirectory`
- `staff/payroll` → `StaffPayroll` (placeholder)
- `staff/attendance` → `StaffAttendance`
- `staff/appraisals` → `StaffAppraisals` (placeholder)

**Showcase** (`showcaseRoute.jsx`):
- `whole-showcase` → `ViewWholeHistory`
- `broken-showcase` → `ViewBrokenHistory`

**Site Management** (`siteManagementRouter.jsx`):
- `create` → `CreateSite`
- `view-all` → `ViewAllSites`
- `site-performance` → `SitePerformance` (placeholder)

**Batch Dashboard** (`batchDashboardRouter.jsx`):
- `/` (index) → `BatchDashboard`
- `summary/:batchId` → `BatchSummary`

**Hatchery** (`hatcheryRouter.jsx`):
- `dashboard` → `HatcheryDashboard` (placeholder)
- `hatch-batches/*` → `HatchBatchesRouter`
- `broodstock/*` → `BroodstockNavigations`
- `fry-production/*` → `FryProductionNavigations`
- `transfers/*` → `TransfersNavigations`
- `cost-analysis/*` → `CostAnalysisNavigations`

**Referral** (`referralRouter.jsx`):
- `dashboard` → `ReferralDashboard` (placeholder)
- `agents` → `ReferralAgents`
- `payouts` → `ReferralPayouts`

**MLM** (`mlmRouter.jsx`):
- `tree` → `MlmTree` (placeholder)
- `leaders` → `MlmLeaders`
- `payouts` → `MlmPayouts`
- `earnings` → `MlmEarnings`

## 6. Authentication & Authorization

### Login Flow
- `login.jsx`: Form with username/password
- `Api.post('/login', credentials)` → receives JWT
- Token stored in `sessionStorage` (key: `authToken`, cleared on tab close)
- Token decoded client-side via `jwt-decode` to extract `userTypes`, `userSites`, etc.
- Dispatches `loginUser()` Redux action on success

### Redux Auth State (`src/components/shared/reduxForProtectingRoute/`)
- **Store**: Single `createStore` with `composeEnhancers` for Redux DevTools
- **Reducer**: `authReducer` (directly, not via `rootReducer` — `rootReducer.js` exists but is unused)
- **Auth Reducer**: Manages `authenticated` (boolean), `user` (object with `userTypes[]`, `userSites[]`, `username`, `email`, `role`, `token`), and `activeSite` (object with `id`, `name`, `type` | null)
- **Actions**: `LOGIN_USER`/`LOGOUT_USER`/`SET_ACTIVE_SITE` types; `loginUser()`/`logoutUser()`/`setActiveSite()` action creators
- **Active site persistence**: `localStorage` key `fendol_active_site`

### Route Protection
- `protect-routes.jsx`: Checks `sessionStorage` for `authToken` AND Redux `authenticated` flag
- Token expiry checked every 60 seconds via interval + on mount — expired tokens trigger redirect to `/`
- `RoleRoute` wrapper enforces RBAC via `hasPermission()` from `permissions.js`

### RBAC Permission System (`permissions/permissions.js`)
- **5 role types:** `super_admin`, `farm_manager`, `store_keeper`, `sales_manager`, `finance`
- Permission matrix `ACCESS` maps resource keys to allowed role arrays
- Fine-grained permissions with optional `:action` suffix (e.g., `admin:create`, `site-management:delete`)
- `hasPermission(userTypes, resource, action?)` — returns boolean
- `extractUserTypes(decodedJwt)` — parses roles from JWT (supports `roles[].type` array OR legacy `role` string OR `isSuperAdmin` flag)
- `normaliseRoleType()` — fixes known backend typo `farm_manger` → `farm_manager`
- Comprehensive test file at `permissions.test.js`

### API Interceptor Auth
- Request interceptor in `apiLink.jsx` (identical for both `Api` and `ApiV2`):
  - Attaches `Authorization: Bearer <token>` header
  - Decodes JWT to check `exp` — if expired, clears session, dispatches `logoutUser()`, shows toast, redirects to `/`
- 403 responses: Shows toast notification

## 7. State Management

**Redux** is used exclusively for authentication and active site state:

```
store (createStore)
└── authReducer
    ├── authenticated: boolean
    ├── user: { userTypes[], userSites[], username, email, role, token }
    └── activeSite: { id, name, type } | null
```

**All other state is local** — each component manages its own `useState` for:
- Form data
- API response data
- Loading/error states
- Pagination (page index)
- Modal visibility
- Sidebar toggle

This means **no shared state** between features. Each feature re-fetches independently.

**Anti-pattern**: Same data (e.g., customers, stages, products) is fetched multiple times
across different components (e.g., in `add-sales.jsx` parent and also in child forms).

## 8. API Integration

### Axios Clients (`src/components/shared/api/apiLink.jsx`)

| Instance | baseURL | Usage |
|---|---|---|
| `Api` (default export) | `VITE_API_BASE_URL` (e.g., `https://dev-api.fendolgroup.com/api/v1`) | Older v1 endpoints |
| `ApiV2` (named export) | `VITE_API_V2_BASE_URL` (e.g., `https://dev-api.fendolgroup.com/`) | Newer v2 endpoints |

Both have identical **request interceptors**: read `authToken` from `sessionStorage`, check expiry via `jwtDecode`, attach `Authorization: Bearer` header.
Both have **response interceptors**: catch 403 and show toast.

**Anti-pattern**: Interceptor code is duplicated in both instances — should be a shared function.

### API Endpoints Used

| Module | v1 Endpoints | v2 Endpoints |
|---|---|---|
| **Auth** | `/login` | — |
| **Dashboard** | `/dashboard` | — |
| **Admin** | — | `/v2/roles`, `/v2/all-site`, `/api/v1/admin`, `/api/v1/edit-admin/:id` |
| **Customers** | `/customers`, `/customer/:id`, `/customer/:id/pending-sales`, `/add-payment`, `/delete-customer/:id` | — |
| **Feed** | `/feeds`, `/feeds-histories` | `/v2/raw-material`, `/v2/feed-production`, `/v2/feed-production/:batchNumber` |
| **Ponds** | `/fish-stages`, `/fish-stage` | — |
| **Manage Fish** | `/add-fish`, `/move-fish`, `/harvest-fish`, `/damage-fish`, `/all-fish-history`, `/create-fish` | `/v2/transfers`, `/v2/transfer-fish` |
| **Fish Processes** | `/move-fish`, `/process-fish`, `/all-process-history`, `/check-stages` | — |
| **Products** | `/products`, `/create-product`, `/update-product/:id` | `/api/v1/product-types`, `/api/v1/product-type`, `/v2/site-types`, `/api/v1/assign-site` |
| **Store** | `/stores`, `/stores-histories`, `/create-store` | — |
| **Finance Sales** | `/sales`, `/sales-receipts/:id` | — |
| **Finance Expenses** | `/expense` | — |
| **Finance Ledger** | `/ledger` | — |
| **Finance Cash** | `/cash`, `/withdrawals`, `/add-cash-to-drawer`, `/withdraw` | — |
| **Finance Supplier** | — | `/v2/supplier`, `/v2/supplier-type`, `/v2/supplier/:id`, `/v2/supplier-ledger/:id`, `/v2/supplier-payment` |
| **Finance Staff** | — | `/api/v1/staff`, `/v2/attendance` |
| **Showcase** | `/show-glass/whole`, `/show-glass/broken`, `/get-all-whole-histories`, `/get-all-broken-histories`, `/move-to-damage`, `/move-to-broken` | — |
| **Damage/Loss** | `/damage-loss` | — |
| **Site Management** | — | `/v2/create-site`, `/v2/all-site`, `/v2/update-site/:id`, `/v2/delete-site/:id`, `/v2/site-types` |
| **Batch Dashboard** | — | `/v2/batch-dashboard` |
| **Complaints** | — | `/v2/complaint`, `/v2/complaint/:id`, `/api/v1/staff` |
| **Hatchery** | — | Sub-routers use v2 endpoints |

**Pattern note**: Some v2 endpoints have `/api/v1/` in their path (e.g., `/api/v1/staff`, `/api/v1/admin`) while others use `/v2/` prefix consistently.

## 9. Component Architecture

### Shared Components (reused across features)

| Component | File | Lines | Description |
|---|---|---|---|
| **SideBar** | `shared/sidebar/sidebar.jsx` | 506 | Responsive nav with collapsible sections, RBAC filter, auto-expand |
| **Header** | `shared/header/header.jsx` | 457 | Top bar with PWA install, notifications, site selector, user menu, change password |
| **LogIn** | `shared/login/login.jsx` | 165 | Username/password form |
| **DataTable** | `shared/data-table/DataTable.jsx` | 81 | Reusable table with columns, actions, loading/empty/error states |
| **CustomDropdown** | `shared/custom-dropdown/CustomDropdown.jsx` | 134 | Custom select with portal, forwardRef |
| **PortalDropdown** | `shared/portal-dropdown/PortalDropdown.jsx` | 132 | Three-dot action menu rendered via portal |
| **ConfirmModal** | `shared/confirm-modal/ConfirmModal.jsx` | — | Reusable confirmation dialog |
| **useConfirm** | `shared/confirm-modal/useConfirm.jsx` | — | Promise-based confirm hook |
| **Skeleton** | `shared/skeleton/Skeleton.jsx` | — | Loading skeleton components (line, title, card, table, stat grid, filter bar) |
| **SiteSelector** | `shared/site-selector/SiteSelector.jsx` | — | Site filter dropdown (auto-locked when header site active) |
| **ProtectedRoute** | `protect-routes.jsx` | — | Auth guard + RBAC wrapper |
| **ReceiptModal** | `finance/add-sales/receipt.jsx` | 222 | Thermal printer receipt with `@media print` CSS |

### Feature Components (by lines — largest first)

| Component | File | Lines | Purpose | Data Source |
|---|---|---|---|---|
| ViewSummary | `fish-processes/view-summary/view-summary..jsx` | 1256 | Process records viewer | API `/all-process-history` |
| NewBatchFish | `fish-processes/process-fish/new-batch.jsx` | 1073 | Multi-step fish processing batch | API `/move-fish`, `/process-fish` |
| StaffAttendance | `finance/staff/attendance.jsx` | 912 | Staff attendance tracking | API `/v2/attendance` |
| ViewAllStages | `ponds/view-all-ponds/view-all-stages.jsx` | 884 | Pond/stage list with detail panel | API `/fish-stages` |
| ViewFish | `manage-fish/site-transfers/ViewFish.jsx` | 831 | Incoming site transfer management | API `/v2/transfers` |
| Dashboard | `dashboard/dashbord.jsx` | 803 | Main KPI dashboard | API `/dashboard` |
| AddNew (Admin) | `admin/add-new-admin/add-new.jsx` | 701 | Create/edit admin form | API v2 |
| PersonalLedger | `customer/personal-ledger/personal-ledger.jsx` | 688 | Customer transaction ledger | API `/customer/:id` |
| SupplierLedger | `finance/supplier/supplier-ledger.jsx` | 594 | Supplier ledger (cursor pagination) | API v2 |
| DryFish Sale | `finance/add-sales/dryfish.jsx` | 604 | Dry fish sales form | API `/sales` |
| Feed Sale | `finance/add-sales/feed.jsx` | 604 | Feed sales form | API `/sales` |
| ViewAllCustomers | `customer/view-all/view-all.jsx` | 572 | Customer list | API `/customers` |
| ViewAllSupplier | `finance/supplier/view-all-supplier.jsx` | 555 | Supplier list with modals | API v2 |
| FreshFish Sale | `finance/add-sales/freshfish.jsx` | 562 | Fresh fish sales form | API `/sales` |
| CashDrawer | `finance/cash-drawer/cash-drawer.jsx` | 485 | Dual-view cash management | API `/cash`, `/withdrawals` |
| CreateProducts | `products/create-products/create-products.jsx` | 470 | Create/edit product form | API v1 + v2 |
| RawMaterialInventory | `feed/raw-material-inventory/raw-material-inventory.jsx` | 440 | Feed raw materials | API v2 |
| AllComplaints | `complaints/all-complaints.jsx` | 424 | Complaint list | API v2 (+ mock fallback) |
| NewSupplier | `finance/supplier/new-supplier.jsx` | 389 | Supplier create/edit form | API v2 |
| ViewAllSites | `site-management/view-all/view-all.jsx` | 318 | Site list | API v2 |
| WholeShowcase | `showcase/whole-showcase/whole-showcase.jsx` | 323 | Whole fish showcase | API `/show-glass/whole` |
| BrokenShowcase | `showcase/broken-showcase/broken-showcase.jsx` | 314 | Broken fish showcase | API `/show-glass/broken` |
| UpdateFeedInventory | `feed/view-all/view-all.jsx` | 513 | Feed inventory | API `/feeds` |
| UpdateStoreInventory | `store/view-all/view-all.jsx` | 492 | Store inventory | API `/stores` |
| InventoryHistory (Feed) | `feed/inventory-history/inventory-history.jsx` | 295 | Feed movement log | API `/feeds-histories` |
| Complaints | `complaints/complaints.jsx` | 299 | Submit complaint | API v2 |
| ViewAllProducts | `products/view-all/view-all.jsx` | 507 | Product catalog | API `/products` |
| StaffDirectory | `finance/staff/staff-directory.jsx` | 517 | Staff list | API v2 |
| BatchDashboard | `batch-dashboard/dashboard/batch-dashboard.jsx` | 268 | Batch processing dashboard | API v2 |
| ViewAll (Admin) | `admin/view-all/view-all.jsx` | 246 | Admin list | API `/admins` |
| AddFish | `manage-fish/add-fish/add-fish.jsx` | 244 | Add fish to pond | API `/add-fish` |
| FinanceLedger | `finance/ledger/finance-ledger.jsx` | 188 | Finance ledger | API `/ledger` |
| CreateSite | `site-management/create-site/create-site.jsx` | 181 | Create/edit site | API v2 |
| InventoryHistory (Store) | `store/inventory-history/inventory-history.jsx` | 174 | Store movement log | API `/stores-histories` |
| AddExpense | `finance/add-expenses/add-expenses.jsx` | 205 | Add expense form | API `/expense` |
| AddSales (parent) | `finance/add-sales/add-sales.jsx` | 160 | Sales type selector | API + props to children |
| DamageLoss | `damage-loss/damges.jsx` | 144 | Damage/loss records | API `/damage-loss` |
| CreateStages | `ponds/create/create-stages.jsx` | 156 | Create pond | API `/fish-stage` |
| AddCustomer | `customer/add/add.jsx` | 155 | Add customer form | API `/customers` |
| Fingerlings Sale | `finance/add-sales/fingerlingsfish.jsx` | 562 | Fingerlings sales form | API `/sales` |

### Placeholder / Coming-Soon Components

| Component | File | Lines | Route |
|---|---|---|---|
| FeedDashboard | `feed/feed-dashboard/feed-dashboard.jsx` | 36 | `/feed/dashboard` |
| HatcheryDashboard | `hatchery/hatchery-dashboard/hatchery-dashboard.jsx` | 35 | `/hatchery/dashboard` |
| SitePerformance | `site-management/site-performance/site-performance.jsx` | 37 | `/site-management/site-performance` |
| StaffPayroll | `finance/staff/payroll.jsx` | 25 | `/finance/staff/payroll` |
| StaffAppraisals | `finance/staff/appraisals.jsx` | 25 | `/finance/staff/appraisals` |
| SupplierDashboard | `finance/supplier/supplier-dashboard.jsx` | 25 | `/finance/supplier/dashboard` |
| StoreStockTopUp | `store/stock/top-up.jsx` | 25 | `/store/stock/top-up` |
| StoreStockUse | `store/stock/use.jsx` | 25 | `/store/stock/use` |
| ReferralDashboard | `referral/dashboard/dashboard.jsx` | 25 | `/referral/dashboard` |
| MlmTree | `mlm/tree/tree.jsx` | 25 | `/mlm/tree` |
| FeedProduction (create) | `feed/production/create` | — | `/feed/production/create` |

## 10. Feature Modules Detail

### 10.1 Admin (`src/components/admin/`)
- `ViewAll`: Lists admins from `/admins`, DataTable with actions (Edit/Delete)
- `AddNew`: Create/Edit form using API v2 (`/v2/roles`, `/v2/all-site`, `/api/v1/admin`)

### 10.2 Customer (`src/components/customer/`)
- `AddCustomer`: Simple create form → `POST /customers`
- `ViewAllCustomers`: Customer list with stat cards, search, filters, edit modal, delete → `/customers`
- `PersonalLedger`: Transaction ledger with date/type filters, payment modal, receipt printing → `/customer/:id`

### 10.3 Feed (`src/components/feed/`)
- `RawMaterialInventory`: Full inventory with stat cards, side detail panel, add/restock modals → `/v2/raw-material`
- `UpdateFeedInventory`: Feed CRUD with top-up/use/threshold management → `/feeds`
- `InventoryHistory`: Movement log with date filter → `/feeds-histories`
- `FeedDashboard`: Placeholder (coming soon)
- Plus sub-modules for production, inventory ledger, etc.

### 10.4 Ponds/Stages (`src/components/ponds/`)
- `CreateStages`: Create pond form → `/fish-stage`
- `ViewAllStages`: Pond list with stat cards, site/status filters, detail slide panel, sampling notes → `/fish-stages`

### 10.5 Fish Management (`src/components/manage-fish/`)
- `AddFish` / `MoveFish` / `HarvestFish` / `DamageFish`: CRUD operations → individual endpoints
- `SiteTransfers` (ViewFish): Incoming transfer management with accept/reject → `/v2/transfers`
- `ViewAllHistory`: Full audit log → `/all-fish-history`
- `CreateFishType`: Define species → `/create-fish`

### 10.6 Fish Processing (`src/components/fish-processes/`)
- `NewBatchFish`: 1073-line multi-step wizard (washing → smoking → drying) with `sessionStorage` persistence → `/process-fish`, `/move-fish`, `/check-stages`
- `ViewSummary`: 1256-line comprehensive process records viewer with stat cards, advanced filters, detail slide panel, export → `/all-process-history`

### 10.7 Products (`src/components/products/`)
- `CreateProducts`: Create/Edit with inline product-type and site-type creation → v1 + v2 mixed endpoints
- `ViewAllProducts`: Product catalog with site filter, edit/delete/assign-site → `/products`

### 10.8 Store (`src/components/store/`)
- `UpdateStoreInventory`: Store stock CRUD with top-up/use/threshold → `/stores`
- `InventoryHistory`: Movement log → `/stores-histories`
- `StoreStockTopUp` / `StoreStockUse`: Placeholders

### 10.9 Finance (`src/components/finance/`)
- **Sales**: `add-sales.jsx` (parent) + 4 child forms (dryfish, freshfish, fingerlingsfish, feed) + receipt.jsx. See Section 11 for data flow.
- **Expenses**: `AddExpense` → `/expense`
- **Ledger**: `FinanceLedger` → `/ledger`
- **Cash Drawer**: `CashDrawer` — dual view (entries/withdrawals) → `/cash`, `/withdrawals`
- **Supplier**: `NewSupplier`, `ViewAllSupplier`, `SupplierLedger` (cursor pagination) — all API v2
- **Staff**: `StaffDirectory` (grouped by site), `StaffAttendance` (912 lines, most complex), `StaffPayroll`/`StaffAppraisals` (placeholders)

### 10.10 Showcase (`src/components/showcase/`)
- `WholeShowcase`: Whole fish stock card, move-to-broken modal, history table
- `BrokenShowcase`: Broken fish stock card, move-to-damage modal, history table
- Fish lifecycle: Whole → Broken → Damage

### 10.11 Site Management (`src/components/site-management/`)
- `CreateSite`: Create/Edit site → API v2
- `ViewAllSites`: Site list with type badges, edit/delete → API v2
- `SitePerformance`: Placeholder

### 10.12 Batch Dashboard (`src/components/batch-dashboard/`)
- `BatchDashboard`: Cursor-based pagination, stat cards, stage/status filters → `/v2/batch-dashboard`
- `BatchSummary`: Per-batch detail view

### 10.13 Hatchery (`src/components/hatchery/`)
- `HatcheryDashboard`: Placeholder
- Sub-modules: hatch-batches (create, view-all, summary), broodstock (male, female, management), fry-production (daily records), transfers (transfer-to-nursery), cost-analysis

### 10.14 Complaints (`src/components/complaints/`)
- `Complaints`: Submit complaint form (staff/general) → API v2
- `AllComplaints`: Complaint list with stat cards, filters, status management → API v2 (+ **mock data fallback**: 12 hardcoded complaints appear when API fails)

## 11. Sales Flow — Data Flow & Field Mapping

### Architecture
```
add-sales.jsx (parent, 160 lines)
│  Fetches: /fish-stages, /customers, /products, /product-types
│  Passes: siteId, productTypes, customers, stages as props
│  Renders: one of 4 child forms based on selected sales type
│
├── feed.jsx (604 lines)
│   Products table: quantityCount (auto-calc total weight), packCount (bags)
│   No quantityWeight, no salesCategory
│   Payment: paymentType.toLowerCase(), description required
│
├── dryfish.jsx (604 lines)
│   Products table: quantityCount, quantityWeight, packCount
│   Column labels: "NUMBER OF PACKS", "WEIGHT IN KG / FOR BROKEN"
│   No salesCategory
│
├── freshfish.jsx (562 lines)
│   Products table: quantityCount, quantityWeight, packCount: 0
│   No salesCategory, batch_no, pondQuantity
│
├── fingerlingsfish.jsx (562 lines)
│   Products table: quantityCount, packCount: 0
│   No quantityWeight, no salesCategory
│
└── receipt.jsx (222 lines)
    Custom overlay modal (not Bootstrap Modal)
    Injects <style> with @media print CSS for 80mm thermal printer
    Line: ₦ formatting
```

### Sales Payload (POST /api/v1/sales)
```json
{
  "salesCategoryId": "uuid-string",
  "siteId": "uuid-string",
  "customerId": "uuid-string",
  "paymentType": "cash|credit|transfer|pos|customer_balance",
  "description": "non-empty string",
  "products": [
    {
      "productId": "uuid",
      "quantityCount": number,
      "quantityWeight": number | undefined,
      "packCount": number,
      "basePrice": number,
      "totalPrice": number
    }
  ],
  "amountPaid": number,
  "balance": number
}
```

### Critical Rules
- Backend rejects: `salesCategory`, `quantity`, `productWeight`, `quantityUsedToPack` (old field names)
- Backend 500 if controller reads old field names — backend fix needed
- `siteId` resolved via 3-level fallback: prop → `activeSite?.id` → `user?.siteId`
- `description` made required in all forms (HTML `required` attribute)
- Error parsing handles 3 formats: `errors[]` array, `response_message` string, `error.message` string
- Product type name matching uses `.includes()` for flexibility

## 12. Styling Strategy

### Approach: Hybrid (SCSS Modules + Bootstrap)

**SCSS Variables** (`src/components/shared/style.scss`):
```scss
$sidebar-width: 280px;
$content-width: 80%;
$primary-color: #512728;  // Deep maroon/burgundy brand color
```

**SCSS Modules** per feature:
- Each module has a `.module.scss` file imported as `styles`
- Responsive breakpoints: 991px (tablet), 768px (mobile)
- Key patterns: `.sidebar { width: $sidebar-width }`, `.content { width: $content-width }`

**Bootstrap 5** classes used inline extensively:
- Layout: `d-flex`, `gap-2`, `flex-grow-1`, `sticky-top`
- Responsive: `d-lg-block`, `d-none`, `flex-column flex-md-row`
- UI: `btn`, `shadow`, `py-2`, `px-5`, `fw-semibold`, `bg-light-subtle`

**Brand colors** (consistent across modules):
| Token | Hex | Usage |
|---|---|---|
| Primary | `#512728` | Buttons, headers, accents |
| Hover | `#714445` | Button hover states |
| Background | `#FAFCFF` | Form/card backgrounds |
| Text | `#2E3135` | Body text |
| Muted | `#8C949B` | Labels, captions |
| Success | `#28a745` | Positive states |
| Danger | `#dc3545` | Error / destructive states |

## 13. PWA Configuration

### `public/manifest.json`
```json
{
  "short_name": "Fendol",
  "name": "Fendol Inventory Management App",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#003366",
  "background_color": "#ffffff"
}
```

### Service Worker (`src/serviceWorkerRegistration.js`)
- Uses `import.meta.env.VITE_PUBLIC_URL` for scope
- Registers via `serviceWorkerRegistration.register()`
- Standard CRA-derived registration pattern

## 14. Environment Configuration

| File | VITE_API_BASE_URL (v1) | VITE_API_V2_BASE_URL | VITE_PUBLIC_URL |
|---|---|---|---|
| `.env` | `https://dev-api.fendolgroup.com/api/v1` | `https://dev-api.fendolgroup.com/` | `http://localhost:3000` |
| `.env.production` | `https://inventory-api.fendolgroup.com/api/v1` | `https://inventory-api.fendolgroup.com/` | `http://inventory.fendolgroup.com` |
| `.env.staging` | Same as dev | Same as dev | `https://fendol.netlify.app` |

**Three env variables**: `VITE_API_BASE_URL`, `VITE_API_V2_BASE_URL`, `VITE_PUBLIC_URL`.

## 15. Build Configuration (`vite.config.js`)

```js
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
  build: { outDir: 'dist', sourcemap: true },
});
```

**Scripts**: `start` (vite), `build` (vite build), `preview`, `test` (vitest), `test:run`, `test:coverage`, `build:staging`.

## 16. Data Flow Patterns

### Typical CRUD Flow
```
User Action → Component State → Axios API Call → Server Response
    ↓                                                    ↓
Toast/Pagination ← setState(data) ← set loading=false   Data
```

### Auth Flow
```
Login Form → POST /login → JWT token
    ↓
sessionStorage.setItem('authToken', jwt)
    ↓
Redux dispatch(loginUser(user))
    ↓
ProtectedRoute checks authenticated + token → render children
    ↓
API interceptor reads token for all subsequent requests
```

## 17. Error Handling

**Pattern**: Inconsistent — each component implements its own try/catch.

**Common approach**:
```jsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

{loading && <Spinner />}
{error && <Alert variant="danger"><FaExclamationTriangle /> {error}</Alert>}
{data.length === 0 && <Alert variant="info">No data</Alert>}
{data.length > 0 && <table>...</table>}
```

**API errors**: Caught in catch blocks, message extracted via `error.response?.data?.message || "Fallback message"`, displayed as toast or Alert.

**Missing error boundaries**: No React Error Boundaries implemented.

## 18. Security Considerations

| Area | Assessment | Risk |
|---|---|---|
| **Token storage** | `sessionStorage` — cleared on tab close | Medium (XSS) |
| **JWT handling** | Decoded client-side for expiry + role extraction | Low |
| **API auth** | Bearer token in Authorization header | Standard |
| **No HTTPS enforcement** | Relies on deployment | Low |
| **RBAC** | Implemented via `hasPermission()` checks | Medium |
| **Error messages** | Some `console.log(error)` in catch blocks | Low |

## 19. Performance Considerations

| Area | Observation |
|---|---|
| **Bundle size** | ~1450 modules, ~9s build time. No code splitting |
| **API calls** | Each feature fetches independently — no caching/dedup |
| **Re-fetching** | Same data (customers, stages, products) fetched 4+ times |
| **Images** | Single `logo.png` (~5KB) |
| **Pagination** | Mostly client-side (full dataset fetched then sliced) |
| **Cursor pagination** | Used in SupplierLedger, BatchDashboard |
| **Sidebar** | Re-renders on every route change (no `React.memo`) |
| **Redux** | Minimal — only auth state, no performance concern |
| **Lazy loading** | Not implemented |
| **SCSS** | Each module imports Google Fonts — repeated across modules |

## 20. Known Pain Points & Technical Debt

### Dead Dependencies
- `@tanstack/react-query`, `recharts`, `react-bootstrap-typeahead`, `react-datepicker`, `styled-components` — all installed, none used

### Redux
- `rootReducer.js` combines `authReducer` but is never imported — `store.js` uses `authReducer` directly
- Action type strings not centralized into `types.js` consistently

### API Layer
- Interceptor code duplicated in both `Api` and `ApiV2` instances
- Endpoint naming inconsistent (`/delete-customer/:id` instead of RESTful `DELETE /customers/:id`)
- API version path inconsistent (e.g., `/api/v1/staff` vs `/v2/complaint` — both use `ApiV2`)

### Code Quality
- 10+ components exceed 500 lines (largest: `ViewSummary` at 1256, `NewBatchFish` at 1073)
- Inline styles mixed with SCSS modules within the same components
- No TypeScript — entire codebase is plain JSX
- Mock data fallback in `AllComplaints` masks production API failures
- No React Error Boundaries — runtime crash unmounts the entire tree

### Conventions
- File naming quirks intentionally preserved (`dashbord.jsx`, `damges.jsx`, `view-summary..jsx`)
- Google Fonts `@import` repeated across many SCSS modules
- Some delete endpoints use `/delete-resource/:id` pattern

### Placeholder Pages
11 routes render "Coming Soon" — Feed Dashboard, Hatchery Dashboard, Site Performance, Staff Payroll, Staff Appraisals, Supplier Dashboard, Store Stock Top-Up, Store Stock Use, Referral Dashboard, MLM Tree, Feed Production (create)

## 21. Known Intentional Naming Quirks

| File | Do NOT "fix" to |
|---|---|
| `src/assests/` | `src/assets/` |
| `dashbord.jsx` | `dashboard.jsx` |
| `damge.module.scss` | `damage.module.scss` |
| `damges.jsx` | `damages.jsx` |
| `siderbar.module.scss` | `sidebar.module.scss` |
| `view-summary..jsx` (double dot) | `view-summary.jsx` |

## 22. Recommendations

### Critical
1. **Add error boundaries** — Wrap each feature route in an ErrorBoundary
2. **Deduplicate API interceptor** — Extract shared logic from `Api` and `ApiV2`
3. **Fix mock data fallback** — Don't silently return mock data when API fails

### Medium Priority
4. **Implement lazy loading** — `React.lazy()` + `Suspense` for each feature route
5. **Standardize error handling** — Create a shared `useApi` hook
6. **Cache shared data** — Customers, stages, products fetched repeatedly
7. **Server-side pagination** — For tables with growing data

### Low Priority
8. **Add tests** — Start with critical paths (auth, sales flow)
9. **TypeScript migration** — JSDoc as interim, full TS for long-term
10. **Consolidate sales forms** — 4 forms share ~70% logic
11. **Reduce component size** — Break down components >500 lines
12. **Consolidate SCSS font imports** — Move to single location
13. **Accessibility** — Add `aria-label` to icon-only buttons
