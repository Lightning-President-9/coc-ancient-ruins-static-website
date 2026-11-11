const PLAYER_JSON_PATH = "/json/players/";

let currentPlayerData = null;
let currentPlayerName = "";

const METRICS = [
	"War Attack",
	"Clan Capital",
	"Clan Games",
	"Clan Games Maxed",
	"Clan Score"
];

document.addEventListener("DOMContentLoaded", async function() {

	try {

		await loadPlayerList();

	} catch (error) {

		console.error("Dashboard initialization failed:", error);

	}

});

async function loadPlayerList() {

	const selector =
		document.getElementById("player-selector");

	try {

		const response =
			await fetch("/json/players.json");

		if (!response.ok) {

			throw new Error(
				"Could not load players.json"
			);

		}

		const players =
			await response.json();


		selector.innerHTML = "";

		players.forEach(function(player) {

			const option =
				document.createElement("option");

			option.value = player;

			option.textContent = player;

			selector.appendChild(option);

		});

		selector.addEventListener(
			"change",
			function() {

				const playerName =
					selector.value;

				if (playerName) {

					loadPlayer(playerName);

				}

			}
		);

		if (players.length > 0) {

			selector.value = players[0];

			await loadPlayer(players[0]);

		}

	} catch (error) {

		console.error(
			"Error loading player list:",
			error
		);

		selector.innerHTML = `
            <option value="">
                Unable to load players
            </option>
        `;

	}

}

function playerToFilename(playerName) {

	return playerName
		.trim()
		.replace(/\s+/g, "_") +
		".json";

}

async function loadPlayer(playerName) {

	try {

		currentPlayerName = playerName;

		const filename =
			playerToFilename(playerName);

		const url =
			PLAYER_JSON_PATH + filename;

		const response =
			await fetch(url);

		if (!response.ok) {

			throw new Error(
				`HTTP ${response.status}`
			);

		}

		const data =
			await response.json();

		currentPlayerData = data;

		updateHeader(data);

		updateSummaryCards(data);

		renderTimeline(data);

		renderDonut(data);

		renderComparison(data);

		renderHeatmap(data);

		renderHistoryTable(data);

	} catch (error) {

		console.error(
			"Error loading player JSON:",
			error
		);

		showDashboardError(error);

	}

}

function updateHeader(data) {

	const player =
		data.player || {};

	const rankings =
		data.rankings || {};

	const rating =
		rankings.rating || "-";

	document.getElementById(
			"player-name"
		).textContent =
		player.name || currentPlayerName;

	document.getElementById(
			"player-rating"
		).textContent =
		rating;

	const rankData =
		rankings.ranks &&
		rankings.ranks["Clan Score"];

	if (rankData) {

		document.getElementById(
				"player-rank"
			).textContent =
			`Rank #${rankData.rank} of ${rankData.total_players}`;

	} else {

		document.getElementById(
				"player-rank"
			).textContent =
			"Rank -";

	}

}

function updateSummaryCards(data) {

	const summary =
		data.summary || {};

	const totals =
		summary.totals || {};

	const averages =
		summary.averages || {};

	const rankings =
		data.rankings || {};

	const ranks =
		rankings.ranks || {};

	updateCard(
		"warattack",
		totals["War Attack"],
		averages["War Attack"],
		ranks["War Attack"]
	);

	updateCard(
		"clancapital",
		totals["Clan Capital"],
		averages["Clan Capital"],
		ranks["Clan Capital"]
	);

	updateCard(
		"clangames",
		totals["Clan Games"],
		null,
		ranks["Clan Games"],
		summary.total_seasons
	);

	updateCard(
		"clangamesmaxed",
		totals["Clan Games Maxed"],
		null,
		ranks["Clan Games Maxed"],
		summary.total_seasons
	);

	updateCard(
		"clanscore",
		totals["Clan Score"],
		averages["Clan Score"],
		ranks["Clan Score"]
	);

}

function updateCard(
	prefix,
	total,
	average,
	rankData,
	numberOfMonths
) {

	const totalElement =
		document.getElementById(
			`${prefix}-total`
		);

	if (totalElement) {

		totalElement.textContent =
			formatNumber(total);

	}

	const rankElement =
		document.getElementById(
			`${prefix}-rank`
		);

	if (rankElement) {

		if (rankData) {

			rankElement.textContent =
				`Rank #${rankData.rank} / ${rankData.total_players}`;

		} else {

			rankElement.textContent =
				"Rank -";

		}

	}

	const averageElement =
		document.getElementById(
			`${prefix}-average`
		);

	if (averageElement) {

		if (average !== null &&
			average !== undefined) {

			averageElement.textContent =
				`Avg/Mon ${formatNumber(average)}`;

		} else {

			averageElement.textContent =
				`No. of Mon ${numberOfMonths || "-"}`;

		}

	}

	const monthsElement =
		document.getElementById(
			`${prefix}-months`
		);

	if (monthsElement) {

		monthsElement.textContent =
			`No. of Mon ${numberOfMonths || "-"}`;

	}

}

function formatNumber(value) {

	if (
		value === null ||
		value === undefined
	) {

		return "-";

	}

	if (
		typeof value === "number" &&
		!Number.isInteger(value)
	) {

		return value.toFixed(2);

	}

	return value;

}

