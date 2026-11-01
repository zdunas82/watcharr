<script lang="ts">
	import tooltip from "@/lib/actions/tooltip";
	import DropDown from "@/lib/DropDown.svelte";
	import {
		DiscoverFilter,
		SearchType,
		type DiscoverFilterOption,
		type DropDownItem,
	} from "@/types";

	interface Props {
		active: DiscoverFilter | undefined;
		discoverType: SearchType | undefined;
		onChange: () => void;
	}

	let { active = $bindable(), discoverType, onChange }: Props = $props();

	const dropDownOptions: { [x in DiscoverFilterOption]: DropDownItem } = {
		trending: {
			id: DiscoverFilter.trending,
			value: "Na czasie",
		},
		popular: {
			id: DiscoverFilter.popular,
			value: "Popularne",
		},
		upcoming: {
			id: DiscoverFilter.upcoming,
			value: "Nadchodzące",
		},
		intheatres: {
			id: DiscoverFilter.inTheatres,
			value: "W kinach",
		},
		streaming: {
			id: DiscoverFilter.streaming,
			value: "W streamingu",
		},
		// advanced: {
		// 	id: "advanced",
		// 	value: "Advanced Search",
		// },
	};

	let options = $derived.by(() => {
		let o: DropDownItem[] = [dropDownOptions.trending];
		switch (discoverType) {
			case SearchType.movie:
				o.push(
					dropDownOptions.popular,
					dropDownOptions.upcoming,
					dropDownOptions.intheatres,
				);
				break;
			case SearchType.show:
				o.push(dropDownOptions.popular, dropDownOptions.upcoming);
				break;
			case SearchType.person:
				o.push(dropDownOptions.popular);
				break;
			case SearchType.game:
				o.push(dropDownOptions.upcoming);
				break;
		}
		// o.push(dropDownOptions.advanced);
		return o;
	});
	let onMultiDiscover = $derived(discoverType === SearchType.multi);
</script>

<div
	use:tooltip={{
		text: "Najpierw wybierz typ.",
		pos: "left",
		condition: onMultiDiscover,
	}}
>
	<DropDown
		placeholder="Na czasie"
		{options}
		isDropDownItem={true}
		bind:active
		{onChange}
		disabled={onMultiDiscover}
	/>
</div>
