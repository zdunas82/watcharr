<script lang="ts">
	import DropDown from "./DropDown.svelte";
	import type { DropDownItem, TMDBRegions } from "@/types";
	import Error from "./Error.svelte";
	import { req } from "./util/api";

	interface Props {
		selectedCountry?: string;
		disabled?: boolean;
		onChange: (country: string) => void;
	}

	let {
		selectedCountry = $bindable("US"),
		disabled = false,
		onChange,
	}: Props = $props();

	let mappedCountries: DropDownItem[] = $state([]);

	async function getCountries() {
		const c = await req.get<TMDBRegions>(`/content/regions`);
		let regionNames: Intl.DisplayNames | undefined;
		try {
			regionNames = new Intl.DisplayNames(["pl"], { type: "region" });
		} catch {
			regionNames = undefined;
		}
		mappedCountries = c.results
			.map((cc) => {
				let name = cc.english_name;
				try {
					name = regionNames?.of(cc.iso_3166_1) ?? cc.english_name;
				} catch {
					name = cc.english_name;
				}
				return {
					id: cc.iso_3166_1,
					value: name,
				} as DropDownItem;
			})
			.sort((a, b) => a.value.localeCompare(b.value, "pl"));
	}
</script>

{#await getCountries() then}
	<DropDown
		placeholder="Wybierz kraj"
		bind:active={selectedCountry}
		options={mappedCountries}
		onChange={() => onChange(selectedCountry)}
		isDropDownItem={true}
		{disabled}
	/>
{:catch err}
	<Error error={err} pretty="Nie udało się wczytać listy krajów!" />
{/await}
