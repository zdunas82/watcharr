<script lang="ts">
	import Checkbox from "@/lib/Checkbox.svelte";
	import Spinner from "@/lib/Spinner.svelte";
	import { notify } from "@/lib/util/notify";
	import type {
		Content,
		RadarrSettings,
		ServerConfig,
		SonarrSettings,
	} from "@/types";
	import SonarrModal from "./modals/SonarrModal.svelte";
	import SettingsList from "@/lib/settings/SettingsList.svelte";
	import Setting from "@/lib/settings/Setting.svelte";
	import SettingButton from "@/lib/settings/SettingButton.svelte";
	import RadarrModal from "./modals/RadarrModal.svelte";
	import { getServerFeatures, req } from "@/lib/util/api";
	import Stats from "@/lib/stats/Stats.svelte";
	import Error from "@/lib/Error.svelte";
	import Stat from "@/lib/stats/Stat.svelte";
	import TwitchModal from "./modals/TwitchModal.svelte";
	import RegionDropDown from "@/lib/RegionDropDown.svelte";
	import TaskScheduleModal from "./modals/TaskScheduleModal.svelte";
	import TrustedHeaderAuthModal from "./modals/TrustedHeaderAuthModal.svelte";
	import { resolve } from "$app/paths";

	let serverConfig: ServerConfig | undefined = $state();
	let jellyfinOrEmby = $derived(serverConfig?.USE_EMBY ? "Emby" : "Jellyfin");
	let sonarrModalOpen = $state(false);
	let sonarrServerEditing: SonarrSettings | undefined = $state();
	let sonarrModalEditing = $state(false);
	let radarrModalOpen = $state(false);
	let radarrServerEditing: RadarrSettings | undefined = $state();
	let radarrModalEditing = $state(false);
	let twitchModalOpen = $state(false);
	let taskScheduleModalOpen = $state(false);
	let headerSSOModalOpen = $state(false);
	// Disabled vars for disabling inputs until api request completes
	let signupDisabled = $state(false);
	let debugDisabled = $state(false);
	let jfDisabled = $state(false);
	let jfWebhookEnabledDisabled = $state(false);
	let tmdbkDisabled = $state(false);
	let plexHostDisabled = $state(false);
	let countryDisabled = $state(false);
	let useEmbyDisabled = $state(false);

	let jellyfinWebhookEndpoint: string | undefined = $derived.by(() => {
		if (
			!serverConfig ||
			!serverConfig.JELLYFIN_WEBHOOK_ENABLED ||
			!serverConfig.JELLYFIN_WEBHOOK_KEY
		) {
			return "Błąd: odśwież stronę ALBO wyłącz i włącz ponownie ustawienie webhooka, żeby uzyskać adres!";
		}
		return `${location.protocol}//${location.host}/api/jellyfin/webhook/${serverConfig.JELLYFIN_WEBHOOK_KEY}`;
	});

	async function getServerConfig() {
		serverConfig = await req.get<ServerConfig>(`/server/config`);
	}

	export function updateServerConfig<K extends keyof ServerConfig>(
		name: K,
		value: ServerConfig[K],
		done?: (respData?: object) => void,
	) {
		if (!serverConfig) {
			console.error("updateServerConfig: No server config to update!");
			notify({ type: "error", text: "Brak konfiguracji serwera do zaktualizowania!" });
			return;
		}
		console.log("Updating server setting", name, "to", value);
		const originalValue = serverConfig[name];
		const nid = notify({ type: "loading", text: "Aktualizowanie" });
		let ep = "/server/config";
		if (name === "PLEX_HOST") {
			ep = "/server/config/plex_host";
		} else if (name === "JELLYFIN_WEBHOOK_ENABLED") {
			ep = "/server/config/JELLYFIN_WEBHOOK_ENABLED";
		}
		req
			.postWhole<object>(ep, { key: name, value: value })
			.then((r) => {
				if (r.status === 200) {
					serverConfig![name] = value;
					notify({ id: nid, type: "success", text: "Zaktualizowano" });
					if (typeof done !== "undefined") done(r?.body);
				}
			})
			.catch((err) => {
				console.error("Failed to update user setting", err);
				notify({ id: nid, type: "error", text: "Nie udało się zaktualizować" });
				serverConfig![name] = originalValue;
				if (typeof done !== "undefined") done();
			});
	}

	interface ServerStats {
		users: number;
		privateUsers: number;
		watchedMovies: number;
		watchedShows: number;
		watchedSeasons: number;
		mostWatchedMovie: Content;
		mostWatchedShow: Content;
		activities: number;
	}

	async function getServerStats() {
		return await req.get<ServerStats>("/server/stats");
	}
