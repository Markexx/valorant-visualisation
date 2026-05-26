// ==================== MAPS MODULE ====================

let currentMapChartType = "winrate";

// Helper: Extract number from messy string
function extractNumber(value) {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    
    let str = String(value).replace(/^"|"$/g, '');
    const percentMatch = str.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) return parseFloat(percentMatch[1]);
    const numMatch = str.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) return parseFloat(numMatch[1]);
    return 0;
}

// Helper: Extract played count
function extractPlayedCount(value) {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    
    let str = String(value).replace(/^"|"$/g, '');
    const match = str.match(/(\d+)\s+out\s+of/);
    if (match) return parseInt(match[1]);
    const numMatch = str.match(/(\d+)/);
    if (numMatch) return parseInt(numMatch[1]);
    return 0;
}

// Draw map win rate chart
function drawMapWinRateChart(data) {
    if (!data || data.length === 0) {
        showPlaceholder("mapChart", "No map data available");
        return;
    }
    
    clearContainer("mapChart");
    
    const container = document.getElementById("mapChart");
    const containerWidth = container.clientWidth - 40;
    const w = Math.min(containerWidth, 800);
    const chartHeight = 450;
    const m = { top: 60, right: 60, bottom: 80, left: 70 };
    
    const svg = d3.select("#mapChart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", chartHeight + m.top + m.bottom)
        .attr("viewBox", `0 0 ${w + m.left + m.right} ${chartHeight + m.top + m.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${m.left},${m.top})`);
    
    const x = d3.scaleBand()
        .domain(data.map(d => d.map))
        .range([0, w])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);
    
    // Attack bars (red)
    svg.selectAll(".atk-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.map))
        .attr("y", d => y(extractNumber(d.atk_win_rate)))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => Math.max(0, chartHeight - y(extractNumber(d.atk_win_rate))))
        .attr("fill", "#ff4655")
        .attr("rx", 3)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.map}</strong><br/>⚔️ Attack Win Rate: ${extractNumber(d.atk_win_rate)}%`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    
    // Defense bars (green)
    svg.selectAll(".def-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.map) + x.bandwidth() / 2)
        .attr("y", d => y(extractNumber(d.def_win_rate)))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => Math.max(0, chartHeight - y(extractNumber(d.def_win_rate))))
        .attr("fill", "#2a9d8f")
        .attr("rx", 3)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.map}</strong><br/>🛡️ Defense Win Rate: ${extractNumber(d.def_win_rate)}%`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    
    svg.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .style("fill", "#ccc")
        .style("font-size", "11px");
    
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%"))
        .style("color", "#ccc");
    
    // Legend
    svg.append("rect").attr("x", w - 130).attr("y", -25).attr("width", 12).attr("height", 12).attr("fill", "#ff4655").attr("rx", 2);
    svg.append("text").attr("x", w - 115).attr("y", -15).text("Attack").style("fill", "#ccc").style("font-size", "11px");
    svg.append("rect").attr("x", w - 65).attr("y", -25).attr("width", 12).attr("height", 12).attr("fill", "#2a9d8f").attr("rx", 2);
    svg.append("text").attr("x", w - 50).attr("y", -15).text("Defense").style("fill", "#ccc").style("font-size", "11px");
}

