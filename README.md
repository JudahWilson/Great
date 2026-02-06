# Setup

`npm install` then `npm run tauri dev`.

## Local data (SQLite)

The app uses **sqlx** in the Rust backend only. 

The DB file is created in the app config dir (platform-specific). On startup, migrations in `src-tauri/migrations/` are applied. 

Add new migrations there (e.g. `002_add_foo.sql`). 

In commands, use `tauri::State<'_, SqlitePool>` to run queries. 

Example: `db_ping` (invoke from the frontend to verify the DB is up).
