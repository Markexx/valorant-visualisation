// Global data stores
let agentsData = [];
let mapsData = [];
let playersData = [];
let teamsData = [];

let currentAgentSort = "pick_rate";
let currentAgentMetric = "rating";
let currentMapChartType = "winrate";
let currentPlayerMetric = "rating";
let currentTeamSort = "maps_won%";

let countryFilter = "all";
let teamFilter = "all";

// Chart dimensions
const width = 500;
const height = 400;
const margin = { top: 25, right: 30, bottom: 60, left: 65 };

// DOM Elements
const agentsFile = document.getElementById("agentsFile");
const mapsFile = document.getElementById("mapsFile");
const playersFile = document.getElementById("playersFile");
const teamsFile = document.getElementById("teamsFile");
const fileStatus = document.getElementById("fileStatus");
const tabs = document.getElementById("tabs");

// File counters
let loadedFiles = {
    agents: false,
    maps: false,
    players: false,
    teams: false
};

// Event listeners for file uploads
agentsFile.addEventListener("change", (e) => loadCSV(e.target.files[0], "agents"));
mapsFile.addEventListener("change", (e) => loadCSV(e.target.files[0], "maps"));
playersFile.addEventListener("change", (e) => loadCSV(e.target.files[0], "players"));
teamsFile.addEventListener("change", (e) => loadCSV(e.target.files[0], "teams"));

function loadCSV(file, type) {
    if (!file) return;
    
    updateFileStatus(`Loading ${file.name}...`, "#ffd700");
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        parseCSV(csvContent, type);
    };
    reader.readAsText(file);
}

function parseCSV(csvContent, type) {
    const rows = csvContent.split("\n");
    const headers = rows[0].split(",").map(h => h.trim().replace(/"/g, ''));
    
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
        if (rows[i].trim() === "") continue;
        
        // Handle quoted values properly
        let row = rows[i];
        let values = [];
        let inQuote = false;
        let current = "";
        
        for (let char of row) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        const item = {};
        for (let j = 0; j < headers.length; j++) {
            let val = values[j] || "";
            // Remove quotes if present
            val = val.replace(/^"|"$/g, '');
            
            if (headers[j] !== "agent" && headers[j] !== "map" && 
                headers[j] !== "player" && headers[j] !== "team" &&
                headers[j] !== "country") {
                // Try to parse as number
                if (val.includes("%")) {
                    val = parseFloat(val.replace("%", ""));
                } else {
                    const num = parseFloat(val);
                    item[headers[j]] = isNaN(num) ? val : num;
                    continue;
                }
            }
            item[headers[j]] = val;
        }
        if (Object.keys(item).length > 1) data.push(item);
    }
    
    // Store data
    switch(type) {
        case "agents":
            agentsData = data;
            loadedFiles.agents = true;
            break;
        case "maps":
            mapsData = data;
            loadedFiles.maps = true;
            break;
        case "players":
            playersData = data;
            loadedFiles.players = true;
            updatePlayerFilters();
            break;
        case "teams":
            teamsData = data;
            loadedFiles.teams = true;
            break;
    }
    
    updateFileStatus(`✅ Loaded: ${data.length} records from ${type}.csv`, "#00ff88");
    
    // Show tabs if at least one file is loaded
    if (loadedFiles.agents || loadedFiles.maps || loadedFiles.players || loadedFiles.teams) {
        tabs.style.display = "flex";
    }
    
    // Render active tab
    renderActiveTab();
}

function updateFileStatus(message, color) {
    fileStatus.innerHTML = `<span style="color: ${color}">${message}</span>`;
}

function renderActiveTab() {
    const activeTab = document.querySelector(".tab-btn.active").dataset.tab;
    switch(activeTab) {
        case "agents":
            if (agentsData.length) renderAgents();
            else showPlaceholder("agents", "No agents.csv loaded");
            break;
        case "maps":
            if (mapsData.length) renderMaps();
            else showPlaceholder("maps", "No maps.csv loaded");
            break;
        case "players":
            if (playersData.length) renderPlayers();
            else showPlaceholder("players", "No players.csv loaded");
            break;
        case "teams":
            if (teamsData.length) renderTeams();
            else showPlaceholder("teams", "No teams.csv loaded");
            break;
    }
}

function showPlaceholder(tab, message) {
    const containers = ["agentBarChart", "agentScatterPlot", "mapChart", "playerHistogram", "playerTop10", "teamChart"];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div style="text-align:center; padding:100px; color:#888;">${message}</div>`;
    });
}

// ==================== AGENTS VISUALIZATION ====================
function renderAgents() {
    const sorted = sortAgentsData(agentsData, currentAgentSort);
    drawAgentBarChart(sorted);
    drawAgentScatterPlot(agentsData, currentAgentMetric);
    updateAgentInsights(agentsData);
}

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

function drawAgentBarChart(data) {
    const svg = d3.select("#agentBarChart").html("")
        .append("svg").attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(data.map(d => d.agent)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.pick_rate) + 5]).range([height, 0]);
    const colorScale = d3.scaleLinear().domain([0, 50, 80]).range(["#3a86ff", "#ffbe0b", "#ff4655"]);
    
    svg.selectAll(".bar").data(data).enter()
        .append("rect").attr("class", "bar")
        .attr("x", d => x(d.agent)).attr("y", d => y(d.pick_rate))
        .attr("width", x.bandwidth()).attr("height", d => height - y(d.pick_rate))
        .attr("fill", d => colorScale(d.pick_rate)).attr("rx", 4)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.agent}</strong><br/>📊 Pick Rate: ${d.pick_rate}%<br/>⭐ Rating: ${d.rating}<br/>🔫 K/D: ${d["K/D"]}<br/>💥 ACS: ${d.ACS}`))
        .on("mousemove", moveTooltip).on("mouseout", hideTooltip);
    
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x))
        .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end").style("fill", "#ccc");
    svg.append("g").call(d3.axisLeft(y).ticks(6)).style("color", "#ccc");
}

