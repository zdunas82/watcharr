<script lang="ts">
	import Modal from "@/lib/Modal.svelte";
	import Setting from "@/lib/settings/Setting.svelte";
	import SettingsList from "@/lib/settings/SettingsList.svelte";
	import { req } from "@/lib/util/api";
	import { ReqerError } from "@/lib/util/fetch";
	import { notify } from "@/lib/util/notify";
	import type { TwitchSettings } from "@/types";

	interface Props {
		cfg?: TwitchSettings;
		onClose: () => void;
	}

	let { cfg = {}, onClose }: Props = $props();

	let error: string | undefined = $state();
	let formDisabled = false;

	function checkForm() {
		let errs: string[] = [];
		if (!cfg.clientId) {
			errs.push("Client ID");
		}
		if (!cfg.clientSecret) {
			errs.push("Client Secret");
		}
		if (errs.length > 0) {
			error = `Brak wymaganych pól: ${errs.join(", ")}`;
		} else {
			error = "";
		}
	}

	async function save() {
		checkForm();
		// if no error set from checkForm func, continue
		if (!error) {
			try {
				await req.post(`/game/config`, cfg);
				notify({
					type: "success",
					text: "Zapisano zmiany!",
				});
				onClose();
			} catch (err) {
				console.error("Failed to save twitch cfg!", err);
				error = ReqerError.getMsg(err, "Nie udało się zapisać");
			}
		}
	}
</script>

<Modal
	title="Konfiguracja Twitch"
	desc="Skonfiguruj aplikację Twitch, żeby włączyć obsługę gier."
	{onClose}
>
	{#if error}
		<span class="error">{error}!</span>
	{/if}

	<SettingsList>
		<a
			href="https://watcharr.app/docs/server_config/game-support-igdb"
			target="_blank"
		>
			Dowiedz się, jak skonfigurować tę opcję, w dokumentacji Watcharra.
		</a>

		<Setting title="Client ID" desc="Client ID aplikacji Twitch.">
			<input
				type="text"
				placeholder="yrbrrakvgbce99fzjsidkfoalsk9eee"
				value={cfg.clientId}
				oninput={(e) => (cfg.clientId = e.currentTarget.value)}
				disabled={formDisabled}
			/>
		</Setting>
		<Setting title="Client Secret" desc="Client Secret aplikacji Twitch.">
			<input
				type="text"
				placeholder="yrbralsodkfishfzpajdkflqoefeee"
				value={cfg.clientSecret}
				oninput={(e) => (cfg.clientSecret = e.currentTarget.value)}
				disabled={formDisabled}
			/>
		</Setting>
		<div class="btns">
			<button onclick={() => save()}>Zapisz</button>
		</div>
	</SettingsList>
</Modal>

<style lang="scss">
	a {
		text-decoration: underline;
		transition: opacity 100ms ease;

		&:hover {
			opacity: 0.8;
		}
	}

	.btns {
		display: flex;
		flex-flow: row;
		gap: 10px;

		:first-child {
			margin-left: auto;
		}

		button {
			width: max-content;
			padding-left: 15px;
			padding-right: 15px;
		}
	}

	.error {
		position: sticky;
		top: 0;
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 10px;
		background-color: rgb(221, 48, 48);
		text-transform: none; /* PoterX: polskie teksty maja wlasna wielkosc liter */
		color: white;
		margin-bottom: 15px;
	}
</style>
