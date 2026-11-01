<script lang="ts">
	import { type Activity, ActivityCreatedBy } from "@/types";
	import { seasonAndEpToReadable } from "../util/helpers";
	import ActivityEditor from "./ActivityEditor.svelte";
	import ActivityIcon from "./ActivityIcon.svelte";

	interface Props {
		activity: Activity[] | undefined;
		onRemoved: (activity: Activity) => void;
	}

	let { activity = undefined, onRemoved }: Props = $props();

	let clickedActivity: Activity | undefined = $state();
	let groupedActivities: { [index: string]: Activity[] } = $derived(
		getGroupedActivity(activity),
	);
	let count = $derived(activity ? activity.length : 0);

	function getMsg(a: Activity) {
		switch (a?.type) {
			case "ADDED_WATCHED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `Dodano do Twojej listy${data?.status ? ` jako „${toFullTitleCase(data.status)}”` : ""}${
						data?.rating ? ` z oceną ${data.rating}` : ""
					}`;
				}
				return "Dodano do Twojej listy";
			case "REMOVED_WATCHED":
				return "Usunięto z Twojej listy";
			case "RATING_CHANGED":
				if (a.data) {
					return `Zmieniono ocenę na ${a.data}`;
				}
				return "Zmieniono ocenę";
			case "STATUS_CHANGED":
				if (a.data) {
					let status = a.data;
					if (a.data.startsWith("{")) {
						const data = JSON.parse(a.data);
						status = data.status;
					}
					return `Zmieniono status na „${toFullTitleCase(status)}”`;
				}
				return "Zmieniono status";
			case "THOUGHTS_CHANGED":
				return "Zmieniono przemyślenia";
			case "THOUGHTS_REMOVED":
				return "Usunięto przemyślenia";
			case "IMPORTED_RATING":
				if (a.data) {
					const data = JSON.parse(a.data);
					if (data.rating) {
						return `Zmieniono ocenę na ${data.rating}`;
					} else {
						return "Dodano do Twojej listy bez oceny";
					}
				}
				return "Zaimportowano ocenę";
			case "IMPORTED_ADDED_WATCHED":
				return "Zaimportowano datę obejrzenia";
			case "SEASON_ADDED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `Dodano sezon ${data.season} jako „${toFullTitleCase(data.status)}”`;
				}
				return "Dodano sezon";
			case "SEASON_RATING_CHANGED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `Zmieniono ocenę sezonu ${data.season} na ${data.rating}`;
				}
				return "Zmieniono ocenę sezonu";
			case "SEASON_STATUS_CHANGED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `Zmieniono status sezonu ${data.season} na „${toFullTitleCase(data.status)}”`;
				}
				return "Zmieniono status sezonu";
			case "SEASON_REMOVED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `Usunięto status sezonu ${data.season}`;
				}
				return "Usunięto sezon";
			case "EPISODE_ADDED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `Dodano ${seasonAndEpToReadable(data.season, data.episode)}${data.status ? ` jako „${toFullTitleCase(data.status)}”` : data.rating ? ` z oceną ${data.rating}` : ""}`;
				}
				return "Dodano odcinek";
			case "EPISODE_RATING_CHANGED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `${seasonAndEpToReadable(data.season, data.episode)}: zmieniono ocenę na ${data.rating}`;
				}
				return "Zmieniono ocenę odcinka";
			case "EPISODE_STATUS_CHANGED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `${seasonAndEpToReadable(data.season, data.episode)}: zmieniono status na „${toFullTitleCase(data.status)}”`;
				}
				return "Zmieniono status odcinka";
			case "EPISODE_REMOVED":
				if (a.data) {
					const data = JSON.parse(a.data);
					return `Usunięto ${seasonAndEpToReadable(data.season, data.episode)}`;
				}
				return "Usunięto odcinek";
			default:
				return a.type;
		}
	}

	// Polish display labels for watched status values (values stay unchanged).
	const statusLabels: Record<string, string> = {
		PLANNED: "Planuję",
		WATCHING: "Oglądam",
		FINISHED: "Obejrzane",
		HOLD: "Wstrzymane",
		DROPPED: "Porzucone",
	};

	function toFullTitleCase(text: string | undefined) {
		if (text && statusLabels[text.toUpperCase()]) {
			return statusLabels[text.toUpperCase()];
		}
		if (text) {
			return text
				.split(" ")
				.map((l) => l[0].toUpperCase() + l.substring(1).toLowerCase())
				.join(" ");
		}
		return "Nieznany";
	}

	function toDayTime(d: Date) {
		return `${d.toLocaleDateString("pl-PL")} o ${d.toLocaleTimeString("pl-PL")}`;
	}

	/**
	 * Get what will be the visible date the activity was 'created'.
	 * @returns customDate if defined or createdAt if not.
	 */
	function getCreatedAtVis(a: Activity) {
		return Date.parse(a.customDate ?? a.createdAt);
	}

	function getGroupedActivity(activities?: Activity[]) {
		activities = activities?.filter((a) => a.type);
		const a = activities?.sort(
			(a, b) => getCreatedAtVis(b) - getCreatedAtVis(a),
		);
		let grouped: { [index: string]: Activity[] } = {};
		if (a) {
			for (let i = 0; i < a.length; i++) {
				const activity = a[i];
				const date = new Date(getCreatedAtVis(activity));
				const monthYear = date.toLocaleDateString("pl-PL", {
					month: "long",
					year: "numeric",
				});
				const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
				if (grouped[key]) {
					grouped[key].push(activity);
				} else {
					grouped[key] = [activity];
				}
			}
		}
		return grouped;
	}

	function openEditor(a: Activity) {
		clickedActivity = a;
		return;
	}
</script>

{#if clickedActivity}
	<ActivityEditor
		activity={clickedActivity}
		activityMessage={getMsg(clickedActivity)}
		onClose={() => (clickedActivity = undefined)}
		onUpdated={(activityId, updatedActivity) => {
			if (!activity) {
				console.error(
					"ActivityEditor->onUpdated: 'activity' doesn't exist somehow..",
				);
				return;
			}
			const ai = activity.findIndex((a) => a.id === activityId);
			activity[ai] = updatedActivity;
		}}
		onRemoved={(a) => {
			if (!activity) {
				console.error(
					"ActivityEditor->onRemoved: 'activity' doesn't exist somehow..",
				);
				return;
			}
			onRemoved(a);
		}}
	/>
{/if}

<div class="activity">
	<div class="title">
		<h2>Aktywność</h2>
		<div class="act-count">{count}</div>
	</div>
	{#if groupedActivities && Object.keys(groupedActivities).length > 0}
		<ul>
			{#each Object.keys(groupedActivities) as k (k)}
				<h3>{k}</h3>

				{#each groupedActivities[k] as a (a.id)}
					{@const d = new Date(getCreatedAtVis(a))}
					<li>
						<button class="plain" onclick={() => openEditor(a)}>
							<span
								title={d.toLocaleDateString("pl-PL", {
									weekday: "long",
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							>{toDayTime(d)}</span>
							<span>{getMsg(a)}</span>
						</button>
						{#if a.createdBy == ActivityCreatedBy.Watcharr}
							<ActivityIcon
								icon="sparkles"
								tooltipText={a.reason
									? `(Automatycznie) ${a.reason}`
									: "Wykonane przez automatyzację."}
							/>
						{:else if a.createdBy == ActivityCreatedBy.GenericImport}
							<ActivityIcon icon="calendar" tooltipText="Zaimportowane" />
						{:else if a.createdBy == ActivityCreatedBy.JellyfinImport}
							<ActivityIcon icon="jellyfin" tooltipText="Import z Jellyfina" />
						{:else if a.createdBy == ActivityCreatedBy.JellyfinWebhook}
							<ActivityIcon icon="jellyfin" tooltipText="Webhook Jellyfina" />
						{:else if a.createdBy == ActivityCreatedBy.PlexImport}
							<ActivityIcon icon="plex" tooltipText="Import z Plexa" />
						{/if}
						{#if a.countAsPlay}
							<ActivityIcon icon="play" tooltipText="Liczy się jako obejrzenie." />
						{/if}
					</li>
				{/each}
			{/each}
		</ul>
	{:else}
		<span>Nie masz jeszcze żadnej aktywności!</span>
	{/if}
</div>

<style lang="scss">
	.activity {
		width: 100%;

		div.title {
			display: flex;
			flex-flow: row;
			align-items: center;
			gap: 10px;

			.act-count {
				font-family:
					"Shrikhand",
					system-ui,
					-apple-system,
					BlinkMacSystemFont;
				font-size: 13px;
				color: black;
				background-color: $gold;
				padding: 3px 6px;
				border-radius: 50px;
				min-width: 25px;
				min-height: 25px;
				height: min-content;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}

		ul {
			display: flex;
			flex-flow: column;
			gap: 8px;
			margin-top: 8px;
			margin-left: calc(30px + 8px);
			list-style: none;
			max-height: 250px;
			overflow-y: auto;
			overflow-x: hidden;

			h3 {
				position: sticky;
				top: 0;
				font-size: 16px;
				font-family:
					sans-serif,
					system-ui,
					-apple-system,
					BlinkMacSystemFont;
				padding-bottom: 1px;
				background-color: $bg-color;
			}

			li {
				display: flex;
				flex-flow: row;
				gap: 8px;
				align-items: center;

				button {
					all: unset;
					display: flex;
					flex-flow: row;
					align-items: center;
					flex-shrink: 1;
					gap: 8px;
					width: max-content;
					min-width: 0;
					max-width: 100%;
					cursor: pointer;
				}

				span {
					width: max-content;
					margin-left: 0px;

					&:first-child {
						min-width: max-content;
					}

					&:last-of-type {
						background-color: $accent-color;
						color: $text-color;
						border-radius: 8px;
						padding: 10px 12px;
					}
				}
			}
		}

		span {
			margin-left: calc(30px);
			width: 100%;
			display: flex;
			justify-content: center;
		}
	}

	h2 {
		font-size: 30px;
		font-weight: bold;
		margin-left: 30px;
	}
</style>
