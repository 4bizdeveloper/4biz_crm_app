# Prisma database migration notes

## Current state

The repository already contains a Prisma schema for PostgreSQL, but API routes still call Supabase's query builder. Adding Prisma configuration alone does not migrate those routes. Do not deploy this branch as a completed Supabase removal until all API and server-side data access paths are converted and tested.

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
- Enforce role, department, and branch scope server-side; never trust client-provided authorization fields.
- Allowlist mutable fields and validate explicit status transitions.
- Model archive separately from disqualification.
- Keep currency/time-zone defaults grounded in existing application rules; never fabricate unknown lead data.
- Record actor, operation, timestamp, and meaningful before/after details for lead changes.
- Test validation, duplicate detection, merge integrity, permissions, transitions, archive, and audit behavior.

## Verification still required

Run Prisma client generation, schema validation, TypeScript checks, lint, unit/integration tests, and a production build in the project environment. GitHub edits do not execute the repository's install/build/test commands.
