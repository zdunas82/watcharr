<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import Icon from "@/lib/Icon.svelte";
	import { type AuthResponse, type AvailableAuthProviders } from "@/types";
	import { noAuthReq } from "@/lib/util/api";
	import { onMount } from "svelte";
	import { notify, unNotify } from "@/lib/util/notify";
	import { ReqerError } from "@/lib/util/fetch";
	import { resolve } from "$app/paths";

	let error: string | undefined = $state();
	let login = $state(true);
	let availableProviders: string[] = $state([]);
	let apHeader = $state(false);
	let apPlex = $state(false);
	let signupEnabled = $state(true);
	let useEmby = $state(false);
	let noAuto = $state(false);

	onMount(() => {
		if (localStorage.getItem("token")) {
			goto(resolve("/"));
		}

		if (!error && page.url.searchParams.get("again")) {
			error = "Zaloguj się ponownie";
		}
		if (page.url.searchParams.get("noAuto") == "1") {
			console.info(
				"login: Found noAuto param.. auto logins should be disabled now.",
			);
			noAuto = true;
		}

		processAvailableLoginMethods();
	});

	/**
	 * Get and process available login methods.
	 */
	async function processAvailableLoginMethods() {
		let r: AvailableAuthProviders;
		try {
			r = await noAuthReq.get<AvailableAuthProviders>("/auth/available");
		} catch {
			notify({
				type: "error",
				time: 10000,
				text: "Nie udało się pobrać dostępnych metod logowania",
			});
			return;
		}
		if (!r) {
			console.log("AvailableAuth: no response data");
		}
		if (r.isInSetup) {
			console.log(
				"AvailableAuth: Server is in setup.. navigating to web setup page.",
			);
			goto(resolve("/setup"));
		}
		availableProviders = r.available;
		apHeader = availableProviders?.includes("header");
		apPlex = availableProviders?.includes("plex");
		signupEnabled = r.signupEnabled;
		useEmby = r.useEmby;
		if (r.headerAuthAutoLogin && !noAuto) {
			console.log(
				"AvailableAuth: handling headerAuthAutoLogin.. calling proxyLogin automatically now.",
			);
			proxyLogin(true);
		}
	}

	function handleLogin(ev: SubmitEvent) {
		ev.preventDefault();
		const fd = new FormData(ev.target! as HTMLFormElement);
		const user = fd.get("username");
		const pass = fd.get("password");

		if (!user || !pass) {
			error = "Nazwa użytkownika i hasło są wymagane";
			return;
		}

		let customAuthEP = "";
		if ((ev.submitter as HTMLButtonElement)?.name === "jellyfin") {
			customAuthEP = "jellyfin";
		}

		const nid = notify({ text: "Logowanie", type: "loading" });
		noAuthReq
			.post<AuthResponse>(`/auth${login ? `/${customAuthEP}` : "/register"}`, {
				username: user,
				password: pass,
			})
			.then((resp) => {
				if (resp?.token) {
					console.log("Received token... logging in.");
					localStorage.setItem("token", resp.token);
					if (useEmby) {
						localStorage.setItem("useEmby", "1");
					} else {
						localStorage.removeItem("useEmby");
					}
					goto(resolve("/"));
					notify({ id: nid, text: `Witaj, ${user}!`, type: "success" });
				}
			})
			.catch((err) => {
				error = ReqerError.getMsg(err, "Logowanie nie powiodło się");
				unNotify(nid);
			});
	}

	async function plexLogin() {
		try {
			const { preparePlexAuth, doPlexLogin, plexPinPoll } =
				await import("@/lib/util/plex");
			const p = preparePlexAuth();
			const pin = await doPlexLogin(p);
			plexPinPoll(pin, p, (err, token) => {
				if (err) {
					error = "Autoryzacja Plex nie powiodła się";
					console.error("Plex auth failed!", err);
					return;
				}
				const nid = notify({ text: "Logowanie", type: "loading" });
				noAuthReq
					.post<AuthResponse>("/auth/plex", {
						token,
						clientIdentifier: p.clientId,
					})
					.then((resp) => {
						if (resp?.token) {
							console.log("Received token... logging in.");
							localStorage.setItem("token", resp.token);
							goto(resolve("/"));
							notify({ id: nid, text: `Witaj!`, type: "success" });
						}
					})
					.catch((err) => {
						console.error("plexLogin: Fail", err);
						error = ReqerError.getMsg(err, "Logowanie nie powiodło się");
						notify({ id: nid, text: `Nie udało się!`, type: "error" });
					});
			});
		} catch (err) {
			console.error("plexLogin: failed!", err);
			error = "Logowanie przez Plex nie powiodło się";
		}
	}

	function proxyLogin(auto = false) {
		const nid = notify({ text: "Logowanie", type: "loading" });
		noAuthReq
			.post<AuthResponse>(`/auth/proxy`)
			.then((resp) => {
				if (resp?.token) {
					console.log("Received token... logging in.");
					localStorage.setItem("token", resp.token);
					goto(resolve("/"));
					notify({ id: nid, text: `Witaj!`, type: "success" });
				}
			})
			.catch((err) => {
				error = ReqerError.getMsg(err, "Logowanie nie powiodło się");
				if (auto) {
					notify({
						id: nid,
						text: `Automatyczne logowanie SSO nie powiodło się!`,
						type: "error",
					});
				} else {
					unNotify(nid);
				}
			});
	}
