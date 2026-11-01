<script lang="ts">
	import { store } from "@/store.svelte";
	import Menu from "../Menu.svelte";
	import { parseTokenPayload, userHasPermission } from "../util/helpers";
	import { UserPermission, UserType } from "@/types";
	import ProxyUserLogoutModal from "../logout/ProxyUserLogoutModal.svelte";
	import { goto } from "$app/navigation";
	import { clearWatcharrData } from "../logout";
	import { notify } from "../util/notify";
	import AboutModal from "./AboutModal.svelte";
	import { resolve } from "$app/paths";

	let user = $derived(store.userInfo);
	let proxyUserLogoutShown = $state(false);
	let aboutModalOpen = $state(false);

	function logout() {
		if (user?.type === UserType.Proxy) {
			// Proxy users logout flow is different.
			proxyUserLogoutShown = true;
			return;
		}
		clearWatcharrData();
		goto(resolve("/login"));
	}

	function profile() {
		goto(resolve("/profile"));
	}

	function settings() {
		goto(resolve("/settings"));
	}

	function serverSettings() {
		goto(resolve("/server"));
	}

	function userManagement() {
		goto(resolve("/manage_users"));
	}

	function requestManagement() {
		goto(resolve("/arr_requests"));
	}

	function shareWatchedList() {
		const nid = notify({ type: "loading", text: "Pobieranie linku" });
		const ud = parseTokenPayload();
		console.log(ud);
		if (ud?.userId && ud?.username) {
			const shareLink = `${window.location.origin}/lists/${ud.userId}/${ud.username}`;
			navigator.clipboard
				.writeText(shareLink)
				.then(() => {
					notify({ id: nid, type: "success", text: "Skopiowano link do udostępnienia" });
				})
				.catch((r) => {
					console.error("Failed to copy list share link", r);
					notify({
						id: nid,
						type: "error",
						text: `Nie udało się skopiować linku:<br/><a href="${shareLink}" target="_blank">${shareLink}</a>`,
						time: 20000,
					});
				});
		} else {
			notify({ id: nid, type: "error", text: "Nie udało się pobrać linku" });
		}
	}

	function closeAbout() {
		aboutModalOpen = false;
	}
</script>

<Menu conf={{ width: "150px", arrowRight: "10px" }}>
	{#if user?.username}
		<h5 title={user.username}>Cześć, {user.username}!</h5>
	{/if}
	<button class="plain" onclick={() => profile()}>Profil</button>
	{#if !store.userSettings?.private}
		<button class="plain" onclick={() => shareWatchedList()}>Udostępnij listę</button>
	{/if}
	<button class="plain" onclick={() => settings()}>Ustawienia</button>
	{#if user && userHasPermission(user.permissions, UserPermission.PERM_ADMIN)}
		<button class="plain" onclick={() => serverSettings()}>Serwer</button>
		<button class="plain" onclick={() => userManagement()}>Użytkownicy</button>
		{#if store.serverFeatures?.sonarr || store.serverFeatures?.radarr}
			<!-- At least one (sonarr/radarr) should be enabled for requests menu item to display. -->
			<button class="plain" onclick={() => requestManagement()}>
				Prośby
			</button>
		{/if}
	{/if}
	<button class="plain logout" onclick={() => logout()}>Wyloguj</button>
	{#if proxyUserLogoutShown}
		<ProxyUserLogoutModal onClose={() => (proxyUserLogoutShown = false)} />
	{/if}
	<span>
		<button
			class="menu-footer"
			onclick={() => {
				aboutModalOpen = !aboutModalOpen;
			}}
		>
			o aplikacji
		</button>
		|
		<a
			class="menu-footer"
			href="https://github.com/sbondCo/Watcharr/releases"
			target="_blank"
		>
			v{__WATCHARR_VERSION__}
		</a>
	</span>
</Menu>

{#if aboutModalOpen}
	<AboutModal onClose={closeAbout} />
{/if}

<style lang="scss">
	button.plain.logout {
		&:hover {
			color: white;
			background-color: $error;
		}
	}
</style>
