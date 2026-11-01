<script lang="ts">
	import Icon from "@/lib/Icon.svelte";
	import Modal from "@/lib/Modal.svelte";

	let modalShown = $state(false);
</script>

<button
	onclick={() => (modalShown = true)}
	style="width: min-content; margin-left:auto; gap: 5px;"
>
	<Icon i="filter" wh={16} /> Filtry
</button>

{#if modalShown}
	<Modal title="Pomoc: filtry" onClose={() => (modalShown = false)}>
		<div class="modal-inner">
			<p>
				Obecnie, aby użyć filtrów, musisz ręcznie wpisać je w pasku
				wyszukiwania.
			</p>
			<p><b>Obsługiwane filtry</b></p>
			<ul>
				<li>
					<b>year</b>, <b>y</b> - pozycja ma <i>dowolną</i> datę premiery w podanym roku
					(działa tylko po wybraniu typu, np. Filmy).
				</li>
				<li>
					<b>fyear</b>, <b>fy</b> - <i>pierwsza</i> premiera pozycji była w podanym roku
					(działa tylko po wybraniu typu, np. Filmy).
				</li>
				<li>
					<b>adult</b> - włącza wyniki dla dorosłych. Domyślnie zawsze „wyłączone”
					(tylko Filmy, Seriale, Osoby). Podaj dowolną wartość, aby je „włączyć”.
				</li>
			</ul>
			<p><b>Przykłady</b></p>
			<ul>
				<li>
					<b>Filtrowanie po dowolnym pasującym roku premiery:</b>
					<ul>
						<li>Spider Man year:2026</li>
						<li>Spider Man y:2026</li>
					</ul>
				</li>
				<li>
					<b>Filtrowanie po roku pierwszej premiery:</b>
					<ul>
						<li>Spider Man fyear:2026</li>
						<li>Spider Man fy:2026</li>
					</ul>
				</li>
				<li>
					<b>Włączenie filmów, seriali lub osób dla dorosłych w wynikach:</b>
					<ul>
						<li>Spider Man adult:1</li>
					</ul>
				</li>
			</ul>
		</div>
	</Modal>
{/if}

<style lang="scss">
	.modal-inner {
		display: flex;
		flex-flow: column;
		gap: 5px;

		ul {
			list-style: inside;
			margin-left: 5px;
		}

		ul li > ul {
			list-style: inside circle;
			margin-left: 15px;
		}
	}
</style>
