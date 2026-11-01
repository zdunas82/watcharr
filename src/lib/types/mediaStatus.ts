/**
 * Media statuses.
 */

export enum MediaStatusShow {
	ReturningSeries = "Returning Series",
	Planned = "Planned",
	InProduction = "In Production",
	Ended = "Ended",
	Canceled = "Canceled",
	Pilot = "Pilot",
}

export enum MediaStatusMovie {
	Rumored = "Rumored",
	Planned = "Planned",
	InProduction = "In Production",
	PostProduction = "Post Production",
	Released = "Released",
	Canceled = "Canceled",
}

/**
 * Taken from what `https://api.igdb.com/v4/game_statuses` returned at the time.
 */
export enum MediaStatusGame {
	Released = "Released",
	Alpha = "Alpha",
	Beta = "Beta",
	EarlyAccess = "Early Access",
	Offline = "Offline",
	Cancelled = "Cancelled",
	Rumored = "Rumored",
	Delisted = "Delisted",
}

/**
 * Polish display labels for media statuses (TMDB/IGDB values).
 * Display only, never use in logic.
 */
const mediaStatusLabels: { [key: string]: string } = {
	"Returning Series": "Wciąż emitowany",
	Planned: "Zapowiedź",
	"In Production": "W produkcji",
	"Post Production": "Postprodukcja",
	Ended: "Zakończony",
	Canceled: "Anulowany",
	Cancelled: "Anulowana",
	Pilot: "Odcinek pilotażowy",
	Rumored: "Pogłoski",
	Released: "Po premierze",
	Alpha: "Alfa",
	Beta: "Beta",
	"Early Access": "Wczesny dostęp",
	Offline: "Offline",
	Delisted: "Wycofana ze sprzedaży",
};

/**
 * Get readable (Polish) label for a media status.
 * Falls back to the original value if unknown.
 */
export function mediaStatusLabel(status: string | undefined): string {
	if (!status) return "";
	return mediaStatusLabels[status] ?? status;
}
