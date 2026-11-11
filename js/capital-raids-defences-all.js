document.addEventListener("DOMContentLoaded", loadAllCapitalRaidDefences);

async function loadAllCapitalRaidDefences() {
	try {
		const response = await fetch("json/coc-data/capital_raid_seasons.json");

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}

		const data = await response.json();
		const seasons = data.items || [];

		renderTotalRaids(seasons);
		renderDefenceLog(seasons);
		renderDefenceDistricts(seasons);

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
		"capital-raid-all-defence-seasons-body"
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
		"capital-raid-all-defence-log-body"
	);

	if (!tbody) {
		console.error("Defence Log tbody not found");
		return;
	}

	tbody.innerHTML = "";

	seasons.forEach(season => {
		(season.defenseLog || []).forEach(log => {
			const clan = log.attacker || {};
			const row = document.createElement("tr");

			row.appendChild(createCell(season.startTime));
			row.appendChild(createCell(season.endTime));
			row.appendChild(createCell(clan.tag));
			row.appendChild(createCell(clan.name));
			row.appendChild(createCell(clan.level));
			row.appendChild(
				createBadgeCell(clan.badgeUrls?.small)
			);
			row.appendChild(createCell(log.attackCount));
			row.appendChild(createCell(log.districtCount));
			row.appendChild(createCell(log.districtsDestroyed));

			tbody.appendChild(row);
		});
	});
}

function renderDefenceDistricts(seasons) {
	const tbody = document.getElementById(
		"capital-raid-all-defence-districts-body"
	);

	if (!tbody) {
		console.error("Defence Log/Districts tbody not found");
		return;
	}

	tbody.innerHTML = "";

	seasons.forEach(season => {
		(season.defenseLog || []).forEach(log => {
			const clan = log.attacker || {};

			(log.districts || []).forEach(district => {
				const row = document.createElement("tr");

				row.appendChild(createCell(season.startTime));
				row.appendChild(createCell(season.endTime));
				row.appendChild(createCell(clan.tag));
				row.appendChild(createCell(clan.name));
				row.appendChild(
					createBadgeCell(clan.badgeUrls?.small)
				);
				row.appendChild(createCell(district.name));
				row.appendChild(
					createCell(district.districtHallLevel)
				);
				row.appendChild(
					createCell(district.destructionPercent)
				);
				row.appendChild(createCell(district.attackCount));
				row.appendChild(createCell(district.totalLooted));

				tbody.appendChild(row);
			});
		});
	});
}