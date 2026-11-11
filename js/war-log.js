document.addEventListener("DOMContentLoaded", loadWarLog);

async function loadWarLog() {
	try {
		const response = await fetch("json/coc-data/warlog.json");

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}

		const data = await response.json();
		const wars = data.items || [];

		renderWarLog(wars);

	} catch (error) {
		console.error("War Log data loading error:", error);
	}
}

function createCell(value) {
	const td = document.createElement("td");
	td.textContent = value ?? "-";
	return td;
}

function createBadgeCell(url, altText) {
	const td = document.createElement("td");

	if (url) {
		const img = document.createElement("img");
		img.src = url;
		img.alt = altText;
		img.width = 40;
		td.appendChild(img);
	} else {
		td.textContent = "-";
	}

	return td;
}

function renderWarLog(wars) {
	const tbody = document.getElementById("war-log-body");

	if (!tbody) {
		console.error("War Log tbody not found");
		return;
	}

	tbody.innerHTML = "";

	wars.forEach(war => {
		const clan = war.clan || {};
		const opponent = war.opponent || {};
		const row = document.createElement("tr");

		row.appendChild(createCell(war.result));
		row.appendChild(createCell(war.endTime));
		row.appendChild(createCell(war.teamSize));
		row.appendChild(createCell(war.attacksPerMember));

		row.appendChild(createCell(clan.name));
		row.appendChild(createCell(clan.tag));
		row.appendChild(createCell(clan.clanLevel));
		row.appendChild(
			createBadgeCell(clan.badgeUrls?.small, "Clan Badge")
		);
		row.appendChild(createCell(clan.stars));
		row.appendChild(createCell(clan.destructionPercentage));

		row.appendChild(createCell(opponent.name));
		row.appendChild(createCell(opponent.tag));
		row.appendChild(createCell(opponent.clanLevel));
		row.appendChild(
			createBadgeCell(opponent.badgeUrls?.small, "Opponent Badge")
		);
		row.appendChild(createCell(opponent.stars));
		row.appendChild(createCell(opponent.destructionPercentage));

		tbody.appendChild(row);
	});
}