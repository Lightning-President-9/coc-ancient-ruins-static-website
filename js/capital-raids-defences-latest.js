document.addEventListener("DOMContentLoaded", loadCapitalRaidDefences);

async function loadCapitalRaidDefences() {
	try {
		const response = await fetch("json/coc-data/capital_raid_seasons.json");

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}

		const data = await response.json();
		const seasons = Array.isArray(data.items) ? data.items : [];

		renderTotalRaids(seasons);
		renderDefenceLog(seasons);

	} catch (error) {
		console.error("Capital Raid Defence data loading error:", error);
	}
}

function createCell(value) {
	const td = document.createElement("td");
	td.textContent = value ?? "-";
	return td;
}

function createBadgeCell(url) {
	const td = document.createElement("td");

	if (url) {
		const img = document.createElement("img");
		img.src = url;
		img.alt = "Clan Badge";
		img.width = 40;
		td.appendChild(img);
	} else {
		td.textContent = "-";
	}

	return td;
}

function renderTotalRaids(seasons) {
	const tbody = document.getElementById(
		"capital-raid-defence-seasons-body"
	);

	if (!tbody) {
		console.error("Total Raids tbody not found");
		return;
	}

	tbody.innerHTML = "";

	seasons.forEach(season => {
		const row = document.createElement("tr");

		[
			season.state,
			season.startTime,
			season.endTime,
			season.capitalTotalLoot,
			season.raidsCompleted,
			season.totalAttacks,
			season.enemyDistrictsDestroyed,
			season.offensiveReward,
			season.defensiveReward
		].forEach(value => {
			row.appendChild(createCell(value));
		});

		tbody.appendChild(row);
	});
}

function renderDefenceLog(seasons) {
	const tbody = document.getElementById(
		"capital-raid-defence-log-body"
	);

	if (!tbody) {
		console.error("Defence Log tbody not found");
		return;
	}

	tbody.innerHTML = "";

	seasons.forEach(season => {

		(season.defenseLog || []).forEach(log => {

			const attackerClan = log.attacker || {};

			(log.districts || []).forEach(district => {

				const row = document.createElement("tr");

				row.appendChild(createCell(season.startTime));
				row.appendChild(createCell(season.endTime));

				row.appendChild(createCell(attackerClan.tag));
				row.appendChild(createCell(attackerClan.name));

				row.appendChild(
					createBadgeCell(attackerClan.badgeUrls?.small)
				);

				row.appendChild(createCell(district.name));

				row.appendChild(createCell(attackerClan.tag));
				row.appendChild(createCell(attackerClan.name));

				row.appendChild(
					createCell(district.destructionPercent)
				);

				tbody.appendChild(row);
			});
		});
	});
}