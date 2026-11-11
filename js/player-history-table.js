const HISTORY_TABLE = ".main-table";

function getHistoryTable() {

	const table =
		document.querySelector(
			"#performance-table"
		);

	return table;

}

function getPlayerName() {

	const playerElement =
		document.getElementById(
			"player-name"
		);

	if (playerElement) {

		const name =
			playerElement.textContent.trim();

		if (
			name &&
			name !== "Loading..."
		) {

			return name;

		}

	}

	return "player";

}

function getSafePlayerName() {

	return getPlayerName()
		.replace(/\s+/g, "_")
		.replace(/[^\w-]/g, "");

}

function downloadFile(
	data,
	filename,
	mimeType
) {

	const blob =
		new Blob(
			[data], {
				type: mimeType
			}
		);

	const url =
		URL.createObjectURL(blob);

	const link =
		document.createElement("a");

	link.href = url;

	link.download = filename;

	document.body.appendChild(link);

	link.click();

	document.body.removeChild(link);

	setTimeout(
		() => {

			URL.revokeObjectURL(url);

		},
		100
	);

}

function tableToJSON() {

	const table =
		getHistoryTable();

	if (!table) {

		console.error(
			"Performance table not found!"
		);

		return "[]";

	}

	const headers = [
			...table.querySelectorAll(
				"thead th"
			)
		]
		.map(
			th =>
			th.textContent
			.replace(/[↑↓↕]/g, "")
			.trim()
			.toLowerCase()
			.replace(/\s+/g, "")
		);

	const rows = [];

	table
		.querySelectorAll(
			"tbody tr"
		)
		.forEach(
			row => {

				const obj = {};

				[
					...row.cells
				]
				.forEach(
					(cell, index) => {

						obj[
								headers[index]
							] =
							cell.textContent.trim();

					}
				);

				rows.push(obj);

			}
		);

	return JSON.stringify(
		rows,
		null,
		4
	);

}

function exportHistoryJSON() {

	const json =
		tableToJSON();

	const filename =
		`${getSafePlayerName()}_monthly_history.json`;

	downloadFile(
		json,
		filename,
		"application/json"
	);

}

function tableToCSV() {

	const table =
		getHistoryTable();

	if (!table) {

		console.error(
			"Performance table not found!"
		);

		return "";

	}

	const csv = [];

	const headers = [
			...table.querySelectorAll(
				"thead th"
			)
		]
		.map(
			th => {

				const value =
					th.textContent
					.replace(/[↑↓↕]/g, "")
					.trim()
					.toLowerCase()
					.replace(/\s+/g, "")
					.replace(
						/"/g,
						'""'
					);

				return `"${value}"`;

			}
		);

	csv.push(
		headers.join(",")
	);

	table
		.querySelectorAll(
			"tbody tr"
		)
		.forEach(
			row => {

				const values = [
						...row.cells
					]
					.map(
						cell => {

							const value =
								cell.textContent
								.trim()
								.replace(
									/"/g,
									'""'
								);

							return `"${value}"`;

						}
					);

				csv.push(
					values.join(",")
				);

			}
		);

	return csv.join("\n");

}

function exportHistoryCSV() {

	const csv =
		tableToCSV();

	const filename =
		`${getSafePlayerName()}_monthly_history.csv`;

	downloadFile(
		csv,
		filename,
		"text/csv;charset=utf-8;"
	);

}

function loadSheetJS(callback) {

	if (window.XLSX) {

		callback();

		return;

	}

	const script =
		document.createElement(
			"script"
		);

	script.src =
		"https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";

	script.onload =
		function() {

			callback();

		};

	script.onerror =
		function() {

			console.error(
				"Failed to load SheetJS"
			);

			alert(
				"Excel export library could not be loaded."
			);

		};

	document.head.appendChild(
		script
	);

}

function exportHistoryExcel() {

	const table =
		getHistoryTable();

	if (!table) {

		console.error(
			"Performance table not found!"
		);

		return;

	}

	loadSheetJS(
		function() {

			const workbook =
				XLSX.utils.book_new();

			const headers = [
					...table.querySelectorAll(
						"thead th"
					)
				]
				.map(
					th =>
					th.textContent
					.replace(/[↑↓↕]/g, "")
					.trim()
					.toLowerCase()
					.replace(/\s+/g, "")
				);

			const data = [];

			data.push(
				headers
			);

			table
				.querySelectorAll(
					"tbody tr"
				)
				.forEach(
					row => {

						data.push(
							[
								...row.cells
							]
							.map(
								cell =>
								cell.textContent.trim()
							)
						);

					}
				);

			const worksheet =
				XLSX.utils.aoa_to_sheet(
					data
				);

			XLSX.utils.book_append_sheet(
				workbook,
				worksheet,
				"Monthly History"
			);

			const filename =
				`${getSafePlayerName()}_monthly_history.xlsx`;


			XLSX.writeFile(
				workbook,
				filename
			);

		}
	);

}

