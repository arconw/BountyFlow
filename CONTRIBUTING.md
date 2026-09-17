# Contributing

Use Node.js 24 and npm. Start with `npm ci` and `npm run dev:local`.

Keep presentation components, hooks, server actions, business services, and database access focused. Reuse the existing schemas and components. All interface text belongs in the eight dictionaries; user content and standardized skill names stay unchanged.

For a database change, add a Prisma migration. Production uses `prisma migrate deploy`, never automatic schema pushes. Add curated skills to `src/content/skills.ts` and seed their rows in a new data migration.

Before opening a pull request, run the checks in [README](README.md#verification). Use local EVM accounts only. Browser tests create isolated databases and contracts. Keep credentials, `.env` files, SQLite data, private keys, and authentication material out of commits and test artifacts.

`main` contains the full application and demo source. `demo` is the publication branch: its Pages workflow builds only the isolated static demo. Update it from reviewed `main` commits rather than making a second implementation of the application.
