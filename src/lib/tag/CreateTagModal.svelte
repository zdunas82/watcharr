<script lang="ts">
	import { store } from "@/store.svelte";
	import Modal from "../Modal.svelte";
	import Setting from "../settings/Setting.svelte";
	import SettingsList from "../settings/SettingsList.svelte";
	import ColorSelector from "../ColorSelector.svelte";
	import { notify } from "../util/notify";
	import { req } from "../util/api";
	import type { Tag, TagAddRequest } from "@/types";
	import { onMount } from "svelte";

	interface Props {
		onClose: () => void;
		// Passing an existing tag will enable 'Edit Tag' mode.
		existingTag?: Tag | undefined;
	}

	let { onClose, existingTag = undefined }: Props = $props();

	const colorPresets = [
		["#36BA98", "#000"],
		["#FF4191", "#231731"],
		["#173B45", "#FFE0C9"],
		["#6EACDA", "#021526"],
		["#180161", "#FF9E73"],
		["#FFBC0A", "#2F0A39"],
		["#C1FF9B", "#321673"],
		["#F5FFC6", "#5126B5"],
		["#6D213C", "#FAFF70"],
		["#F7C4A5", "#2f0082"],
		["#F7EFE5", "#63338c"],
	];

	function getRandomColorPreset() {
		return colorPresets[Math.floor(Math.random() * colorPresets.length)];
	}

	const defaultPreset = getRandomColorPreset();
	let textColor = $state(defaultPreset[1]);
	let bgColor = $state(defaultPreset[0]);
	let tagName = $state("");
	let error = $state("");
	let submitDisabled = $state(false);
	let modalTitle = $state("Utwórz tag");
	let modalDesc = $state("Utwórz nowy tag");
	let submitBtnText = $state("Utwórz tag");

	async function addTag() {
		console.debug("addTag:", tagName, textColor, bgColor);
		if (!tagName) {
			error = "Tag musi mieć nazwę!";
			return;
		}
		const nid = notify({ text: "Tworzenie tagu", type: "loading" });
		try {
			const resp = await req.post<Tag>("/tag", {
				name: tagName,
				color: textColor,
				bgColor,
			} as TagAddRequest);
			console.log("addTag: Tag was created", resp);
			store.tags.push(resp);
			notify({ id: nid, text: "Utworzono tag!", type: "success" });
			onClose();
		} catch (err) {
			console.error("addTag: Failed!", err);
			notify({ id: nid, text: "Nie udało się!", type: "error", time: 1 });
			error = "Nie udało się!";
		}
	}

	async function updateTag() {
		console.debug("updateTag:", existingTag, tagName, textColor, bgColor);
		if (!tagName) {
			error = "Tag musi mieć nazwę!";
			return;
		}
		const nid = notify({ text: "Zmienianie tagu", type: "loading" });
		try {
			const resp = await req.put<Tag>(`/tag/${existingTag!.id}`, {
				name: tagName,
				color: textColor,
				bgColor,
			} as TagAddRequest);
			console.log("updateTag: Tag was edited", resp);
			existingTag!.name = tagName;
			existingTag!.color = textColor;
			existingTag!.bgColor = bgColor;
			// Doesn't update `updatedAt`... may need to in the future if we need to sort by it, etc
			notify({ id: nid, text: "Zmieniono tag!", type: "success" });
			onClose();
		} catch (err) {
			console.error("updateTag: Failed!", err);
			notify({ id: nid, text: "Nie udało się!", type: "error", time: 1 });
			error = "Nie udało się!";
		}
	}

	async function submitClicked() {
		submitDisabled = true;
		try {
			if (existingTag) {
				await updateTag();
			} else {
				await addTag();
			}
		} catch (err) {
			console.log("CreateTagModal: Submit failed!", err);
		}
		submitDisabled = false;
	}

	onMount(() => {
		if (existingTag) {
			console.log("CreateTagModal: Entering edit mode for tag:", existingTag);
			modalTitle = "Edytuj tag";
			modalDesc = "Edytuj istniejący tag";
			submitBtnText = "Zapisz tag";
			tagName = existingTag.name;
			textColor = existingTag.color;
			bgColor = existingTag.bgColor;
		}
	});
</script>

<div class="wrap">
	<Modal title={modalTitle} desc={modalDesc} maxWidth="500px" {onClose} {error}>
		<SettingsList>
			<Setting title="Nazwa" desc="Jak nazwać ten tag?">
				<input
					type="text"
					name="name"
					placeholder="Nazwa"
					bind:value={tagName}
				/>
			</Setting>
			<Setting title="Kolor tekstu" desc="Kolor tekstu tagu." row>
				<ColorSelector bind:value={textColor} style="max-width: 150px;" />
			</Setting>
			<Setting
				title="Kolor tła"
				desc="Kolor tła tagu."
				row
			>
				<ColorSelector bind:value={bgColor} style="max-width: 150px;" />
			</Setting>
			<button
				class="add-tag-btn"
				onclick={() => submitClicked()}
				disabled={submitDisabled}
			>
				{submitBtnText}
			</button>
		</SettingsList>
	</Modal>
</div>

<style lang="scss">
	.add-tag-btn {
		width: max-content;
		margin-left: auto;
	}

	.wrap {
		color: $text-color;
	}
</style>
