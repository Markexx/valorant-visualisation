// ==================== TEAMS MODULE ====================

let currentTeamSort = "maps_won%";

// Helper: Get win percentage - ključ se zove "maps_won%" (sa znakom %)
function getWinPercentage(team) {
    // Tvoj parser koristi originalni naziv kolone "maps_won%"
    const val = team["maps_won%"];
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace('%', '')) || 0;
    return 0;
}

// Helper: Get matches played
function getMapsPlayed(team) {
    return team.maps_played || 0;
}

// Sort teams data
function sortTeamsData(data, sortBy) {
    const sorted = [...data];
    switch(sortBy) {
        case "maps_won%": 
            sorted.sort((a,b) => getWinPercentage(b) - getWinPercentage(a)); 
            break;
        case "maps_played": 
            sorted.sort((a,b) => getMapsPlayed(b) - getMapsPlayed(a)); 
            break;
        case "team": 
            sorted.sort((a,b) => a.team.localeCompare(b.team)); 
            break;
        default: 
            sorted.sort((a,b) => getWinPercentage(b) - getWinPercentage(a));
    }
    return sorted.slice(0, 30);
}

// Draw horizontal bar chart
function drawTeamChart(data) {
    if (!data || data.length === 0) {
        showPlaceholder("teamChart", "No team data available");
        return;
    }
    
    clearContainer("teamChart");
    
    const container = document.getElementById("teamChart");
    const containerWidth = container.clientWidth - 40;
    const w = Math.min(containerWidth, 700);
    const barHeight = 28;
    const chartHeight = Math.max(400, data.length * barHeight);
    const m = { top: 50, right: 60, bottom: 60, left: 160 };
    
    const svg = d3.select("#teamChart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", chartHeight + m.top + m.bottom)
        .attr("viewBox", `0 0 ${w + m.left + m.right} ${chartHeight + m.top + m.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${m.left},${m.top})`);
    
    const y = d3.scaleBand()
        .domain(data.map(d => d.team.length > 22 ? d.team.substring(0, 20) + "..." : d.team))
        .range([0, data.length * barHeight])
        .padding(0.2);
    
    const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, w]);
    
    // Bars
    svg.selectAll(".team-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "team-bar")
        .attr("y", d => y(d.team.length > 22 ? d.team.substring(0, 20) + "..." : d.team))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", d => x(getWinPercentage(d)))
        .attr("fill", "#ff8c00")
        .attr("rx", 4)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.team}</strong><br/>🏆 Win Rate: ${getWinPercentage(d)}%<br/>🗺️ Matches Played: ${getMapsPlayed(d)}<br/>🏆 Matches Won: ${d.maps_won || 0}`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    
    // Value labels
    svg.selectAll(".team-label")
        .data(data)
        .enter()
        .append("text")
        .attr("x", d => x(getWinPercentage(d)) + 5)
        .attr("y", d => y(d.team.length > 22 ? d.team.substring(0, 20) + "..." : d.team) + y.bandwidth() / 2 + 4)
        .text(d => getWinPercentage(d) + "%")
        .style("fill", "#ffd700")
        .style("font-size", "10px");
    
    // Y axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .style("color", "#ccc")
        .style("font-size", "9px");
    
    // X axis
    svg.append("g")
        .attr("transform", `translate(0,${data.length * barHeight})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d => d + "%"))
        .style("color", "#ccc");
    
    // X axis label
    svg.append("text")
        .attr("x", w / 2)
        .attr("y", data.length * barHeight + 40)
        .attr("text-anchor", "middle")
        .style("fill", "#ff8c00")
        .style("font-size", "12px")
        .text("Map Win Percentage (%)");
    
    // Title
    svg.append("text")
        .attr("x", w / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("fill", "#ff8c00")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Team Performance by Match Win Rate");
}

// Update team insights
function updateTeamInsights(data) {
    if (!data || data.length === 0) {
        document.getElementById("teamInsights").innerHTML = '<div class="insight-item">No data available</div>';
        return;
    }
    
    const topTeam = data.reduce((max,d) => getWinPercentage(d) > getWinPercentage(max) ? d : max, data[0]);
    const mostMaps = data.reduce((max,d) => getMapsPlayed(d) > getMapsPlayed(max) ? d : max, data[0]);
    const avgWin = (data.reduce((sum,d) => sum + getWinPercentage(d), 0) / data.length).toFixed(1);
    
    document.getElementById("teamInsights").innerHTML = `
        <div class="insight-item"><div class="value">${topTeam.team}</div><div class="label">Highest Win Rate (${getWinPercentage(topTeam)}%)</div></div>
        <div class="insight-item"><div class="value">${mostMaps.team}</div><div class="label">Most Matches Played (${getMapsPlayed(mostMaps)})</div></div>
        <div class="insight-item"><div class="value">${avgWin}%</div><div class="label">Avg Team Win Rate (${data.length} teams)</div></div>
    `;
}

// Main render function
function renderTeams() {
    const allData = getData("teams");
    console.log("Teams data loaded:", allData.length);
    
    // Log first team to debug
    if (allData.length > 0) {
        console.log("Sample team:", allData[0]);
        console.log("Win percentage from maps_won%:", allData[0]["maps_won%"]);
        console.log("Win percentage via function:", getWinPercentage(allData[0]));
    }
    
    if (allData.length === 0) {
        showPlaceholder("teamChart", "No teams.csv loaded. Make sure the file exists in the data folder.");
        document.getElementById("teamInsights").innerHTML = '<div class="insight-item">Waiting for data...</div>';
        return;
    }
    
    const sortedData = sortTeamsData(allData, currentTeamSort);
    drawTeamChart(sortedData);
    updateTeamInsights(allData);
}

// Add event listener for sort dropdown
document.addEventListener("DOMContentLoaded", () => {
    const teamSort = document.getElementById("teamSort");
    if (teamSort) {
        teamSort.addEventListener("change", (e) => {
            currentTeamSort = e.target.value;
            renderTeams();
        });
    }
});