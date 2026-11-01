<script lang="ts">
	import { onMount } from "svelte";
	import Modal from "../Modal.svelte";
	import type { TrustedHeaderAuthLogoutDetailsResponse } from "@/types";
	import Spinner from "../Spinner.svelte";
	import { clearWatcharrData } from ".";
	import { goto } from "$app/navigation";
	import { req } from "../util/api";
	import { resolve } from "$app/paths";

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	let loadingBtns = $state(true);
	let logoutUrl: string | undefined = $state(undefined);

	onMount(async () => {
		try {
			const r = await req.get<TrustedHeaderAuthLogoutDetailsResponse>(
				"/auth/proxy_logout_details",
			);
			logoutUrl = r?.logoutUrl;
			if (!logoutUrl?.toLowerCase()?.startsWith("http")) {
				// If no protocol in logoutUrl, set https
				logoutUrl = `https://${logoutUrl}`;
			}
		} catch (err) {
			console.error("Failed to get proxy logout details!", err);
		}
		loadingBtns = false;
	});

	function logout() {
		clearWatcharrData();
		goto(resolve("/login?noAuto=1"));
	}

	function proxyLogout() {
		if (!logoutUrl) {
			console.error(
				"proxyLogout: Not supported without a configured logoutUrl.",
			);
			return;
		}
		clearWatcharrData();
		window.location.replace(logoutUrl);
	}
</script>

<Modal
	title="Wylogowanie"
	desc="Zalogowano Cię przez logowanie jednokrotne (SSO). Czy kliknięcie „Wyloguj” było pomyłką?"
	{onClose}
>
	{#if loadingBtns}
		<Spinner />
	{:else}
		<div>
			<p>
				{#if logoutUrl}
					Prawdopodobnie chodzi Ci o to: <b
						>wyloguj się całkowicie z usługi logowania jednokrotnego i z Watcharr</b
					>.
				{:else}
					Wylogowanie z logowania jednokrotnego nie zostało skonfigurowane na tym
					serwerze. Jeśli nie zarządzasz serwerem, daj znać administratorowi!
				{/if}
			</p>
			<button disabled={!logoutUrl} onclick={proxyLogout}
				>Wyloguj z usługi logowania jednokrotnego</button
			>
			<p>
				Wylogowanie z Watcharr usunie lokalne dane logowania i dane aplikacji, ale <b
					>nadal będziesz zalogowany w usłudze logowania jednokrotnego</b
				>! <b>Nie</b> rób tego na publicznym komputerze, zakładając, że się
				wylogowałeś — konto może być nadal dostępne.
			</p>
			<button onclick={logout}>Wyloguj z Watcharr</button>
		</div>
	{/if}
</Modal>

<style lang="scss">
	div {
		display: flex;
		flex-flow: column;

		p {
			margin-bottom: 5px;
		}

		button:first-of-type {
			margin-bottom: 15px;
		}
	}
</style>