</script>

<div>
	<div class="inner">
		<h2>
			{#if login}
				Witaj ponownie!
			{:else}
				Dobrze, że nas znalazłeś!
			{/if}
		</h2>

		{#if error}
			<span class="error">{error}!</span>
		{/if}

		<form onsubmit={handleLogin}>
			<label for="username">Nazwa użytkownika</label>
			<input type="text" name="username" placeholder="Nazwa użytkownika" />

			<label for="password">Hasło</label>
			<input type="password" name="password" placeholder="Hasło" />

			{#if login}
				<span class="login-with" style="font-weight: bold">Zaloguj się przez</span>
				<div class="login-btns">
					<button type="submit"><span class="watcharr">W</span>Watcharr</button>
					{#if availableProviders?.length > 0}
						{#if availableProviders.find((ap) => ap === "jellyfin")}
							{#if useEmby}
								<button type="submit" name="jellyfin" class="other">
									<Icon i="emby" wh={18} />
									Emby
								</button>
							{:else}
								<button type="submit" name="jellyfin" class="other">
									<Icon i="jellyfin" wh={18} />
									Jellyfin
								</button>
							{/if}
						{/if}
					{/if}
				</div>
				{#if apHeader || apPlex}
					<p style="font-weight: bold; font-size: 14px;">lub</p>
					{#if apHeader}
						<div class="login-btns">
							<button
								type="button"
								name="proxy"
								class="proxy other"
								onclick={() => {
									proxyLogin();
								}}
							>
								<Icon i="lock-closed" wh={18} />Kontynuuj przez logowanie jednokrotne (SSO)
							</button>
						</div>
					{/if}
					{#if apPlex}
						<div class="login-btns">
							<button
								type="button"
								onclick={() => {
									plexLogin();
								}}
								name="plex"
								class="plex other"
							>
								<Icon i="plex" wh={18} />Kontynuuj przez Plex
							</button>
						</div>
					{/if}
				{/if}
			{:else}
				<div class="login-btns">
					<button type="submit">Zarejestruj się</button>
				</div>
			{/if}
		</form>

		{#if signupEnabled}
			<button
				class="plain"
				onclick={() => {
					login = !login;
				}}
			>
				{#if login}
					Nie masz konta?
				{:else}
					Masz już konto?
				{/if}
			</button>
		{/if}
	</div>
</div>

<style lang="scss">
	div,
	form {
		display: flex;
		flex-flow: column;
		align-items: center;
		gap: 10px;
		margin: 0 35px;
	}

	.inner,
	form {
		width: 100%;
		max-width: 400px;
	}

	.inner h2 {
		font-weight: normal;
	}

	label {
		align-self: flex-start;
		font-weight: bold;
	}

	span.login-with {
		font-size: 14px;
	}

	.login-btns {
		display: flex;
		flex-flow: row;
		gap: 10px;
		width: 100%;

		/* Hardcoded point for when main watcharr/jellyfin btns break. */
		@media screen and (max-width: 320px) {
			flex-wrap: wrap;
		}

		button {
			display: flex;
			flex-flow: row;
			gap: 10px;
			text-transform: none; /* PoterX: polskie teksty maja wlasna wielkosc liter */

			.watcharr {
				font-family: "Rampart One";
				font-size: 19px;
				line-height: 19px;
			}

			&.other {
				overflow: hidden;
				animation: 250ms ease otherbtn;

				@keyframes otherbtn {
					from {
						width: 0px;
					}
					to {
						width: 100%;
					}
				}
			}
		}
	}

	.error {
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 10px;
		background-color: rgb(221, 48, 48);
		text-transform: none; /* PoterX: polskie teksty maja wlasna wielkosc liter */
		color: white;
	}
</style>
