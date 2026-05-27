// ==================== PLAYERS MODULE ====================

// Global variables for filters
window.currentPlayerMetric = window.currentPlayerMetric || "rating";
window.currentCountryFilter = window.currentCountryFilter || "all";
window.currentTeamFilter = window.currentTeamFilter || "all";

// Update filter dropdowns
function updatePlayerFilters() {
    const data = getData("players");
    if (!data || data.length === 0) return;
    
    const countries = [...new Set(data.map(p => p.country).filter(c => c && c !== "null" && c !== ""))];
    const teams = [...new Set(data.map(p => p.team).filter(t => t && t !== "null" && t !== ""))];
    
    const countrySelect = document.getElementById("countryFilter");
    const teamSelect = document.getElementById("teamFilter");
    
    if (countrySelect) {
        countrySelect.innerHTML = '<option value="all">🌍 All Countries</option>' + 
            countries.slice(0, 30).map(c => `<option value="${c}">${c.toUpperCase()}</option>`).join("");
        countrySelect.value = window.currentCountryFilter;
    }
    
    if (teamSelect) {
        teamSelect.innerHTML = '<option value="all">🏆 All Teams</option>' + 
            teams.slice(0, 50).map(t => `<option value="${t}">${t}</option>`).join("");
        teamSelect.value = window.currentTeamFilter;
    }
}

// Filter players
function filterPlayers(data) {
    let filtered = [...data];
    if (window.currentCountryFilter && window.currentCountryFilter !== "all") {
        filtered = filtered.filter(p => p.country === window.currentCountryFilter);
    }
    if (window.currentTeamFilter && window.currentTeamFilter !== "all") {
        filtered = filtered.filter(p => p.team === window.currentTeamFilter);
    }
    console.log(`Filtered: ${filtered.length} of ${data.length} players`);
    return filtered;
}

// Draw histogram SA ANIMACIJOM
function drawPlayerHistogram(data) {
    // Prvo očisti placeholder ako postoji
    clearContainer("playerHistogram");
    
    if (!data || data.length === 0) {
        showPlaceholder("playerHistogram", "No players match the selected filters");
        return;
    }
    
    const metric = window.currentPlayerMetric || "rating";
    const values = data.map(d => d[metric]).filter(v => !isNaN(v) && v !== null);
    
    if (values.length === 0) {
        showPlaceholder("playerHistogram", `No valid data for metric: ${metric}`);
        return;
    }
    
    if (values.length < 3) {
        showPlaceholder("playerHistogram", `Only ${values.length} player(s) match. Not enough data for histogram.`);
        return;
    }
    
    const container = document.getElementById("playerHistogram");
    const containerWidth = container.clientWidth - 40;
    const w = Math.min(containerWidth, 500);
    const h = 400;
    const m = { top: 50, right: 30, bottom: 60, left: 60 };
    
    let svg = d3.select("#playerHistogram").select("svg");
    let isFirstRender = svg.empty();
    
    if (isFirstRender) {
        svg = d3.select("#playerHistogram")
            .append("svg")
            .attr("width", "100%")
            .attr("height", h + m.top + m.bottom)
            .attr("viewBox", `0 0 ${w + m.left + m.right} ${h + m.top + m.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${m.left},${m.top})`);
    } else {
        svg = d3.select("#playerHistogram svg g");
    }
    
    const histogram = d3.histogram()
        .domain([d3.min(values), d3.max(values)])
        .thresholds(Math.min(15, Math.floor(values.length / 4)));
    const binsData = histogram(values);
    
    const x = d3.scaleLinear()
        .domain([d3.min(values), d3.max(values)])
        .range([0, w]);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(binsData, d => d.length)])
        .range([h, 0]);
    
    // Ažuriraj X os
    svg.selectAll(".x-axis-hist").remove();
    svg.append("g")
        .attr("class", "x-axis-hist")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(8))
        .style("color", "#ccc");
    
    // Ažuriraj Y os
    svg.selectAll(".y-axis-hist").remove();
    svg.append("g")
        .attr("class", "y-axis-hist")
        .call(d3.axisLeft(y))
        .style("color", "#ccc");
    
    // Labele samo prvi put
    if (isFirstRender) {
        svg.append("text")
            .attr("class", "title-hist")
            .attr("x", w / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .style("fill", "#ff8c00")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(`Distribution of ${metric} (${values.length} players)`);
        
        svg.append("text")
            .attr("class", "x-label-hist")
            .attr("x", w / 2)
            .attr("y", h + 40)
            .attr("text-anchor", "middle")
            .style("fill", "#aaa")
            .style("font-size", "11px")
            .text(metric);
        
        svg.append("text")
            .attr("class", "y-label-hist")
            .attr("x", -h / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .style("fill", "#aaa")
            .style("font-size", "11px")
            .text("Number of Players");
    }
    
    // Ažuriraj title s brojem igrača
    svg.selectAll(".title-hist")
        .text(`Distribution of ${metric} (${values.length} players)`);
    
    // ANIMIRANI BAROVI
    const bars = svg.selectAll(".hist-bar").data(binsData);
    
    bars.exit()
        .transition().duration(500)
        .attr("height", 0)
        .attr("y", h)
        .remove();
    
    bars.enter()
        .append("rect")
        .attr("class", "hist-bar")
        .attr("x", d => x(d.x0))
        .attr("y", h)
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", 0)
        .attr("fill", "#ff8c00")
        .attr("rx", 3)
        .transition().duration(500)
        .attr("y", d => y(d.length))
        .attr("height", d => h - y(d.length));
    
    bars.transition().duration(500)
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => h - y(d.length));
}

