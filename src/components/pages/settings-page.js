/**
 * <settings-page> – Settings: app settings and project settings (edit/delete).
 */
const template = document.createElement("template");
template.innerHTML = `
  <style>
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font: 500 22px/28px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface, #1d1b20);
      margin: 0 0 12px 0;
    }
    .project-card {
      border: 1px solid var(--md-sys-color-outline-variant, #e7e0ec);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }
    .project-card label {
      font: 500 12px/16px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      display: block;
      margin-bottom: 4px;
    }
    .project-card input {
      width: 100%;
      padding: 8px 12px;
      font: 400 14px/20px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface, #1d1b20);
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e7e0ec);
      border-radius: 6px;
      margin-bottom: 12px;
      box-sizing: border-box;
    }
    .project-card input:last-of-type {
      margin-bottom: 12px;
    }
    .project-card .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .project-card .actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      padding: 8px 16px;
      font: 500 14px/20px Roboto, sans-serif;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-save {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }
    .btn-save:hover {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .btn-delete {
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
    }
    .btn-delete:hover {
      background: var(--md-sys-color-error, #b3261e);
      color: var(--md-sys-color-on-error, #fff);
    }
    .empty-hint {
      font: 400 14px/20px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
    }
  </style>
  <page-wrapper title="Settings">
    <div class="section">
      <h2 class="section-title">Project settings</h2>
      <div id="projects-list"></div>
      <p id="projects-empty" class="empty-hint" style="display: none;">No projects yet. Add one from the Home page.</p>
    </div>
  </page-wrapper>
`;

customElements.define(
  "settings-page",
  class SettingsPage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
      this._onProjectsUpdated = () => this._loadProjects();
      this._onViewChanged = (e) => {
        if (e.detail?.view === "settings") this._loadProjects();
      };
      document.addEventListener("projects-updated", this._onProjectsUpdated);
      document.addEventListener("view-changed", this._onViewChanged);
      this._loadProjects();
    }

    disconnectedCallback() {
      document.removeEventListener("projects-updated", this._onProjectsUpdated);
      document.removeEventListener("view-changed", this._onViewChanged);
    }

    async _loadProjects() {
      const invoke = window.__TAURI__?.core?.invoke;
      const listEl = this.shadowRoot.getElementById("projects-list");
      const emptyEl = this.shadowRoot.getElementById("projects-empty");
      if (!invoke) {
        listEl.innerHTML = "";
        emptyEl.style.display = "block";
        return;
      }
      try {
        const list = await invoke("list_projects");
        if (!list || list.length === 0) {
          listEl.innerHTML = "";
          emptyEl.style.display = "block";
          return;
        }
        emptyEl.style.display = "none";
        listEl.innerHTML = "";
        for (const p of list) {
          listEl.appendChild(this._createProjectCard(p));
        }
      } catch (_) {
        listEl.innerHTML = "";
        emptyEl.style.display = "block";
      }
    }

    _createProjectCard(project) {
      const card = document.createElement("div");
      card.className = "project-card";
      card.dataset.id = String(project.id);
      card.innerHTML = `
        <label for="name-${project.id}">Name</label>
        <input type="text" id="name-${project.id}" value="${this._escape(
        project.name
      )}" placeholder="Project name" />
        <label for="path-${project.id}">Path</label>
        <input type="text" id="path-${project.id}" value="${this._escape(
        project.path
      )}" placeholder="Folder path" />
        <div class="row">
          <span></span>
          <div class="actions">
            <button type="button" class="btn btn-save" data-action="save">Save</button>
            <button type="button" class="btn btn-delete" data-action="delete">Delete</button>
          </div>
        </div>
      `;
      const saveBtn = card.querySelector('[data-action="save"]');
      const deleteBtn = card.querySelector('[data-action="delete"]');
      saveBtn.addEventListener("click", () =>
        this._saveProject(project.id, card)
      );
      deleteBtn.addEventListener("click", () =>
        this._deleteProject(project.id, card)
      );
      return card;
    }

    _escape(s) {
      if (s == null) return "";
      const div = document.createElement("div");
      div.textContent = s;
      return div.innerHTML;
    }

    async _saveProject(id, card) {
      const nameInput = card.querySelector(`#name-${id}`);
      const pathInput = card.querySelector(`#path-${id}`);
      const name = nameInput?.value?.trim() ?? "";
      const path = pathInput?.value?.trim() ?? "";
      const invoke = window.__TAURI__?.core?.invoke;
      if (!invoke || !name || !path) return;
      try {
        await invoke("update_project", { id, name, path });
        await this._loadProjects();
        document.dispatchEvent(new CustomEvent("projects-updated"));
      } catch (e) {
        console.error("Update project failed", e);
      }
    }

    async _deleteProject(id, card) {
      const invoke = window.__TAURI__?.core?.invoke;
      if (!invoke) return;
      try {
        await invoke("delete_project", { id });
        card.remove();
        const listEl = this.shadowRoot.getElementById("projects-list");
        if (listEl.children.length === 0) {
          this.shadowRoot.getElementById("projects-empty").style.display =
            "block";
        }
        document.dispatchEvent(new CustomEvent("projects-updated"));
      } catch (e) {
        console.error("Delete project failed", e);
      }
    }
  }
);
