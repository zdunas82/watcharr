<script lang="ts">
	import Modal from "../Modal.svelte";
	import Icon from "../Icon.svelte";
	import { notify } from "../util/notify";

	interface Props {
		contentTitle?: string;
		thoughts: string;
		onChange: (newThoughts: string) => Promise<boolean>;
	}

	let { contentTitle = "tym tytule", thoughts, onChange }: Props = $props();

	let modalOpen = $state(false);
	let textarea: HTMLTextAreaElement | undefined = $state();
	let thoughtsToDisplay = $derived(
		thoughts ? thoughts : `Dodaj swoje przemyślenia o ${contentTitle}`,
	);

	function resizeTextarea() {
		if (!textarea) {
			return;
		}
		textarea.style.height = "";
		textarea.style.height = textarea.scrollHeight + "px";
	}

	$effect(() => {
		if (textarea) resizeTextarea();
	});
</script>

<button
	class={`plain thoughts${thoughtsToDisplay?.length > 100 ? " long" : ""}${thoughts ? "" : " placeholdered"}`}
	onclick={() => {
		modalOpen = !modalOpen;
		if (modalOpen) {
			resizeTextarea();
		}
	}}
>
	<i><Icon i="pencil" wh={24} /></i>
	<p>{thoughtsToDisplay}</p>
</button>

{#if modalOpen}
	<Modal
		title="Twoje przemyślenia"
		desc="Zobacz lub zmień swoje przemyślenia o {contentTitle}"
		onClose={async () => {
			if (!textarea) {
				notify({
					text: "Nie udało się znaleźć pola tekstowego! Skopiuj swoje zmiany, żeby ich nie stracić, i spróbuj ponownie!",
				});
				return;
			}
			// If thoughts weren't changed or changes saved successfully.
			if (thoughts === textarea.value || (await onChange(textarea.value))) {
				modalOpen = false;
			}
		}}
	>
		<textarea
			name="Thoughts"
			rows="3"
			placeholder={`Moje przemyślenia o ${contentTitle}`}
			value={thoughts}
			bind:this={textarea}
			oninput={resizeTextarea}></textarea>
	</Modal>
{/if}

<style lang="scss">
	button.thoughts {
		position: relative;
		width: 100%;
		text-align: start;
		padding: 7px 10px;
		border: 2px solid $text-color;
		border-radius: 5px;
		max-height: 100px;
		opacity: 0.5;
		transition: opacity 150ms ease-in-out;

		&:hover {
			opacity: 1;
		}

		i {
			display: flex;
			position: absolute;
			bottom: 4px;
			right: 5px;
			opacity: 0;
			transform: scale(0.5);
			transition:
				opacity 150ms ease-in-out,
				transform 150ms ease-in-out;
		}

		&:hover i {
			transform: scale(1);
			opacity: 1;
		}

		&.placeholdered {
			padding: 12px 12px;
		}

		p {
			max-height: 90px;
			overflow: hidden;
		}

		&.long p {
			mask: linear-gradient(
				to bottom,
				rgba(0, 0, 0, 1) 0,
				rgba(0, 0, 0, 1) 40%,
				rgba(0, 0, 0, 0) 95%,
				rgba(0, 0, 0, 0) 0
			);
		}
	}

	textarea {
		border: 0;
	}
</style>
