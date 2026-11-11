document.addEventListener("DOMContentLoaded", function() {

	const yearSelect =
		document.getElementById("range-year");

	const rangeSelect =
		document.getElementById("range-select");

	const loadButton =
		document.getElementById("load-graphs");

	const chartsContainer =
		document.getElementById("charts-container");

	const statusMessage =
		document.getElementById("status-message");

	statusMessage.style.display = "none";


	function showGraphsNotAvailable() {

		chartsContainer.innerHTML = "";

		statusMessage.textContent =
			"Graphs not available.";

		statusMessage.style.display =
			"block";
	}

	async function loadClusterData() {

		const year =
			yearSelect.value;

		const range =
			rangeSelect.value;

		const basePath =
			`json/ai_cluster/${year}/${range}/`;

		chartsContainer.innerHTML = "";

		try {

			const indexResponse =
				await fetch(
					`${basePath}index.json`
				);

			if (indexResponse.status === 404) {

				showGraphsNotAvailable();

				return;
			}

			const indexData =
				await indexResponse.json();

			let graphFiles = [];

			if (
				Array.isArray(indexData)
			) {

				graphFiles =
					indexData;

			} else if (
				Array.isArray(indexData.graphs)
			) {

				graphFiles =
					indexData.graphs;

			} else if (
				Array.isArray(indexData.files)
			) {

				graphFiles =
					indexData.files;

			}

			if (
				graphFiles.length === 0
			) {

				showGraphsNotAvailable();

				return;
			}

			for (
				const graphInfo of graphFiles
			) {

				await renderGraph(
					basePath,
					graphInfo
				);

			}

			if (
				chartsContainer.children.length === 0
			) {

				showGraphsNotAvailable();

				return;
			}

			statusMessage.textContent = "";

			statusMessage.style.display =
				"none";

		} catch (error) {

			showGraphsNotAvailable();
		}
	}

	async function renderGraph(
		basePath,
		graphInfo
	) {

		let filename;

		let title;

		if (
			typeof graphInfo === "string"
		) {

			filename =
				graphInfo;

			title =
				graphInfo
				.replace(".json", "")
				.replace(/_/g, " ");

		} else {

			filename =
				graphInfo.file ||
				graphInfo.filename;


			title =
				graphInfo.title ||
				graphInfo.name ||
				filename;

		}

		const chart =
			document.createElement("div");

		chart.className =
			"chart";

		chartsContainer.appendChild(
			chart
		);

		const response =
			await fetch(
				`${basePath}${filename}`
			);

		if (!response.ok) {

			console.error(
				`${filename}: HTTP ${response.status}`
			);

			chart.remove();

			return;
		}

		const figure =
			await response.json();

		const data =
			Array.isArray(figure.data) ?
			figure.data :
			[];

		const layout =
			figure.layout ?
			{
				...figure.layout
			} :
			{};

		delete layout.width;

		delete layout.height;

		layout.autosize =
			true;

		layout.title = {

			text: title,

			x: 0.02,

			xanchor: "left",

			y: 0.96,

			yanchor: "top",

		};

		if (layout.xaxis) {

			layout.xaxis = {

				...layout.xaxis,

				automargin: true

			};

		}

		if (layout.yaxis) {

			layout.yaxis = {

				...layout.yaxis,

				automargin: true

			};

		}

		const config = {

			responsive: true,

			displaylogo: false

		};

		await Plotly.newPlot(

			chart,

			data,

			layout,

			config

		);
	}

	loadButton.addEventListener(
		"click",
		loadClusterData
	);

});