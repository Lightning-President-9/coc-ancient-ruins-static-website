document.addEventListener("DOMContentLoaded", loadCapitalRaidAttacks);

async function loadCapitalRaidAttacks() {
	try {
		const response = await fetch("json/coc-data/capital_raid_seasons.json");

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}

		const data = await response.json();
		const seasons = data.items || [];

		renderTotalRaids(seasons);
		renderAttackLog(seasons);
		renderAttackLogDistricts(seasons);

	} catch (error) {
		console.error("Capital Raid data loading error:", error);
	}
}

function cell(value) {
	const td = document.createElement("td");
	td.textContent = value ?? "-";
	return td;
}

function badgeCell(url) {
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
		"capital-raid-all-seasons-body"
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
		].forEach(value => row.appendChild(cell(value)));

		tbody.appendChild(row);
	});
}

function renderAttackLog(seasons) {
	const tbody = document.getElementById(
		"capital-raid-all-attack-log-body"
	);

	if (!tbody) {
		console.error("Attack Log tbody not found");
		return;
	}

	tbody.innerHTML = "";

	seasons.forEach(season => {
		(season.attackLog || []).forEach(log => {
			const defender = log.defender || {};
			const row = document.createElement("tr");

			row.appendChild(cell(season.startTime));
			row.appendChild(cell(season.endTime));
			row.appendChild(cell(defender.tag));
			row.appendChild(cell(defender.name));
			row.appendChild(cell(defender.level));
			row.appendChild(badgeCell(defender.badgeUrls?.small));
			row.appendChild(cell(log.attackCount));
			row.appendChild(cell(log.districtCount));
			row.appendChild(cell(log.districtsDestroyed));

			tbody.appendChild(row);
		});
	});
}

function renderAttackLogDistricts(seasons) {
	const tbody = document.getElementById(
		"capital-raid-all-attack-districts-body"
	);

	if (!tbody) {
		console.error("Attack Log Districts tbody not found");
		return;
	}

	tbody.innerHTML = "";

	seasons.forEach(season => {
		(season.attackLog || []).forEach(log => {
			const defender = log.defender || {};

			(log.districts || []).forEach(district => {
				const row = document.createElement("tr");

				row.appendChild(cell(season.startTime));
				row.appendChild(cell(season.endTime));
				row.appendChild(cell(defender.name));
				row.appendChild(
					badgeCell(defender.badgeUrls?.small)
				);
				row.appendChild(cell(district.name));
				row.appendChild(cell(district.districtHallLevel));
				row.appendChild(cell(district.destructionPercent));
				row.appendChild(cell(district.attackCount));
				row.appendChild(cell(district.totalLooted));

				tbody.appendChild(row);
			});
		});
	});
}