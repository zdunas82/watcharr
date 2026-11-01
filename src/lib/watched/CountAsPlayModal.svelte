<script lang="ts">
	import Modal from "../Modal.svelte";
	import type { Signal } from "../util/signal";

	interface Props {
		onDecision: Signal<boolean>;
	}

	let { onDecision }: Props = $props();
</script>

<Modal
	title="Policz jako pełne obejrzenie"
	desc="Czy zwiększyć liczbę obejrzeń tej pozycji o jeden?"
	maxWidth="450px"
>
	<div class="button-row">
		<button class="danger" onclick={() => onDecision.fire(false)}>
			Nie, nie licz
		</button>
		<button onclick={() => onDecision.fire(true)}>Tak, policz jako obejrzenie</button>
	</div>
</Modal>

<style lang="scss">
	.button-row {
		display: flex;
		flex-flow: row;
		justify-content: space-between;
		margin-top: 10px;

		button {
			margin-top: auto;
			width: max-content;
		}
	}
</style>
