(() => {
	"use strict";

	const CONFIG = {
		rawBase: "https://raw.githubusercontent.com/Lightning-President-9/ClanDataRepo/refs/heads/main",
		domains: {
			CLAN_MEMBERS: "Clan%20Members/JSON",
			CLAN_MONTHLY_ANALYSIS: "Clan%20Members/Monthly%20Analysis%20JSON",
			FORMER_CLAN_MEMBERS: "Former%20Clan%20Members/JSON",
			TOP_CLAN_CONTRIBUTORS: "Top%20Clan%20Contributors/JSON"
		},
		maxMessageLength: 500,
		cacheLimit: 32
	};

	const DOMAIN_ALLOWED_FIELDS = {
		CLAN_MEMBERS: ["war", "warattack", "clancapital", "clangames", "clangamesmaxed", "clanscore", "status"],
		CLAN_MONTHLY_ANALYSIS: ["warattack", "clancapital", "clangames", "clangamesmaxed", "clanscore"],
		FORMER_CLAN_MEMBERS: ["warattack", "clancapital", "clangames", "clangamesmaxed", "clanscore"],
		TOP_CLAN_CONTRIBUTORS: ["clanscore"]
	};
	const SUPPORTED_METRICS = ["warattack", "clancapital", "clangames", "clangamesmaxed", "clanscore"];
	const METRIC_EXPLANATIONS = {
		warattack: "Number of times attacked in war.",
		clancapital: "Number of times attacked in clan capital.",
		clangames: "Number of times participated in clan games.",
		clangamesmaxed: "Number of times maxed clan points in clan games.",
		clanscore: "Total sum of warattack, clancapital, clangames and clangamesmaxed."
	};
	const MONTHS = {
		jan: "JAN",
		january: "JAN",
		feb: "FEB",
		february: "FEB",
		mar: "MAR",
		march: "MAR",
		apr: "APR",
		april: "APR",
		may: "MAY",
		jun: "JUN",
		june: "JUN",
		jul: "JUL",
		july: "JUL",
		aug: "AUG",
		august: "AUG",
		sep: "SEP",
		sept: "SEP",
		september: "SEP",
		oct: "OCT",
		october: "OCT",
		nov: "NOV",
		november: "NOV",
		dec: "DEC",
		december: "DEC"
	};
	const SHORT_MONTHS = {
		jan: "JAN",
		feb: "FEB",
		mar: "MAR",
		apr: "APR",
		may: "MAY",
		jun: "JUN",
		jul: "JUL",
		aug: "AUG",
		sep: "SEP",
		oct: "OCT",
		nov: "NOV",
		dec: "DEC"
	};

	const cache = new Map();
	const transcript = [];
	let busy = false;

	function setStatus(message, kind = "") {
		const el = document.getElementById("data-status");
		if (!el) return;
		el.textContent = message;
		el.dataset.state = kind;
	}

	function escapeHTML(value) {
		return String(value ?? "").replace(/[&<>"']/g, c => ({
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;"
		})[c]);
	}

	function safeMarkdown(text) {
		// Markdown is optional; sanitization remains mandatory when DOMPurify is present.
		let html;
		if (window.marked && typeof window.marked.parse === "function") {
			html = window.marked.parse(String(text ?? ""));
		} else {
			html = escapeHTML(text).replace(/\n/g, "<br>");
		}
		if (window.DOMPurify && typeof window.DOMPurify.sanitize === "function") {
			return window.DOMPurify.sanitize(html);
		}
		// Conservative fallback: allow only plain text with line breaks.
		return escapeHTML(text).replace(/\n/g, "<br>");
	}

	function monthNormalize(text) {
		const lower = String(text).toLowerCase();
		const words = Object.keys(MONTHS).sort((a, b) => b.length - a.length);
		for (const a of words) {
			for (const b of words) {
				const re = new RegExp("\\b" + a + "\\b[\\s-]+\\b" + b + "\\b\\s+(20\\d{2})", "i");
				const m = lower.match(re);
				if (m) return {
					type: "range",
					value: `${MONTHS[a]}-${MONTHS[b]}_${m[1]}`
				};
			}
		}
		for (const word of words) {
			const m = lower.match(new RegExp("\\b" + word + "\\b\\s+(20\\d{2})", "i"));
			if (m) return {
				type: "single",
				value: `${MONTHS[word]}_${m[1]}`
			};
		}
		return {
			type: null,
			value: null
		};
	}

	function suggestMonth(text) {
		const t = String(text).toLowerCase();
		const m = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{2,4})\b/i);
		if (!m) return null;
		let year = m[2];
		if (year.length === 2) year = "20" + year;
		return `${SHORT_MONTHS[m[1].toLowerCase()]} ${year}`;
	}

	function classifyInput(text) {
		const t = String(text).trim().toLowerCase();
		if (!t) return "EMPTY";
		if (["hi", "hello", "hey", "who are you", "who are you?", "tell me about yourself"].includes(t)) return "GREETING";
		if (t.length <= 8 && /^[a-z]+$/.test(t) && !/(apr|may|jun|jul|aug|sep|oct|nov|dec|jan|feb)/.test(t)) return "GIBBERISH";
		return "POSSIBLE_CLAN_QUERY";
	}

	function routeDomain(text, monthInfo) {
		const t = text.toLowerCase();
		if ((t.includes("former") || t.includes("ex member")) && monthInfo.type === "single") return "FORMER_CLAN_MEMBERS";
		if (monthInfo.type === "range") return "CLAN_MONTHLY_ANALYSIS";
		if (monthInfo.type === "single" && t.includes("clanscore") && (t.includes("top") || t.includes("most"))) return "TOP_CLAN_CONTRIBUTORS";
		if (monthInfo.type === "single") return "CLAN_MEMBERS";
		return null;
	}

	function buildRawURL(domain, monthValue) {
		const path = CONFIG.domains[domain];
		if (!path) return null;
		const filename = domain === "CLAN_MONTHLY_ANALYSIS" ? `data_${monthValue}.json` : `${monthValue}.json`;
		return `${CONFIG.rawBase}/${path}/${filename}`;
	}

	async function fetchJSONIfExists(domain, monthValue) {
		const url = buildRawURL(domain, monthValue);
		if (!url) return null;
		if (cache.has(url)) return cache.get(url);
		try {
			const response = await fetch(url, {
				cache: "force-cache"
			});
			if (!response.ok) return null;
			const json = await response.json();
			if (!Array.isArray(json)) return null;
			cache.set(url, json);
			if (cache.size > CONFIG.cacheLimit) cache.delete(cache.keys().next().value);
			return json;
		} catch (error) {
			console.warn("KARSB dataset fetch failed:", error);
			return null;
		}
	}

	function getMetric(text) {
		const t = text.toLowerCase();
		return SUPPORTED_METRICS.find(m => t.includes(m)) || null;
	}

	function getPlayer(text, data) {
		const t = text.toLowerCase();
		// Prefer longest names to avoid matching a short name inside a longer one.
		const rows = [...data].filter(r => r && r.name).sort((a, b) => String(b.name).length - String(a.name).length);
		const found = rows.find(r => t.includes(String(r.name).toLowerCase()));
		return found ? String(found.name) : null;
	}

	function getTwoPlayers(text, data) {
		const t = text.toLowerCase();
		const found = [];
		for (const row of data) {
			const name = row && row.name ? String(row.name) : "";
			if (name && t.includes(name.toLowerCase()) && !found.includes(name)) found.push(name);
		}
		// Restore query order when multiple names are mentioned.
		found.sort((a, b) => t.indexOf(a.toLowerCase()) - t.indexOf(b.toLowerCase()));
		return found.length === 2 ? found : [];
	}

	function asInt(value) {
		if (value === null || value === undefined || value === "") return 0;
		const n = Number(value);
		if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error("invalid numeric value");
		return n;
	}

	function validNumericValues(data, metric) {
		const out = [];
		for (const row of data) {
			try {
				out.push({
					row,
					value: asInt(row?.[metric])
				});
			} catch (_) {
				/* ignore malformed values */ }
		}
		return out;
	}

	function resolveOperation(text, domain, data) {
		if (!Array.isArray(data) || !data.length) return null;
		const t = text.toLowerCase();
		const isLowest = ["lowest", "least", "minimum", "min"].some(k => t.includes(k));
		const isHighest = (t.includes("top") || t.includes("most")) && !isLowest;
		const nonZeroOnly = t.includes("non-zero") || t.includes("non zero");
		const topMatch = t.match(/\btop\s+(\d{1,2})\b/);
		const topN = topMatch && Number(topMatch[1]) >= 1 && Number(topMatch[1]) <= 50 ? Number(topMatch[1]) : null;
		const metric = getMetric(text);
		const player = getPlayer(text, data);
		const allowed = DOMAIN_ALLOWED_FIELDS[domain] || [];

		if (metric && !allowed.includes(metric)) return {
			type: "ERROR_FIELD_NOT_SUPPORTED",
			field: metric,
			allowed: [...allowed].sort()
		};
		if (metric) {
			const sample = data.find(r => r?.[metric] !== null && r?.[metric] !== undefined && r?.[metric] !== "");
			if (sample) {
				try {
					asInt(sample[metric]);
				} catch (_) {
					return {
						type: "ERROR_UNSUPPORTED_METRIC",
						allowed: [...SUPPORTED_METRICS].sort()
					};
				}
			}
		}

		if (player && metric) {
			const row = data.find(r => r?.name === player);
			return {
				type: "PLAYER_METRIC",
				player,
				metric,
				value: asInt(row?.[metric])
			};
		}
		if (t.includes("status") && domain !== "CLAN_MEMBERS") {
			return {
				type: "ERROR_FIELD_NOT_SUPPORTED",
				field: "status",
				allowed: [...allowed].sort()
			};
		}
		if (t.includes("most") && !metric) return {
			type: "ERROR_UNSUPPORTED_METRIC",
			allowed: [...SUPPORTED_METRICS].sort()
		};

		if (t.includes("list")) return {
			type: "LIST_NAMES",
			domain,
			names: data.map(r => r?.name)
		};
		if (metric && t.includes(" of ") && !player) return {
			type: "ERROR_PLAYER_NOT_FOUND",
			players: data.map(r => r?.name)
		};

		// Membership queries are checked before general metric ranking so questions like
		// "is X in top contributors" are treated as existence checks.
		const membershipIntent = ["a member", "a former", "in top"].some(k => t.includes(k));
		if (membershipIntent && player) {
			return {
				type: "PLAYER_MEMBERSHIP_CHECK",
				player,
				domain,
				exists: data.some(r => r?.name === player)
			};
		}

		if (t.includes("compare")) {
			const players = getTwoPlayers(text, data);
			if (!players.length) return {
				type: "ERROR_COMPARE_PLAYERS_NOT_FOUND",
				players: data.map(r => r?.name)
			};
			const [p1, p2] = players;
			const row1 = data.find(r => r?.name === p1),
				row2 = data.find(r => r?.name === p2);
			const metrics = {};
			for (const m of allowed.filter(m => m !== "status")) {
				try {
					metrics[m] = {
						[p1]: asInt(row1?.[m]),
						[p2]: asInt(row2?.[m])
					};
				} catch (_) {}
			}
			const result = {
				type: "COMPARE_PLAYERS",
				players,
				metrics
			};
			if (domain === "CLAN_MEMBERS") result.status = {
				[p1]: row1?.status,
				[p2]: row2?.status
			};
			return result;
		}

		if (metric && (t.includes("total") || t.includes("sum"))) {
			const values = validNumericValues(data, metric);
			if (!values.length) return {
				type: "ERROR_NO_DATA_FOR_TOTAL",
				metric
			};
			return {
				type: "TOTAL_METRIC",
				metric,
				total: values.reduce((s, x) => s + x.value, 0),
				count: values.length
			};
		}
		if (metric && (t.includes("average") || t.includes("avg") || t.includes("mean"))) {
			const values = validNumericValues(data, metric);
			if (!values.length) return {
				type: "ERROR_NO_DATA_FOR_AVERAGE",
				metric
			};
			return {
				type: "AVERAGE_METRIC",
				metric,
				average: Math.round((values.reduce((s, x) => s + x.value, 0) / values.length) * 100) / 100,
				count: values.length
			};
		}

		if (metric) {
			let entries = validNumericValues(data, metric);
			if (nonZeroOnly) entries = entries.filter(x => x.value !== 0);
			if (!entries.length) return nonZeroOnly ? {
				type: "ERROR_NO_NON_ZERO_VALUES",
				metric
			} : null;
			const unique = [...new Set(entries.map(x => x.value))].sort((a, b) => isHighest ? b - a : a - b);

			if (t.includes("group") && !topN) {
				const groups = {};
				for (const {
						row,
						value
					}
					of entries)(groups[value] ||= []).push(row?.name);
				const sorted = Object.fromEntries(Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0])));
				return {
					type: "GROUP_BY_VALUE",
					metric,
					groups: sorted
				};
			}
			if (topN) {
				const selected = unique.slice(0, topN);
				const groups = {};
				for (const v of selected) groups[v] = data.filter(row => {
					try {
						return asInt(row?.[metric]) === v && (!nonZeroOnly || v !== 0);
					} catch (_) {
						return false;
					}
				}).map(row => row?.name);
				return {
					type: "TOP_N_METRIC",
					metric,
					mode: isLowest ? "lowest" : "highest",
					limit: topN,
					groups
				};
			}
			const extreme = unique[0];
			const names = entries.filter(x => x.value === extreme).map(x => x.row?.name);
			return {
				type: isLowest ? "LEAST_OF_METRIC" : "MOST_OF_METRIC",
				metric,
				names,
				value: extreme
			};
		}

		if (player === null && (t.includes("status") || t.includes("display"))) {
			return {
				type: "ERROR_PLAYER_NOT_FOUND",
				players: data.map(r => r?.name)
			};
		}
		if (domain === "CLAN_MEMBERS" && t.includes("status") && player) {
			const row = data.find(r => r?.name === player);
			return {
				type: "PLAYER_STATUS",
				player,
				status: row?.status
			};
		}
		if (player && (t.includes("display") || t.includes("show"))) {
			const row = data.find(r => r?.name === player);
			return {
				type: "PLAYER_FULL_DATA",
				player,
				"coc-data": row
			};
		}
		return {
			type: "ERROR_UNCLEAR_OPERATION"
		};
	}

	const safeNames = names => (names || []).filter(n => n !== null && n !== undefined && String(n).trim()).map(String);

	function buildResponse(result, monthValue) {
		if (!result) return "I could not understand the request or the clan data is unavailable.";
		const month = monthValue.replace(/_/g, " ");
		const names = a => safeNames(a).join(", ");
		switch (result.type) {
			case "LIST_NAMES": {
				const title = result.domain === "FORMER_CLAN_MEMBERS" ? `Former clan members for ${month}` :
					result.domain === "TOP_CLAN_CONTRIBUTORS" ? `Top clan contributors for ${month}` : `Clan members for ${month}`;
				return result.names?.length ? `${title}:\n${names(result.names)}` : `No clan data found for ${month}.`;
			}
			case "TOTAL_METRIC":
				return `The total ${result.metric} done by the clan in ${month} was ${result.total}, across ${result.count} players.`;
			case "MOST_OF_METRIC":
				return `In ${month}, the highest ${result.metric} was ${result.value}, achieved by: ${names(result.names)}.`;
			case "LEAST_OF_METRIC":
				return `In ${month}, the lowest ${result.metric} was ${result.value}, recorded by: ${names(result.names)}.`;
			case "COMPARE_PLAYERS": {
				const [p1, p2] = result.players;
				const lines = [`Comparison for ${p1} vs ${p2} in ${month}:`];
				Object.entries(result.metrics || {}).sort(([a], [b]) => a.localeCompare(b)).forEach(([metric, vals]) => lines.push(`${metric.padEnd(14)}: ${p1} = ${vals[p1]}, ${p2} = ${vals[p2]}`));
				if (result.status) lines.push(`status         : ${p1} = ${result.status[p1]}, ${p2} = ${result.status[p2]}`);
				return lines.join("\n");
			}
			case "TOP_N_METRIC": {
				const lines = [`Top ${result.limit} ${result.mode} ${result.metric} in ${month}:`];
				Object.keys(result.groups).sort((a, b) => result.mode === "highest" ? Number(b) - Number(a) : Number(a) - Number(b))
					.forEach(v => lines.push(`${v}: ${names(result.groups[v])}`));
				return lines.join("\n");
			}
			case "GROUP_BY_VALUE": {
				const lines = [`${result.metric[0].toUpperCase()+result.metric.slice(1)} grouped by value in ${month}:`];
				Object.entries(result.groups).forEach(([v, ns]) => lines.push(`${v}: ${names(ns)}`));
				return lines.join("\n");
			}
			case "PLAYER_STATUS":
				return `${result.player}'s status in ${month} was ${result.status}.`;
			case "PLAYER_METRIC":
				return `${result.player}'s ${result.metric} in ${month} was ${result.value}.`;
			case "PLAYER_FULL_DATA":
				return Object.entries(result["coc-data"] || {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k.padEnd(14)}: ${v}`).join("\n");
			case "AVERAGE_METRIC":
				return `The average ${result.metric} in ${month} was ${result.average} based on ${result.count} players.`;
			case "PLAYER_MEMBERSHIP_CHECK": {
				const label = ({
					CLAN_MEMBERS: "a clan member",
					FORMER_CLAN_MEMBERS: "a former member",
					TOP_CLAN_CONTRIBUTORS: "in top contributors"
				})[result.domain] || "present";
				return result.exists ? `Yes, ${result.player} was ${label} in ${month}.` : `No, ${result.player} was not ${label} in ${month}.`;
			}
			case "ERROR_UNSUPPORTED_METRIC":
				return `I could not identify the metric you requested. Supported metrics are: ${result.allowed.join(", ")}.`;
			case "ERROR_FIELD_NOT_SUPPORTED":
				return `The field '${result.field}' is not available for this dataset. Supported fields are: ${result.allowed.join(", ")}.`;
			case "ERROR_PLAYER_NOT_FOUND":
				return `I could not find that player for this month. Available players are: ${names(result.players)}.`;
			case "ERROR_NO_NON_ZERO_VALUES":
				return `All values for ${result.metric} are zero in ${month}. No non-zero data is available.`;
			case "ERROR_UNCLEAR_OPERATION":
				return "I could not understand the requested operation.\nTry questions like:\n- list all names in APR 2025\n- top 5 warattack in APR 2025\n- lowest non-zero clanscore in APR 2025\n- group warattack in APR 2025";
			case "ERROR_COMPARE_PLAYERS_NOT_FOUND":
				return `I could not find exactly two players to compare for this month.\nPlease write your message like below:\nCompare {player_name} {player_name} in MAY 2026\nAvailable players are: ${names(result.players)}.`;
			case "ERROR_NO_DATA_FOR_AVERAGE":
				return `No valid data available to calculate the average for ${result.metric} in ${month}.`;
			case "ERROR_NO_DATA_FOR_TOTAL":
				return `No valid data available to calculate the total for ${result.metric} in ${month}.`;
			default:
				return "I could not process the request.";
		}
	}

	function pick(pool) {
		const unique = [...new Set(pool.filter(Boolean))];
		// Fisher-Yates shuffle, return at most three unique prompts.
		for (let i = unique.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[unique[i], unique[j]] = [unique[j], unique[i]];
		}
		return unique.slice(0, 3);
	}

	function buildSuggestions(result, domain, monthValue) {
		const m = monthValue.replace(/_/g, " ");
		const op = result?.type,
			metric = result?.metric || "warattack",
			player = result?.player;
		if (op === "PLAYER_METRIC") return pick([`display coc-data of ${player} in ${m}`, `compare ${player} vs another player in ${m}`, `what is the average ${metric} in ${m}`, `who had the highest ${metric} in ${m}`, `top 10 ${metric} in ${m}`, `group ${metric} in ${m}`, `total ${metric} in ${m}`]);
		if (op === "PLAYER_FULL_DATA") return pick([`what is ${player}'s warattack in ${m}`, `what is ${player}'s clanscore in ${m}`, `compare ${player} vs another player in ${m}`, `who had the highest clanscore in ${m}`, `top 10 warattack in ${m}`]);
		if (["MOST_OF_METRIC", "LEAST_OF_METRIC"].includes(op)) return pick([`top 10 ${metric} in ${m}`, `average ${metric} in ${m}`, `total ${metric} in ${m}`, `group ${metric} in ${m}`, `who had the highest ${metric} in ${m}`, `who had the lowest ${metric} in ${m}`]);
		if (op === "TOP_N_METRIC") return pick([`average ${metric} in ${m}`, `total ${metric} in ${m}`, `group ${metric} in ${m}`, `who had the highest ${metric} in ${m}`, `who had the lowest ${metric} in ${m}`]);
		if (op === "GROUP_BY_VALUE") return pick([`top 10 ${metric} in ${m}`, `average ${metric} in ${m}`, `total ${metric} in ${m}`, `who had the highest ${metric} in ${m}`]);
		if (["TOTAL_METRIC", "AVERAGE_METRIC"].includes(op)) return pick([`top 10 ${metric} in ${m}`, `group ${metric} in ${m}`, `who had the highest ${metric} in ${m}`, `who had the lowest ${metric} in ${m}`, `compare two players in ${m}`]);
		if (op === "COMPARE_PLAYERS") return pick([`display coc-data of ${result.players[0]} in ${m}`, `display coc-data of ${result.players[1]} in ${m}`, `who had the highest warattack in ${m}`, `average warattack in ${m}`, `top 10 clanscore in ${m}`]);
		if (op === "PLAYER_MEMBERSHIP_CHECK") return pick([`display coc-data of ${player} in ${m}`, `compare ${player} vs another player in ${m}`, `what is ${player}'s warattack in ${m}`, `top 10 clanscore in ${m}`]);
		return pick([`list all clan members in ${m}`, `top 10 warattack in ${m}`, `average clanscore in ${m}`, `group warattack in ${m}`, `compare two players in ${m}`]);
	}

	function staticReply(text) {
		const t = text.toLowerCase();
		if (["help", "/help", "commands"].includes(t)) return {
			reply: `Here’s what I can help you with (Ancient Ruins clan only):

GENERAL
- who are you
- what can you do
- what metrics can I ask about
- what does warattack mean
- what does clanscore mean

PLAYER INFORMATION
- display coc-data of Chief in APR 2025
- display coc-data of KAI HIWATARI in APR 2025
- what is Chief's warattack in APR 2025
- what is Chief's clancapital in APR 2025
- what is the status of Chief in APR 2025

CLAN MEMBERS
- list all clan members in APR 2025
- was Chief a member in APR 2025

FORMER CLAN MEMBERS
- list all former members in DEC 2024
- display coc-data of KING SEENU in DEC 2024
- is KING SEENU a former member in DEC 2024

TOP CLAN CONTRIBUTORS
- who had the highest clanscore in APR 2025
- top 10 clanscore in APR 2025
- is Bennie in top contributors for APR 2025

RANKINGS
- who had the highest warattack in APR 2025
- who had the lowest warattack in APR 2025
- who had the lowest non-zero warattack in APR 2025
- top 10 warattack in APR 2025
- top 5 lowest clanscore in APR 2025

STATISTICS
- average warattack in APR 2025
- total clanscore in APR 2025

GROUPING
- group warattack in APR 2025
- group non-zero warattack in APR 2025

PLAYER COMPARISON
- compare Chief vs KAI HIWATARI in APR 2025

SUPPORTED METRICS
- warattack, clancapital, clangames, clangamesmaxed, clanscore
- status (Clan Members only)

SUPPORTED DATE FORMAT
- APR 2025
- APR-MAY 2025 (Monthly Analysis)

NOTES
- Every clan query must include a month.
- Rankings handle ties.
- Top N refers to top N unique values, not number of players.
- I only answer questions about the Ancient Ruins clan.`,
			source: null,
			suggestions: []
		};
		if (["hi", "hello", "hey", "who are you", "who are you?", "tell me about yourself"].includes(t)) return {
			reply: "Hello! I am kARsb, Clan Data Assistant for the Ancient Ruins clan.\n\nI specialize only in Ancient Ruins clan data and can help with monthly clan member statistics, performance analysis, rankings and comparisons.\n\nType `help` to see example questions.",
			source: null,
			suggestions: []
		};
		if (t.includes("who are you")) return {
			reply: "I am KARSB, Clan Data Assistant for the Ancient Ruins clan.\n\nI specialize only in Ancient Ruins clan data. I can help you with monthly stats, performance, and rankings.",
			source: null,
			suggestions: []
		};
		if (t.includes("what can you do")) return {
			reply: "I can help you with:\n- Clan member statistics by month\n- Former clan member data\n- Top clan contributors\n- Rankings (top, lowest, averages, totals)\n- Player comparisons\n- Grouped performance analysis\n\nAll data is specific to the Ancient Ruins clan.",
			source: null,
			suggestions: []
		};
		if (t.includes("what metrics")) return {
			reply: "You can ask about the following metrics:\n" + Object.keys(METRIC_EXPLANATIONS).sort().join(", "),
			source: null,
			suggestions: []
		};
		if (t.includes("what does") && t.includes("mean")) {
			for (const [metric, explanation] of Object.entries(METRIC_EXPLANATIONS))
				if (t.includes(metric)) return {
					reply: `**${metric}** means:\n${explanation}`,
					source: null,
					suggestions: []
				};
		}
		if (["thanks", "thank you", "thnx"].some(k => t.includes(k))) return {
			reply: "You're welcome! If you need more clan insights, just ask.",
			source: null,
			suggestions: []
		};
		return null;
	}

	async function handleChat(userText) {
		if (userText.length > CONFIG.maxMessageLength) return {
			reply: "Your message is too long. Please keep it under 500 characters.",
			source: null,
			suggestions: []
		};
		const text = userText.trim(),
			lower = text.toLowerCase();
		if (!text) return {
			reply: "Please ask a clan-related question.",
			source: null,
			suggestions: []
		};
		const info = staticReply(text);
		if (info) return info;
		const category = classifyInput(text);
		if (category === "GIBBERISH") return {
			reply: "I couldn’t understand your message.\nPlease ask something related to the Ancient Ruins clan or type `help` to see example questions.",
			source: null,
			suggestions: []
		};

		const metricDefinitionQuery = lower.includes("what does") && lower.includes("mean");
		if (metricDefinitionQuery) return {
			reply: "Supported metrics: " + SUPPORTED_METRICS.join(", ") + ". Ask `what does warattack mean` for a metric definition.",
			source: null,
			suggestions: []
		};

		const monthInfo = monthNormalize(text);
		const monthValue = monthInfo.value;
		if (!monthValue) {
			const hint = suggestMonth(text);
			return hint ? {
				reply: `I couldn't find an exact match for the date.\nDid you mean **${hint}**?`,
				source: null,
				suggestions: []
			} : {
				reply: "Please specify a valid month and year, e.g. 'APR 2025' or 'APR-MAY 2025'.",
				source: null,
				suggestions: []
			};
		}
		const domain = routeDomain(text, monthInfo);
		if (!domain) return {
			reply: "I could not determine which clan data to use.",
			source: null,
			suggestions: []
		};
		setStatus(`Loading ${monthValue.replace(/_/g," ")} data…`, "loading");
		const data = await fetchJSONIfExists(domain, monthValue);
		if (!data) return {
			reply: `No data available for ${monthValue.replace(/_/g," ")}. The requested JSON file may not exist or could not be reached.`,
			source: null,
			suggestions: []
		};
		const result = resolveOperation(text, domain, data);
		if (!result) return {
			reply: "I could not understand the requested operation.",
			source: null,
			suggestions: []
		};
		const source = buildRawURL(domain, monthValue);
		return {
			reply: buildResponse(result, monthValue),
			source,
			suggestions: buildSuggestions(result, domain, monthValue)
		};
	}


	let hasUnsavedChat = false;
	const promptHistory = [];
	let historyIndex = -1;

	function isNearBottom(container, threshold = 80) {
		return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
	}

	// Always follow newly submitted messages and streamed bot output. Use rAF so
	// the browser has laid out the appended content before reading scrollHeight.
	function scrollToBottom(container = document.getElementById("chat-box")) {
		if (!container) return;
		const move = () => {
			container.scrollTop = container.scrollHeight;
			// A second pass catches height changes caused by markdown/source/suggestion
			// rendering after the first layout.
			requestAnimationFrame(() => {
				container.scrollTop = container.scrollHeight;
			});
		};
		requestAnimationFrame(move);
	}

	// Retained for optional cases where we should only follow if already at bottom.
	function smartScroll(container) {
		if (container && isNearBottom(container)) scrollToBottom(container);
	}

	function addUserMessage(text) {
		const box = document.getElementById("chat-box");
		if (!box) return;
		const id = "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
		const div = document.createElement("div");
		div.className = "user-msg";
		div.innerHTML = `<div class="bot-header"><strong>You</strong><button type="button" class="copy-btn" data-copy-id="${id}">Copy</button></div><div id="${id}">${escapeHTML(text)}</div>`;
		box.appendChild(div);
		scrollToBottom(box);
	}

	function renderLines(text, container, done) {
		if (!container) {
			done && done();
			return;
		}
		const lines = String(text || "").split("\n");
		let i = 0;
		const box = document.getElementById("chat-box");

		function next() {
			if (i >= lines.length) {
				done && done();
				return;
			}
			const line = lines[i].trim();
			const row = document.createElement("div");
			row.style.margin = "2px 0";
			if (/^\d+\s*:/.test(line)) {
				const colon = line.indexOf(":");
				row.innerHTML = `<strong>${escapeHTML(line.slice(0,colon))}:</strong> ${escapeHTML(line.slice(colon+1).trim())}`;
			} else if (window.marked && window.DOMPurify) {
				row.innerHTML = window.DOMPurify.sanitize(window.marked.parseInline(line || " "));
			} else {
				row.innerHTML = escapeHTML(line || " ");
			}
			container.appendChild(row);
			scrollToBottom(box);
			i++;
			window.setTimeout(next, 70);
		}
		next();
	}

	function appendSourceAndSuggestions(wrapper, source, suggestions) {
		if (source) {
			const sourceRow = document.createElement("div");
			sourceRow.style.marginTop = "10px";
			const label = document.createElement("strong");
			label.textContent = "Source: ";
			const link = document.createElement("a");
			link.href = source;
			link.target = "_blank";
			link.rel = "noopener noreferrer";
			link.textContent = source;
			sourceRow.append(label, link);
			wrapper.appendChild(sourceRow);
		}
		if (Array.isArray(suggestions) && suggestions.length) {
			const heading = document.createElement("div");
			heading.style.marginTop = "12px";
			const strong = document.createElement("strong");
			strong.textContent = "Suggestions:";
			heading.appendChild(strong);
			wrapper.appendChild(heading);
			suggestions.forEach(s => {
				const row = document.createElement("div");
				row.style.marginTop = "3px";
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "suggestion-chip";
				btn.textContent = s;
				btn.addEventListener("click", () => {
					scrollToBottom(document.getElementById("chat-box"));
					sendMessage(s);
				});
				row.appendChild(btn);
				wrapper.appendChild(row);
			});
		}
	}

	function addBotMessage(reply, source, suggestions) {
		const box = document.getElementById("chat-box");
		if (!box) return;
		const id = "b_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
		const div = document.createElement("div");
		div.className = "bot-msg";
		const header = document.createElement("div");
		header.className = "bot-header";
		const name = document.createElement("strong");
		name.textContent = "KARSB";
		const copy = document.createElement("button");
		copy.type = "button";
		copy.className = "copy-btn";
		copy.dataset.copyId = id;
		copy.textContent = "Copy";
		header.append(name, copy);
		const content = document.createElement("div");
		content.className = "bot-content";
		content.id = id;
		div.append(header, content);
		box.appendChild(div);
		scrollToBottom(box);

		transcript.push({
			role: "KARSB",
			text: reply || "",
			source: source || null
		});
		renderLines(reply || "", content, () => {
			appendSourceAndSuggestions(div, source, suggestions);
			scrollToBottom(box);
		});
	}

	async function sendMessage(overrideText) {
		if (busy) return;
		const input = document.getElementById("user-input");
		const message = (typeof overrideText === "string" ? overrideText : (input?.value || "")).trim();
		if (!message) return;
		hasUnsavedChat = true;
		promptHistory.push(message);
		historyIndex = promptHistory.length;
		addUserMessage(message);
		transcript.push({
			role: "You",
			text: message,
			source: null
		});
		if (input && typeof overrideText !== "string") input.value = "";

		busy = true;
		const sendButton = document.getElementById("send-button");
		if (sendButton) sendButton.disabled = true;
		setStatus("Thinking…", "loading");
		try {
			const result = await handleChat(message);
			addBotMessage(result.reply, result.source, result.suggestions);
			setStatus(result.source ? "Dataset loaded successfully." : "Ready.", result.source ? "success" : "");
		} catch (error) {
			console.error("KARSB error:", error);
			addBotMessage("Error processing the request. Please try again.", null, []);
			setStatus("Unable to process request.", "error");
		} finally {
			busy = false;
			if (sendButton) sendButton.disabled = false;
			input?.focus();
		}
	}

	function clearChat() {
		const box = document.getElementById("chat-box");
		if (box) box.replaceChildren();
		transcript.length = 0;
		promptHistory.length = 0;
		historyIndex = -1;
		hasUnsavedChat = false;
		addBotMessage("Hello! I am KARSB, **AR STATS BOT**.\n\nI specialize only in **Ancient Ruins** clan data.\n\nType `help` to see everything I can do.", null, []);
		setStatus("Ready.");
	}

	function resetFont(doc) {
		doc.setFont("courier", "normal");
		doc.setFontSize(11);
	}

	function addFooter(doc, siteUrl) {
		const h = doc.internal.pageSize.height;
		const cx = doc.internal.pageSize.width / 2;
		doc.setFont("courier", "italic");
		doc.setFontSize(9);
		doc.text("Generated by KARSB - Ancient Ruins STATS BOT", cx, h - 14, {
			align: "center"
		});
		doc.textWithLink(siteUrl, cx, h - 9, {
			align: "center",
			url: siteUrl
		});
	}

	function exportPDF() {
		if (!window.jspdf?.jsPDF) {
			addBotMessage("PDF export is unavailable because the jsPDF library did not load.", null, []);
			return;
		}
		const {
			jsPDF
		} = window.jspdf;
		const doc = new jsPDF("p", "mm", "a4");
		const siteUrl = "https://coc-ancient-ruins-website.onrender.com";
		const now = new Date().toLocaleString();

		doc.setFont("courier", "bold");
		doc.setFontSize(16);
		doc.text("KARSB - Ancient Ruins STATS BOT", 105, 40, {
			align: "center"
		});
		doc.setFont("courier", "normal");
		doc.setFontSize(11);
		doc.text(`This document contains a chatbot conversation\n generated for the Ancient Ruins clan.\n\nGenerated on: ${now}\n\nWebsite: ${siteUrl}`, 20, 70);
		doc.addPage();
		resetFont(doc);

		let y = 10;
		const marginX = 10,
			width = 190,
			lineHeight = 6;
		transcript.forEach(entry => {
			if (y > 265) {
				addFooter(doc, siteUrl);
				doc.addPage();
				resetFont(doc);
				y = 10;
			}
			doc.setFont("courier", "bold");
			doc.text(entry.role === "You" || entry.role === "user" ? "You:" : "KARSB:", marginX, y);
			y += lineHeight;
			resetFont(doc);
			const lines = doc.splitTextToSize(String(entry.text || ""), width);
			lines.forEach(line => {
				if (y > 270) {
					addFooter(doc, siteUrl);
					doc.addPage();
					resetFont(doc);
					y = 10;
				}
				doc.text(line, marginX, y);
				y += lineHeight;
			});
			if (entry.source) {
				y += 2;
				doc.setFont("courier", "italic");
				doc.text("Source:", marginX, y);
				y += lineHeight;
				resetFont(doc);
				doc.splitTextToSize(entry.source, width).forEach(line => {
					if (y > 270) {
						addFooter(doc, siteUrl);
						doc.addPage();
						resetFont(doc);
						y = 10;
					}
					doc.textWithLink(line, marginX, y, {
						url: entry.source
					});
					y += lineHeight;
				});
			}
			y += lineHeight;
		});
		addFooter(doc, siteUrl);
		doc.save("Ancient Ruins STATS BOT chat.pdf");
	}

	function init() {
		const input = document.getElementById("user-input");
		const form = document.getElementById("chat-form");
		// Works with the original layout whether the input is wrapped in a form or
		// the original page calls sendMessage() from an inline onclick.
		form?.addEventListener("submit", e => {
			e.preventDefault();
			sendMessage();
		});
		input?.addEventListener("keydown", e => {
			if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
				e.preventDefault();
				sendMessage();
			} else if (e.key === "ArrowUp" && historyIndex > 0) {
				historyIndex--;
				input.value = promptHistory[historyIndex];
				e.preventDefault();
			} else if (e.key === "ArrowDown") {
				if (historyIndex < promptHistory.length - 1) input.value = promptHistory[++historyIndex];
				else {
					historyIndex = promptHistory.length;
					input.value = "";
				}
				e.preventDefault();
			}
		});
		document.addEventListener("click", async e => {
			const btn = e.target.closest?.(".copy-btn");
			if (!btn) return;
			const el = document.getElementById(btn.dataset.copyId);
			if (!el) return;
			try {
				await navigator.clipboard.writeText(el.innerText);
				btn.textContent = "Copied ✓";
				window.setTimeout(() => btn.textContent = "Copy", 1000);
			} catch (_) {
				btn.textContent = "Copy failed";
				window.setTimeout(() => btn.textContent = "Copy", 1200);
			}
		});
		document.getElementById("save-pdf")?.addEventListener("click", exportPDF);
		document.getElementById("clear-chat")?.addEventListener("click", clearChat);
		document.getElementById("capture-page")?.addEventListener("click", () => window.print());
		if (document.getElementById("chat-box") && !document.getElementById("chat-box").children.length) {
			addBotMessage("Hello! I am KARSB, **AR STATS BOT**.\n\nI specialize only in **Ancient Ruins** clan data.\n\nType `help` to see everything I can do.", null, []);
		}
		setStatus("Ready.");
	}

	window.addEventListener("resize", () => {
		scrollToBottom(document.getElementById("chat-box"));
	});

	window.addEventListener("beforeunload", function(e) {
		if (!hasUnsavedChat) return;
		e.preventDefault();
		e.returnValue = "";
	});

	// Public API is useful for manual testing and optional integration.
	window.KARSB = {
		handleChat,
		monthNormalize,
		routeDomain,
		buildRawURL,
		fetchJSONIfExists,
		resolveOperation,
		buildResponse,
		clearChat,
		sendMessage,
		exportPDF
	};
	window.sendMessage = sendMessage;
	window.saveChatAsPDF = exportPDF;
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();