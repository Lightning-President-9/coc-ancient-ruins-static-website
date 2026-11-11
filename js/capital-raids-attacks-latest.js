document.addEventListener("DOMContentLoaded", loadCapitalRaidAttacks);

async function loadCapitalRaidAttacks() {
	try {
		const response = await fetch(
			"json/coc-data/capital_raid_seasons.json"
		);

		if (!response.ok) {
			throw new Error(
				`Unable to load capital_raid_seasons.json (${response.status})`
			);
		}

		const data = await response.json();

		const seasons = Array.isArray(data) ?
			data :
			(data.items || []);

		if (!seasons.length) {
			throw new Error("No capital raid seasons were found.");
		}

		const seasonsBody = document.getElementById(
			"capital-raid-seasons-body"
		);

		if (seasonsBody) {
			seasonsBody.innerHTML = seasons.map(season => `
                <tr>
                    <td>${escapeHTML(season.state ?? "-")}</td>
                    <td>${escapeHTML(season.startTime ?? "-")}</td>
                    <td>${escapeHTML(season.endTime ?? "-")}</td>
                    <td>${escapeHTML(season.capitalTotalLoot ?? "-")}</td>
                    <td>${escapeHTML(season.raidsCompleted ?? "-")}</td>
                    <td>${escapeHTML(season.totalAttacks ?? "-")}</td>
                    <td>${escapeHTML(season.enemyDistrictsDestroyed ?? "-")}</td>
                    <td>${escapeHTML(season.offensiveReward ?? "-")}</td>
                    <td>${escapeHTML(season.defensiveReward ?? "-")}</td>
                </tr>
            `).join("");
		}

		const membersBody = document.getElementById(
			"capital-raid-members-body"
		);

		if (membersBody) {
			const memberRows = [];

			seasons.forEach(season => {
				(season.members || []).forEach(member => {
					memberRows.push(`
                        <tr>
                            <td>${escapeHTML(season.startTime ?? "-")}</td>
                            <td>${escapeHTML(season.endTime ?? "-")}</td>
                            <td>${escapeHTML(member.tag ?? "-")}</td>
                            <td>${escapeHTML(member.name ?? "-")}</td>
                            <td>${escapeHTML(member.attacks ?? "-")}</td>
                            <td>${escapeHTML(member.capitalResourcesLooted ?? "-")}</td>
                        </tr>
                    `);
				});
			});

			membersBody.innerHTML = memberRows.join("");
		}

		const attackLogBody = document.getElementById(
			"capital-raid-attack-log-body"
		);

		if (attackLogBody) {
			const attackRows = [];

			seasons.forEach(season => {
				(season.attackLog || []).forEach(log => {
					(log.districts || []).forEach(district => {
						(district.attacks || []).forEach(attack => {
							attackRows.push(`
                                <tr>
                                    <td>${escapeHTML(season.startTime ?? "-")}</td>
                                    <td>${escapeHTML(season.endTime ?? "-")}</td>
                                    <td>${escapeHTML(log.defender?.tag ?? "-")}</td>
                                    <td>${escapeHTML(log.defender?.name ?? "-")}</td>

                                    <td>
                                        ${
                                            log.defender?.badgeUrls?.small
                                                ? `<img
                                                    src="${escapeAttribute(log.defender.badgeUrls.small)}"
                                                    alt="Clan Badge"
                                                    width="40"
                                                >`
                                                : "-"
                                        }
                                    </td>

                                    <td>${escapeHTML(district.name ?? "-")}</td>
                                    <td>${escapeHTML(attack.attacker?.tag ?? "-")}</td>
                                    <td>${escapeHTML(attack.attacker?.name ?? "-")}</td>
                                    <td>${escapeHTML(attack.destructionPercent ?? "-")}</td>
                                    <td>${escapeHTML(attack.stars ?? "-")}</td>
                                </tr>
                            `);
						});
					});
				});
			});

			attackLogBody.innerHTML = attackRows.join("");
		}

	} catch (error) {
		console.error(
			"Capital raid attacks loading failed:",
			error
		);
	}
}

function escapeHTML(value) {
	return String(value).replace(/[&<>"']/g, character => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;"
	})[character]);
}

function escapeAttribute(value) {
	return escapeHTML(value);
}