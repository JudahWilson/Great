/**
 * <app-top-nav> – Top app bar (Material purple theme).
 * Structure: put title in slot="title", actions in slot="actions".
 * Example: <app-top-nav><span slot="title">App</span><button slot="actions">...</button></app-top-nav>
 */
const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      align-items: center;
      height: 64px;
      min-height: 64px;
      padding: 0;
      background: var(--md-sys-color-surface, #fef7ff);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #e7e0ec);
      box-sizing: border-box;
    }
    .title {
      flex: 1;
      font: 500 22px/28px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface, #1d1b20);
      padding-right: 16px;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    ::slotted([slot="actions"]) {
      margin: 0;
    }
  </style>
  <span class="title">
    <slot name="title">App</slot>
  </span>
  <div class="actions">
    <slot name="actions"></slot>
  </div>
`;

customElements.define(
  "app-top-nav",
  class AppTopNav extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
);
