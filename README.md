# DataLab

A local-first PostgreSQL optimization workspace, with a separate SQL handbook from foundations to advanced syntax. The primary flow is **connect an existing database → capture a baseline → review and confirm an experiment → measure again → explain the evidence**.

## Run

```bash
npm ci
npm run dev
```

Open http://localhost:3000/connections and fill in host, port, database, user and password of a PostgreSQL running **on the same machine** (or paste a `postgresql://` URL). `/workspace` measures and compares; `/paths` is the SQL course. `/learn`, basic lab, interview and challenge routes redirect to the new pages.

### Is the connection secure?

- The dev/start scripts bind the server to `127.0.0.1`; other machines on your network cannot reach it.
- `/api/local-db` accepts only same-origin requests addressed to `localhost`/`127.0.0.1`/`[::1]` (blocks other websites, CSRF and DNS rebinding) and only connects to loopback PostgreSQL hosts.
- The password is sent once to the local server, kept in memory in the `pg` client while connected, and never stored, logged or returned. The browser keeps only a random session token in memory; sessions close on disconnect, page close or after 30 idle minutes.
- Queries are read-only (guarded SELECT/WITH in a read-only transaction). Index/partition changes are generated server-side and require a one-use preview plus confirmation.
- Admin roles are allowed but flagged; a dedicated read-only role is recommended (see the "Roles and permissions" lesson). Use development databases, never production.
- A hosted copy of DataLab cannot reach your local database; this mode works only when you run DataLab yourself. Set `DATALAB_DIRECT_DB=0` to disable it.

The older outbound connector (`npm run connector`) remains available for the legacy lab dataset; see [connector setup](docs/native-connector-setup.md). Node.js 22.9+ or 24 is recommended.

## Implemented

- Database-first, responsive workspace and navigation, with Vietnamese/English and light/dark/system appearance.
- Existing-table discovery: schemas, columns, types, approximate row estimates and table sizes; no seeding, reset or migration at pairing.
- Real EXPLAIN ANALYZE measurements for guarded SELECT/WITH queries. Index/table DDL is rejected by the query editor.
- Structured B-tree index builder with 1–4 ordered key columns on the selected table.
- Monthly range-partition experiments on a **separate copy**, with 1–24 monthly partitions and a default partition for NULL/out-of-range values.
- SQL previews generated and validated at the connector boundary, expiring after five minutes, requiring explicit one-use confirmation.
- Transactional changes, bounded lock waits, rollback on failure, and reviewed cleanup restricted to objects created by the current connector process.
- Before/after time, approximate heap visits and shared-buffer-read charts; actual scan/index paths, partition tiles and expandable plan evidence.
- Query-rewrite comparisons, explicitly **not** full-result-equivalence validation.
- A 21-lesson bilingual SQL course (basics → advanced): what it is, when to use it, syntax broken down part by part, an example with input tables and the real result, and common mistakes. A test runs every example on the sample data to guarantee displayed results are correct.
- Existing browser sandbox and advanced scenario routes retained as secondary demonstrations. Basic scenario routes no longer serve exercises.

## Safety and measurement limits

Use development copies, not production databases. A regular index build blocks writes while building. Partition copies acquire a SHARE lock on the source, copy **all** rows (maximum one million), consume extra disk and omit original indexes, defaults, generated/identity behavior, triggers and foreign keys. They are not a production migration. Check constraints and business semantics separately.

Read measurements run in read-only transactions with a 4.5-second statement timeout. DDL/copy statements have a 20-second timeout and a 1.5-second lock timeout; relay jobs have a 30-second deadline. A failed multi-statement experiment rolls back as one transaction. The relay never automatically replays SQL after a network failure. An uncertain mutation requires inspection and explicit state acknowledgement, **never a reset of the existing database**.

Charts use measured plans, not seeded or simulated metrics. Cache, concurrent writes, query shape and missing indexes on a partition copy can affect comparisons. Heap visits are approximate, parent/child buffers must not be summed, and one timing is not a benchmark. No AI-generated diagnosis or universal speedup is claimed.

Connections, baselines, previews and change history are session-memory state; reloading requires pairing again. Created database objects persist in PostgreSQL. Restarting the connector loses its cleanup ownership registry; inspect and clean those objects manually in a local database client if necessary.

Client-side navigation to the handbook preserves your query, baseline, comparison and change history. SQL approval checkboxes/previews do not survive leaving the workspace. Reloading requests release of the old browser session; if that request is lost, restart the connector to obtain a new pairing session.

The relay is a single-process local-development prototype, not an authenticated public SaaS or a horizontally scalable service. MySQL/SQL Server, arbitrary migrations, concurrent-index automation, accounts, cloud sync and payments are not implemented.

## Validation

```bash
npm run typecheck
npm test
npm run build
```

Real PostgreSQL checks require `DATALAB_TEST_DATABASE_URL` pointing to a disposable `datalab_lab` or `datalab_lab_*` database:

```bash
node --import tsx --test --test-isolation=none tests/workspace-postgres.test.ts
```

The workspace integration test creates its own named test schema, verifies discovery, real before/after index plans, a complete partition copy including NULL/out-of-range values, atomic rollback, source preservation and scoped cleanup, then removes only that schema. Without the environment variable the real integration test reports SKIP.

The retained fixture engine can still be tested with `npm run test:connector:postgres`; those legacy tests reset their dedicated lab schema. Existing-database mode rejects all fixture initialize/reset/prepare/run operations.

## Relevant code

```text
app/workspace/                       Primary database optimization route
components/optimization-workspace.tsx Guided experiment and evidence UI
components/connections-page.tsx       Existing local database setup
components/sql-handbook.tsx           Searchable syntax reference
content/sql-handbook.ts               Bilingual reference content
lib/workspace.ts                      Shared typed requests and SQL builders
lib/connector/workspace.ts            Discovery, EXPLAIN, approvals, DDL and cleanup
lib/connector/postgres.ts             Strict existing/legacy mode separation
lib/connector/store.ts                Local relay ownership, deadlines and recovery
lib/engine/                          Retained browser/fixture SQL engine
```
