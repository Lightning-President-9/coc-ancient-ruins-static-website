function renderGraphs(graphs) {

    const container = document.getElementById("charts-container");

    container.innerHTML = "";

    if (!graphs || graphs.length === 0) {
        container.innerHTML = `
            <div class="alert-message">
                No graphs found.
            </div>
        `;
        return;
    }

    graphs.forEach((graph, index) => {

        const chart = document.createElement("div");

        chart.className = "chart";

        chart.id = `chart-${index}`;

        container.appendChild(chart);

        Plotly.newPlot(
            chart,
            graph.figure.data,
            graph.figure.layout,
            {
                responsive: true,
                displaylogo: false
            }
        );

    });
}