function drawAgentScatterPlot(data, metric) {
    const svg = d3.select("#agentScatterPlot").html("")
        .append("svg").attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.pick_rate) + 5]).range([0, width]);
    const yDomain = d3.extent(data, d => d[metric]);
    const y = d3.scaleLinear().domain([yDomain[0] - 0.05, yDomain[1] + 0.05]).range([height, 0]);
    
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(6)).style("color", "#ccc");
    svg.append("g").call(d3.axisLeft(y).ticks(6)).style("color", "#ccc");
    
    svg.selectAll(".scatter-dot").data(data).enter()
        .append("circle").attr("class", "scatter-dot")
        .attr("cx", d => x(d.pick_rate)).attr("cy", d => y(d[metric]))
        .attr("r", 7).attr("fill", d => d.pick_rate > 50 ? "#ff4655" : "#ff8c00").attr("opacity", 0.8)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.agent}</strong><br/>📊 Pick Rate: ${d.pick_rate}%<br/>⭐ ${metric}: ${d[metric]}`))
        .on("mousemove", moveTooltip).on("mouseout", hideTooltip);
    
    svg.append("text").attr("x", width/2).attr("y", height+40).attr("text-anchor", "middle").style("fill", "#ff8c00").text("Pick Rate (%)");
}

function updateAgentInsights(data) {
    const topPick = data.reduce((max,d) => d.pick_rate > max.pick_rate ? d : max, data[0]);
    const topRating = data.reduce((max,d) => d.rating > max.rating ? d : max, data[0]);
    const topKD = data.reduce((max,d) => d["K/D"] > max["K/D"] ? d : max, data[0]);
    const avgPick = (data.reduce((sum,d) => sum + d.pick_rate,0)/data.length).toFixed(1);
    
    document.getElementById("agentInsights").innerHTML = `
        <div class="insight-item"><div class="value">${topPick.agent}</div><div class="label">Most Picked (${topPick.pick_rate}%)</div></div>
        <div class="insight-item"><div class="value">${topRating.agent}</div><div class="label">Highest Rating (${topRating.rating})</div></div>
        <div class="insight-item"><div class="value">${topKD.agent}</div><div class="label">Best K/D (${topKD["K/D"]})</div></div>
        <div class="insight-item"><div class="value">${avgPick}%</div><div class="label">Avg Pick Rate</div></div>
    `;
}

// ==================== MAPS VISUALIZATION ====================
function renderMaps() {
    if (currentMapChartType === "winrate") drawMapWinRateChart();
    else if (currentMapChartType === "played") drawMapPlayedChart();
    else if (currentMapChartType === "conversion") drawMapConversionChart();
    updateMapInsights();
}

function drawMapWinRateChart() {
    const svg = d3.select("#mapChart").html("")
        .append("svg").attr("width", width + margin.left + margin.right + 200)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(mapsData.map(d => d.map)).range([0, width + 150]).padding(0.3);
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    
    mapsData.forEach((d, i) => {
        const xPos = x(d.map);
        svg.append("rect").attr("x", xPos).attr("y", y(d.atk_win_rate)).attr("width", x.bandwidth()/2).attr("height", height - y(d.atk_win_rate)).attr("fill", "#ff4655").attr("rx", 3);
        svg.append("rect").attr("x", xPos + x.bandwidth()/2).attr("y", y(d.def_win_rate)).attr("width", x.bandwidth()/2).attr("height", height - y(d.def_win_rate)).attr("fill", "#2a9d8f").attr("rx", 3);
    });
    
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-30)").style("text-anchor", "end").style("fill", "#ccc");
    svg.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%")).style("color", "#ccc");
    svg.append("text").attr("x", width/2+75).attr("y", -10).attr("text-anchor", "middle").style("fill", "#ff8c00").text("Attack vs Defense Win Rate by Map");
}

function drawMapPlayedChart() {
    const svg = d3.select("#mapChart").html("")
        .append("svg").attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const pie = d3.pie().value(d => d.played).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(Math.min(width, height)/2);
    const arcs = pie(mapsData);
    
    const g = svg.append("g").attr("transform", `translate(${width/2},${height/2})`);
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    
    g.selectAll("path").data(arcs).enter()
        .append("path").attr("d", arc).attr("fill", d => color(d.data.map))
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.data.map}</strong><br/>📊 Played: ${d.data.played.toLocaleString()} (${((d.data.played/d3.sum(mapsData, m=>m.played))*100).toFixed(1)}%)`))
        .on("mousemove", moveTooltip).on("mouseout", hideTooltip);
    
    svg.append("text").attr("x", width/2).attr("y", -10).attr("text-anchor", "middle").style("fill", "#ff8c00").text("Matches Played Distribution");
}

