# IntakeOps Database Setup

IntakeOps uses **Prisma + PostgreSQL** for durable workflow state.

The database scope is intentionally small for Week 6. The goal is not advanced database design. The goal is durable event-driven workflow state:

```txt
External event
→ validated ingestion
→ persisted FeedbackEvent
→ AI processing
→ persisted OperationsRecord
→ dashboard / workflow state
```

## Current Data Model

The app currently persists two models:

### FeedbackEvent

Represents the original incoming client message/event.

Fields:

```txt
id
source
receivedAt
status
message
```

### OperationsRecord

Represents the AI-generated operational analysis for a feedback event.

Fields:

```txt
id
eventId
summary
sentiment
priority
needsResponse
actionItems
risks
suggestedResponse
confidence
createdAt
```

Each `FeedbackEvent` has at most one `OperationsRecord`.

## Environment Variable

The app expects this environment variable:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

For local development, keep this in:

```txt
.env
.env.local
```

Both files should be ignored by Git:

```gitignore
.env
.env.local
```

## Windows Setup

On Windows, this project currently uses **native PostgreSQL for Windows**.

PostgreSQL is installed as a Windows service.

Typical service name:

```txt
postgresql-x64-15 - PostgreSQL Server 15
```

Default connection details:

```txt
host: localhost
port: 5432
database: intake_ops_dev
user: postgres
```

Example `.env` / `.env.local`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/intake_ops_dev?schema=public"
```

### Useful Windows Commands

Connect with `psql`:

```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -p 5432
```

Create the database if needed:

```sql
CREATE DATABASE intake_ops_dev;
```

List databases:

```sql
\l
```

Exit:

```sql
\q
```

## macOS Setup

On macOS, this project uses **PostgreSQL in Docker**.

Create `docker-compose.yml` at the project root if it does not already exist:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: intake_ops_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: intake_ops
      POSTGRES_PASSWORD: intake_ops_password
      POSTGRES_DB: intake_ops_dev
    ports:
      - "5432:5432"
    volumes:
      - intake_ops_postgres_data:/var/lib/postgresql/data

volumes:
  intake_ops_postgres_data:
```

Start Postgres:

```bash
docker compose up -d
```

Stop Postgres but keep data:

```bash
docker compose down
```

Stop Postgres and delete local database data:

```bash
docker compose down -v
```

Example macOS `.env` / `.env.local`:

```env
DATABASE_URL="postgresql://intake_ops:intake_ops_password@localhost:5432/intake_ops_dev?schema=public"
```

## Prisma Setup

This project uses **Prisma 7**.

Prisma 7 uses:

```txt
prisma.config.ts
```

for the database URL used by Prisma CLI commands.

### Install Dependencies

```bash
npm install prisma @prisma/client
npm install @prisma/adapter-pg pg
npm install --save-dev @types/pg dotenv
```

### Validate Schema

```bash
npx prisma validate
```

### Run Migrations

```bash
npx prisma migrate dev
```

Or for a named migration:

```bash
npx prisma migrate dev --name init_intake_ops
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Open Prisma Studio

```bash
npx prisma studio
```

If Prisma Studio shows this error but the browser opens successfully, it can usually be ignored:

```txt
Error [ERR_STREAM_UNABLE_TO_PIPE]: Cannot pipe to a closed or destroyed stream
```

Prisma Studio is only an inspection tool. The critical checks are:

```bash
npx prisma validate
npx prisma migrate status
```

## Prisma 7 Client Setup

The app uses the PostgreSQL adapter.

`lib/prisma.ts` should look like:

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

If `DATABASE_URL` changes, restart the Next.js dev server.

## Prisma Schema

Current `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model FeedbackEvent {
  id         String   @id @default(uuid())
  source     String
  receivedAt DateTime @default(now())
  status     String
  message    String

  operationsRecord OperationsRecord?
}

model OperationsRecord {
  id                String   @id @default(uuid())
  eventId           String   @unique
  summary           String
  sentiment         String
  priority          String
  needsResponse     Boolean
  actionItems       Json
  risks             Json
  suggestedResponse String
  confidence        String
  createdAt         DateTime @default(now())

  event FeedbackEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
}
```

## Prisma Config

Current `prisma.config.ts`:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

## Development Workflow

Start the database first.

### Windows

Start PostgreSQL service from Windows Services if it is not already running.

Service name:

```txt
postgresql-x64-15 - PostgreSQL Server 15
```

### macOS

```bash
docker compose up -d
```

Then start the app:

```bash
npm run dev
```

Run Prisma Studio when needed:

```bash
npx prisma studio
```

## Persistence Check

To verify that durable persistence is working:

```txt
1. Create a feedback event in the app.
2. Confirm it appears in /inbox.
3. Confirm it appears in Prisma Studio under FeedbackEvent.
4. Process the event.
5. Confirm OperationsRecord is created.
6. Restart npm run dev.
7. Confirm the event and operations record are still there.
```

If data remains after server restart, PostgreSQL persistence is working.

## Troubleshooting

### Port 5432 is unavailable

Something else is already using the default PostgreSQL port.

Check on Windows:

```powershell
netstat -ano | findstr :5432
```

Find the process:

```powershell
tasklist /FI "PID eq <PID>"
```

Options:

```txt
Use existing PostgreSQL instance
Stop the conflicting service
Use another port such as 5433
```

If using port `5433`, update `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5433/intake_ops_dev?schema=public"
```

### Prisma cannot connect

Check:

```txt
PostgreSQL service/container is running
DATABASE_URL is correct
Database exists
Password is correct
Port is correct
.env and .env.local are present
Dev server was restarted after env changes
```

### Prisma Client initialization error

If you see:

```txt
PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions
```

Make sure `lib/prisma.ts` uses the PostgreSQL adapter:

```ts
new PrismaClient({ adapter })
```

not:

```ts
new PrismaClient()
```

### Prisma schema says `url` is no longer supported

In Prisma 7, do not put this in `schema.prisma`:

```prisma
url = env("DATABASE_URL")
```

Instead, `schema.prisma` should have:

```prisma
datasource db {
  provider = "postgresql"
}
```

and `prisma.config.ts` should define the datasource URL.

## Commit Recommendation

After adding this documentation:

```bash
git add docs/DATABASE_SETUP.md
git commit -m "Document local database setup"
```

## Terminology Note

This project uses **PostgreSQL**, often shortened to **Postgres**.

**PostgREST** is a different tool that exposes a PostgreSQL database as a REST API. IntakeOps is not using PostgREST.