// Draw top 10 players SA ANIMACIJOM
function drawPlayerTop10(data) {
    // Prvo očisti placeholder ako postoji
    clearContainer("playerTop10");
    
    if (!data || data.length === 0) {
        showPlaceholder("playerTop10", "No players match the selected filters");
        return;
    }
    
    const top10 = [...data]
        .filter(p => p.rating && !isNaN(p.rating))
        .sort((a,b) => b.rating - a.rating)
        .slice(0, 10);
    
    if (top10.length === 0) {
        showPlaceholder("playerTop10", "No rating data available for selected filters");
        return;
    }
    
    const container = document.getElementById("playerTop10");
    const containerWidth = container.clientWidth - 40;
    const w = Math.min(containerWidth, 500);
    const h = 400;
    const m = { top: 50, right: 30, bottom: 80, left: 70 };
    
    let svg = d3.select("#playerTop10").select("svg");
    let isFirstRender = svg.empty();
    
    if (isFirstRender) {
        svg = d3.select("#playerTop10")
            .append("svg")
            .attr("width", "100%")
            .attr("height", h + m.top + m.bottom)
            .attr("viewBox", `0 0 ${w + m.left + m.right} ${h + m.top + m.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${m.left},${m.top})`);
    } else {
        svg = d3.select("#playerTop10 svg g");
    }
    
    const x = d3.scaleBand()
        .domain(top10.map(d => d.player.length > 15 ? d.player.substring(0, 12) + "..." : d.player))
        .range([0, w])
        .padding(0.2);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(top10, d => d.rating) + 0.1])
        .range([h, 0]);
    
    // Ažuriraj X os
    svg.selectAll(".x-axis-top10").remove();
    svg.append("g")
        .attr("class", "x-axis-top10")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("fill", "#ccc")
        .style("font-size", "9px");
    
    // Ažuriraj Y os
    svg.selectAll(".y-axis-top10").remove();
    svg.append("g")
        .attr("class", "y-axis-top10")
        .call(d3.axisLeft(y))
        .style("color", "#ccc");
    
    // Labele samo prvi put
    if (isFirstRender) {
        svg.append("text")
            .attr("class", "title-top10")
            .attr("x", w / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .style("fill", "#ff8c00")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(`Top ${top10.length} Players by Rating`);
        
        svg.append("text")
            .attr("class", "x-label-top10")
            .attr("x", w / 2)
            .attr("y", h + 55)
            .attr("text-anchor", "middle")
            .style("fill", "#aaa")
            .style("font-size", "11px")
            .text("Player");
        
        svg.append("text")
            .attr("class", "y-label-top10")
            .attr("x", -h / 2)
            .attr("y", -45)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .style("fill", "#aaa")
            .style("font-size", "11px")
            .text("Rating");
    }
    
    // Ažuriraj title
    svg.selectAll(".title-top10")
        .text(`Top ${top10.length} Players by Rating`);
    
    // ANIMIRANI BAROVI
    const bars = svg.selectAll(".top10-bar").data(top10, d => d.player);
    
    bars.exit()
        .transition().duration(500)
        .attr("height", 0)
        .attr("y", h)
        .remove();
    
    bars.enter()
        .append("rect")
        .attr("class", "top10-bar")
        .attr("x", (d) => x(d.player.length > 15 ? d.player.substring(0, 12) + "..." : d.player))
        .attr("y", h)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", "#ff4655")
        .attr("rx", 4)
        .on("mouseover", (e,d) => showTooltip(e, `<strong>${d.player}</strong><br/>⭐ Rating: ${d.rating}<br/>🔫 K/D: ${d["K/D"]}<br/>💥 ACS: ${d.ACS}<br/>🏆 Team: ${d.team || "N/A"}`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip)
        .transition().duration(500)
        .attr("y", d => y(d.rating))
        .attr("height", d => h - y(d.rating));
    
    bars.transition().duration(500)
        .attr("x", (d) => x(d.player.length > 15 ? d.player.substring(0, 12) + "..." : d.player))
        .attr("y", d => y(d.rating))
        .attr("width", x.bandwidth())
        .attr("height", d => h - y(d.rating));
}

// Update player insights
function updatePlayerInsights(data) {
    if (!data || data.length === 0) {
        document.getElementById("playerInsights").innerHTML = '<div class="insight-item">No data available</div>';
        return;
    }
    
    const topPlayer = data.reduce((max,d) => d.rating > max.rating ? d : max, data[0]);
    const avgRating = (data.reduce((sum,d) => sum + d.rating, 0) / data.length).toFixed(2);
    const topKDplayer = data.reduce((max,d) => d["K/D"] > max["K/D"] ? d : max, data[0]);
    
    document.getElementById("playerInsights").innerHTML = `
        <div class="insight-item"><div class="value">${topPlayer.player}</div><div class="label">Top Rating (${topPlayer.rating})</div></div>
        <div class="insight-item"><div class="value">${topKDplayer.player}</div><div class="label">Top K/D (${topKDplayer["K/D"]})</div></div>
        <div class="insight-item"><div class="value">${avgRating}</div><div class="label">Avg Rating (${data.length} players)</div></div>
    `;
}

// Main render function
function renderPlayers() {
    console.log("🔵 renderPlayers called");
    const allData = getData("players");
    console.log(`📊 Total players: ${allData.length}`);
    
    if (allData.length === 0) {
        showPlaceholder("playerHistogram", "No players.csv loaded.");
        showPlaceholder("playerTop10", "No players.csv loaded.");
        document.getElementById("playerInsights").innerHTML = '<div class="insight-item">Waiting for data...</div>';
        return;
    }
    
    const filteredData = filterPlayers(allData);
    
    // Ako nema filtriranih podataka, prikaži placeholder za oba grafa
    if (filteredData.length === 0) {
        showPlaceholder("playerHistogram", "No players match the selected filters");
        showPlaceholder("playerTop10", "No players match the selected filters");
        updatePlayerInsights(filteredData);
        return;
    }
    
    drawPlayerHistogram(filteredData);
    drawPlayerTop10(filteredData);
    updatePlayerInsights(filteredData);
}