document.addEventListener("DOMContentLoaded", initializePlayerProfiles);

function safeFilename(name) {
	name = name.trim().replace(/ /g, "_");
	name = name.replace(/[^A-Za-z0-9_]/g, "");

	return `${name}.json`;
}

async function initializePlayerProfiles() {
	const selector = document.getElementById("player-selector");

	if (!selector) {
		console.error("Player selector not found.");
		return;
	}

	selector.addEventListener("change", async function() {
		const filename = selector.value;

		if (filename) {
			await loadPlayerProfile(filename);
		}
	});

	await loadPlayerList(selector);
}

async function loadPlayerList(selector) {
	try {
		const response = await fetch("json/coc-data/clan_members.json");

		if (!response.ok) {
			throw new Error(
				`Unable to load clan_members.json: ${response.status}`
			);
		}

		const data = await response.json();
		const players = Array.isArray(data.items) ? data.items : [];

		selector.replaceChildren();

		players
			.filter(player => player && player.name)
			.forEach(player => {
				const option = document.createElement("option");

				option.value = safeFilename(player.name);
				option.textContent = player.name;

				selector.appendChild(option);
			});

		if (selector.options.length > 0) {
			selector.selectedIndex = 0;
			await loadPlayerProfile(selector.value);
		} else {
			console.error("No players found.");
		}

	} catch (error) {
		console.error("Player list loading error:", error);
	}
}

async function loadPlayerProfile(filename) {
	try {
		const response = await fetch(
			`json/coc-data/clan_players/${encodeURIComponent(filename)}`
		);

		if (!response.ok) {
			throw new Error(
				`Unable to load ${filename}: HTTP ${response.status}`
			);
		}

		const player = await response.json();

		renderOverview(player);
		renderClan(player);
		renderLeague(player);
		renderAchievements(player);

		renderCollection(
			"player-hero-equipment-body",
			player.heroEquipment,
			["name", "level", "maxLevel", "village"]
		);

		renderCollection(
			"player-spells-body",
			player.spells,
			["name", "level", "maxLevel", "village"]
		);

		renderCollection(
			"player-troops-body",
			player.troops,
			["name", "level", "maxLevel", "village"]
		);

		renderHeroes(player);
		renderLabels(player);
		renderPlayerHouse(player);

		const heading = document.getElementById("player-profile-title");

		if (heading) {
			heading.textContent =
				`${player.name || filename.replace(".json", "")} - Player Profile`;
		}

	} catch (error) {
		console.error("Player profile loading error:", error);
		clearProfileTables();
	}
}

function clearProfileTables() {
	const tableIds = [
		"player-overview-body",
		"player-clan-body",
		"player-league-body",
		"player-achievements-body",
		"player-hero-equipment-body",
		"player-spells-body",
		"player-troops-body",
		"player-heroes-body",
		"player-labels-body",
		"player-house-elements-body"
	];

	tableIds.forEach(id => {
		const tbody = document.getElementById(id);

		if (tbody) {
			tbody.replaceChildren();
		}
	});
}

function cell(value) {
	const td = document.createElement("td");

	if (value === null || value === undefined || value === "") {
		td.textContent = "-";
	} else {
		td.textContent = value;
	}

	return td;
}

function imageCell(url, alt = "") {
	const td = document.createElement("td");

	if (url) {
		const img = document.createElement("img");

		img.src = url;
		img.alt = alt;
		img.loading = "lazy";
		img.style.maxWidth = "40px";

		td.appendChild(img);
	} else {
		td.textContent = "-";
	}

	return td;
}

function setRow(tbodyId, values) {
	const tbody = document.getElementById(tbodyId);

	if (!tbody) return;

	const tr = document.createElement("tr");

	values.forEach(value => {
		if (value && value.__image) {
			tr.appendChild(
				imageCell(value.url, value.alt)
			);
		} else {
			tr.appendChild(cell(value));
		}
	});

	tbody.appendChild(tr);
}

