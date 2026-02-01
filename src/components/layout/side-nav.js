/**
 * <app-side-nav> – Side navbar component (Material purple theme).
 * Put nav links/buttons inside: <app-side-nav><a href="...">Label</a> ... </app-side-nav>
 */
const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      width: 260px;
      min-width: 260px;
      padding: 0;
      background: var(--md-sys-color-surface, #fef7ff);
      border-right: 1px solid var(--md-sys-color-outline-variant, #e7e0ec);
      box-sizing: border-box;
    }
    .nav-header {
      padding: 16px 0 8px;
      font: 500 14px/20px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    nav {
      display: flex;
      flex-direction: column;
      padding: 0;
    }
    nav slot {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    ::slotted(a),
    ::slotted(button) {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px !important;
      border: none;
      border-radius: var(--md-sys-shape-corner-large, 8px);
      font: 500 14px/20px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface, #1d1b20);
      background: transparent;
      text-decoration: none;
      cursor: pointer;
      box-sizing: border-box;
      transition: background 0.2s;
    }
    ::slotted(a:hover),
    ::slotted(button:hover) {
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
    }
    ::slotted(a[aria-current="page"]),
    ::slotted(button[aria-current="page"]) {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }
  </style>
  <div class="nav-header">Navigation</div>
  <nav>
    <slot></slot>
  </nav>
`;

customElements.define(
  "app-side-nav",
  class AppSideNav extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
);
