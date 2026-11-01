<script lang="ts">
	import Modal from "@/lib/Modal.svelte";
	import Spinner from "@/lib/Spinner.svelte";
	import Setting from "@/lib/settings/Setting.svelte";
	import SettingsList from "@/lib/settings/SettingsList.svelte";
	import { plPlural, toRelativeTime } from "@/lib/util/helpers";
	import { notify } from "@/lib/util/notify";
	import type { AllTasksResponse } from "@/types";
	import { req } from "@/lib/util/api";
	import { onMount } from "svelte";
	import Icon from "@/lib/Icon.svelte";

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	let now = $state(Date.now());
	let formDisabled = $state(false);
	let taskSchedule: AllTasksResponse[] = $state([]);

	async function getAllTasks() {
		try {
			const res = await req.get<AllTasksResponse[]>("/task/");
			taskSchedule = res?.sort((a, b) => {
				if (a.name < b.name) {
					return -1;
				}
				if (a.name > b.name) {
					return 1;
				}
				return 0;
			});
		} catch (err) {
			console.error("getAllTasks failed!", err);
			notify({
				type: "error",
				text: "Nie udało się pobrać listy zadań z serwera.",
				time: 6000,
			});
		}
	}

	async function rescheduleTask(name: string, seconds: number) {
		const nid = notify({ type: "loading", text: "Aktualizowanie…" });
		try {
			formDisabled = true;
			const res = await req.putWhole(`/task/${name}`, { seconds });
			if (res.status === 200) {
				notify({ id: nid, type: "success", text: "Zaktualizowano harmonogram." });
				getAllTasks();
			} else {
				console.error(
					"rescheduleTask: Unexpected response status code:",
					res.status,
				);
				notify({
					id: nid,
					type: "error",
					text: "Nieoczekiwana odpowiedź na żądanie zmiany harmonogramu.",
					time: 6000,
				});
			}
			formDisabled = false;
		} catch (err) {
			console.error("rescheduleTask failed!", err);
			notify({
				id: nid,
				type: "error",
				text: "Nie udało się zaktualizować harmonogramu.",
				time: 6000,
			});
			formDisabled = false;
		}
	}

	async function runTask(name: string) {
		const nid = notify({ type: "loading", text: "Uruchamianie…" });
		try {
			await req.post(`/task/${name}/run`);
			notify({ id: nid, type: "success", text: "Uruchomiono!" });
		} catch (err) {
			console.error("runTask failed!", err);
			notify({
				id: nid,
				type: "error",
				text: "Ręczne uruchomienie nie powiodło się!",
			});
		}
	}

	onMount(() => {
		getAllTasks();
		const nowInterval = setInterval(() => {
			now = Date.now();
		}, 1000);
		const getTasksInterval = setInterval(() => {
			getAllTasks();
		}, 8000);
		return () => {
			clearInterval(nowInterval);
			clearInterval(getTasksInterval);
		};
	});
</script>

<Modal
	title="Harmonogram zadań"
	desc="Chcesz, żeby cykliczne zadanie uruchamiało się częściej lub rzadziej? Ustaw to poniżej."
	maxWidth="700px"
	{onClose}
>
	<SettingsList>
		{#if taskSchedule?.length <= 0}
			<Spinner />
		{:else}
			{#each taskSchedule as task (task.name)}
				{@const nextRun = toRelativeTime(
					(new Date(task.nextRun).getTime() - now) / 1000,
				)}
				<Setting title={task.name}>
					<div class="entry">
						<span>Uruchamiane co</span>
						<input
							type="number"
							placeholder="60"
							bind:value={task.seconds}
							disabled={formDisabled}
							onblur={() => {
								rescheduleTask(task.name, task.seconds);
							}}
						/>
						<span>
							{plPlural(task.seconds, "sekundę", "sekundy", "sekund")}.
							Następne{nextRun === "teraz" ? ":" : " za"}
							{nextRun}.
						</span>
						<button
							onclick={() => runTask(task.name)}
							aria-label="Uruchom teraz"
						>
							<Icon i="play" />
						</button>
					</div>
				</Setting>
			{/each}
		{/if}
	</SettingsList>
</Modal>

<style lang="scss">
	.entry {
		display: flex;
		flex-flow: row;
		align-items: center;
		gap: 5px;

		input {
			width: 110px;
		}

		button {
			width: min-content;
			height: 100%;
			margin-left: auto;
		}
	}
</style>
