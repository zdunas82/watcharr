import {
	UserPermission,
	type Icon,
	type TMDBContentCreditsCrew,
	type TokenClaims,
	type WatchedStatus,
} from "@/types";

export const watchedStatuses: {
	[key in WatchedStatus]: Icon;
} = {
	PLANNED: "calendar",
	WATCHING: "clock",
	FINISHED: "check",
	HOLD: "pause",
	DROPPED: "thumb-down",
};

export const months = [
	"Styczeń",
	"Luty",
	"Marzec",
	"Kwiecień",
	"Maj",
	"Czerwiec",
	"Lipiec",
	"Sierpień",
	"Wrzesień",
	"Październik",
	"Listopad",
	"Grudzień",
];

export const monthsShort = [
	"Sty",
	"Lut",
	"Mar",
	"Kwi",
	"Maj",
	"Cze",
	"Lip",
	"Sie",
	"Wrz",
	"Paź",
	"Lis",
	"Gru",
];

export function isTouch() {
	return "ontouchstart" in window;
}

/**
 * Turns a WatchedStatus into readable and context aware text.
 * Watched statuses can be used normally for movies/tv, but
 * for games, we want to transform the status to make more sense.
 * ex: 'finished' would become 'played' for games, but remain
 *     unmodified for series/movies.
 *
 * This is only for use when displaying a status in ui for a user
 * to read, should **never** be involved in logic (comparing
 * statuses for example).
 *
 * @param s The watched status.
 * @param isForGame If this status is being displayed for a game or not.
 */
export function toUnderstandableStatus(s: WatchedStatus, isForGame: boolean) {
	if (isForGame) {
		if (s === "FINISHED") {
			return "Zagrane";
		} else if (s === "WATCHING") {
			return "Gram";
		}
	}
	const labels: { [key in WatchedStatus]: string } = {
		PLANNED: "Planuję",
		WATCHING: "Oglądam",
		FINISHED: "Obejrzane",
		HOLD: "Wstrzymane",
		DROPPED: "Porzucone",
	};
	return labels[s] ?? s?.toLowerCase();
}

/**
 * Add a class to the parent node of a clicked element.
 * @param e Event with currentTarget.
 * @param c Class to add to parent.
 */
export function addClassToParent(
	e: Event & {
		currentTarget: EventTarget & Element;
	},
	c: string,
) {
	(e.currentTarget?.parentNode as HTMLDivElement)?.classList.add(c);
}

/**
 * Gets "main" crew members from list of crew.
 * @param crew Crew
 * @returns Top Crew
 */
export function getTopCrew(crew: TMDBContentCreditsCrew[]) {
	return crew.filter(
		(c) =>
			c.job === "Director" ||
			c.job === "Writer" ||
			c.job === "Characters" ||
			c.job === "Story",
	);
}

/**
 * Calculates what the transform-origin property should be
 * depending on where the scaled (poster) element will be
 * in the viewport to keep it in view.
 * @param e
 */
export function calculateTransformOrigin(
	e: Event & {
		currentTarget: EventTarget & HTMLLIElement;
	},
) {
	const magicNumber = 26;
	const ctr = e.currentTarget.querySelector(".container") as HTMLElement;
	const pb = ctr.getBoundingClientRect();
	const sx = pb.x;
	const sw = pb.width;
	const wb = document.body.getBoundingClientRect();

	if (ctr) {
		ctr.style.transformOrigin = "unset";
		const origins = [];
		// Overflow on right
		if (sx + sw + magicNumber > wb.x + wb.width) {
			origins.push("right");
		}
		// Overflow on left
		if (sx - magicNumber < wb.x) {
			origins.push("left");
		}
		// Overflow on bottom
		const ppb = e.currentTarget.getBoundingClientRect();
		if (ppb.bottom + magicNumber > window.innerHeight) {
			origins.push("bottom");
		}
		ctr.style.transformOrigin = `${origins.join(" ")}`;
	}
}

/**
 * Get ordinal suffix to use from day number (1`st`, 2`nd`, 3`rd`).
 * @param i Day number.
 */
export function getOrdinalSuffix(i: number) {
	// Polish dates have no ordinal suffix (ex: "1 Sty").
	void i;
	return "";
}

export function parseTokenPayload(): TokenClaims | undefined {
	try {
		const token = localStorage.getItem("token");
		if (!token) return;
		return JSON.parse(atob(token.split(".")[1])) as TokenClaims;
	} catch (err) {
		console.error("parseTokenPayload: Failed.", err);
		return;
	}
}

export async function sleep(ms: number) {
	return new Promise<void>((r) =>
		setTimeout(() => {
			r();
		}, ms),
	);
}

export function userHasPermission(
	perms: UserPermission,
	reqPerm: UserPermission,
): boolean {
	// Admins have permission for everything.
	if (perms & UserPermission.PERM_ADMIN) {
		return true;
	}
	return (perms & reqPerm) == reqPerm;
}

/**
 * Takes season and episode number to make a quickly understandable
 * string in this format S1E1.
 */
export function seasonAndEpToReadable(
	season: number | undefined,
	episode: number | undefined,
) {
	return `S${typeof season === "number" ? String(season) : "(?)"}E${typeof episode === "number" ? String(episode) : "(?)"}`;
}

export function msToAmountsOfTime(ms: number) {
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
	const days = Math.floor(ms / (1000 * 60 * 60 * 24));
	return { days, hours, minutes, seconds };
}

/** I'm no warden of time, this is as relative as it's getting. */
export function toRelativeDate(d: Date): string {
	if (!d) {
		return "Nieznana";
	}
	const dn = new Date(Date.now());
	if (d.getFullYear() === dn.getFullYear()) {
		if (d.getMonth() === dn.getMonth()) {
			if (d.getDate() === dn.getDate()) {
				return "Dzisiaj";
			}
		}
		return `${d.getDate()}${getOrdinalSuffix(d.getDate())} ${monthsShort[d.getMonth()]}`;
	}
	return `${d.getDate()}${getOrdinalSuffix(d.getDate())} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * To relative time (seconds, mins, hours).
 * @param s Seconds.
 */
export function toRelativeTime(s: number) {
	const totalMinutes = Math.floor(s / 60);
	const hours = Math.floor(totalMinutes / 60);
	const mins = totalMinutes % 60;
	const secs = Math.floor(s % 60);
	if (hours > 0) {
		return `${hours} ${plPlural(hours, "godzinę", "godziny", "godzin")}`;
	}
	if (mins > 0) {
		return `${mins} ${plPlural(mins, "minutę", "minuty", "minut")}`;
	}
	if (secs > 0) {
		return `${secs} ${plPlural(secs, "sekundę", "sekundy", "sekund")}`;
	}
	return "teraz";
}

/**
 * Tests whether the mouse is hovering over `el`.
 */
export function mouseOverEl(el?: HTMLElement) {
	if (!el) {
		return false;
	}
	return el.matches(":hover");
}

/**
 * Polish plural form for `n`.
 * ex: plPlural(n, "odcinek", "odcinki", "odcinków")
 *     1 -> odcinek, 2-4/22-24 -> odcinki, 0/5-21/25+ -> odcinków.
 */
export function plPlural(n: number, one: string, few: string, many: string) {
	const abs = Math.abs(n);
	if (abs === 1) return one;
	const mod10 = abs % 10;
	const mod100 = abs % 100;
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
	return many;
}
