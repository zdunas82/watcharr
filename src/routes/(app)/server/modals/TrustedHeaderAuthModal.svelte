<script lang="ts">
	import Checkbox from "@/lib/Checkbox.svelte";
	import Modal from "@/lib/Modal.svelte";
	import Notice from "@/lib/Notice.svelte";
	import Spinner from "@/lib/Spinner.svelte";
	import Setting from "@/lib/settings/Setting.svelte";
	import SettingsList from "@/lib/settings/SettingsList.svelte";
	import { req } from "@/lib/util/api";
	import { notify } from "@/lib/util/notify";
	import type { ServerConfigByName, TrustedHeaderAuthSetting } from "@/types";
	import { onMount } from "svelte";

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	let headerCfg: TrustedHeaderAuthSetting = $state({
		enabled: false,
		headerName: "",
		logoutUrl: "",
		autoLogin: false,
	});
	let formDisabled = false;
	let loadingCfg = $state(false);
	let error = "";

	async function getHeaderCfg() {
		try {
			loadingCfg = true;
			const res = await req.get<ServerConfigByName<TrustedHeaderAuthSetting>>(
				"/server/config",
				{
					params: { s: "HEADER_AUTH" },
				},
			);
			headerCfg = res.value;
			loadingCfg = false;
		} catch (err) {
			console.error("getHeaderCfg failed!", err);
			notify({
				type: "error",
				text: "Nie udało się pobrać konfiguracji z serwera.",
				time: 6000,
			});
		}
	}

	async function save() {
		const nid = notify({
			type: "loading",
			text: "Zapisywanie…",
		});
		try {
			await req.post("/server/config", headerCfg, {
				params: { s: "HEADER_AUTH" },
			});
			notify({
				id: nid,
				type: "success",
				text: "Zapisano zmiany!",
			});
			onClose();
		} catch (err) {
			console.error("save failed!", err);
			notify({
				id: nid,
				type: "error",
				text: "Nie udało się zapisać konfiguracji. Spróbuj ponownie!",
				time: 6000,
			});
		}
	}

	onMount(() => {
		getHeaderCfg();
	});
</script>

<Modal
	title="Uwierzytelnianie zaufanym nagłówkiem"
	desc="Skonfiguruj logowanie jednokrotne (SSO) przez zaufany nagłówek."
	{onClose}
>
	{#if error}
		<span class="error">{error}!</span>
	{/if}
	{#if loadingCfg}
		<Spinner />
	{:else}
		<SettingsList>
			<Notice
				title="To jest niebezpieczne!"
				desc="Przy błędnej konfiguracji moduł autoryzacji serwera można łatwo przejąć. Jeśli to włączasz, upewnij się, że Twoja instancja Watcharra jest dostępna wyłącznie przez proxy, a nie bezpośrednio."
				type="warn"
			/>
			<Setting
				title="Nazwa nagłówka"
				desc="Nazwa nagłówka używanego do uwierzytelniania."
			>
				<input
					type="text"
					placeholder="X-User"
					onblur={() => {}}
					disabled={formDisabled}
					bind:value={headerCfg.headerName}
				/>
			</Setting>
			<Setting
				title="Adres wylogowania"
				desc="Dokąd przekierować użytkownika, żeby mógł się wylogować?"
			>
				<input
					type="text"
					placeholder="https://auth.example.com/logout"
					onblur={() => {}}
					disabled={formDisabled}
					bind:value={headerCfg.logoutUrl}
				/>
			</Setting>
			<Setting
				title="Automatyczne logowanie"
				desc="Czy logować użytkowników automatycznie od razu po wejściu na stronę logowania?"
				row
			>
				<Checkbox
					name="HeaderAuthAutoLogin"
					disabled={formDisabled}
					bind:value={headerCfg.autoLogin}
				/>
			</Setting>
			<Setting
				title="Włączone"
				desc="Włączyć logowanie jednokrotne przez zaufany nagłówek? Włącz, żeby aktywować powyższą konfigurację."
				row
			>
				<Checkbox
					name="HeaderAuthEnabled"
					disabled={formDisabled}
					bind:value={headerCfg.enabled}
				/>
			</Setting>
			<div class="btns">
				<button onclick={() => save()}>Zapisz</button>
			</div>
		</SettingsList>
	{/if}
</Modal>

<style lang="scss">
	.btns {
		display: flex;
		flex-flow: row;
		gap: 10px;

		button {
			width: max-content;
			padding-left: 15px;
			padding-right: 15px;

			&:nth-child(1) {
				margin-left: auto;
			}
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
