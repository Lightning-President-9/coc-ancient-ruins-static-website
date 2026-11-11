const datasetSelect = document.getElementById("dataset-select");

const singleMonthContainer = document.getElementById("single-month-container");

const rangeContainer = document.getElementById("range-container");

const loadButton = document.getElementById("load-graphs");

function updateUI() {

    if (datasetSelect.value === "monthly_analysis") {

        singleMonthContainer.style.display = "none";
        rangeContainer.style.display = "flex";

    } else {

        singleMonthContainer.style.display = "flex";
        rangeContainer.style.display = "none";

    }

}

datasetSelect.addEventListener("change", updateUI);

updateUI();

loadButton.addEventListener("click", async () => {

    const dataset = datasetSelect.value;
    const graphType = document.getElementById("graph-type-select").value;

    let options = {
        dataset,
        graphType
    };

    if (dataset === "monthly_analysis") {

        const months = document
    .getElementById("range-select")
    .value
    .split("-");

const year = document.getElementById("range-year").value;

options.startMonth = months[0];
options.endMonth = months[1];

options.startYear = year;
options.endYear = year;

if (months[0] === "12" && months[1] === "01") {
    options.endYear = String(Number(year) + 1);
}

    }
    else {

        options.month = document.getElementById("month-select").value;
        options.year = document.getElementById("year-select").value;

    }

    await loadGraphs(options);

});