/**
 * <branch-graph-interactive> – Interactive git branch tree (extends branch-graph-base).
 * Branches-page specific: drag-and-drop to move/merge branches.
 */
(function () {
  const BranchGraphBase = customElements.get("branch-graph-base");
  if (!BranchGraphBase) {
    console.warn("branch-graph-interactive: load branch-graph-base.js first.");
    return;
  }

  const nodeRadius = 48;

  const dropTargetStyles = document.createElement("style");
  dropTargetStyles.textContent = `
    .node.drop-target circle {
      fill: #6e7681 !important;
      stroke: #8b949e !important;
    }
    .node.main.drop-target circle {
      fill: #9e6a03 !important;
      stroke: #b8860b !important;
    }
  `;

  customElements.define(
    "branch-graph-interactive",
    class BranchGraphInteractive extends BranchGraphBase {
      constructor() {
        super();
        this.shadowRoot.appendChild(dropTargetStyles);
      }

      _afterRender(node, root, g) {
        const d3 = this._d3;
        let ghostEl = null;
        let currentDropTarget = null;
        let draggedNode = null;
        const nodeUnderPoint = (px, py) =>
          root
            .descendants()
            .find(
              (n) =>
                n !== draggedNode &&
                Math.hypot(px - n.x, py - n.y) <= nodeRadius
            );

        const drag = d3
          .drag()
          .on("start", (_event, d) => {
            draggedNode = d;
            ghostEl = g
              .append("g")
              .attr("class", "ghost")
              .attr("opacity", 0.5)
              .attr("pointer-events", "none")
              .attr("transform", `translate(${d.x},${d.y})`);
            ghostEl
              .append("circle")
              .attr("r", nodeRadius)
              .attr("fill", d.data.branch === "main" ? "#f0883e" : "#238636")
              .attr("stroke", d.data.branch === "main" ? "#f0a020" : "#2ea043")
              .attr("stroke-width", 2);
            ghostEl
              .append("text")
              .attr("dy", 0)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "central")
              .attr("fill", "#1d1b20")
              .attr("font-size", 12)
              .text(d.data.name);
          })
          .on("drag", (event, d) => {
            ghostEl.attr("transform", `translate(${event.x},${event.y})`);
            const target = nodeUnderPoint(event.x, event.y);
            if (target !== currentDropTarget) {
              node.classed("drop-target", false);
              currentDropTarget = target;
              if (target)
                node.filter((n) => n === target).classed("drop-target", true);
            }
          })
          .on("end", (_event, d) => {
            ghostEl?.remove();
            ghostEl = null;
            node.classed("drop-target", false);
            if (currentDropTarget) {
              alert(
                `${d.data.name} is merging into ${currentDropTarget.data.name}`
              );
              currentDropTarget = null;
            }
            draggedNode = null;
          });

        node
          .select("circle")
          .attr("cursor", "grab")
          .on("mousedown", function () {
            d3.select(this).attr("cursor", "grabbing");
          });
        node.call(drag);
      }
    }
  );
})();
