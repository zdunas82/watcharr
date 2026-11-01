<script lang="ts">
	import Modal from "@/lib/Modal.svelte";
	import { req } from "@/lib/util/api";
	import { notify } from "@/lib/util/notify";

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	async function downloadWatchedList() {
		const nid = notify({ text: "Eksportowanie", type: "loading" });
		try {
			// We re-fetch, to ensure data we export is up to date.
			const r = await req.get<unknown[]>("/watched");
			console.log(r);
			if (!r || r?.length <= 0) {
				notify({
					id: nid,
					text: "Nie można wyeksportować pustej listy!",
					type: "error",
					time: 10000,
				});
				return;
			}
			const file = new Blob([JSON.stringify(r, undefined, 2)], {
				type: "application/json",
			});
			const a = document.createElement("a");
			a.href = URL.createObjectURL(file);
			a.download = "watcharr-export.json";
			a.click();
			notify({ id: nid, text: "Wyeksportowano", type: "success" });
			onClose();
		} catch (err) {
			console.error("downloadWatchedList failed!", err);
			notify({ id: nid, text: "Eksport nie powiódł się!", type: "error" });
		}
	}
</script>

<Modal title="Eksport twojej listy" maxWidth="600px" {onClose}>
	<p>
		Używaj tej funkcji tylko wtedy, gdy przenosisz się z Watcharr na inną
		platformę ALBO na inną instancję Watcharr, a nie jesteś właścicielem tej lub
		tamtej instancji.
	</p>
	<p>
		Jeśli przenosisz się na inny serwer, który należy do ciebie, najlepiej zabierz
		ze sobą obecną bazę danych.
	</p>
	<p>
		<b>Uwaga</b>: to nie jest funkcja kopii zapasowej. Kopie zapasowe należy
		robić na serwerze (zobacz:
		<a href="https://watcharr.app/docs/server_config/backup" target="_blank"
			>https://watcharr.app/docs/server_config/backup</a
		>).
	</p>
	<button onclick={() => downloadWatchedList()}>Eksportuj</button>
</Modal>

<style lang="scss">
	p {
		margin-bottom: 10px;

		&:first-of-type {
			margin-top: 10px;
		}
	}
</style>
