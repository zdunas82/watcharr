<!-- 
  /import/trakt collects the username for the trakt
  user to import data from.
 -->

<script lang="ts">
	import JobWatcherModal from "@/lib/JobWatcherModal.svelte";
	import Setting from "@/lib/settings/Setting.svelte";
	import { req } from "@/lib/util/api";
	import { notify } from "@/lib/util/notify";
	import { store } from "@/store.svelte";
	import type { JobCreatedResponse } from "@/types";

	let modalOpen = $state(false);
	let traktUsername = $state("");
	let traktApiKey = $state("");

	async function startJob(): Promise<{ jobId: string } | undefined> {
		const r = await req.post<JobCreatedResponse>("/import/trakt", {
			username: traktUsername,
			apiKey: traktApiKey.trim(),
		});
		console.log("startSync: Response:", r);
		if (!r?.jobId) {
			notify({
				type: "error",
				text: "Nie zwrócono identyfikatora zadania! Nie da się śledzić zadania (o ile w ogóle wystartowało).",
			});
			return;
		}
		return { jobId: r.jobId };
	}
</script>

<div class="content">
	<div class="inner">
		<h2>Import z Trakt</h2>
		<h5 class="norm">
			Podaj nazwę użytkownika swojego <b>publicznego</b> profilu Trakt, aby
			rozpocząć import.
		</h5>

		<input
			class="username"
			type="text"
			placeholder={store.userInfo?.username ?? "Nazwa użytkownika Trakt"}
			bind:value={traktUsername}
		/>
		<button onclick={() => (modalOpen = true)}>Rozpocznij import</button>

		<div class="settings-ctr">
			<Setting
				title="Klucz API (opcjonalnie)"
				desc="Podaj własny Client ID aplikacji Trakt, jeśli nasz domyślny klucz sprawia problemy."
			>
				<input placeholder="Trakt Client ID" bind:value={traktApiKey} />
			</Setting>
		</div>

		<a
			class="help"
			href="https://watcharr.app/docs/importing/trakt"
			target="_blank"
		>
			Potrzebujesz pomocy? Zobacz: https://watcharr.app/docs/importing/trakt
		</a>
	</div>

	{#if modalOpen}
		<JobWatcherModal
			modalTitle="Import z Trakt"
			messages={{ starting: "Uruchamianie importu z Trakt" }}
			getJobId={startJob}
			onClose={() => (modalOpen = false)}
		/>
	{/if}
</div>

<style lang="scss">
	.content {
		display: flex;
		width: 100%;
		justify-content: center;
		padding: 0 30px 30px 30px;

		.inner {
			display: flex;
			flex-flow: column;
			min-width: 400px;
			max-width: 400px;
			overflow: hidden;

			@media screen and (max-width: 420px) {
				min-width: 100%;
			}
		}
	}

	input.username,
	button {
		margin-top: 15px;
	}

	.settings-ctr {
		margin-top: 30px;
	}

	a.help {
		margin-top: 20px;
	}
</style>
