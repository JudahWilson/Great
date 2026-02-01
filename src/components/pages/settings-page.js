/**
 * <settings-page> – Top-level Settings page.
 */
const template = document.createElement("template");
template.innerHTML = `
  <page-wrapper title="Settings">
    <p>App settings will appear here.</p>
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
  }
);
