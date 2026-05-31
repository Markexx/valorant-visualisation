const CHART_WIDTH = 500;
const CHART_HEIGHT = 400;
const CHART_MARGIN = { top: 25, right: 30, bottom: 60, left: 65 };

function showTooltip(event, html) {
    const tooltip = d3.select("#tooltip");
    tooltip.style("opacity", 1).html(html);
}

function moveTooltip(event) {
    d3.select("#tooltip")
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
}

function hideTooltip() {
    d3.select("#tooltip").style("opacity", 0);
}

function showPlaceholder(containerId, message) {
    const element = document.getElementById(containerId);
    if (element) {
        element.innerHTML = `<div style="text-align:center; padding:100px; color:#888;">${message}</div>`;
    }
}

function clearContainer(containerId) {
    const element = document.getElementById(containerId);
    if (element) {
        element.innerHTML = "";
    }
}