function drawMapConversionChart() {
    const svg = d3.select("#mapChart").html("")
        .append("svg").attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(mapsData.map(d => d.map)).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([70, 100]).range([height, 0]);
    
    mapsData.forEach(d => {
        const xPos = x(d.map);
        svg.append("rect").attr("x", xPos).attr("y", y(d.second_round_conversion_atk)).attr("width", x.bandwidth()/2).attr("height", height - y(d.second_round_conversion_atk)).attr("fill", "#ff4655").attr("rx", 3);
        svg.append("rect").attr("x", xPos + x.bandwidth()/2).attr("y", y(d.second_round_conversion_def)).attr("width", x.bandwidth()/2).attr("height", height - y(d.second_round_conversion_def)).attr("fill", "#2a9d8f").attr("rx", 3);
    });
    
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-30)").style("text-anchor", "end").style("fill", "#ccc");
    svg.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%")).style("color", "#ccc");
}

function updateMapInsights() {
    const mostPlayed = mapsData.reduce((max,d) => d.played > max.played ? d : max, mapsData[0]);
    const mostBalanced = mapsData.reduce((min,d) => Math.abs(d.atk_win_rate - d.def_win_rate) < Math.abs(min.atk_win_rate - min.def_win_rate) ? d : min, mapsData[0]);
    const avgAtkWin = (mapsData.reduce((sum,d) => sum + d.atk_win_rate,0)/mapsData.length).toFixed(1);
    
    document.getElementById("mapInsights").innerHTML = `
        <div class="insight-item"><div class="value">${mostPlayed.map}</div><div class="label">Most Played Map (${mostPlayed.played.toLocaleString()} rounds)</div></div>
        <div class="insight-item"><div class="value">${mostBalanced.map}</div><div class="label">Most Balanced (${Math.abs(mostBalanced.atk_win_rate - mostBalanced.def_win_rate).toFixed(1)}% diff)</div></div>
        <div class="insight-item"><div class="value">${avgAtkWin}%</div><div class="label">Avg Attack Win Rate</div></div>
    `;
}

