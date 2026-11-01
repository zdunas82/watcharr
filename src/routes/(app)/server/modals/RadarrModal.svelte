<script lang="ts">
	import { run } from "svelte/legacy";

	import Checkbox from "@/lib/Checkbox.svelte";
	import DropDown from "@/lib/DropDown.svelte";
	import Modal from "@/lib/Modal.svelte";
	import Setting from "@/lib/settings/Setting.svelte";
	import SettingsList from "@/lib/settings/SettingsList.svelte";
	import { notify } from "@/lib/util/notify";
	import type {
		DropDownItem,
		RadarrSettings,
		RadarrTestResponse,
	} from "@/types";
	import { req } from "@/lib/util/api";
	import { ReqerError } from "@/lib/util/fetch";

	interface Props {
		servarr: RadarrSettings;
		isEditing: boolean;
		onClose: () => void;
	}

	let { servarr = $bindable(), isEditing, onClose }: Props = $props();

	let error: string | undefined = $state();
	let formDisabled = $state(false);

	let qualityProfiles: DropDownItem[] = $state([]);
	let rootFolders: DropDownItem[] = $state([]);

	function testIfHostAndKeySet() {
		if (servarr.host && servarr.key) {
			console.log("host and key set.. loading settings data from radarr");
			getSettingsData();
		} else {
			qualityProfiles = [];
			rootFolders = [];
			error = "aby przetestować połączenie, podaj host i klucz";
		}
	}

	async function getSettingsData() {
		try {
			formDisabled = true;
			const res = await req.post<RadarrTestResponse>("/arr/rad/test", {
				host: servarr.host,
				key: servarr.key,
			});
			qualityProfiles = res.qualityProfiles.map((d) => {
				return { id: d.id, value: d.name };
			});
			rootFolders = res.rootFolders.map((d) => {
				return { id: d.id, value: d.path };
			});
			formDisabled = false;
			error = "";
		} catch (err) {
			console.error("getSettingsData failed!", err);
			error = `Żądanie nie powiodło się, sprawdź host i klucz`;
			formDisabled = false;
		}
	}

	function checkForm() {
		let errs: string[] = [];
		if (!servarr.name) {
			errs.push("nazwa");
		}
		if (!servarr.host) {
			errs.push("host");
		}
		if (!servarr.key) {
			errs.push("klucz");
		}
		if (!servarr.qualityProfile) {
			errs.push("profil jakości");
		}
		if (!servarr.rootFolder) {
			errs.push("folder główny");
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
			console.log(servarr);
			try {
				await req.post(`/arr/rad/${isEditing ? "edit" : "add"}`, servarr);
				notify({
					type: "success",
					text: isEditing ? "Zapisano zmiany!" : "Dodano serwer!",
				});
				onClose();
			} catch (err) {
				console.error("Failed to save server!", err);
				error = ReqerError.getMsg(
					err,
					`Nie udało się ${isEditing ? "zapisać zmian" : "dodać serwera"}`,
				);
			}
		}
	}

	async function remove() {
		try {
			await req.post(`/arr/rad/rm/${servarr.name}`);
			notify({
				type: "success",
				text: "Usunięto serwer",
			});
			onClose();
		} catch (err) {
			console.error("Failed to remove server!", err);
			error = ReqerError.getMsg(err, "Nie udało się usunąć");
		}
	}
	run(() => {
		if (isEditing) {
			getSettingsData();
		}
	});
</script>

<Modal
	title={isEditing ? `Edytuj ${servarr.name}` : "Dodaj serwer Radarr"}
	desc="Skonfiguruj połączenie z serwerem Radarr"
	{onClose}
>
	{#if error}
		<span class="error">{error}!</span>
	{/if}
	<SettingsList>
		{#if !isEditing}
			<Setting title="Nazwa" desc="Nadaj serwerowi łatwą do zapamiętania nazwę.">
				<input
					type="text"
					placeholder="https://radarr.example.com"
					bind:value={servarr.name}
					disabled={formDisabled}
				/>
			</Setting>
		{/if}
		<Setting
			title="Host Radarr"
			desc="Wskaż swój serwer Radarr, żeby włączyć prośby o filmy."
		>
			<input
				type="text"
				placeholder="https://radarr.example.com"
				bind:value={servarr.host}
				disabled={formDisabled}
			/>
		</Setting>
		<Setting title="Klucz Radarr" desc="Klucz API Twojej instancji Radarr.">
			<input
				type="text"
				placeholder="dGhhbmtzIGZvciB1c2luZyB3YXRjaGFyciA6KQ=="
				bind:value={servarr.key}
				disabled={formDisabled}
			/>
		</Setting>
		<Setting
			title="Profil jakości"
			desc="Domyślny profil jakości przy dodawaniu filmów."
		>
			<DropDown
				placeholder={qualityProfiles?.length == 0
					? "Podaj host i klucz, potem kliknij Testuj"
					: "Wybierz profil jakości"}
				options={qualityProfiles}
				bind:active={servarr.qualityProfile}
				disabled={formDisabled}
			/>
		</Setting>
		<Setting title="Folder główny" desc="Domyślny folder główny przy dodawaniu filmów.">
			<DropDown
				placeholder={rootFolders?.length == 0
					? "Podaj host i klucz, potem kliknij Testuj"
					: "Wybierz folder główny"}
				options={rootFolders}
				bind:active={servarr.rootFolder}
				disabled={formDisabled}
			/>
		</Setting>
		<Setting
			title="Automatyczne wyszukiwanie"
			desc="Automatycznie rozpocząć wyszukiwanie filmu?"
			row
		>
			<Checkbox
				name="automaticSearch"
				disabled={formDisabled}
				bind:value={servarr.automaticSearch}
			/>
		</Setting>
		<div class="btns">
			{#if isEditing}
				<button class="danger" onclick={() => remove()}>Usuń</button>
			{/if}
			<button id="test" class="secondary" onclick={() => testIfHostAndKeySet()}
				>Testuj</button
			>
			<button onclick={() => save()}>{isEditing ? "Zapisz" : "Dodaj serwer"}</button
			>
		</div>
	</SettingsList>
</Modal>

<style lang="scss">
	.btns {
		display: flex;
		flex-flow: row;
		gap: 10px;

		#test {
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
