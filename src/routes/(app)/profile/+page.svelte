<script lang="ts">
	import Error from "@/lib/Error.svelte";
	import Spinner from "@/lib/Spinner.svelte";
	import Stat from "@/lib/stats/Stat.svelte";
	import Stats from "@/lib/stats/Stats.svelte";
	import { req } from "@/lib/util/api";
	import { plPlural } from "@/lib/util/helpers";
	import { store } from "@/store.svelte";
	import { type Image, type Profile } from "@/types";
	import { notify } from "@/lib/util/notify";
	import UserAvatar from "@/lib/img/UserAvatar.svelte";
	import { ReqerError } from "@/lib/util/fetch";
	import { resolve } from "$app/paths";

	let user = $derived(store.userInfo);
	let getProfilePromise = $state(getProfile());

	async function getProfile() {
		return await req.get<Profile>(`/profile`);
	}

	function formatDate(d: Date) {
		return d.toLocaleDateString("pl-PL", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	}

	function updateBio(
		ev: FocusEvent & { currentTarget: EventTarget & HTMLTextAreaElement },
	) {
		const newBio = ev?.currentTarget?.value;
		if (typeof newBio !== "string") {
			console.warn("updateBio called without any value", newBio);
			return;
		}
		const nid = notify({ text: "Aktualizowanie opisu", type: "loading" });
		req
			.post("/user/bio", { newBio: newBio })
			.then(() => {
				if (user) {
					user.bio = newBio;
					notify({ id: nid, text: "Zaktualizowano opis", type: "success" });
				}
			})
			.catch((err) => {
				notify({
					id: nid,
					text: ReqerError.getMsg(err, "Nie udało się zaktualizować opisu"),
					type: "error",
				});
			});
	}

	function avatarDropped(ev: Event) {
		const files = (ev.currentTarget as HTMLInputElement)?.files;
		if (!files || files?.length <= 0) {
			console.error("avatarDropped: no file found");
			return;
		}
		const nid = notify({ text: "Przesyłanie awatara", type: "loading" });
		const fd = new FormData();
		fd.append("avatar", files[0]);
		req
			.post<Image>("/user/avatar", fd)
			.then((r) => {
				if (user) {
					user.avatar = r;
					notify({ id: nid, text: "Przesłano awatar", type: "success" });
				}
			})
			.catch((err) => {
				console.error("uploading avatar failed", err);
				notify({
					id: nid,
					text: ReqerError.getMsg(err, "Nie udało się przesłać awatara"),
					type: "error",
				});
			});
	}

	/**
	 * Takes in number of minutes and converts to readable.
	 * eg into months, weeks, days, hours and minutes.
	 */
	function toFormattedTimeLong(m: number) {
		// Considers a 30 days long month
		const countInMinutes = [
			[["miesiąc", "miesiące", "miesięcy"], 43200],
			[["tydzień", "tygodnie", "tygodni"], 10080],
			[["dzień", "dni", "dni"], 1440],
			[["godzina", "godziny", "godzin"], 60],
		];
		let ansString = "";
		let tmp;
		for (const c of countInMinutes) {
			tmp = Math.floor(m / (c[1] as number));

			// Ignore fields with fewer than 1 unit
			if (tmp) {
				const f = c[0] as string[];
				ansString += `${tmp} ${plPlural(tmp, f[0], f[1], f[2])}, `;
			}
			m -= tmp * (c[1] as number);
		}
		if (!ansString) {
			return "0 godzin";
		}
		return ansString.slice(0, -2);
	}
</script>

<svelte:head>
	<title>Mój profil</title>
</svelte:head>

<div class="content">
	<div class="inner">
		<div class="user-basic-info">
			<UserAvatar img={user?.avatar} {avatarDropped} />
			<div>
				<h2 title={user?.username}>
					<span style="font-weight: normal; font-variant: all-small-caps;"
						>Cześć</span
					>
					{user?.username}
				</h2>
				<textarea
					rows="1"
					placeholder="mój opis"
					onblur={updateBio}
					value={user?.bio}></textarea>
			</div>
		</div>

		<Stats>
			{#await getProfilePromise}
				<Spinner />
			{:then profile}
				<Stat name="Data dołączenia" value={formatDate(new Date(profile.joined))} />
				<Stat name="Obejrzane filmy" value={profile.moviesWatched} large />
				<Stat name="Obejrzane seriale" value={profile.showsWatched} large />
				<Stat
					name="Czas oglądania filmów"
					value={toFormattedTimeLong(profile.moviesWatchedRuntime)}
				/>
				<Stat
					name="Czas oglądania seriali"
					value={toFormattedTimeLong(profile.showsWatchedRuntime)}
					disc="To bardzo przybliżona wartość 🚀"
				/>
			{:catch err}
				<Error error={err} pretty="Nie udało się pobrać statystyk!" />
			{/await}
		</Stats>

		<div style="margin-top: 10px;">
			<!-- Temporary link to settings, since we just moved them to
			 another page, can remove this later. -->
			<a href={resolve("/settings")}>Szukasz ustawień?</a>
		</div>
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

	.user-basic-info {
		display: flex;
		gap: 20px;

		& > div {
			display: flex;
			flex-flow: column;
			gap: 5px;
			width: 100%;
			overflow: hidden;

			textarea {
				resize: none;

				&:not(:focus) {
					border: 0;
					padding: 0;
					height: 32px;
				}
			}
		}
	}
</style>