// ==================== PLAYERS VISUALIZATION ====================
function updatePlayerFilters() {
    const countries = [...new Set(playersData.map(p => p.country).filter(c => c && c !== "null"))];
    const teams = [...new Set(playersData.map(p => p.team).filter(t => t && t !== "null"))];
    
    const countrySelect = document.getElementById("countryFilter");
    const teamSelect = document.getElementById("teamFilter");
    
    countrySelect.innerHTML = '<option value="all">All Countries</option>' + countries.map(c => `<option value="${c}">${c.toUpperCase()}</option>`).join("");
    teamSelect.innerHTML = '<option value="all">All Teams</option>' + teams.slice(0, 50).map(t => `<option value="${t}">${t}</option>`).join("");
}

function renderPlayers() {
    let filtered = [...playersData];
    if (countryFilter !== "all") filtered = filtered.filter(p => p.country === countryFilter);
    if (teamFilter !== "all") filtered = filtered.filter(p => p.team === teamFilter);
    
    drawPlayerHistogram(filtered);
    drawPlayerTop10(filtered);
    updatePlayerInsights(filtered);
}

function drawPlayerHistogram(data) {
    const metric = currentPlayerMetric;
    const values = data.map(d => d[metric]).filter(v => !isNaN(v));
    const bins = d3.range(d3.min(values), d3.max(values), (d3.max(values)-d3.min(values))/15);
    
    const histogram = d3.histogram().domain([d3.min(values), d3.max(values)]).thresholds(15);
    const binsData = histogram(values);
    
    const svg = d3.select("#playerHistogram").html("")
        .append("svg").attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleLinear().domain([d3.min(values), d3.max(values)]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(binsData, d => d.length)]).range([height, 0]);
    
    svg.selectAll(".bar").data(binsData).enter()
        .append("rect").attr("x", d => x(d.x0)).attr("y", d => y(d.length))
        .attr("width", d => x(d.x1) - x(d.x0) - 1).attr("height", d => height - y(d.length))
        .attr("fill", "#ff8c00").attr("rx", 2);
    
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(8)).style("color", "#ccc");
    svg.append("g").call(d3.axisLeft(y)).style("color", "#ccc");
}

