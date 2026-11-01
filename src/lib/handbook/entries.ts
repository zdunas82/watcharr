import type { Component } from "svelte";

type HandbookGroup = {
	title: string;
	entries: HandbookEntry[];
};

export type HandbookEntry = {
	id: string;
	title: string;
	comp: () => Promise<{ default: Component }>;
};

export const entries = [
	{
		title: "Ogólne",
		entries: [
			{
				id: "adding-to-your-watchlist",
				title: "Dodawanie do listy",
				comp: () =>
					import("./entries/general/AddingToYourWatchlist/AddingToYourWatchlist.svelte"),
			},
		],
	},
	{
		title: "Administracja",
		entries: [
			{
				id: "jellyfin-webhook-setup",
				title: "Konfiguracja webhooka Jellyfina",
				comp: () => import("./entries/admin/JellyfinWebhookSetup.svelte"),
			},
			{
				id: "your-own-tmdb-api-key",
				title: "Własny klucz API TMDB",
				comp: () => import("./entries/admin/YourOwnTMDBAPIKey.svelte"),
			},
		],
	},
] as const satisfies HandbookGroup[];

export type HandbookEntryId = (typeof entries)[number]["entries"][number]["id"];
