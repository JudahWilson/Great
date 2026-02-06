// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod db;

use std::process::Command;
use std::str;
use std::sync::RwLock;

use serde::Serialize;
use sqlx::SqlitePool;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Path of the currently selected project. All git commands use this as the repo cwd.
#[derive(Default)]
pub struct CurrentProject(pub RwLock<Option<String>>);

/// Returns the selected project path or an error. Call at the start of every git command so they
/// always run in the selected project repo. Example: `let cwd = require_project_path(&current)?;`
fn require_project_path(state: &tauri::State<'_, CurrentProject>) -> Result<String, String> {
    state
        .0
        .read()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "No project selected. Choose a project on the Home page.".to_string())
}

/// Saved project: id, name, path (and optional created_at for display).
#[derive(Debug, Serialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub created_at: Option<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

const LAST_SELECTED_KEY: &str = "last_selected_project_path";

/// Set the currently selected project path. Persists to DB when path is Some so it becomes the default next launch.
#[tauri::command]
async fn set_current_project(
    current: tauri::State<'_, CurrentProject>,
    pool: tauri::State<'_, SqlitePool>,
    path: Option<String>,
) -> Result<(), String> {
    let path = path
        .map(|s| s.trim().to_string())
        .and_then(|s| if s.is_empty() { None } else { Some(s) });
    *current.0.write().map_err(|e| e.to_string())? = path.clone();
    if let Some(ref p) = path {
        sqlx::query("INSERT OR REPLACE INTO app_meta (key, value) VALUES (?1, ?2)")
        .bind(LAST_SELECTED_KEY)
        .bind(p)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Get the currently selected project path, if any.
#[tauri::command]
fn get_current_project_path(
    current: tauri::State<'_, CurrentProject>,
) -> Result<Option<String>, String> {
    current.0.read().map_err(|e| e.to_string()).map(|g| g.clone())
}

/// Run git commands in the selected project repo. Returns the raw string for the frontend to parse with parseBranchTree().
#[tauri::command]
fn get_branch_tree_output(current: tauri::State<'_, CurrentProject>) -> Result<String, String> {
    let cwd = require_project_path(&current)?;
    
    let branches_out = Command::new("git")
        .current_dir(&cwd)
        .args(["for-each-ref", "refs/heads", "--format=%(refname:short)"])
        .output()
        .map_err(|e| e.to_string())?;
    if !branches_out.status.success() {
        return Err(String::from_utf8_lossy(&branches_out.stderr).into_owned());
    }
    let branch_list: Vec<String> = str::from_utf8(&branches_out.stdout)
        .map_err(|e| e.to_string())?
        .split_whitespace()
        .map(String::from)
        .collect();
    
    let mut lines = Vec::new();
    for branch in &branch_list {
        let parent_commit_out = Command::new("git")
            .current_dir(&cwd)
            .args(["rev-parse", &format!("{}^", branch)])
            .output()
            .map_err(|e| e.to_string())?;
        if !parent_commit_out.status.success() {
            lines.push(branch.clone());
            continue;
        }
        let parent_commit = str::from_utf8(&parent_commit_out.stdout)
            .map_err(|e| e.to_string())?
            .trim();
        let contains_out = Command::new("git")
            .current_dir(&cwd)
            .args([
                "for-each-ref",
                "refs/heads",
                "--contains",
                parent_commit,
                "--format=%(refname:short)",
            ])
            .output()
            .map_err(|e| e.to_string())?;
        if !contains_out.status.success() {
            lines.push(branch.clone());
            continue;
        }
        let containing: Vec<&str> = str::from_utf8(&contains_out.stdout)
            .map_err(|e| e.to_string())?
            .split_whitespace()
            .filter(|b| *b != branch.as_str())
            .collect();
        let parent = containing.first().map(|s| (*s).to_string());
        match parent {
            Some(p) => lines.push(format!("{} {}", branch, p)),
            None => lines.push(branch.clone()),
        }
    }
    Ok(lines.join("\n"))
}

/// Open folder picker; returns selected path or null if cancelled. No frontend dialog import needed.
#[tauri::command]
async fn pick_project_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = app.dialog().file().blocking_pick_folder();
    Ok(path.map(|p| p.to_string()))
}

/// Example: verify local DB is reachable. Use State<SqlitePool> in other commands for queries.
#[tauri::command]
async fn db_ping(pool: tauri::State<'_, SqlitePool>) -> Result<String, String> {
    let one: (i32,) = sqlx::query_as("SELECT 1")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(if one.0 == 1 { "ok" } else { "unexpected" }.to_string())
}

#[tauri::command]
async fn list_projects(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Project>, String> {
    let rows = sqlx::query_as::<_, (i64, String, String, Option<String>)>(
        "SELECT id, name, path, created_at FROM projects ORDER BY name",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .map(|(id, name, path, created_at)| Project {
            id,
            name,
            path,
            created_at,
        })
        .collect())
}

#[tauri::command]
async fn add_project(
    pool: tauri::State<'_, SqlitePool>,
    path: String,
    name: Option<String>,
) -> Result<Project, String> {
    let name = name.unwrap_or_else(|| {
        std::path::Path::new(&path)
            .file_name()
            .and_then(|p| p.to_str())
            .unwrap_or("Project")
            .to_string()
    });
    let path = path.trim().to_string();
    if path.is_empty() {
        return Err("Path is required".to_string());
    }
    let id = sqlx::query_scalar(
        "INSERT INTO projects (name, path) VALUES (?1, ?2) RETURNING id",
    )
    .bind(&name)
    .bind(&path)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    let created_at: Option<String> = sqlx::query_scalar("SELECT created_at FROM projects WHERE id = ?1")
        .bind(id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(Project {
        id,
        name,
        path,
        created_at,
    })
}

#[tauri::command]
async fn update_project(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
    name: Option<String>,
    path: Option<String>,
) -> Result<Project, String> {
    if name.is_none() && path.is_none() {
        return Err("Provide at least one of name or path to update".to_string());
    }
    if let Some(ref n) = name {
        sqlx::query("UPDATE projects SET name = ?1 WHERE id = ?2")
            .bind(n)
            .bind(id)
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
    }
    if let Some(ref p) = path {
        sqlx::query("UPDATE projects SET path = ?1 WHERE id = ?2")
            .bind(p.trim())
            .bind(id)
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
    }
    let row: Option<(i64, String, String, Option<String>)> = sqlx::query_as(
        "SELECT id, name, path, created_at FROM projects WHERE id = ?1",
    )
    .bind(id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    row.map(|(id, name, path, created_at)| Project {
        id,
        name,
        path,
        created_at,
    })
    .ok_or_else(|| "Project not found".to_string())
}

#[tauri::command]
async fn delete_project(pool: tauri::State<'_, SqlitePool>, id: i64) -> Result<(), String> {
    let r = sqlx::query("DELETE FROM projects WHERE id = ?1")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    if r.rows_affected() == 0 {
        return Err("Project not found".to_string());
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let pool = tauri::async_runtime::block_on(db::init_pool(&handle))
                .map_err(|e| e.to_string())?;
            let last_path: Option<String> = tauri::async_runtime::block_on(
                sqlx::query_scalar::<_, String>("SELECT value FROM app_meta WHERE key = ?1")
                    .bind(LAST_SELECTED_KEY)
                    .fetch_optional(&pool),
            )
            .map_err(|e: sqlx::Error| e.to_string())?;
            let current = CurrentProject(RwLock::new(last_path));
            app.manage(pool);
            app.manage(current);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_branch_tree_output,
            set_current_project,
            get_current_project_path,
            db_ping,
            pick_project_folder,
            list_projects,
            add_project,
            update_project,
            delete_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
