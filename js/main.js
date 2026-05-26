// ==================== MAIN - Initialization and Tab Switching ====================

// Tab switching logic
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

// Render currently active tab
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

// Setup control event listeners
function setupControlListeners() {
    // Agents controls
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
    
    // Maps controls
    const mapChartType = document.getElementById("mapChartType");
    if (mapChartType) {
        mapChartType.addEventListener("change", e => {
            currentMapChartType = e.target.value;
            renderMaps();
        });
    }
    
    // Players controls - ISPRAVLJENO (koristi window varijable)
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
    
    // Teams controls
    const teamSort = document.getElementById("teamSort");
    if (teamSort) {
        teamSort.addEventListener("change", e => {
            currentTeamSort = e.target.value;
            renderTeams();
        });
    }
}

// Initialize the application
async function init() {
    setupTabListeners();
    setupControlListeners();
    await loadAllData();
}

// Start the app
init();