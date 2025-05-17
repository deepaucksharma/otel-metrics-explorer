# 60 · project-Structure.md
_Overview of the codebase organization and file structure_

---

## Directory Layout

```
otlp-metrics-explorer/
├── .github/                    # GitHub workflows and templates
├── docs/                       # Architecture and technical specs (this documentation)
│   ├── adr/                    # Architectural Decision Records
│   └── assets/                 # Documentation images and diagrams
├── example-payloads/           # Sample OTLP JSON files for testing and demos
├── public/                     # Static assets for the web application
├── src/                        # Source code
│   ├── contracts/              # Type definitions shared across all layers
│   ├── data/                   # Data provider implementations
│   │   ├── StaticFileProvider.ts
│   │   └── LiveWsProvider.ts
│   ├── logic/                  # Pure business logic and algorithms
│   │   ├── parser/             # OTLP parsing logic
│   │   ├── diff/               # Diff computation engines
│   │   ├── cardinality/        # Series count and label analysis
│   │   └── config/             # YAML generation
│   ├── state/                  # Global state management (Zustand)
│   │   ├── metricsSlice.ts
│   │   ├── diffSlice.ts
│   │   ├── cardinalitySlice.ts
│   │   └── uiSlice.ts
│   ├── ui/                     # React components
│   │   ├── app/                # App-level components
│   │   ├── metrics/            # Metric view components
│   │   ├── cardinality/        # Cardinality analyzer components
│   │   ├── common/             # Shared UI elements
│   │   └── config/             # Configuration export components
│   ├── utils/                  # Shared utilities and helpers
│   ├── workers/                # Web Worker implementations
│   │   ├── parser.worker.ts
│   │   └── cardinality.worker.ts
│   ├── event-bus.ts            # Event bus singleton implementation
│   ├── bootstrap.ts            # Application initialization
│   ├── main.tsx                # Entry point
│   └── vite-env.d.ts           # TypeScript declarations for Vite
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── e2e/                    # End-to-end tests (Cypress)
│   └── fixtures/               # Test fixtures and mock data
├── eslint.config.cjs           # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── cypress.json                # Cypress configuration
├── index.html                  # HTML entry point
├── package.json                # Package configuration and dependencies
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite build configuration
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| UI Components | `ui-[ComponentName].tsx` | `ui-GaugeStatCard.tsx` |
| Logic Modules | `logic-[purpose].ts` | `logic-DiffEngine.ts` |
| Data Providers | `data-[ProviderName].ts` | `data-StaticFileProvider.ts` |
| Workers | `[purpose].worker.ts` | `parser.worker.ts` |
| Tests | `[file-being-tested].spec.ts[x]` | `DiffEngine.spec.ts` |

## Import Guidelines

Follow the strict dependency flow defined in `02-Dependency-Graph.md`:

- UI components may only import from state slices or other UI components
- Logic modules must not import from UI
- Data providers must not import from UI or logic
- Shared utilities (`utils/`) can be imported by any layer

All imports should be explicitly documented in the corresponding `.md` spec file.
