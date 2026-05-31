let currentTeamSort = "maps_won%";

function getWinPercentage(team) {
    const val = team["maps_won%"];
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace('%', '')) || 0;
    return 0;
}

function getMapsPlayed(team) {
    return team.maps_played || 0;
}

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

function drawTeamChart(data) {
    if (!data || data.length === 0) {
        showPlaceholder("teamChart", "No team data available");
        return;
    }
    
    const container = document.getElementById("teamChart");
    const containerWidth = container.clientWidth - 40;
    const w = Math.min(containerWidth, 700);
    const barHeight = 28;
    const chartHeight = Math.max(400, data.length * barHeight);
    const m = { top: 50, right: 60, bottom: 60, left: 160 };
    
    let svg = d3.select("#teamChart").select("svg");
    let isFirstRender = svg.empty();
    
    if (isFirstRender) {
        svg = d3.select("#teamChart")
            .append("svg")
            .attr("width", "100%")
            .attr("height", chartHeight + m.top + m.bottom)
            .attr("viewBox", `0 0 ${w + m.left + m.right} ${chartHeight + m.top + m.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${m.left},${m.top})`);
    } else {
        svg = d3.select("#teamChart svg g");
        svg.selectAll(".team-label").remove();
    }
    
    const y = d3.scaleBand()
        .domain(data.map(d => d.team.length > 22 ? d.team.substring(0, 20) + "..." : d.team))
        .range([0, data.length * barHeight])
        .padding(0.2);
    
    const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, w]);
    
    svg.selectAll(".y-axis-team").remove();
    svg.append("g")
        .attr("class", "y-axis-team")
        .call(d3.axisLeft(y))
        .style("color", "#ccc")
        .style("font-size", "9px");
    
    svg.selectAll(".x-axis-team").remove();
    svg.append("g")
        .attr("class", "x-axis-team")
        .attr("transform", `translate(0,${data.length * barHeight})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d => d + "%"))
        .style("color", "#ccc");
    
    if (isFirstRender) {
        svg.append("text")
            .attr("class", "x-label-team")
            .attr("x", w / 2)
            .attr("y", data.length * barHeight + 40)
            .attr("text-anchor", "middle")
            .style("fill", "#ff8c00")
            .style("font-size", "12px")
            .text("Match Win Percentage (%)");
        
        svg.append("text")
            .attr("class", "title-team")
            .attr("x", w / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .style("fill", "#ff8c00")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Team Performance by Match Win Rate");
    }
    
    const bars = svg.selectAll(".team-bar").data(data, d => d.team);
    
    bars.exit()
        .transition().duration(500)
        .attr("width", 0)
        .remove();
    
    bars.enter()
        .append("rect")
        .attr("class", "team-bar")
        .attr("y", d => y(d.team.length > 22 ? d.team.substring(0, 20) + "..." : d.team))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", 0)
        .attr("fill", "#ff8c00")
        .attr("rx", 4)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.team}</strong><br/>🏆 Win Rate: ${getWinPercentage(d)}%<br/>🎮 Matches Played: ${getMapsPlayed(d)}<br/>🏆 Matches Won: ${d.maps_won || 0}`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip)
        .transition().duration(500)
        .attr("width", d => x(getWinPercentage(d)));
    
    bars.transition().duration(500)
        .attr("y", d => y(d.team.length > 22 ? d.team.substring(0, 20) + "..." : d.team))
        .attr("width", d => x(getWinPercentage(d)))
        .attr("height", y.bandwidth());
    
    const labels = svg.selectAll(".team-label").data(data, d => d.team);
    
    labels.exit()
        .transition().duration(500)
        .attr("opacity", 0)
        .remove();
    
    labels.enter()
        .append("text")
        .attr("class", "team-label")
        .attr("x", d => x(getWinPercentage(d)) + 5)
        .attr("y", d => y(d.team.length > 22 ? d.team.substring(0, 20) + "..." : d.team) + y.bandwidth() / 2 + 4)
        .attr("opacity", 0)
        .text(d => getWinPercentage(d) + "%")
        .style("fill", "#ffd700")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .transition().duration(500)
        .attr("opacity", 1);
    
    labels.transition().duration(500)
        .attr("x", d => x(getWinPercentage(d)) + 5)
        .attr("y", d => y(d.team.length > 22 ? d.team.substring(0, 20) + "..." : d.team) + y.bandwidth() / 2 + 4)
        .text(d => getWinPercentage(d) + "%");
}

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

function renderTeams() {
    const allData = getData("teams");
    console.log("Teams data loaded:", allData.length);
    
    if (allData.length === 0) {
        showPlaceholder("teamChart", "No teams.csv loaded.");
        document.getElementById("teamInsights").innerHTML = '<div class="insight-item">Waiting for data...</div>';
        return;
    }
    
    const sortedData = sortTeamsData(allData, currentTeamSort);
    drawTeamChart(sortedData);
    updateTeamInsights(allData);
}

document.addEventListener("DOMContentLoaded", () => {
    const teamSort = document.getElementById("teamSort");
    if (teamSort) {
        teamSort.addEventListener("change", (e) => {
            currentTeamSort = e.target.value;
            renderTeams();
        });
    }
});
