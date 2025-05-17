# 72 · implementation-Plan.md
_Detailed execution plan with parallel tracks_

---

## 1. Overall Timeline

| Phase | Dates | Primary Goal | Key Deliverables |
|-------|-------|--------------|------------------|
| **Foundation** | Week 1-2 | Core architecture | Contracts, EventBus, Store skeleton, AppLayout |
| **Alpha** | Week 3-6 | Static file analysis | File upload, Parser, Metrics View |
| **Beta** | Week 7-10 | Cardinality analysis | Cardinality engine, What-If simulator |
| **RC** | Week 11-12 | Live mode | WebSocket provider, Config export |
| **1.0 GA** | Week 13 | Production release | Documentation, final integration |

## 2. Parallel Track Strategy

We will execute five parallel development tracks to maximize velocity:

### Track A: Data Foundation
**Owner**: @jack
**Team**: 2 engineers
**Focus**: Data providers, parsers, contracts

| Week | Goal | Details |
|------|------|---------|
| 1-2 | Core contracts | Define TS interfaces for all data structures |
| 3-4 | Static file provider | File upload, parsing worker architecture |
| 5-6 | Parser logic | Complete OTLP parser with test fixtures |
| 7-8 | Parser optimization | Memory usage reduction |
| 9-10 | Live WebSocket | Provider implementation, reconnect logic |
| 11-12 | Integration | E2E data flow testing, edge cases |

### Track B: Logic Engines
**Owner**: @arun
**Team**: 2 engineers
**Focus**: DiffEngine, CardinalityEngine, ConfigGenerator

| Week | Goal | Details |
|------|------|---------|
| 1-2 | Engine interfaces | Define input/output contracts for all engines |
| 3-4 | DiffEngine | Implement diff algorithm, delta/rate calculation |
| 5-6 | Golden test suite | Create test fixtures for all algorithms |
| 7-8 | CardinalityEngine | Label analysis, series counting |
| 9-10 | What-If simulation | Drop plan simulation algorithm |
| 11-12 | ConfigGenerator | YAML template generation |

### Track C: UI Infrastructure
**Owner**: @li
**Team**: 2 engineers
**Focus**: Core UI components, layout, navigation

| Week | Goal | Details |
|------|------|---------|
| 1-2 | UI skeleton | AppLayout, SidebarNavigator shell |
| 3-4 | Navigation flow | Routing, sidebar functionality |
| 5-6 | DetailPanel | Slide-over panel implementation |
| 7-8 | Responsive design | Mobile adaptation, CSS refinement |
| 9-10 | Animations | Smooth transitions, loading states |
| 11-12 | Theme support | Dark/light mode |

### Track D: Visualization
**Owner**: @mira
**Team**: 2 engineers
**Focus**: Charts, cards, metrics display

| Week | Goal | Details |
|------|------|---------|
| 1-2 | Chart library | ECharts integration, base components |
| 3-4 | GaugeStatCard | Implementation and styling |
| 5-6 | RateDeltaCard | Implementation with breakdown bar |
| 7-8 | TreemapRenderer | Label cardinality visualization |
| 9-10 | BarRenderer | Comparison bar charts |
| 11-12 | Visual polish | Consistent styling |

### Track E: Testing & DevOps
**Owner**: @steph
**Team**: 1 engineer
**Focus**: Testing infrastructure, CI/CD

| Week | Goal | Details |
|------|------|---------|
| 1-2 | Test framework | Jest/Vitest setup, first unit tests |
| 3-4 | CI pipeline | GitHub Actions workflow |
| 5-6 | Component testing | React Testing Library suite |
| 7-8 | E2E with Cypress | Main user flow automation |
| 9-10 | Integration testing | Cross-component flows |
| 11-12 | Documentation | User guide, API docs |

## 3. Integration Points & Dependencies

Weekly integration milestones with clear handoffs:

| Week | Integration Point | Tracks | Success Criteria |
|------|-------------------|--------|------------------|
| 2 | Contracts finalized | A→B,C,D | TypeScript interfaces approved |
| 4 | Parser → Store | A→B | Parser worker emits valid ParsedSnapshot |
| 6 | Store → UI | B→C,D | UI components render from store selectors |
| 8 | Cardinality flow | B→D | What-If UI updates with simulation results |
| 10 | Config generation | B→C | YAML snippets render in modal |
| 12 | Live mode | A→C | WebSocket connection status in UI |

## 4. Risk Management

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Large payloads processing** | High | High | Web Worker optimization, virtualized lists |
| **Browser compatibility issues** | Medium | Medium | Cross-browser testing from week 1, polyfills as needed |
| **Integration delays** | Medium | High | Mock interfaces, strict contracts, daily integration check-ins |
| **Scope creep** | High | Medium | Strict backlog prioritization, defer non-essential features to v1.1 |
| **UI complexity** | Medium | Medium | Component-driven development, Storybook for visual testing |

## 5. Critical Path

The following sequence represents the critical path for v1.0:

1. Contracts package (week 2)
2. ParsedSnapshot from static file (week 4)
3. Basic metrics view (week 6)
4. Cardinality analysis (week 8)
5. Config generation (week 10)
6. E2E testing suite (week 12)

Delays in any critical path item must trigger immediate team escalation.

## 6. Resources & Staffing

| Role | Count | Primary Responsibility |
|------|-------|------------------------|
| Frontend Engineer | 4 | React components, state management |
| Backend Engineer | 2 | WebSocket, parsers, algorithms |
| DevOps Engineer | 1 | CI/CD, testing infrastructure |
| Designer | 1 | UI/UX design, visual assets |
| Project Manager | 1 | Track coordination, risk management |

Resource loading by week:
- Weeks 1-4: 80% research/design, 20% implementation
- Weeks 5-8: 30% design, 70% implementation
- Weeks 9-12: 10% design, 70% implementation, 20% testing

## 7. Communication Plan

| Audience | Frequency | Channel | Owner |
|----------|-----------|---------|-------|
| Engineering Team | Daily | Stand-up | PM |
| Project Stakeholders | Weekly | Status report | PM |
| Integration Partners | Bi-weekly | Office hours | Tech Lead |

## 8. Decision Log

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2025-05-01 | React + Zustand for state | Best balance of developer experience | @li |
| 2025-05-01 | Web Workers for parsing | Keep UI responsive with large payloads | @jack |
| 2025-05-03 | ECharts for visualization | Better fit for our visualization needs | @mira |
| 2025-05-10 | Mitt for EventBus | Lightweight, typed, simple API | @arun |