function drawPlayerTop10(data) {
    const top10 = [...data].sort((a,b) => b.rating - a.rating).slice(0,10);
    
    const svg = d3.select("#playerTop10").html("")
        .append("svg").attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(top10.map(d => d.player)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(top10, d => d.rating) + 0.1]).range([height, 0]);
    
    svg.selectAll(".bar").data(top10).enter()
        .append("rect").attr("x", d => x(d.player)).attr("y", d => y(d.rating))
        .attr("width", x.bandwidth()).attr("height", d => height - y(d.rating))
        .attr("fill", "#ff4655").attr("rx", 4)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.player}</strong><br/>⭐ Rating: ${d.rating}<br/>🔫 K/D: ${d["K/D"]}<br/>💥 ACS: ${d.ACS}<br/>🏆 Team: ${d.team || "N/A"}`))
        .on("mousemove", moveTooltip).on("mouseout", hideTooltip);
    
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x))
        .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end").style("fill", "#ccc").style("font-size", "8px");
    svg.append("g").call(d3.axisLeft(y)).style("color", "#ccc");
}

function updatePlayerInsights(data) {
    const topPlayer = data.reduce((max,d) => d.rating > max.rating ? d : max, data[0]);
    const avgRating = (data.reduce((sum,d) => sum + d.rating,0)/data.length).toFixed(2);
    const topKDplayer = data.reduce((max,d) => d["K/D"] > max["K/D"] ? d : max, data[0]);
    
    document.getElementById("playerInsights").innerHTML = `
        <div class="insight-item"><div class="value">${topPlayer.player}</div><div class="label">Top Rating (${topPlayer.rating})</div></div>
        <div class="insight-item"><div class="value">${topKDplayer.player}</div><div class="label">Top K/D (${topKDplayer["K/D"]})</div></div>
        <div class="insight-item"><div class="value">${avgRating}</div><div class="label">Avg Rating (${data.length} players)</div></div>
    `;
}

// ==================== TEAMS VISUALIZATION ====================
function renderTeams() {
    const sorted = sortTeamsData(teamsData, currentTeamSort);
    drawTeamChart(sorted);
    updateTeamInsights(teamsData);
}

function sortTeamsData(data, sortBy) {
    const sorted = [...data];
    switch(sortBy) {
        case "maps_won%": sorted.sort((a,b) => b.maps_won_ - a.maps_won_); break;
        case "maps_played": sorted.sort((a,b) => b.maps_played - a.maps_played); break;
        case "team": sorted.sort((a,b) => a.team.localeCompare(b.team)); break;
        default: sorted.sort((a,b) => b.maps_won_ - a.maps_won_);
    }
    return sorted.slice(0, 30);
}

function drawTeamChart(data) {
    const svg = d3.select("#teamChart").html("")
        .append("svg").attr("width", width + margin.left + margin.right + 200)
        .attr("height", Math.max(400, data.length * 25) + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const barHeight = 20;
    const y = d3.scaleBand().domain(data.map(d => d.team)).range([0, data.length * barHeight]).padding(0.2);
    const x = d3.scaleLinear().domain([0, 100]).range([0, width + 150]);
    
    svg.selectAll(".team-bar").data(data).enter()
        .append("rect").attr("class", "team-bar")
        .attr("y", d => y(d.team)).attr("x", 0)
        .attr("height", y.bandwidth()).attr("width", d => x(d.maps_won_))
        .attr("fill", "#ff8c00").attr("rx", 3)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.team}</strong><br/>🏆 Maps Won: ${d.maps_won} (${d.maps_won_}%)<br/>🗺️ Matches Played: ${d.maps_played}<br/>⚔️ Attack Win: ${d.atk_won_}%<br/>🛡️ Defense Win: ${d.def_won_}%`))
        .on("mousemove", moveTooltip).on("mouseout", hideTooltip);
    
    svg.append("g").call(d3.axisLeft(y)).style("color", "#ccc").style("font-size", "9px");
    svg.append("g").attr("transform", `translate(0,${data.length * barHeight})`).call(d3.axisBottom(x).ticks(10).tickFormat(d => d + "%")).style("color", "#ccc");
}

function updateTeamInsights(data) {
    const topTeam = data.reduce((max,d) => d.maps_won_ > max.maps_won_ ? d : max, data[0]);
    const mostMaps = data.reduce((max,d) => d.maps_played > max.maps_played ? d : max, data[0]);
    const avgWin = (data.reduce((sum,d) => sum + d.maps_won_,0)/data.length).toFixed(1);
    
    document.getElementById("teamInsights").innerHTML = `
        <div class="insight-item"><div class="value">${topTeam.team}</div><div class="label">Highest Win Rate (${topTeam.maps_won_}%)</div></div>
        <div class="insight-item"><div class="value">${mostMaps.team}</div><div class="label">Most Matches Played (${mostMaps.maps_played})</div></div>
        <div class="insight-item"><div class="value">${avgWin}%</div><div class="label">Avg Team Win Rate</div></div>
    `;
}

// ==================== TOOLTIP & EVENT HANDLERS ====================
function showTooltip(event, html) {
    d3.select("#tooltip").style("opacity", 1).html(html);
}

function moveTooltip(event) {
    d3.select("#tooltip").style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
}

function hideTooltip() {
    d3.select("#tooltip").style("opacity", 0);
}

// Tab switching
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
        renderActiveTab();
    });
});

// Control event listeners
document.getElementById("agentSort")?.addEventListener("change", e => { currentAgentSort = e.target.value; renderAgents(); });
document.getElementById("agentMetric")?.addEventListener("change", e => { currentAgentMetric = e.target.value; renderAgents(); });
document.getElementById("mapChartType")?.addEventListener("change", e => { currentMapChartType = e.target.value; renderMaps(); });
document.getElementById("countryFilter")?.addEventListener("change", e => { countryFilter = e.target.value; renderPlayers(); });
document.getElementById("teamFilter")?.addEventListener("change", e => { teamFilter = e.target.value; renderPlayers(); });
document.getElementById("playerMetric")?.addEventListener("change", e => { currentPlayerMetric = e.target.value; renderPlayers(); });
document.getElementById("teamSort")?.addEventListener("change", e => { currentTeamSort = e.target.value; renderTeams(); });