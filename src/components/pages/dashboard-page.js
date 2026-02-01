/**
 * <dashboard-page> – Top-level Dashboard page.
 */
const template = document.createElement("template");
template.innerHTML = `
  <page-wrapper title="Welcome">
    <p>Side navbar and top navbar are web components. This is the main content area.</p>
  </page-wrapper>
`;

customElements.define(
  "dashboard-page",
  class DashboardPage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
);
