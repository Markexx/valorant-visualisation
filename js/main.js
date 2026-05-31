function setupTabListeners() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            const tabName = btn.dataset.tab;
            document.getElementById(`tab-${tabName}`).classList.add("active");
            
            renderActiveTab();
        });
    });
}

function renderActiveTab() {
    const activeTab = document.querySelector(".tab-btn.active").dataset.tab;
    
    switch(activeTab) {
        case "agents":
            renderAgents();
            break;
        case "maps":
            renderMaps();
            break;
        case "players":
            renderPlayers();
            break;
        case "teams":
            renderTeams();
            break;
    }
}

function setupControlListeners() {
    const agentSort = document.getElementById("agentSort");
    if (agentSort) {
        agentSort.addEventListener("change", e => {
            currentAgentSort = e.target.value;
            renderAgents();
        });
    }
    
    const agentMetric = document.getElementById("agentMetric");
    if (agentMetric) {
        agentMetric.addEventListener("change", e => {
            currentAgentMetric = e.target.value;
            renderAgents();
        });
    }
    
    const mapChartType = document.getElementById("mapChartType");
    if (mapChartType) {
        mapChartType.addEventListener("change", e => {
            currentMapChartType = e.target.value;
            renderMaps();
        });
    }
    
    const countryFilterSelect = document.getElementById("countryFilter");
    if (countryFilterSelect) {
        countryFilterSelect.addEventListener("change", e => {
            window.currentCountryFilter = e.target.value;
            renderPlayers();
        });
    }
    
    const teamFilterSelect = document.getElementById("teamFilter");
    if (teamFilterSelect) {
        teamFilterSelect.addEventListener("change", e => {
            window.currentTeamFilter = e.target.value;
            renderPlayers();
        });
    }
    
    const playerMetricSelect = document.getElementById("playerMetric");
    if (playerMetricSelect) {
        playerMetricSelect.addEventListener("change", e => {
            window.currentPlayerMetric = e.target.value;
            renderPlayers();
        });
    }
    
    const teamSort = document.getElementById("teamSort");
    if (teamSort) {
        teamSort.addEventListener("change", e => {
            currentTeamSort = e.target.value;
            renderTeams();
        });
    }
}

async function init() {
    setupTabListeners();
    setupControlListeners();
    await loadAllData();
}

init();
