// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// use std::process::Command;  // uncomment when using git commands in get_branch_tree_output
// use std::str;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Run git commands to produce "branch" or "branch parent" lines (one per branch).
/// Returns the raw string for the frontend to parse with parseBranchTree().
/// For now: git commands are commented out; dummy output is returned (same shape as current dummy graph).
#[tauri::command]
fn get_branch_tree_output(_repo_path: Option<String>) -> Result<String, String> {
    // Dummy output for development; matches format expected by gitparse.parseBranchTree().
    const DUMMY_OUTPUT: &str = "main
develop main
feature/auth develop
feature/dashboard develop
feature/api-v2 develop
release/1.0 main
hotfix/login-bug release/1.0
experiment/poc main";
    return Ok(DUMMY_OUTPUT.to_string());

    // --- Git commands (uncomment when ready to use real repo data) ---
    // let cwd = repo_path.as_deref().unwrap_or(".");
    //
    // let branches_out = Command::new("git")
    //     .current_dir(cwd)
    //     .args(["for-each-ref", "refs/heads", "--format=%(refname:short)"])
    //     .output()
    //     .map_err(|e| e.to_string())?;
    // if !branches_out.status.success() {
    //     return Err(String::from_utf8_lossy(&branches_out.stderr).into_owned());
    // }
    // let branch_list: Vec<String> = str::from_utf8(&branches_out.stdout)
    //     .map_err(|e| e.to_string())?
    //     .split_whitespace()
    //     .map(String::from)
    //     .collect();
    //
    // let mut lines = Vec::new();
    // for branch in &branch_list {
    //     let parent_commit_out = Command::new("git")
    //         .current_dir(cwd)
    //         .args(["rev-parse", &format!("{}^", branch)])
    //         .output()
    //         .map_err(|e| e.to_string())?;
    //     if !parent_commit_out.status.success() {
    //         lines.push(branch.clone());
    //         continue;
    //     }
    //     let parent_commit = str::from_utf8(&parent_commit_out.stdout)
    //         .map_err(|e| e.to_string())?
    //         .trim();
    //     let contains_out = Command::new("git")
    //         .current_dir(cwd)
    //         .args([
    //             "for-each-ref",
    //             "refs/heads",
    //             "--contains",
    //             parent_commit,
    //             "--format=%(refname:short)",
    //         ])
    //         .output()
    //         .map_err(|e| e.to_string())?;
    //     if !contains_out.status.success() {
    //         lines.push(branch.clone());
    //         continue;
    //     }
    //     let containing: Vec<&str> = str::from_utf8(&contains_out.stdout)
    //         .map_err(|e| e.to_string())?
    //         .split_whitespace()
    //         .filter(|b| *b != branch.as_str())
    //         .collect();
    //     let parent = containing.first().map(|s| (*s).to_string());
    //     match parent {
    //         Some(p) => lines.push(format!("{} {}", branch, p)),
    //         None => lines.push(branch.clone()),
    //     }
    // }
    // Ok(lines.join("\n"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_branch_tree_output])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
