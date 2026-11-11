document.addEventListener("DOMContentLoaded", async function() {

	const BASE_PATH = "json/ai_prediction/";

	const predictionGraphs =
		document.getElementById("predictionGraphs");

	let graphList = [];
	let loadedGraphs = [];

	async function loadJSON(file) {

		const response = await fetch(BASE_PATH + file);

		if (!response.ok) {
			throw new Error(
				`Failed to load ${file} (${response.status})`
			);
		}

		return await response.json();
	}

	async function loadIndex() {

		const indexData = await loadJSON("index.json");

		if (!indexData.graphs) {
			throw new Error(
				"index.json does not contain 'graphs'"
			);
		}

		graphList = indexData.graphs;
	}

	async function loadGraphs() {

		loadedGraphs = [];

		for (const graph of graphList) {

			const figure =
				await loadJSON(graph.file);

			loadedGraphs.push({

				id: graph.id,

				file: graph.file,

				title: graph.title,

				figure: figure

			});
		}
	}

	function getPlayersFromFigure(figure) {

		if (!figure) {
			return [];
		}

		const updatemenus =
			figure.layout &&
			figure.layout.updatemenus;

		if (
			!updatemenus ||
			updatemenus.length === 0
		) {
			return [];
		}

		const buttons =
			updatemenus[0].buttons || [];

		return buttons
			.map(button => button.label)
			.filter(label => label);
	}

	function getPlayerButton(
		figure,
		playerIndex
	) {

		const updatemenus =
			figure.layout &&
			figure.layout.updatemenus;

		if (
			!updatemenus ||
			updatemenus.length === 0
		) {
			return null;
		}

		const buttons =
			updatemenus[0].buttons || [];

		return buttons[playerIndex] || null;
	}

	function createGraphContainers() {

		predictionGraphs.innerHTML = "";

		loadedGraphs.forEach(
			(graph, graphIndex) => {

				const graphBox =
					document.createElement("div");

				graphBox.className =
					"prediction-graph";

				const graphWrapper =
					document.createElement("div");

				graphWrapper.className =
					"prediction-chart-wrapper";

				const chart =
					document.createElement("div");

				chart.id =
					`predictionGraph-${graphIndex}`;

				chart.className =
					"prediction-chart";

				const playerSelect =
					document.createElement("select");

				playerSelect.className =
					"graph-player-select";

				playerSelect.setAttribute(
					"aria-label",
					`Select player for ${graph.title}`
				);

				const players =
					getPlayersFromFigure(
						graph.figure
					);

				players.forEach(
					(player, playerIndex) => {

						const option =
							document.createElement("option");

						option.value =
							playerIndex;

						option.textContent =
							player;

						playerSelect.appendChild(
							option
						);

					}
				);

				if (players.length === 0) {

					const option =
						document.createElement("option");

					option.value = "";

					option.textContent =
						"No players available";

					playerSelect.appendChild(
						option
					);
				}

				graphWrapper.appendChild(chart);

				graphWrapper.appendChild(
					playerSelect
				);

				graphBox.appendChild(
					graphWrapper
				);

				predictionGraphs.appendChild(
					graphBox
				);

				playerSelect.addEventListener(
					"change",
					function() {

						const playerIndex =
							parseInt(
								this.value,
								10
							);

						if (
							Number.isNaN(
								playerIndex
							)
						) {
							return;
						}

						renderGraph(
							graphIndex,
							playerIndex
						);

					}
				);

			}
		);
	}

	function renderGraph(
		graphIndex,
		playerIndex
	) {

		const graph =
			loadedGraphs[graphIndex];

		if (!graph) {
			return;
		}

		const figure =
			graph.figure;

		const players =
			getPlayersFromFigure(
				figure
			);

		const playerName =
			players[playerIndex] || "";

		const playerButton =
			getPlayerButton(
				figure,
				playerIndex
			);

		if (!playerButton) {

			console.warn(
				`Player button not found for ${graph.file}`
			);

			return;
		}

		const traceUpdate =
			playerButton.args &&
			playerButton.args[0];

		const layoutUpdate =
			playerButton.args &&
			playerButton.args[1];

		let visibility = [];

		if (
			traceUpdate &&
			Array.isArray(
				traceUpdate.visible
			)
		) {

			visibility =
				traceUpdate.visible;

		}

		const traces =
			figure.data.map(
				(trace, index) => {

					const copiedTrace = {
						...trace
					};

					if (
						visibility.length >
						index
					) {

						copiedTrace.visible =
							visibility[index];

					} else {

						copiedTrace.visible =
							false;

					}

					return copiedTrace;

				}
			);

		const layout = {
			...figure.layout
		};

		layout.updatemenus = [];

		if (layoutUpdate) {
			Object.assign(
				layout,
				layoutUpdate
			);
		}

		if (graph.title) {

			layout.title = {

				text: playerName ?
					`${graph.title} - ${playerName}` :
					graph.title,

				x: 0.05,
				xanchor: "left",

				y: 0.95,
				yanchor: "top",

			};

		}

		layout.autosize = true;

		Plotly.react(

			`predictionGraph-${graphIndex}`,

			traces,

			layout,

			{
				responsive: true,


				modeBarButtonsToRemove: [
					"select2d",
					"lasso2d"
				]
			}

		);
	}

	function renderDefaultGraphs() {

		loadedGraphs.forEach(
			(graph, graphIndex) => {

				const players =
					getPlayersFromFigure(
						graph.figure
					);

				if (players.length > 0) {

					renderGraph(
						graphIndex,
						0
					);

				}

			}
		);
	}

	window.addEventListener(
		"resize",
		function() {

			loadedGraphs.forEach(
				(graph, graphIndex) => {

					const chart =
						document.getElementById(
							`predictionGraph-${graphIndex}`
						);

					if (chart) {

						Plotly.Plots.resize(
							chart
						);

					}

				}
			);

		}
	);

	async function initialize() {

		try {

			await loadIndex();

			await loadGraphs();

			createGraphContainers();

			renderDefaultGraphs();

		} catch (error) {

			console.error(
				"AI Prediction initialization failed:",
				error
			);

			predictionGraphs.innerHTML = `

                <div class="error">

                    <strong>
                        Failed to load AI Prediction data.
                    </strong>

                    <br><br>

                    ${error.message}

                </div>

            `;
		}
	}

	initialize();

});