# Valorant Complete Analytics Dashboard

Interactive dashboard for visualizing Valorant statistics including agents, maps, players and teams.

## Data Source
- Kaggle: Valorant stats (thespike.gg)
- Collected: April 14, 2022

## Features

### Agents Tab
- Bar chart showing pick rate by agent
- Scatter plot showing pick rate vs rating/K/D/ACS/ADR/KPR
- Sortable by pick rate, rating, K/D, or agent name

### Maps Tab
- Attack vs Defense win rate by map
- Maps played distribution (pie chart)
- Second round conversion rates

### Players Tab
- Histogram of player ratings/ACS/K-D/ADR
- Top 10 players by rating
- Filter by country and team

### Teams Tab
- Horizontal bar chart of team win rates
- Sort by win percentage, matches played, or team name

## Technologies Used
- HTML5
- CSS3
- JavaScript
- D3.js v7

valorant-dashboard/
├── index.html          # Main HTML file
├── css/style.css       # Styling
├── js/                 # JavaScript modules
│   ├── utils.js        # Shared helper functions
│   ├── dataLoader.js   # CSV loading
│   ├── agents.js       # Agents visualizations
│   ├── maps.js         # Maps visualizations
│   ├── players.js      # Players visualizations
│   ├── teams.js        # Teams visualizations
│   └── main.js         # Main initialization
└── data/               # CSV data files