function renderTimeline(data) {

	const graph =
		data.graphs &&
		data.graphs.timeline;

	if (!graph) {

		console.warn(
			"Timeline graph not available"
		);

		return;

	}

	Plotly.react(
		"timeline-chart",
		graph.data,
		graph.layout, {
			responsive: true,
			displaylogo: false
		}
	);

}

function renderDonut(data) {

	const graph =
		data.graphs &&
		data.graphs.donut;

	if (!graph) {

		console.warn(
			"Donut graph not available"
		);

		return;

	}

	Plotly.react(
		"donut-chart",
		graph.data,
		graph.layout, {
			responsive: true,
			displaylogo: false
		}
	);

}

function renderComparison(data) {

	const graph =
		data.graphs &&
		data.graphs.comparison;

	if (!graph) {

		console.warn(
			"Comparison graph not available"
		);

		return;

	}

	Plotly.react(
		"comparison-chart",
		graph.data,
		graph.layout, {
			responsive: true,
			displaylogo: false
		}
	);

}

function renderHeatmap(data) {

	const graph =
		data.graphs &&
		data.graphs.heatmap;

	if (!graph) {

		console.warn(
			"Heatmap graph not available"
		);

		return;

	}

	Plotly.react(
		"heatmap-chart",
		graph.data,
		graph.layout, {
			responsive: true,
			displaylogo: false
		}
	);

}

function renderHistoryTable(data) {

	const periods =
		data.periods || [];

	const metrics =
		data.metrics || {};

	const tbody =
		document.getElementById(
			"performance-table-body"
		);

	tbody.innerHTML = "";

	periods.forEach(
		function(period, index) {

			const row =
				document.createElement("tr");

			row.innerHTML = `

                <td>${formatPeriod(period)}</td>

                <td>
                    ${getMetricValue(
                        metrics["War Attack"],
                        index
                    )}
                </td>

                <td>
                    ${getMetricValue(
                        metrics["Clan Capital"],
                        index
                    )}
                </td>

                <td>
                    ${getMetricValue(
                        metrics["Clan Games"],
                        index
                    )}
                </td>

                <td>
                    ${getMetricValue(
                        metrics["Clan Games Maxed"],
                        index
                    )}
                </td>

                <td>
                    ${getMetricValue(
                        metrics["Clan Score"],
                        index
                    )}
                </td>

            `;

			tbody.appendChild(row);

		}
	);

	document.getElementById(
			"history-title"
		).textContent =
		`${currentPlayerName}'s Monthly Performance History`;

}

function getMetricValue(
	metric,
	index
) {

	if (
		!metric ||
		metric[index] === undefined ||
		metric[index] === null
	) {

		return "-";

	}

	return metric[index];

}

function formatPeriod(period) {

	if (!period) {

		return "-";

	}

	return period.replace(
		"_",
		"_"
	);

}

function showDashboardError(error) {

	console.error(error);

	document.getElementById(
			"player-name"
		).textContent =
		"Unable to Load Player";

	document.getElementById(
			"player-rating"
		).textContent =
		"!";

	document.getElementById(
			"player-rank"
		).textContent =
		"JSON data could not be loaded";

}

document
	.getElementById(
		"PerformanceTabletoJSONHistory"
	)
	.addEventListener(
		"click",
		exportJSON
	);

function exportJSON() {

	if (!currentPlayerData) {

		return;

	}

	const blob =
		new Blob(
			[
				JSON.stringify(
					currentPlayerData,
					null,
					4
				)
			], {
				type: "application/json"
			}
		);

	downloadBlob(
		blob,
		`${currentPlayerName.replace(
            /\s+/g,
            "_"
        )}_dashboard.json`
	);

}

document
	.getElementById(
		"PerformanceTabletoCSVHistory"
	)
	.addEventListener(
		"click",
		exportCSV
	);

function exportCSV() {

	if (!currentPlayerData) {

		return;

	}

	const periods =
		currentPlayerData.periods || [];

	const metrics =
		currentPlayerData.metrics || {};

	let csv =
		"Month,War Attack,Clan Capital,Clan Games,Clan Games Maxed,Clan Score\n";

	periods.forEach(
		function(period, index) {

			csv +=
				`"${period}",` +
				`${getMetricValue(
                    metrics["War Attack"],
                    index
                )},` +
				`${getMetricValue(
                    metrics["Clan Capital"],
                    index
                )},` +
				`${getMetricValue(
                    metrics["Clan Games"],
                    index
                )},` +
				`${getMetricValue(
                    metrics["Clan Games Maxed"],
                    index
                )},` +
				`${getMetricValue(
                    metrics["Clan Score"],
                    index
                )}\n`;

		}
	);

	const blob =
		new Blob(
			[csv], {
				type: "text/csv;charset=utf-8;"
			}
		);

	downloadBlob(
		blob,
		`${currentPlayerName.replace(
            /\s+/g,
            "_"
        )}_monthly_history.csv`
	);

}

function downloadBlob(
	blob,
	filename
) {

	const url =
		URL.createObjectURL(blob);

	const link =
		document.createElement("a");

	link.href = url;

	link.download = filename;

	document.body.appendChild(link);

	link.click();

	document.body.removeChild(link);

	URL.revokeObjectURL(url);

}