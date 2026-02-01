/**
 * Parse git-style branch output into the JSON shape expected by branch-graph (name, branch, children).
 *
 * No single git command produces this format. A script that runs these is responsible:
 *
 *   1. List branches:  git for-each-ref refs/heads --format='%(refname:short)'
 *   2. For each branch, parent commit of tip:  git rev-parse <branch>^
 *   3. Branch that contains that commit (parent branch):  git for-each-ref refs/heads --contains=<commit> --format='%(refname:short)'
 *
 * Output format: one line per branch. Root = single name; others = "branch parent".
 *
 * Git itself behaves the same on Windows and Linux (same output). The parser accepts both LF and CRLF.
 * A script that runs these commands may need different shell escaping on Windows (e.g. ^ in cmd).
 */
const SAMPLE_OUTPUT = `main
develop main
feature/auth develop
feature/dashboard develop
feature/api-v2 develop
release/1.0 main
hotfix/login-bug release/1.0
experiment/poc main`;

/**
 * Turn a branch name into the node shape { name, branch, children? }.
 * @param {string} branch
 * @returns {{ name: string, branch: string, children: Array }}
 */
function node(branch) {
  return { name: branch, branch, children: [] };
}

/**
 * Parse "branch parent" output into a single root tree (uses first root as root; others attach under it).
 * @param {string} raw - Output string (one line per branch: "branch" or "branch parent")
 * @returns {{ name: string, branch: string, children: Array }} Root tree for branch-graph
 */
function parseBranchTree(raw) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  /** @type {Map<string, { name: string, branch: string, children: Array }>} */
  const byBranch = new Map();
  /** @type {string[]} */
  const roots = [];

  for (const line of lines) {
    const parts = line.split(/\s+/);
    const branch = parts[0];
    const parentName = parts[1];
    if (!byBranch.has(branch)) {
      byBranch.set(branch, node(branch));
    }
    const n = byBranch.get(branch);
    if (parentName) {
      if (!byBranch.has(parentName)) {
        byBranch.set(parentName, node(parentName));
      }
      byBranch.get(parentName).children.push(n);
    } else {
      roots.push(branch);
    }
  }

  if (roots.length === 0) return node("main");
  const rootName = roots[0];
  return byBranch.get(rootName);
}

/**
 * Fetch branch tree output from Tauri backend (if running in Tauri), then parse to JSON.
 * @param {string} [repoPath] - Optional repo path; default is current dir on backend.
 * @returns {Promise<{ name: string, branch: string, children: Array }>} Root tree for branch-graph
 */
export async function getBranchTreeFromBackend(repoPath) {
  const invoke = window.__TAURI__?.core?.invoke;
  if (!invoke) throw new Error("Tauri invoke not available");
  const raw = await invoke("get_branch_tree_output", {
    repo_path: repoPath ?? null,
  });
  return parseBranchTree(raw);
}

export { SAMPLE_OUTPUT, parseBranchTree };