// Draw pie chart
function drawMapPlayedChart(data) {
    if (!data || data.length === 0) {
        showPlaceholder("mapChart", "No map data available");
        return;
    }
    
    clearContainer("mapChart");
    
    const container = document.getElementById("mapChart");
    const containerWidth = container.clientWidth - 40;
    const size = Math.min(containerWidth, 500);
    const radius = size / 2 - 50;
    
    const svg = d3.select("#mapChart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", size)
        .attr("viewBox", `0 0 ${size + 120} ${size}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${size / 2 + 20},${size / 2})`);
    
    const mapData = data.map(d => ({
        map: d.map,
        played: extractPlayedCount(d.played)
    }));
    
    const totalPlayed = d3.sum(mapData, m => m.played);
    const pie = d3.pie().value(d => d.played).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const arcs = pie(mapData);
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    
    svg.selectAll("path")
        .data(arcs)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.map))
        .attr("stroke", "#1a1a3a")
        .attr("stroke-width", 2)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.data.map}</strong><br/>📊 Played: ${d.data.played.toLocaleString()}<br/>📈 ${((d.data.played / totalPlayed) * 100).toFixed(1)}%`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    
    const legendX = radius + 25;
    let legendY = -radius + 20;
    
    arcs.forEach((d, i) => {
        svg.append("rect")
            .attr("x", legendX)
            .attr("y", legendY + i * 22)
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(d.data.map))
            .attr("rx", 2);
        svg.append("text")
            .attr("x", legendX + 18)
            .attr("y", legendY + i * 22 + 10)
            .text(d.data.map)
            .style("fill", "#ccc")
            .style("font-size", "10px");
    });
}

// Draw conversion chart
function drawMapConversionChart(data) {
    if (!data || data.length === 0) {
        showPlaceholder("mapChart", "No map data available");
        return;
    }
    
    clearContainer("mapChart");
    
    const container = document.getElementById("mapChart");
    const containerWidth = container.clientWidth - 40;
    const w = Math.min(containerWidth, 800);
    const chartHeight = 450;
    const m = { top: 60, right: 60, bottom: 80, left: 70 };
    
    const svg = d3.select("#mapChart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", chartHeight + m.top + m.bottom)
        .attr("viewBox", `0 0 ${w + m.left + m.right} ${chartHeight + m.top + m.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${m.left},${m.top})`);
    
    const x = d3.scaleBand()
        .domain(data.map(d => d.map))
        .range([0, w])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([70, 100])
        .range([chartHeight, 0]);
    
    svg.selectAll(".atk-conv-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.map))
        .attr("y", d => y(extractNumber(d.second_round_conversion_atk)))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => Math.max(0, chartHeight - y(extractNumber(d.second_round_conversion_atk))))
        .attr("fill", "#ff4655")
        .attr("rx", 3)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.map}</strong><br/>⚔️ Attack 2nd Round: ${extractNumber(d.second_round_conversion_atk)}%`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    
    svg.selectAll(".def-conv-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.map) + x.bandwidth() / 2)
        .attr("y", d => y(extractNumber(d.second_round_conversion_def)))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => Math.max(0, chartHeight - y(extractNumber(d.second_round_conversion_def))))
        .attr("fill", "#2a9d8f")
        .attr("rx", 3)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.map}</strong><br/>🛡️ Defense 2nd Round: ${extractNumber(d.second_round_conversion_def)}%`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    
    svg.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .style("fill", "#ccc");
    
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%"))
        .style("color", "#ccc");
    
    svg.append("rect").attr("x", w - 180).attr("y", -25).attr("width", 12).attr("height", 12).attr("fill", "#ff4655").attr("rx", 2);
    svg.append("text").attr("x", w - 165).attr("y", -15).text("Attack Conv.").style("fill", "#ccc").style("font-size", "10px");
    svg.append("rect").attr("x", w - 85).attr("y", -25).attr("width", 12).attr("height", 12).attr("fill", "#2a9d8f").attr("rx", 2);
    svg.append("text").attr("x", w - 70).attr("y", -15).text("Defense Conv.").style("fill", "#ccc").style("font-size", "10px");
}

// Update map insights
function updateMapInsights(data) {
    if (!data || data.length === 0) {
        document.getElementById("mapInsights").innerHTML = '<div class="insight-item">No data available</div>';
        return;
    }
    
    const mostPlayed = data.reduce((max,d) => {
        const played = extractPlayedCount(d.played);
        return played > extractPlayedCount(max.played) ? d : max;
    }, data[0]);
    
    const avgAtkWin = (data.reduce((sum,d) => sum + extractNumber(d.atk_win_rate), 0) / data.length).toFixed(1);
    
    document.getElementById("mapInsights").innerHTML = `
        <div class="insight-item"><div class="value">${mostPlayed.map}</div><div class="label">Most Played Map (${extractPlayedCount(mostPlayed.played).toLocaleString()} rounds)</div></div>
        <div class="insight-item"><div class="value">${avgAtkWin}%</div><div class="label">Avg Attack Win Rate</div></div>
    `;
}

// Main render function for maps
function renderMaps() {
    console.log("🔵 renderMaps called");
    const data = getData("maps");
    console.log("Maps data:", data);
    
    if (data.length === 0) {
        showPlaceholder("mapChart", "No maps.csv loaded. Make sure the file exists in the data folder.");
        document.getElementById("mapInsights").innerHTML = '<div class="insight-item">Waiting for data...</div>';
        return;
    }
    
    if (currentMapChartType === "winrate") drawMapWinRateChart(data);
    else if (currentMapChartType === "played") drawMapPlayedChart(data);
    else if (currentMapChartType === "conversion") drawMapConversionChart(data);
    
    updateMapInsights(data);
}

console.log("✅ maps.js loaded successfully");