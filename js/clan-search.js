document.addEventListener("DOMContentLoaded", loadClanSearchDetails);

async function loadClanSearchDetails() {
	try {
		const response = await fetch("json/coc-data/clans_search.json");

		if (!response.ok) {
			throw new Error(
				`Unable to load clans_search.json (${response.status})`
			);
		}

		const searchData = await response.json();

		const clans = Array.isArray(searchData) ?
			searchData :
			(searchData.items || []);

		if (!clans.length) {
			throw new Error(
				"No clan records were found in clans_search.json"
			);
		}

		const params = new URLSearchParams(window.location.search);
		const requestedTag = normalizeTag(params.get("tag"));

		const clan = requestedTag ?
			clans.find(item => normalizeTag(item.tag) === requestedTag) :
			clans[0];

		if (!clan) {
			throw new Error(
				`Clan ${params.get("tag")} was not found in clans_search.json`
			);
		}

		const getValue = (object, path) => {
			return path.split(".").reduce(
				(value, key) => value == null ? undefined : value[key],
				object
			);
		};

		document.querySelectorAll("[data-clan-field]").forEach(element => {
			const value = getValue(
				clan,
				element.dataset.clanField
			);

			if (element.tagName === "IMG") {
				if (value) {
					element.src = value;
				}
			} else {
				element.textContent = value == null ? "-" : value;
			}
		});

		const labelsBody = document.getElementById(
			"clan-labels-body"
		);

		if (labelsBody) {
			labelsBody.innerHTML = (clan.labels || []).map(label => `
                <tr>
                    <td>${escapeHTML(label.name ?? "-")}</td>

                    <td>
                        ${
                            label.iconUrls?.small
                                ? `<img
                                    src="${escapeAttribute(label.iconUrls.small)}"
                                    alt="Clan Badge"
                                    width="40"
                                >`
                                : "-"
                        }
                    </td>
                </tr>
            `).join("");
		}

	} catch (error) {
		console.error(
			"Clan search details loading failed:",
			error
		);
	}
}

function normalizeTag(tag) {
	return String(tag || "")
		.replace(/^#/, "")
		.trim()
		.toUpperCase();
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