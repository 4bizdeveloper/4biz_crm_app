# Prisma database migration notes

## Current state

The application API routes and server-side authentication now use Prisma. The Prisma schema remains PostgreSQL-specific. The legacy `supabase/migrations/` directory is retained as historical SQL only; runtime Supabase clients and dependencies have been removed.

## Environment

Copy `.env.example` to `.env.local` and set `DATABASE_URL`. Keep credentials out of source control. Use `DIRECT_URL` for migrations only when your provider's pooler requires a separate direct connection.

Prisma supports multiple database providers, but changing providers is not just changing a URL: the datasource provider, provider-specific schema types, migrations, and generated client must also be updated. The current schema uses PostgreSQL-specific UUIDs, enums, timestamptz, JSON, and Decimal fields. PostgreSQL is the supported target until a separate provider-portability effort is completed.

## Data preservation

Do not run schema-reset commands against a populated database. Before applying migrations, take a verified database backup, compare the live schema with `prisma/schema.prisma`, and rehearse against a restored copy. Existing Supabase PostgreSQL data can remain in place while queries are converted if schema compatibility is verified.

## Lead-module acceptance checklist

- Require at least a valid email or phone number.
- Normalize email and phone consistently before duplicate checks; normalize company names for candidate detection.
- Detect candidates without automatically deleting or overwriting records.
- Merge in a transaction, retain the survivor's history and activities, re-point dependent records, and preserve a merge audit trail.
- Enforce role and department scope server-side, and enforce branch scope for employees with an explicitly assigned branch; never trust client-provided authorization fields.
- Employee branch is nullable to avoid inventing values for legacy users. Assign each employee's authoritative branch in User Management before relying on strict branch separation; legacy employees with no branch retain their existing assignment-based access until that data is populated.
- Allowlist mutable fields and validate explicit status transitions.
- Model archive separately from disqualification.
- Keep currency/time-zone defaults grounded in existing application rules; never fabricate unknown lead data.
- Record actor, operation, timestamp, and meaningful before/after details for lead changes.
- Test validation, duplicate detection, merge integrity, permissions, transitions, archive, and audit behavior.

## Verification still required

CI runs Prisma schema validation, client generation, ESLint for migrated server code, lead-status unit tests, and a production build. It does not connect to a live database or apply migrations. Rehearse the additive SQL migrations against a restored database before production rollout.
