document.addEventListener("DOMContentLoaded", loadClanDetails);

async function loadClanDetails() {
	try {
		const response = await fetch("json/coc-data/clan_details.json");

		if (!response.ok) {
			throw new Error(
				`Unable to load clan_details.json (${response.status})`
			);
		}

		const clan = await response.json();

		const getValue = (object, path) => {
			return path.split(".").reduce(
				(value, key) => value == null ? undefined : value[key],
				object
			);
		};

		document.querySelectorAll("[data-clan-field]").forEach(element => {
			const value = getValue(clan, element.dataset.clanField);

			if (element.tagName === "IMG") {
				if (value) {
					element.src = value;
				}
			} else {
				element.textContent = value == null ? "-" : value;
			}
		});

		const districtsBody = document.getElementById(
			"clan-capital-districts"
		);

		if (districtsBody) {
			districtsBody.innerHTML = (
				clan.clanCapital?.districts || []
			).map(district => `
                <tr>
                    <td>${escapeHTML(district.name ?? "-")}</td>
                    <td>${escapeHTML(district.districtHallLevel ?? "-")}</td>
                </tr>
            `).join("");
		}

		const membersBody = document.getElementById(
			"clan-member-list"
		);

		if (membersBody) {
			membersBody.innerHTML = (
				clan.memberList || []
			).map(member => `
                <tr>
                    <td>
                        <a href="https://pixelcrux.com/Clash_of_Clans/Profile/App?tag=${encodeURIComponent((member.tag || "").replace(/^#/, ""))}"
                           target="_blank"
                           rel="noopener noreferrer">
                            ${escapeHTML(member.tag ?? "-")}
                        </a>
                    </td>

                    <td>
                        <a href="https://link.clashofclans.com/en/?action=OpenPlayerProfile&tag=%23${encodeURIComponent((member.tag || "").replace(/^#/, ""))}"
                           target="_blank"
                           rel="noopener noreferrer">
                            ${escapeHTML(member.name ?? "-")}
                        </a>
                    </td>

                    <td>${escapeHTML(member.role ?? "-")}</td>
                    <td>${escapeHTML(member.townHallLevel ?? "-")}</td>
                    <td>${escapeHTML(member.expLevel ?? "-")}</td>
                    <td>${escapeHTML(member.leagueTier?.name ?? "-")}</td>

                    <td>
                        ${
                            member.leagueTier?.iconUrls?.small
                                ? `<img src="${escapeAttribute(member.leagueTier.iconUrls.small)}"
                                        alt="League Badge"
                                        width="40">`
                                : "-"
                        }
                    </td>

                    <td>${escapeHTML(member.trophies ?? "-")}</td>
                    <td>${escapeHTML(member.builderBaseTrophies ?? "-")}</td>
                    <td>${escapeHTML(member.clanRank ?? "-")}</td>
                    <td>${escapeHTML(member.previousClanRank ?? "-")}</td>
                    <td>${escapeHTML(member.donations ?? "-")}</td>
                    <td>${escapeHTML(member.donationsReceived ?? "-")}</td>
                    <td>${escapeHTML(member.builderBaseLeague?.name ?? "-")}</td>
                </tr>
            `).join("");
		}

	} catch (error) {
		console.error("Clan details loading failed:", error);
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