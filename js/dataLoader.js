// ==================== DATA LOADER ====================

// Global data stores
let agentsData = [];
let mapsData = [];
let playersData = [];
let teamsData = [];

let allDataLoaded = {
    agents: false,
    maps: false,
    players: false,
    teams: false
};

// Parse CSV line (handles quotes and commas properly)
function parseCSVLine(line, headers) {
    const values = [];
    let inQuote = false;
    let current = "";
    
    for (let char of line) {
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
        val = val.replace(/^"|"$/g, '');
        
        const stringFields = ["agent", "map", "player", "team", "country"];
        if (!stringFields.includes(headers[j])) {
            if (val.includes("%")) {
                item[headers[j]] = parseFloat(val.replace("%", ""));
            } else {
                const num = parseFloat(val);
                item[headers[j]] = isNaN(num) ? val : num;
            }
        } else {
            item[headers[j]] = val;
        }
    }
    return item;
}

// Parse full CSV content
function parseCSV(csvContent) {
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue;
        
        const item = parseCSVLine(lines[i], headers);
        if (Object.keys(item).length > 1) {
            data.push(item);
        }
    }
    return data;
}

// Load single CSV file
async function loadCSV(filename, dataType) {
    try {
        const response = await fetch(`data/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        
        switch(dataType) {
            case "agents":
                agentsData = parsedData;
                allDataLoaded.agents = true;
                console.log(`✅ Loaded ${parsedData.length} agents`);
                break;
            case "maps":
                mapsData = parsedData;
                allDataLoaded.maps = true;
                console.log(`✅ Loaded ${parsedData.length} maps`);
                break;
            case "players":
                playersData = parsedData;
                allDataLoaded.players = true;
                console.log(`✅ Loaded ${parsedData.length} players`);
                break;
            case "teams":
                teamsData = parsedData;
                allDataLoaded.teams = true;
                console.log(`✅ Loaded ${parsedData.length} teams`);
                break;
        }
        
        return parsedData;
    } catch (error) {
        console.error(`❌ Error loading ${filename}:`, error);
        return [];
    }
}

// Load all CSV files
async function loadAllData() {
    const loadingDiv = document.getElementById("loading");
    if (loadingDiv) loadingDiv.classList.remove("hidden");
    
    await Promise.all([
        loadCSV("agents.csv", "agents"),
        loadCSV("maps.csv", "maps"),
        loadCSV("players.csv", "players"),
        loadCSV("teams.csv", "teams")
    ]);
    
    if (loadingDiv) loadingDiv.classList.add("hidden");
    
    // Update player filters
    if (playersData.length > 0 && typeof updatePlayerFilters === 'function') {
        updatePlayerFilters();
    }
    
    // Render active tab
    if (typeof renderActiveTab === 'function') {
        renderActiveTab();
    }
}

// Get data by type
function getData(type) {
    switch(type) {
        case "agents": return agentsData;
        case "maps": return mapsData;
        case "players": return playersData;
        case "teams": return teamsData;
        default: return [];
    }
}

// Check if data is loaded
function isDataLoaded(type) {
    return allDataLoaded[type] || false;
}