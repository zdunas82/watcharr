<script lang="ts">
	import Icon from "../Icon.svelte";
	import Modal from "../Modal.svelte";

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();
</script>

<Modal title="O aplikacji" {onClose} maxWidth="400px">
	<div class="content">
		<div class="inner">
			<p>
				Projekt open source, który pomaga utrzymać porządek w tym, co oglądasz
				lub w co grasz, i daje Ci nad tym pełną kontrolę.
			</p>
			<div class="horizontal-icon-list">
				<a
					href="https://github.com/sbondCo/Watcharr"
					target="_blank"
					title="Github"
				>
					<Icon i="github" wh={60} />
					Kod<br />
					źródłowy
				</a>
				<a
					href="https://watcharr.app/"
					target="_blank"
					title="Strona i dokumentacja Watcharr"
				>
					<Icon i="website" wh={60} />
					Strona<br />
					i dokumentacja
				</a>
			</div>
			<h5 class="norm">Watcharr korzysta z następujących baz danych:</h5>
			<div class="horizontal-icon-list">
				<a href="https://www.themoviedb.org/" target="_blank" title="TMDB">
					<Icon i="tmdb" wh={60} />
				</a>
				<a href="https://www.igdb.com/" target="_blank" title="IGDB">
					<Icon i="igdb" wh={60} />
				</a>
			</div>
			<h5 class="norm">
				<!-- Linking to the file in `dev` branch would break every old version of
				 Watcharr if the file were ever moved in the future. Using the current version
				 as the branch should ensure this file is always accessible (but only as up to
				 date as the current version) -->
				<a
					href="https://github.com/sbondCo/Watcharr/blob/v{__WATCHARR_VERSION__}/ATTRIBUTION.md"
					target="_blank"
				>
					Zobacz plik z podziękowaniami i atrybucjami.
				</a>
			</h5>
		</div>
	</div>
</Modal>

<style lang="scss">
	p {
		margin: 8px 0px;
	}

	h5.norm {
		margin: 8px 0px;

		> a {
			text-decoration: underline;
		}
	}

	div.horizontal-icon-list {
		display: flex;
		justify-content: center;
		align-items: center;
		padding-bottom: 20px;
		padding-top: 5px;

		> a {
			display: flex;
			flex-flow: column;
			align-items: center;
			gap: 5px;
			margin: 0 10px;
			text-align: center;
		}
	}

	a {
		transition: opacity 150ms ease-in;

		&:hover {
			opacity: 0.5;
		}
	}
</style>
