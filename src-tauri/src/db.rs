//! Local SQLite DB: app config dir, pool init, and migrations.

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use sqlx::{migrate::Migrator, sqlite::SqliteConnectOptions, SqlitePool};

/// Path to the SQLite file in the app config directory (platform-specific, user-local).
pub fn app_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("data.db"))
}

/// Create and run migrations, then return a pool for local SQLite.
pub async fn init_pool(app: &AppHandle) -> Result<SqlitePool, String> {
    let path = app_db_path(app)?;
    let opts = SqliteConnectOptions::new()
        .filename(&path)
        .create_if_missing(true);
    let pool = SqlitePool::connect_with(opts).await.map_err(|e| e.to_string())?;
    let migrations_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("migrations");
    let migrator = Migrator::new(migrations_dir)
        .await
        .map_err(|e: sqlx::migrate::MigrateError| e.to_string())?;
    migrator.run(&pool).await.map_err(|e| e.to_string())?;
    Ok(pool)
}
