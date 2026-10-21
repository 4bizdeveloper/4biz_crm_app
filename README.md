# 4Biz CRM

Next.js App Router CRM built with TypeScript and Prisma ORM.

## Requirements

- Node.js 22 or newer
- A PostgreSQL database

## Configure the database

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to your PostgreSQL connection string.
3. If your provider uses a connection pooler, set `DIRECT_URL` to the direct PostgreSQL connection string for Prisma migration commands. Runtime queries use `DATABASE_URL`.
4. Set `CRM_SESSION_SECRET` to a strong random secret of at least 32 characters.
5. Optionally set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the environment-configured Super Admin login.

Do not commit real credentials. If credentials were previously shared in chat, logs, or source control, rotate them before deployment.

## Install and run

```bash
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Prisma and data safety

The application uses Prisma with PostgreSQL. The schema is in `prisma/schema.prisma`, Prisma CLI configuration is in `prisma.config.ts`, and additive migrations are in `prisma/migrations/`.

The initial Prisma baseline migration is generated in CI at `prisma/migrations/20261021170000_init/migration.sql`. For a fresh database, run `npx prisma migrate deploy`. For an existing database, take and verify a backup, compare the live schema to the baseline, rehearse against a restored copy, and only if compatible mark the baseline as applied with `npx prisma migrate resolve --applied 20261021170000_init` before running `npx prisma migrate deploy`. Do not run `prisma migrate reset` or destructive schema operations against production data. The old `supabase/migrations/` SQL files are retained as historical records; do not apply them as part of the Prisma migration flow.

Branch assignments are optional so legacy employee records are not assigned an invented branch. Set each employee's real branch in **User Management** to enable branch-scoped lead access. Employees with no branch retain legacy assignment-based access until their branch data is populated.

## Verification

```bash
npx prisma validate
npx prisma generate
npx eslint src/app/api src/lib src/proxy.ts prisma.config.ts
npm run build
```

The current Prisma schema is PostgreSQL-specific. Supporting another database provider requires updating provider-specific schema types and migrations, not only changing `DATABASE_URL`.
