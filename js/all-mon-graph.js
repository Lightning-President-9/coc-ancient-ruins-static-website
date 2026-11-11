document.addEventListener("DOMContentLoaded", loadAllMonthGraphs);

async function loadAllMonthGraphs() {

	const container =
		document.getElementById("charts-container");

	container.innerHTML = "";

	try {

		await loadGraphFolder(
			"json/all_month/summary/",
			container
		);

		await loadGraphFolder(
			"json/all_month/heatmap/",
			container
		);

	} catch (error) {

		console.error(
			"Error loading all month graphs:",
			error
		);

		container.innerHTML = `
            <div class="alert-message">
                Unable to load graphs.
            </div>
        `;

	}

}

async function loadGraphFolder(folder, container) {

	const indexResponse =
		await fetch(`${folder}index.json`);

	if (!indexResponse.ok) {

		throw new Error(
			`Unable to load ${folder}index.json`
		);

	}

	const indexData =
		await indexResponse.json();

	if (!indexData.graphs ||
		indexData.graphs.length === 0) {

		return;

	}

	for (const graph of indexData.graphs) {

		const graphResponse =
			await fetch(
				`${folder}${graph.file}`
			);

		if (!graphResponse.ok) {

			console.error(
				`Unable to load ${folder}${graph.file}`
			);

			continue;

		}

		const figure =
			await graphResponse.json();

		const chart =
			document.createElement("div");

		chart.className = "chart";

		container.appendChild(chart);

		Plotly.newPlot(
			chart,
			figure.data,
			figure.layout, {
				responsive: true,
				displaylogo: false
			}
		);

	}

}