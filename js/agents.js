// ==================== AGENTS MODULE ====================

let currentAgentSort = "pick_rate";
let currentAgentMetric = "rating";

// Sort agents data
function sortAgentsData(data, sortBy) {
    const sorted = [...data];
    switch(sortBy) {
        case "pick_rate": sorted.sort((a,b) => b.pick_rate - a.pick_rate); break;
        case "rating": sorted.sort((a,b) => b.rating - a.rating); break;
        case "K/D": sorted.sort((a,b) => b["K/D"] - a["K/D"]); break;
        case "agent": sorted.sort((a,b) => a.agent.localeCompare(b.agent)); break;
        default: sorted.sort((a,b) => b.pick_rate - a.pick_rate);
    }
    return sorted;
}

// Draw bar chart for agents
function drawAgentBarChart(data) {
    if (!data || data.length === 0) {
        showPlaceholder("agentBarChart", "No agent data available");
        return;
    }
    
    clearContainer("agentBarChart");
    
    const sortedData = sortAgentsData(data, currentAgentSort);
    const w = CHART_WIDTH;
    const h = CHART_HEIGHT;
    const m = CHART_MARGIN;
    
    const svg = d3.select("#agentBarChart")
        .append("svg")
        .attr("width", w + m.left + m.right)
        .attr("height", h + m.top + m.bottom)
        .append("g")
        .attr("transform", `translate(${m.left},${m.top})`);
    
    const x = d3.scaleBand()
        .domain(sortedData.map(d => d.agent))
        .range([0, w])
        .padding(0.2);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(sortedData, d => d.pick_rate) + 5])
        .range([h, 0]);
    
    const colorScale = d3.scaleLinear()
        .domain([0, 50, 80])
        .range(["#3a86ff", "#ffbe0b", "#ff4655"]);
    
    svg.selectAll(".bar")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.agent))
        .attr("y", d => y(d.pick_rate))
        .attr("width", x.bandwidth())
        .attr("height", d => h - y(d.pick_rate))
        .attr("fill", d => colorScale(d.pick_rate))
        .attr("rx", 4)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.agent}</strong><br/>📊 Pick Rate: ${d.pick_rate}%<br/>⭐ Rating: ${d.rating}<br/>🔫 K/D: ${d["K/D"]}<br/>💥 ACS: ${d.ACS}`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    
    svg.append("g")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("fill", "#ccc")
        .style("font-size", "10px");
    
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6))
        .style("color", "#ccc");
    
    svg.append("text")
        .attr("x", w / 2)
        .attr("y", h + 45)
        .attr("text-anchor", "middle")
        .style("fill", "#ff8c00")
        .style("font-size", "12px")
        .text("Agent");
    
    svg.append("text")
        .attr("x", -h / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("fill", "#ff8c00")
        .style("font-size", "12px")
        .text("Pick Rate (%)");
}

// Draw scatter plot for agents
function drawAgentScatterPlot(data, metric) {
    if (!data || data.length === 0) {
        showPlaceholder("agentScatterPlot", "No agent data available");
        return;
    }
    
    clearContainer("agentScatterPlot");
    
    const w = CHART_WIDTH;
    const h = CHART_HEIGHT;
    const m = CHART_MARGIN;
    
    const svg = d3.select("#agentScatterPlot")
        .append("svg")
        .attr("width", w + m.left + m.right)
        .attr("height", h + m.top + m.bottom)
        .append("g")
        .attr("transform", `translate(${m.left},${m.top})`);
    
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.pick_rate) + 5])
        .range([0, w]);
    
    const yDomain = d3.extent(data, d => d[metric]);
    const y = d3.scaleLinear()
        .domain([yDomain[0] - Math.abs(yDomain[0] * 0.05), yDomain[1] + Math.abs(yDomain[1] * 0.05)])
        .range([h, 0]);
    
    svg.append("g")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(6))
        .style("color", "#ccc");
    
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6))
        .style("color", "#ccc");
    
    svg.selectAll(".scatter-dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "scatter-dot")
        .attr("cx", d => x(d.pick_rate))
        .attr("cy", d => y(d[metric]))
        .attr("r", 7)
        .attr("fill", d => d.pick_rate > 50 ? "#ff4655" : "#ff8c00")
        .attr("opacity", 0.8)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.agent}</strong><br/>📊 Pick Rate: ${d.pick_rate}%<br/>⭐ ${metric}: ${d[metric]}`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    
    svg.append("text")
        .attr("x", w / 2)
        .attr("y", h + 40)
        .attr("text-anchor", "middle")
        .style("fill", "#ff8c00")
        .style("font-size", "12px")
        .text("Pick Rate (%)");
    
    let metricLabel = metric;
    if (metric === "K/D") metricLabel = "K/D Ratio";
    svg.append("text")
        .attr("x", -h / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("fill", "#ff8c00")
        .style("font-size", "12px")
        .text(metricLabel);
}

// Update insights for agents
function updateAgentInsights(data) {
    if (!data || data.length === 0) {
        document.getElementById("agentInsights").innerHTML = '<div class="insight-item">No data available</div>';
        return;
    }
    
    const topPick = data.reduce((max,d) => d.pick_rate > max.pick_rate ? d : max, data[0]);
    const topRating = data.reduce((max,d) => d.rating > max.rating ? d : max, data[0]);
    const topKD = data.reduce((max,d) => d["K/D"] > max["K/D"] ? d : max, data[0]);
    const avgPick = (data.reduce((sum,d) => sum + d.pick_rate, 0) / data.length).toFixed(1);
    
    document.getElementById("agentInsights").innerHTML = `
        <div class="insight-item"><div class="value">${topPick.agent}</div><div class="label">Most Picked (${topPick.pick_rate}%)</div></div>
        <div class="insight-item"><div class="value">${topRating.agent}</div><div class="label">Highest Rating (${topRating.rating})</div></div>
        <div class="insight-item"><div class="value">${topKD.agent}</div><div class="label">Best K/D (${topKD["K/D"]})</div></div>
        <div class="insight-item"><div class="value">${avgPick}%</div><div class="label">Avg Pick Rate</div></div>
    `;
}

// Main render function for agents
function renderAgents() {
    const data = getData("agents");
    if (data.length === 0) {
        showPlaceholder("agentBarChart", "No agents.csv loaded. Make sure the file exists in the data folder.");
        showPlaceholder("agentScatterPlot", "No agents.csv loaded. Make sure the file exists in the data folder.");
        document.getElementById("agentInsights").innerHTML = '<div class="insight-item">Waiting for data...</div>';
        return;
    }
    
    drawAgentBarChart(data);
    drawAgentScatterPlot(data, currentAgentMetric);
    updateAgentInsights(data);
}