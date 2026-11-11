# Clash of Clans (Ancient Ruins Clan) – Static Website

## Overview

Welcome to the **Clash of Clans (Ancient Ruins Clan) Static Website** repository!

This project is a static implementation of the original [Ancient Ruins Clan Website](https://coc-ancient-ruins-website.onrender.com/). It recreates most of the website's features using HTML, CSS, JavaScript, JSON, and Plotly, without requiring a Python/Flask backend or a database at runtime.

The primary objective of this project is to make clan statistics, historical records, performance analytics, and interactive dashboards accessible through a static architecture.

Unlike the original website, where data was retrieved through backend routes and database operations, this version uses pre-generated JSON files to store and serve all the required information.

**Note:** The Player Report feature and Flasgger (Swagger API documentation) have not been implemented in this static version.

## Static vs Original Website

| Feature | Original Website | Static Website |
|---|---|---|
| Member Data | Supported | Supported |
| Former Member Data | Supported | Supported |
| Clan Score & Rankings | Supported | Supported |
| Search & Sort | Supported | Supported |
| Data Export | Supported | Supported |
| Member Graphs | Supported | Supported |
| Former Member Graphs | Supported | Supported |
| All Month Analysis | Supported | Supported |
| AI Predictions | Supported | Supported |
| KMeans Clustering | Supported | Supported |
| Player Dashboard | Supported | Supported |
| KARSB Chatbot | Python-based | JavaScript-based |
| Player Report | Supported | Not implemented |
| Swagger / Flasgger | Supported | Not implemented |
| Database Backend | PostgreSQL | Not required |
| Runtime Data Storage | Database / API / JSON | JSON files |

## Data Storage & Architecture

All website data is stored in JSON files, eliminating the need for a live database connection or backend API during website execution.

The JSON-based architecture handles the following data:

### 1. Table Data

JSON files contain the datasets required to populate:
- Current Clan Members
- Former Clan Members
- Top Clan Contributors
- COC DATA
- Performance History Table

JavaScript dynamically fetches the corresponding JSON data and renders it into HTML tables.

### 2. Graph Data

All Plotly graph figures are pre-generated and stored as JSON files.

The following graph categories are supported:

- `mem` – Clan Members Graphs
- `fmem` – Former Members Graphs
- `all-mon-ana` – All Month Analysis Graphs
- `ai-prediction` – AI Prediction Graphs
- `ai-cluster` – KMeans-based AI Cluster Analysis

Instead of generating graphs dynamically through Python, the static website fetches the required Plotly figure JSON and renders it using JavaScript.

### 3. Month & Year-wise Graph Retrieval

A dedicated `index.json` file is maintained for each graph category.

These index files are responsible for:
- Maintaining information about available graph files.
- Keeping track of the number of graph figures available for a particular month or year.
- Helping JavaScript retrieve the correct graph files based on the selected month and year.

The graph filenames contain the corresponding month and year information. JavaScript uses the filenames and their associated index data to identify and fetch the appropriate figures.

This approach avoids unnecessary requests and makes historical graph retrieval more organized and efficient.

### 4. Player Dashboard Data

A dedicated `players.json` file is used to initialize the player selection dropdown in the Player Dashboard.

This file provides the list of available players, allowing users to select an individual player.

The dashboard retrieves the relevant player statistics and visualizations from the stored JSON data.

### 5. Clash of Clans API Data

Clan-related information retrieved from the Clash of Clans API is stored in JSON files.

The static website supports the following sections:

- **Clan Details**
- **Clan Search Results**
- **Capital Raid Seasons**
- **War Log**
- **Clan Players**

This allows users to access clan information without making live API requests every time the website loads.

## KARSB Chatbot

KARSB (Knowledge-based Ancient Ruins Statistics Bot) is a lightweight, rule-based conversational assistant designed to help users explore and understand clan performance statistics.

In the original website, the chatbot functionality was distributed across multiple Python files.

For the static implementation, the entire chatbot logic has been consolidated into a single JavaScript file:

`ai-chat.js`

This removes the dependency on the Python chatbot backend and allows KARSB to operate directly in the browser.

## JavaScript Structure

Dedicated JavaScript files are used to handle different website functionalities.

These scripts are responsible for:
- Fetching the correct JSON datasets.
- Populating HTML tables.
- Retrieving Plotly graph figures.
- Handling month and year selection.
- Loading player dashboard information.
- Rendering interactive visualizations.
- Managing chatbot interactions.
- Handling table searching, sorting, and exporting.

Separating these responsibilities into dedicated JavaScript files keeps the project organized, modular, and easier to maintain.

## Technologies Used

- **HTML5** – Website structure.
- **CSS3** – Styling and responsive layouts.
- **JavaScript** – Dynamic content loading and frontend functionality.
- **JSON** – Static data storage and retrieval.
- **Plotly.js** – Interactive graphs, heatmaps, and visualizations.
- **GitHub** – Source code and static data management.

## Original Website

This repository is the static implementation of the original Ancient Ruins Clan Website.

Visit the original website to explore its complete functionality, including features that are not currently available in the static version.

**[Clash of Clans (Ancient Ruins Clan) Website](https://coc-ancient-ruins-website.onrender.com/)**

## Advantages of the Static Implementation

- No Python or Flask server is required at runtime.
- No PostgreSQL database connection is required.
- Data can be accessed directly from JSON files.
- Pre-generated Plotly figures eliminate the need for backend graph generation.
- Historical graphs can be retrieved using month and year indexes.
- KARSB operates entirely through JavaScript.
- Reduced backend complexity and easier deployment.

## Disclaimers

- This material is unofficial and is not endorsed by Supercell.
- Clash of Clans is a trademark of Supercell.
- For more information, see the [Supercell Fan Content Policy](https://www.supercell.com/fan-content-policy).

## License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for details.