</script>

<svelte:head>
	<title>Serwer</title>
</svelte:head>

<div class="content">
	<div class="inner">
		<SettingsList>
			<h2>Ustawienia serwera</h2>

			<Stats>
				{#await getServerStats()}
					<Spinner />
				{:then stats}
					<Stat
						name="Użytkownicy"
						value={stats.users}
						href={resolve("/manage_users")}
						large
					/>
					<Stat name="Prywatni użytkownicy" value={stats.privateUsers} large />
					<Stat name="Obejrzane filmy" value={stats.watchedMovies} large />
					<Stat name="Obejrzane seriale" value={stats.watchedShows} large />
					<Stat name="Obejrzane sezony" value={stats.watchedSeasons} large />
					<Stat name="Aktywności" value={stats.activities} large />
					{#if stats.mostWatchedMovie?.title}
						<Stat
							name="Najczęściej oglądany film"
							value={stats.mostWatchedMovie.title}
							href={resolve(`/movie/${stats.mostWatchedMovie.tmdbId}`)}
						/>
					{/if}
					{#if stats.mostWatchedShow?.title}
						<Stat
							name="Najczęściej oglądany serial"
							value={stats.mostWatchedShow.title}
							href={resolve(`/tv/${stats.mostWatchedShow.tmdbId}`)}
						/>
					{/if}
				{:catch err}
					<Error error={err} pretty="Nie udało się pobrać statystyk serwera!" />
				{/await}
			</Stats>

			{#await getServerConfig()}
				<Spinner />
			{:then}
				<h3>Ogólne</h3>
				{#if serverConfig}
					<Setting
						title="Domyślny kraj"
						desc="Domyślny kraj dla nowych użytkowników. Każdy użytkownik może go zmienić, a zmiana nie wpływa na istniejących użytkowników."
					>
						<RegionDropDown
							selectedCountry={serverConfig.DEFAULT_COUNTRY}
							disabled={countryDisabled}
							onChange={(c) => {
								countryDisabled = true;
								updateServerConfig("DEFAULT_COUNTRY", c, () => {
									countryDisabled = false;
								});
							}}
						/>
					</Setting>
					<Setting
						title="Host {jellyfinOrEmby}"
						desc="Wskaż swój serwer {jellyfinOrEmby}, żeby włączyć powiązane funkcje. Nie zmieniaj serwera, jeśli
        używasz już innego."
					>
						<input
							type="text"
							placeholder="https://{jellyfinOrEmby.toLowerCase()}.example.com"
							bind:value={serverConfig.JELLYFIN_HOST}
							onblur={() => {
								jfDisabled = true;
								updateServerConfig(
									"JELLYFIN_HOST",
									serverConfig!.JELLYFIN_HOST,
									() => {
										jfDisabled = false;
									},
								);
							}}
							disabled={jfDisabled}
						/>
					</Setting>
					<Setting
						title="Webhook Jellyfina"
						desc="Czy włączyć obsługę webhooka Jellyfina?"
						row
						handbook="jellyfin-webhook-setup"
					>
						<Checkbox
							name="JELLYFIN_WEBHOOK_ENABLED"
							disabled={jfWebhookEnabledDisabled}
							value={serverConfig.JELLYFIN_WEBHOOK_ENABLED}
							toggled={(on) => {
								jfWebhookEnabledDisabled = true;
								updateServerConfig("JELLYFIN_WEBHOOK_ENABLED", on, (rData) => {
									jfWebhookEnabledDisabled = false;
									if (
										serverConfig &&
										rData &&
										"JELLYFIN_WEBHOOK_KEY" in rData &&
										typeof rData.JELLYFIN_WEBHOOK_KEY === "string"
									) {
										serverConfig.JELLYFIN_WEBHOOK_KEY =
											rData.JELLYFIN_WEBHOOK_KEY;
									}
								});
							}}
						/>
					</Setting>
					{#if serverConfig.JELLYFIN_WEBHOOK_ENABLED}
						<Setting
							title="Adres webhooka Jellyfina"
							desc="Użyj tego adresu przy tworzeniu webhooka w Jellyfinie. W zależności od konfiguracji może być potrzebna zmiana nazwy hosta. Adres zawiera tajny klucz, nie udostępniaj go innym!"
						>
							<code>
								{jellyfinWebhookEndpoint}
							</code>
						</Setting>
					{/if}
					<Setting
						title="Używaj Emby"
						desc="Czy udawać, że używasz Emby zamiast Jellyfina?"
						row
					>
						<Checkbox
							name="USE_EMBY"
							disabled={useEmbyDisabled}
							value={serverConfig.USE_EMBY}
							toggled={(on) => {
								useEmbyDisabled = true;
								updateServerConfig("USE_EMBY", on, () => {
									useEmbyDisabled = false;
								});
							}}
						/>
					</Setting>
					<Setting
						title="Host Plex"
						desc="Wskaż swój serwer Plex, żeby włączyć powiązane funkcje. Nie zmieniaj serwera, jeśli
        używasz już innego."
					>
						<input
							type="text"
							placeholder="https://plex.example.com"
							bind:value={serverConfig.PLEX_HOST}
							onblur={() => {
								plexHostDisabled = true;
								updateServerConfig(
									"PLEX_HOST",
									serverConfig!.PLEX_HOST,
									(rData) => {
										plexHostDisabled = false;
										serverConfig!.PLEX_MACHINE_ID =
											rData &&
											"PLEX_MACHINE_ID" in rData &&
											rData?.PLEX_MACHINE_ID
												? String(rData?.PLEX_MACHINE_ID)
												: undefined;
									},
								);
							}}
							disabled={plexHostDisabled}
						/>
						{#if serverConfig.PLEX_MACHINE_ID}
							<span style="font-size: 10px"
								>ID maszyny: {serverConfig.PLEX_MACHINE_ID}</span
							>
						{/if}
					</Setting>
					<Setting
						title="Klucz TMDB"
						desc="Podaj własny klucz API TMDB"
						handbook="your-own-tmdb-api-key"
					>
						<input
							type="password"
							placeholder="Klucz TMDB"
							bind:value={serverConfig.TMDB_KEY}
							onblur={() => {
								tmdbkDisabled = true;
								updateServerConfig("TMDB_KEY", serverConfig!.TMDB_KEY, () => {
									tmdbkDisabled = false;
								});
							}}
							disabled={tmdbkDisabled}
						/>
					</Setting>
					<Setting
						title="Rejestracja"
						desc="Pozwól na rejestrację kont Watcharr (login i hasło)."
						row
					>
						<Checkbox
							name="SIGNUP_ENABLED"
							disabled={signupDisabled}
							value={serverConfig.SIGNUP_ENABLED}
							toggled={(on) => {
								signupDisabled = true;
								updateServerConfig("SIGNUP_ENABLED", on, () => {
									signupDisabled = false;
								});
							}}
						/>
					</Setting>
					<Setting
						title="Debugowanie"
						desc="Włącz logowanie debugowania. Nie zostawiaj tego włączonego na stałe, używaj tylko przy rozwiązywaniu problemu."
						row
					>
						<Checkbox
							name="DEBUG"
							disabled={debugDisabled}
							value={serverConfig.DEBUG}
							toggled={(on) => {
								debugDisabled = true;
								updateServerConfig("DEBUG", on, () => {
									debugDisabled = false;
								});
							}}
						/>
					</Setting>
					<Setting>
						<SettingButton
							title="Harmonogram zadań"
							desc="Podgląd i konfiguracja harmonogramu zadań serwera."
							icon="arrow"
							onClick={() => {
								taskScheduleModalOpen = true;
							}}
						/>
					</Setting>
					{#if taskScheduleModalOpen}
						<TaskScheduleModal onClose={() => (taskScheduleModalOpen = false)}
						></TaskScheduleModal>
					{/if}
					<Setting>
						<SettingButton
							title="Uwierzytelnianie zaufanym nagłówkiem"
							desc="Skonfiguruj logowanie jednokrotne (SSO) przez zaufany nagłówek."
							icon="arrow"
							onClick={() => {
								headerSSOModalOpen = true;
							}}
						/>
					</Setting>
					{#if headerSSOModalOpen}
						<TrustedHeaderAuthModal onClose={() => (headerSSOModalOpen = false)}
						></TrustedHeaderAuthModal>
					{/if}
					<div>
						<h3>Usługi</h3>
						<h5 class="norm">
							Te integracje nie są jeszcze w ostatecznej wersji. Traktuj je jako
							wersję beta. Jeśli napotkasz problemy,
							<a
								style="text-decoration: underline;"
								href="https://github.com/sbondCo/Watcharr/issues/new/choose"
								target="_blank"
							>
								zgłoś je.
							</a>
						</h5>
					</div>

					<Setting title="Twitch">
						<SettingButton
							title="Twitch"
							desc="Dane aplikacji Twitch potrzebne do obsługi gier (przez IGDB)."
							icon={serverConfig.TWITCH &&
							Object.keys(serverConfig.TWITCH).length > 0
								? "arrow"
								: "add"}
							onClick={() => {
								twitchModalOpen = true;
							}}
						/>
					</Setting>

					<Setting title="Sonarr">
						{#if serverConfig.SONARR && serverConfig.SONARR?.length > 0}
							{#each serverConfig.SONARR as server (server.name)}
								<SettingButton
									title={server.name}
									desc={`Konfiguruj serwer pod adresem ${server.host}`}
									onClick={() => {
										sonarrServerEditing = server;
										sonarrModalEditing = true;
										sonarrModalOpen = true;
									}}
								/>
							{/each}
						{/if}
						<SettingButton
							title="Sonarr"
							desc="Dodaj serwer Sonarr."
							icon="add"
							onClick={() => {
								let name = "Sonarr";
								if (serverConfig?.SONARR && serverConfig.SONARR.length > 0) {
									// if this still exists ya on yur own
									name = `Sonarr${serverConfig!.SONARR.length + 1}`;
								}
								sonarrServerEditing = { name };
								sonarrModalEditing = false;
								sonarrModalOpen = true;
							}}
						/>
					</Setting>

					<Setting title="Radarr">
						{#if serverConfig.RADARR && serverConfig.RADARR?.length > 0}
							{#each serverConfig.RADARR as server (server.name)}
								<SettingButton
									title={server.name}
									desc={`Konfiguruj serwer pod adresem ${server.host}`}
									onClick={() => {
										radarrServerEditing = server;
										radarrModalEditing = true;
										radarrModalOpen = true;
									}}
								/>
							{/each}
						{/if}
						<SettingButton
							title="Radarr"
							desc="Dodaj serwer Radarr."
							icon="add"
							onClick={() => {
								let name = "Radarr";
								if (serverConfig?.RADARR && serverConfig.RADARR.length > 0) {
									// if this still exists ya on yur own
									name = `Radarr${serverConfig!.RADARR.length + 1}`;
								}
								radarrServerEditing = { name };
								radarrModalEditing = false;
								radarrModalOpen = true;
							}}
						/>
					</Setting>

					{#if twitchModalOpen}
						<TwitchModal
							cfg={serverConfig.TWITCH}
							onClose={() => {
								// "temporary" solution to showing added servers
								// and reloading data to revert modified but not saved changes.
								getServerConfig();
								getServerFeatures();
								twitchModalOpen = false;
							}}
						/>
					{/if}

					{#if sonarrModalOpen && sonarrServerEditing}
						<SonarrModal
							servarr={sonarrServerEditing}
							isEditing={sonarrModalEditing}
							onClose={() => {
								// "temporary" solution to showing added servers
								// and reloading data to revert modified but not saved changes.
								getServerConfig();
								getServerFeatures();
								sonarrModalOpen = false;
								sonarrServerEditing = undefined;
							}}
						/>
					{/if}

					{#if radarrModalOpen && radarrServerEditing}
						<RadarrModal
							servarr={radarrServerEditing}
							isEditing={radarrModalEditing}
							onClose={() => {
								// "temporary" solution to showing added servers
								// and reloading data to revert modified but not saved changes.
								getServerConfig();
								getServerFeatures();
								radarrModalOpen = false;
								radarrServerEditing = undefined;
							}}
						/>
					{/if}
				{/if}
			{:catch err}
				<Error error={err} pretty="Nie udało się wczytać konfiguracji serwera!" />
			{/await}
		</SettingsList>
	</div>
</div>

<style lang="scss">
	.content {
		display: flex;
		width: 100%;
		justify-content: center;
		padding: 0 30px 30px 30px;

		.inner {
			min-width: 400px;
			max-width: 400px;
			overflow: hidden;

			h2 {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}

			& > div:not(:first-of-type) {
				margin-top: 30px;
			}

			@media screen and (max-width: 440px) {
				width: 100%;
				min-width: unset;
			}
		}
	}
</style>