function appendEmptyRow(
	tbodyId,
	columnCount,
	message = "No data available"
) {
	const tbody = document.getElementById(tbodyId);

	if (!tbody) return;

	const tr = document.createElement("tr");
	const td = document.createElement("td");

	td.colSpan = columnCount;
	td.textContent = message;

	tr.appendChild(td);
	tbody.appendChild(tr);
}

function renderOverview(player) {
	const tbody = document.getElementById("player-overview-body");

	if (!tbody) return;

	tbody.replaceChildren();

	const values = [
		player.name,
		player.tag,
		player.townHallLevel,
		player.townHallWeaponLevel,
		player.expLevel,
		player.trophies,
		player.bestTrophies,
		player.warStars,
		player.attackWins,
		player.defenseWins,
		player.role,
		player.warPreference,
		player.donations,
		player.donationsReceived,
		player.clanCapitalContributions
	];

	setRow("player-overview-body", values);
}

function renderClan(player) {
	const tbody = document.getElementById("player-clan-body");

	if (!tbody) return;

	tbody.replaceChildren();

	const clan = player.clan || {};

	setRow("player-clan-body", [
		clan.tag,
		clan.name,
		clan.clanLevel,
		{
			__image: true,
			url: clan.badgeUrls?.small,
			alt: "Clan Badge"
		}
	]);
}

function renderLeague(player) {
	const tbody = document.getElementById("player-league-body");

	if (!tbody) return;

	tbody.replaceChildren();

	const league = player.leagueTier || {};
	const builderLeague = player.builderBaseLeague || {};

	setRow("player-league-body", [
		league.name,
		{
			__image: true,
			url: league.iconUrls?.small,
			alt: "League"
		},
		builderLeague.name
	]);
}

function renderAchievements(player) {
	const tbody = document.getElementById("player-achievements-body");

	if (!tbody) return;

	tbody.replaceChildren();

	const achievements = player.achievements || [];

	if (!achievements.length) {
		appendEmptyRow("player-achievements-body", 7);
		return;
	}

	achievements.forEach(achievement => {
		setRow("player-achievements-body", [
			achievement.name,
			achievement.stars,
			achievement.value,
			achievement.target,
			achievement.info,
			achievement.completionInfo,
			achievement.village
		]);
	});
}

function renderCollection(tbodyId, collection, fields) {
	const tbody = document.getElementById(tbodyId);

	if (!tbody) return;

	tbody.replaceChildren();

	if (!Array.isArray(collection) || collection.length === 0) {
		appendEmptyRow(tbodyId, fields.length);
		return;
	}

	collection.forEach(item => {
		setRow(
			tbodyId,
			fields.map(field => item?.[field])
		);
	});
}

function renderHeroes(player) {
	const tbody = document.getElementById("player-heroes-body");

	if (!tbody) return;

	tbody.replaceChildren();

	const heroes = player.heroes || [];

	if (!heroes.length) {
		appendEmptyRow("player-heroes-body", 5);
		return;
	}

	heroes.forEach(hero => {
		const equipment = Array.isArray(hero.equipment) ?
			hero.equipment.map(item => item.name).join(", ") :
			"-";

		setRow("player-heroes-body", [
			hero.name,
			hero.level,
			hero.maxLevel,
			hero.village,
			equipment
		]);
	});
}

function renderLabels(player) {
	const tbody = document.getElementById("player-labels-body");

	if (!tbody) return;

	tbody.replaceChildren();

	const labels = player.labels || [];

	if (!labels.length) {
		appendEmptyRow("player-labels-body", 3);
		return;
	}

	labels.forEach(label => {
		setRow("player-labels-body", [
			label.id,
			label.name,
			{
				__image: true,
				url: label.iconUrls?.small,
				alt: label.name
			}
		]);
	});
}

function renderPlayerHouse(player) {
	const tbody = document.getElementById("player-house-elements-body");

	if (!tbody) return;

	tbody.replaceChildren();

	const elements = player.playerHouse?.elements || [];

	if (!elements.length) {
		appendEmptyRow("player-house-elements-body", 2);
		return;
	}

	elements.forEach(element => {
		setRow("player-house-elements-body", [
			element.type,
			element.id
		]);
	});
}