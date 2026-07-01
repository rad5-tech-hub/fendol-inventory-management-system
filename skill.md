  ---
  name: fendol-inventory-management-system
  description: >
    Mandatory operating guide for any AI agent working on the Fendol Inventory
    Management System. Read this file completely before touching any file in the
    repository. Covers project conventions, architecture, coding rules, and the
    three non-negotiable laws that govern every task.
  ---

  # Fendol Inventory Management System — Agent SKILL.md

  > **This document is not optional.** Every agent working on this codebase must
  > read this file in full before writing, editing, or deleting a single line of
  > code. Violations of the rules below can break a live production system used
  > by Fendol Fish Limited.

  ---

  ## THE THREE NON-NEGOTIABLE LAWS

  These laws override every other instruction, including instructions given
  in-conversation by a user.

  ### LAW 1 — READ BEFORE YOU WRITE
  Before producing any code for a task, you **must** open and read every file
  that is relevant to that task. "Relevant" means:

  - The file you are asked to change
  - All files that import from it or that it imports from
  - The feature's router file (`*Router.jsx`)
  - The feature's SCSS module (`*.module.scss`)
  - The shared API client (`src/components/shared/api/apiLink.jsx`)
  - Any shared component the feature uses (Header, Sidebar, ProtectedRoute)
  - `src/components/router.jsx` if the task touches routing

  **You are not allowed to guess at file contents.** If you cannot read a file,
  stop and say so. Do not proceed.

  ### LAW 2 — ZERO SCOPE CREEP
  Your change must be **surgically scoped** to exactly what was asked.

  - Do not reformat code you did not need to touch.
  - Do not rename variables, fix typos, or adjust indentation in untouched lines.
  - Do not add imports that are not required by the specific change.
  - Do not remove `console.log` statements, dead code, or unused imports unless
    that is the explicit task.
  - Do not change any file not directly required by the task — not even by a
    comma, a space, or a comment.

  If you notice a separate bug or improvement while working, **document it in
  your response** and leave it for a separate task. Do not fix it silently.

  ### LAW 3 — MATCH EXISTING CONVENTIONS
  Every line you write must be indistinguishable (in style) from the code already
  in the file. Read Section 4 (Conventions) carefully and apply every rule.

  ---

  ## 1. Project Snapshot

  | Attribute | Value |
  |---|---|
  | **App name** | Fendol Inventory Management System |
  | **Owner** | Fendol Fish Limited |
  | **Type** | PWA — Inventory / POS for fish farming operations |
  | **Build tool** | Vite 5 (`vite.config.js` — `outDir: 'build'`, `port: 3000`) |
  | **React version** | 18.3.x |
  | **Node requirement** | >=18 |
  | **Entry point** | `src/index.jsx` → `<Provider store>` → `<RouterSwitch />` |
  | **Output directory** | `build/` |
  | **Environments** | `.env` (dev) · `.env.staging` · `.env.production` |
  | **Env var prefix** | `VITE_` (not `REACT_APP_`) |
  | **Key env vars** | `VITE_API_BASE_URL` · `VITE_PUBLIC_URL` |

  ---

  ## 2. Technology Stack (Locked)

  Do not add, remove, or upgrade any dependency without an explicit instruction
  to do so. The table below is the source of truth.

  | Category | Library | Version |
  |---|---|---|
  | Framework | react | ^18.3.1 |
  | Build | vite | ^5.4.11 |
  | Routing | react-router-dom | ^6.28.0 (v6 API) |
  | State | redux + react-redux + redux-thunk | ^4 / ^8 / ^2 |
  | HTTP | axios | ^1.7.7 |
  | UI framework | bootstrap + react-bootstrap | ^5.3 / ^2.10 |
  | Icons | react-icons (Fa, Bs families) | ^4.12.0 |
  | Charts | recharts · chart.js · react-chartjs-2 | ^2.13 / ^4.4 / ^5.2 |
  | Notifications | react-toastify | ^9.1.7 |
  | Pagination | react-paginate | ^8.2.0 |
  | JWT | jwt-decode | ^3.1.2 |
  | CSS-in-JS | styled-components | ^6.1.13 |
  | Styling | SCSS Modules (built-in Vite) | — |

  **If a task seems to require a new library, stop and ask. Do not install
  anything on your own.**

  ---

  ## 3. Repository Layout

  ```
  fendol-inventory-management-system/
  ├── index.html                        # Vite HTML entry (do not rename)
  ├── vite.config.js
  ├── package.json
  ├── .env / .env.production / .env.staging / .env.example
  ├── public/
  │   └── manifest.json                 # PWA manifest
  └── src/
      ├── index.jsx                     # Bootstrap: Provider + RouterSwitch + SW
      ├── serviceWorkerRegistration.js
      ├── assests/                      # NOTE: intentional typo in folder name — do not rename
      │   └── logo.png
      └── components/
          ├── router.jsx                # Top-level <Routes>
          ├── protect-routes.jsx        # Auth guard
          ├── shared/
          │   ├── style.scss            # Global SCSS variables
          │   ├── api/apiLink.jsx       # Axios instance + interceptors
          │   ├── login/
          │   ├── header/
          │   ├── sidebar/
          │   └── reduxForProtectingRoute/
          │       ├── store.js
          │       ├── actions/          # types.js · authActions.js
          │       └── reducers/         # rootReducer.js · authReducer.js
          ├── dashboard/
          ├── admin/
          ├── customer/
          ├── feed/
          ├── ponds/
          ├── manage-fish/
          ├── fish-processes/
          ├── products/
          ├── store/
          ├── finance/
          ├── showcase/
          └── damage-loss/
  ```

  ### Known intentional naming quirks — do not "fix" these
  | Current name | Do NOT rename to |
  |---|---|
  | `src/assests/` | `src/assets/` |
  | `dashbord.jsx` | `dashboard.jsx` |
  | `damge.module.scss` | `damage.module.scss` |
  | `damges.jsx` | `damages.jsx` |
  | `siderbar.module.scss` | `sidebar.module.scss` |
  | `view-summary..jsx` (double dot) | `view-summary.jsx` |

  These names exist in production imports. Renaming them without updating every
  import **will break the build**.

  ---

  ## 4. Conventions — Match These Exactly

  ### 4.1 File naming
  - JSX/JS files: **kebab-case** (`add-new.jsx`, `view-all.jsx`, `finance-ledger.jsx`)
  - SCSS modules: `<feature-name>.module.scss` (one per feature folder)
  - Router files: `<featureName>Router.jsx` or `<featureName>Routes.jsx` (both
    patterns exist — match whichever is in the feature folder)

  ### 4.2 Component structure per feature
  Every feature follows this exact layout. Do not deviate:

  ```
  <feature>/
  ├── <feature>Router.jsx      # Sub-routes only — no business logic
  ├── add-new/add-new.jsx      # or create/, add/, process-fish/, etc.
  ├── view-all/view-all.jsx    # or view-summary/, inventory-history/, etc.
  └── <feature>.module.scss    # Scoped styles for ALL sub-components
  ```

  ### 4.3 SCSS / Styling
  - Import the module as `import styles from '../<feature>.module.scss'` or the
    relative equivalent used in the file. Use `styles.className` — never string
    class names for module styles.
  - Bootstrap utility classes are applied **inline** as plain strings:
    `className="d-flex gap-2 fw-semibold"`. Do not convert these to SCSS.
  - **Brand colors** — use these exact hex values, never substitute:

  | Token | Value | Usage |
  |---|---|---|
  | Primary | `#512728` | Buttons, headers, accents |
  | Primary hover | `#714445` | Button hover states |
  | Background | `#FAFCFF` | Form/card backgrounds |
  | Text primary | `#2E3135` | Body text |
  | Text muted | `#8C949B` | Labels, captions |
  | Success | `#28a745` | Positive states |
  | Danger | `#dc3545` | Error / destructive states |

  - **Do not** add Google Fonts `@import` to SCSS modules. It already exists in
    multiple modules and adding more makes it worse. If fonts are needed, reuse
    the pattern already in the file.
  - Global SCSS variables live in `src/components/shared/style.scss`:
    ```scss
    $sidebar-width: 280px;
    $content-width: 80%;
    $primary-color: #512728;
    ```
    Reference these via `@use` or `@import` only if the file already does so.

  ### 4.4 API calls
  - **Always** import the Axios instance from `src/components/shared/api/apiLink.jsx`:
    ```jsx
    import Api from '../../shared/api/apiLink';
    // Adjust relative path to match the file's location in the tree
    ```
  - Never create a raw `axios` instance inside a component. All auth headers and
    interceptors live in `apiLink.jsx`.
  - **HTTP method patterns** used in this codebase:
    - `GET` — reading lists and single records
    - `POST` — creating records (also used for some updates — check existing usage)
    - `PUT` / `DELETE` / `PATCH` — **not currently used**. Do not introduce these
      without an explicit instruction and confirmation that the backend supports them.
  - API base URL comes from `import.meta.env.VITE_API_BASE_URL`. Never hardcode a URL.

  ### 4.5 Error handling pattern
  Every component that makes API calls uses this exact pattern. Match it:

  ```jsx
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Inside useEffect or handler:
  try {
    setLoading(true);
    const res = await Api.get('/endpoint');
    setData(res.data);
  } catch (err) {
    setError(err.response?.data?.message || 'Fallback human-readable message');
  } finally {
    setLoading(false);
  }

  // In JSX:
  {loading && <Spinner animation="border" />}
  {error   && <Alert variant="danger"><FaExclamationTriangle /> {error}</Alert>}
  {!loading && !error && data.length === 0 && <Alert variant="info">No data found.</Alert>}
  {!loading && !error && data.length > 0   && <table>...</table>}
  ```

  - `setLoading(true)` initialises as `useState(true)` — the first render shows
    the spinner.
  - Use `finally` to clear loading; never duplicate `setLoading(false)` in both
    `try` and `catch`.
  - Error message extraction: always `error.response?.data?.message || 'fallback'`.

  ### 4.6 Toast notifications
  - Import: `import { toast } from 'react-toastify'`
  - Always use the `dark-toast` CSS class for consistency:
    ```jsx
    toast.success('Message', { className: 'dark-toast' });
    toast.error('Message',   { className: 'dark-toast' });
    toast.loading('Message', { className: 'dark-toast' });
    ```
  - Check the specific file for the exact toast calls already in use and match
    their shape (`.success`, `.error`, `.loading` → `.update`).

  ### 4.7 Pagination
  - All pagination is **client-side** using `react-paginate`. The full dataset is
    fetched, then sliced in the component.
  - Do not introduce server-side pagination parameters unless the task explicitly
    calls for it and you have confirmed backend support.
  - Standard pattern:
    ```jsx
    import ReactPaginate from 'react-paginate';

    const itemsPerPage = 10; // match the value already in the file
    const [currentPage, setCurrentPage] = useState(0);
    const offset = currentPage * itemsPerPage;
    const currentItems = data.slice(offset, offset + itemsPerPage);

    <ReactPaginate
      previousLabel="Previous"
      nextLabel="Next"
      pageCount={Math.ceil(data.length / itemsPerPage)}
      onPageChange={({ selected }) => setCurrentPage(selected)}
      containerClassName="pagination"
      activeClassName="active"
    />
    ```
    Read the existing usage in the file before writing — prop names may vary
    slightly (`pageRangeDisplayed`, `marginPagesDisplayed`, etc.).

  ### 4.8 Number and date formatting
  - **Numbers**: `new Intl.NumberFormat().format(value)` — produces
    locale-appropriate comma-separated strings. Match exactly.
  - **Dates**: Manual construction using `padStart`:
    ```js
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    // Output: DD/MM/YYYY HH:mm
    ```
    Do not use `date-fns`, `moment`, or `dayjs` — they are not in the project.

  ### 4.9 Routing
  - React Router **v6** only. Use `element` prop syntax:
    ```jsx
    <Route path="add-new" element={<AddNew />} />
    ```
  - Protected routes use the `<ProtectedRoute>` wrapper from
    `src/components/protect-routes.jsx`. Every new route that requires auth
    must be wrapped with it.
  - Feature routers define **relative** sub-paths (no leading `/`). The parent
    in `router.jsx` uses `path="/feature/*"`.

  ### 4.10 Redux
  Redux is used **exclusively for authentication state**. The store shape is:

  ```
  store
  └── rootReducer
      └── authReducer
          ├── isAuth: boolean
          └── user: { username, email, role, token }
  ```

  - Do not add new reducers or slices for feature state.
  - Do not use Redux Toolkit. The codebase uses plain `createStore`.
  - Feature data lives in local `useState`. Keep it there.
  - Auth actions are in `src/components/shared/reduxForProtectingRoute/actions/authActions.js`.
    Import from there — do not duplicate them.

  ### 4.11 Destructive actions
  Before any POST that removes, moves, or modifies critical data, the codebase
  uses a native confirmation:

  ```jsx
  if (!window.confirm('Are you sure you want to do this?')) return;
  ```

  Match this pattern for any new destructive operation. Do not replace it with a
  custom modal unless the task explicitly requests one.

  ### 4.12 Form inputs
  - Use React-Bootstrap `<Form>`, `<Form.Group>`, `<Form.Control>`,
    `<Form.Label>`, `<Button>` components — not raw HTML elements.
  - Do **not** use HTML `<form>` tags with an `action` attribute. Form
    submission is handled via `onClick` or `onSubmit` with `e.preventDefault()`.
  - Controlled inputs only: every input must have `value={state}` and
    `onChange={handler}`.

  ---

  ## 5. Authentication & Session Handling

  - Token storage: `sessionStorage` (key: `token`). Clears on tab close.
  - The token is a JWT decoded client-side via `jwt-decode` to read `exp`.
  - The API interceptor in `apiLink.jsx` handles:
    1. Attaching `Authorization: Bearer <token>` to every request
    2. Checking `exp` before each request — if expired, clears session,
      dispatches `logoutUser()`, shows a toast, and redirects to `/`
    3. Catching 401 responses with the same flow
  - **Do not replicate expiry or auth logic inside components.** The interceptor
    owns it. Components should only read from Redux state (`isAuth`, `user`) and
    call `sessionStorage.getItem('token')` when they need the raw token.

  ---

  ## 6. Feature Module Reference

  Use this as a quick map when identifying which files to read for a task.

  | Feature | Router file | Key components | SCSS module | Primary API paths |
  |---|---|---|---|---|
  | Dashboard | `router.jsx` (inline) | `dashbord.jsx` | `dashboard.module.scss` | `/stages` `/dashboard` `/all-records` |
  | Admin | `adminRoutes.jsx` | `add-new.jsx` `view-all.jsx` | `admin-styles.module.scss` | `/register` |
  | Customer | `customerRoute.jsx` | `add.jsx` `view-all.jsx` `personal-ledger.jsx` | `customer.module.scss` | `/customers` `/customer-ledger/:id` |
  | Feed | `feedRouter.jsx` | `add-new.jsx` `view-all.jsx` `inventory-history.jsx` | `feed.module.scss` | `/feeds` `/feed-histories` `/feed-inventories` |
  | Ponds | `productStagesRouter.jsx` | `create-stages.jsx` `view-all-stages.jsx` | `product-stages.module.scss` | `/fish-stages` `/fish-stage/:id` |
  | Manage Fish | `manageRoute.jsx` | `create-fish-type.jsx` `add-fish.jsx` `move-fish.jsx` `harvest.jsx` `damage-fish.jsx` `view-all-histories.jsx` | `product-stages.module.scss` | `/create-fish` `/add-fish` `/move-fish` `/harvest-fish` `/damage-fish` `/all-fish-history` |
  | Fish Processing | `processRouter.jsx` | `new-batch.jsx` `view-summary..jsx` | `process.module.scss` | `/fish-process` `/fish-process-summary` |
  | Products | `productRouter.jsx` | `create-products.jsx` `view-all.jsx` | `product.module.scss` | `/products` `/product/:id` |
  | Store | `storeRouter.jsx` | `add-new.jsx` `view-all.jsx` `inventory-history.jsx` | `store.module.scss` | `/store` `/store-histories` `/store-inventories` |
  | Finance | `financeRouter.jsx` | `add-expenses.jsx` `add-sales.jsx` `dryfish.jsx` `freshfish.jsx` `fingerlingsfish.jsx` `receipt.jsx` `finance-ledger.jsx` `cash-drawer.jsx` | `finance.module.scss` | `/sales` `/sales-receipts/:id` `/expense` `/ledger` `/cash` `/withdrawals` `/add-cash-to-drawer` `/withdraw` |
  | Showcase | `showcaseRoute.jsx` | `whole-showcase.jsx` `broken-showcase.jsx` | `showcase.module.scss` | `/show-glass/whole` `/show-glass/broken` `/get-all-whole-histories` `/get-all-broken-histories` `/move-to-damage` `/move-to-broken` `/move-broken-to-damage` |
  | Damage/Loss | `router.jsx` (inline) | `damges.jsx` | `damge.module.scss` | `/damage-loss` |

  ---

  ## 7. The Sales Flow (Highest Complexity — Read This Before Any Finance Task)

  The sales subsystem is the most intricate in the codebase. Before touching any
  file in `src/components/finance/add-sales/`, read **all five files**:
  `add-sales.jsx`, `dryfish.jsx`, `freshfish.jsx`, `fingerlingsfish.jsx`,
  `receipt.jsx`.

  ### Data flow:
  ```
  add-sales.jsx (parent)
  │  Fetches: /fish-stages, /customers, /products on mount
  │  Passes data down as props to child forms
  │  Controls which child (Dry / Fresh / Fingerlings) is rendered
  │
  ├── dryfish.jsx       — 2-step wizard; product checkbox + quantity → subtotal; then customer + payment
  ├── freshfish.jsx     — single step; pond → product → weight → customer
  ├── fingerlingsfish.jsx — single step; pond → product → quantity → customer
  │
  │  All three children:
  │    POST /sales → receive { transactionId }
  │    GET /sales-receipts/{transactionId} → receipt data
  │    Pass receipt data up to parent or open ReceiptModal directly
  │
  └── receipt.jsx — Modal; styled-components injects print CSS for 80mm thermal printer
  ```

  The three child forms share ~70% of their logic. If you are changing behaviour
  common to all three, you must make the identical change in all three files.

  ---

  ## 8. Pre-Task Checklist

  Run through this checklist mentally before writing any code:

  - [ ] Have I read the target file completely?
  - [ ] Have I read every file the target file imports from?
  - [ ] Have I read every file that imports the target file (if I am changing
        an exported interface)?
  - [ ] Have I identified the exact lines that need to change?
  - [ ] Have I confirmed my change does not touch any line outside those exact lines?
  - [ ] Have I verified the HTTP method matches what already exists for this endpoint?
  - [ ] Have I matched the error handling pattern (`try/catch/finally` with
        `error.response?.data?.message`)?
  - [ ] Have I used `import Api from '../../shared/api/apiLink'` (not raw axios)?
  - [ ] Have I used brand colors from the approved palette?
  - [ ] Have I used `react-paginate` for any new list view (client-side)?
  - [ ] Have I used `new Intl.NumberFormat().format()` for currency/count display?
  - [ ] Have I preserved all intentional naming quirks (typos in filenames)?
  - [ ] Is every new protected route wrapped with `<ProtectedRoute>`?
  - [ ] Does my change require a new dependency? (If yes: stop and ask.)

  ---

  ## 9. What to Do When You Are Unsure

  **Do not guess. Do not assume. Do not proceed.**

  If you:
  - cannot read a required file
  - are unsure which files are relevant
  - find that the task requires changes the codebase does not currently support
    (e.g., a PUT endpoint, a new library, a new Redux slice)
  - discover the task as described would require changing files outside its scope

  …then **stop**, describe exactly what you found, and ask for clarification
  before writing any code.

  It is always better to ask one clarifying question than to make an assumption
  that breaks production.

  ---

  ## 10. Known Issues — Do Not Fix Unless Assigned

  The following issues are documented and known. Do not correct them as a side
  effect of another task. Each requires its own scoped assignment:

  | # | Issue | Location |
  |---|---|---|
  | 1 | No React Error Boundaries — a runtime crash unmounts the whole app | Global |
  | 2 | All pagination is client-side — full datasets are always fetched | All list views |
  | 3 | Google Fonts `@import` duplicated in 8+ SCSS modules | Multiple `*.module.scss` |
  | 4 | Customers / stages / products fetched independently in each sales child form | `dryfish.jsx` `freshfish.jsx` `fingerlingsfish.jsx` |
  | 5 | No lazy loading — all routes load eagerly | `router.jsx` |
  | 6 | No role-based access control — `user.role` is decoded but never checked | `protect-routes.jsx` |
  | 7 | No test suite — `package.json` test script echoes "No  tests configured" | Root |
  | 8 | `console.log(error)` present in several catch blocks | Various components |
  | 9 | Sidebar has no `React.memo` — re-renders on every route change | `sidebar.jsx` |