function exportHistoryToPDF() {

	const table =
		getHistoryTable();

	if (!table) {

		console.error(
			"Performance table not found!"
		);

		alert(
			"Performance table not found."
		);

		return;

	}

	const playerName =
		getPlayerName();

	const pdfTable =
		table.cloneNode(true);

	pdfTable
		.querySelectorAll(
			"thead th"
		)
		.forEach(
			header => {

				header.textContent =
					header.textContent
					.replace(
						/[↑↓↕]/g,
						""
					)
					.trim();

			}
		);

	const iframe =
		document.createElement(
			"iframe"
		);

	iframe.style.position =
		"fixed";

	iframe.style.right =
		"0";

	iframe.style.bottom =
		"0";

	iframe.style.width =
		"0";

	iframe.style.height =
		"0";

	iframe.style.border =
		"0";

	document.body.appendChild(
		iframe
	);

	const pdfDocument =
		iframe.contentWindow.document;

	pdfDocument.open();

	pdfDocument.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                ${playerName}
                Monthly Performance History
            </title>

            <style>

                body {

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    padding: 30px;

                    background: white;

                    color: #222;

                }

                h1 {

                    text-align: center;

                    margin-bottom: 25px;

                }

                table {

                    width: 100%;

                    border-collapse:
                        collapse;

                }

                th {

                    background: #222;

                    color: white;

                    padding: 10px;

                    border:
                        1px solid #888;

                }

                td {

                    padding: 8px;

                    border:
                        1px solid #888;

                    text-align: center;

                }

                tr:nth-child(even) {

                    background:
                        #f2f2f2;

                }

            </style>

        </head>

        <body>

            <h1>
                ${playerName}'s
                MONTHLY PERFORMANCE HISTORY
            </h1>

            ${pdfTable.outerHTML}

        </body>

        </html>

    `);

	pdfDocument.close();

	setTimeout(
		function() {

			iframe.contentWindow.focus();

			iframe.contentWindow.print();

		},
		500
	);

	setTimeout(
		function() {

			document.body.removeChild(
				iframe
			);

		},
		2000
	);

}

let currentSortColumn = -1;

let currentSortDirection = "asc";

function parseMonthValue(value) {

	const monthNames = {

		JAN: 0,
		FEB: 1,
		MAR: 2,
		APR: 3,
		MAY: 4,
		JUN: 5,
		JUL: 6,
		AUG: 7,
		SEP: 8,
		OCT: 9,
		NOV: 10,
		DEC: 11

	};

	const match =
		value
		.trim()
		.toUpperCase()
		.match(
			/^([A-Z]{3})-[A-Z]{3}_(\d{4})$/
		);

	if (!match) {

		return NaN;

	}

	const month =
		monthNames[
			match[1]
		];

	const year =
		parseInt(
			match[2],
			10
		);

	if (
		month === undefined ||
		isNaN(year)
	) {

		return NaN;

	}

	return new Date(
		year,
		month,
		1
	).getTime();

}

function isNumericColumn(columnIndex) {

	return columnIndex >= 1;

}

function getSortValue(
	value,
	columnIndex
) {

	value =
		value
		.replace(/[↑↓↕]/g, "")
		.trim();

	if (columnIndex === 0) {

		return parseMonthValue(
			value
		);

	}

	if (
		isNumericColumn(
			columnIndex
		)
	) {

		const number =
			parseFloat(
				value.replace(
					/,/g,
					""
				)
			);

		return isNaN(number) ?
			0 :
			number;

	}

	return value.toLowerCase();

}

function sortHistoryTable(
	columnIndex
) {

	const table =
		getHistoryTable();

	if (!table) {

		return;

	}

	const tbody =
		table.querySelector(
			"tbody"
		);

	if (!tbody) {

		return;

	}

	const rows = [
		...tbody.querySelectorAll(
			"tr"
		)
	];

	if (
		currentSortColumn ===
		columnIndex
	) {

		currentSortDirection =
			currentSortDirection ===
			"asc" ?
			"desc" :
			"asc";

	} else {

		currentSortColumn =
			columnIndex;

		currentSortDirection =
			"asc";

	}

	rows.sort(
		function(
			rowA,
			rowB
		) {

			const valueA =
				getSortValue(
					rowA.cells[
						columnIndex
					]
					?.textContent ||
					"",
					columnIndex
				);

			const valueB =
				getSortValue(
					rowB.cells[
						columnIndex
					]
					?.textContent ||
					"",
					columnIndex
				);

			if (
				typeof valueA ===
				"number" &&
				typeof valueB ===
				"number"
			) {

				if (
					isNaN(valueA) &&
					isNaN(valueB)
				) {

					return 0;

				}

				if (isNaN(valueA)) {

					return 1;

				}

				if (isNaN(valueB)) {

					return -1;

				}

			}

			let comparison;

			if (
				typeof valueA ===
				"number" &&
				typeof valueB ===
				"number"
			) {

				comparison =
					valueA - valueB;

			} else {

				comparison =
					String(valueA)
					.localeCompare(
						String(valueB)
					);

			}

			return currentSortDirection ===
				"asc" ?
				comparison :
				-comparison;

		}
	);

	rows.forEach(
		row => {

			tbody.appendChild(
				row
			);

		}
	);

	updateSortIndicators(
		columnIndex
	);

}

function updateSortIndicators(
	activeColumn
) {

	const table =
		getHistoryTable();

	if (!table) {

		return;

	}

	const headers =
		table.querySelectorAll(
			"thead th"
		);

	headers.forEach(
		function(
			header,
			index
		) {

			header
				.textContent =
				header.textContent
				.replace(
					/\s*[↑↓↕]\s*$/,
					""
				);

			if (
				index ===
				activeColumn
			) {

				header.textContent +=
					currentSortDirection ===
					"asc" ?
					" ↑" :
					" ↓";

			} else {

				header.textContent +=
					" ↕";

			}

		}
	);

}

function initializeHistorySorting() {

	const table =
		getHistoryTable();

	if (!table) {

		console.error(
			"Performance table not found for sorting!"
		);

		return;

	}

	const headers =
		table.querySelectorAll(
			"thead th"
		);

	headers.forEach(
		function(
			header,
			index
		) {

			header.style.cursor =
				"pointer";

			header.style.userSelect =
				"none";

			header.setAttribute(
				"role",
				"button"
			);

			header.setAttribute(
				"aria-sort",
				"none"
			);

			header.addEventListener(
				"click",
				function() {

					sortHistoryTable(
						index
					);

					headers.forEach(
						function(
							otherHeader,
							otherIndex
						) {

							if (
								otherIndex ===
								index
							) {

								otherHeader.setAttribute(
									"aria-sort",
									currentSortDirection ===
									"asc" ?
									"ascending" :
									"descending"
								);

							} else {

								otherHeader.setAttribute(
									"aria-sort",
									"none"
								);

							}

						}
					);

				}
			);

		}
	);

	updateSortIndicators(
		-1
	);

}

function initializeHistoryExports() {

	const pdfButton =
		document.getElementById(
			"toPDFMainMemberTable"
		);

	const jsonButton =
		document.getElementById(
			"toJSONMainMemberTable"
		);

	const csvButton =
		document.getElementById(
			"toCSVMainMemberTable"
		);

	const excelButton =
		document.getElementById(
			"toEXCELMainMemberTable"
		);

	if (pdfButton) {

		pdfButton.addEventListener(
			"click",
			function(event) {

				event.preventDefault();

				event.stopPropagation();

				exportHistoryToPDF();

			}
		);

	}

	if (jsonButton) {

		jsonButton.addEventListener(
			"click",
			function(event) {

				event.preventDefault();

				event.stopPropagation();

				exportHistoryJSON();

			}
		);

	}

	if (csvButton) {

		csvButton.addEventListener(
			"click",
			function(event) {

				event.preventDefault();

				event.stopPropagation();

				exportHistoryCSV();

			}
		);

	}

	if (excelButton) {

		excelButton.addEventListener(
			"click",
			function(event) {

				event.preventDefault();

				event.stopPropagation();

				exportHistoryExcel();

			}
		);

	}

}

document.addEventListener(
	"DOMContentLoaded",
	function() {

		initializeHistoryExports();

		initializeHistorySorting();

	}
);