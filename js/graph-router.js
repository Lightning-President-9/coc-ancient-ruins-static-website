async function fetchJSON(path) {

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Unable to fetch ${path}`);
    }

    return await response.json();

}

function buildFolder(options) {

    switch (options.dataset) {

        case "clan_members":

            return `json/clan_members/${options.year}/${options.month}/${options.graphType}`;

        case "former_members":

            return `json/former_members/${options.year}/${options.month}/${options.graphType}`;

        case "monthly_analysis":

            return `json/monthly_analysis/${options.startYear}_${options.startMonth}_to_${options.endYear}_${options.endMonth}/${options.graphType}`;

        default:

            throw new Error("Unknown dataset");

    }

}

async function loadGraphs(options) {

    try {

        const folder = buildFolder(options);

        const index = await fetchJSON(`${folder}/index.json`);

        const figures = [];

        for (const graph of index.graphs) {

            const figure = await fetchJSON(
                `${folder}/${graph.file}`
            );

            figures.push({
                id: graph.id,
                title: graph.title,
                figure: figure
            });

        }

        renderGraphs(figures);

    }
    catch (err) {

        console.error(err);

        document.getElementById("charts-container").innerHTML =
        `
            <div class="alert-message">
                Graphs not available.
            </div>
        `;

    }

}