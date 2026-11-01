<script lang="ts">
	import type {
		ArrDetailsResponse,
		ArrInfoResponse,
		ArrRequestResponse,
		ArrRequestStatus,
		ContentType,
	} from "@/types";
	import { onMount } from "svelte";
	import Icon from "../Icon.svelte";
	import tooltip from "../actions/tooltip";
	import { msToAmountsOfTime, plPlural } from "../util/helpers";
	import { notify } from "../util/notify";
	import { req } from "../util/api";
	import { ReqerError } from "../util/fetch";

	interface Props {
		type: ContentType;
		tmdbId: number;
		openRequestModal: () => void;
	}

	let { type, tmdbId, openRequestModal }: Props = $props();

	let existingRequest: ArrRequestResponse | undefined;
	let info: ArrInfoResponse | undefined;
	// The status, extra added string types are set in this file.
	let status:
		| ArrDetailsResponse
		| "available"
		| "requested"
		| ArrRequestStatus
		| undefined = $state();
	let estimatedCompletionIn: string | undefined = $state();

	// Display labels for queue statuses reported by Sonarr/Radarr.
	const arrStatusLabels: Record<string, string> = {
		queued: "w kolejce",
		paused: "wstrzymane",
		downloading: "pobieranie",
		completed: "pobrano",
		delay: "opóźnione",
		failed: "błąd",
		warning: "ostrzeżenie",
		downloadClientUnavailable: "klient pobierania niedostępny",
		unknown: "nieznany",
	};

	async function getInfo() {
		try {
			if (!existingRequest) {
				console.warn("getInfo called before existingRequest exists.");
				return;
			}
			if (
				existingRequest.status !== "APPROVED" &&
				existingRequest.status !== "AUTO_APPROVED" &&
				existingRequest.status !== "FOUND"
			) {
				console.debug(
					"getInfo: Request is not in an approved state.. not continuing.",
				);
				return;
			}
			const resp = await req.get<ArrInfoResponse>(
				`/arr/${type === "movie" ? "rad" : "son"}/info/${existingRequest.id}`,
			);
			if (resp) {
				info = resp;
				if (info.hasFile) {
					status = "available";
				} else {
					getStatus();
				}
			}
		} catch (err) {
			if (
				ReqerError.withBody(err) &&
				err.response?.status === 404 &&
				err.hasErrorInBody() &&
				err.body.error === "request deleted"
			) {
				return;
			}
			console.error("ArrRequestButton: getInfo failed!", err);
			notify({
				text: `Nie udało się pobrać informacji z ${type === "movie" ? "Radarra" : "Sonarra"}`,
				type: "error",
			});
		}
	}

	async function getStatus(ev: MouseEvent | undefined = undefined) {
		try {
			if (!existingRequest) {
				console.warn("getStatus called before existingRequest exists.");
				return;
			}
			const statusResp = await req.getWhole<ArrDetailsResponse>(
				`/arr/${type === "movie" ? "rad" : "son"}/status/${existingRequest.serverName}/${existingRequest.arrId}`,
			);
			if (statusResp.status === 204) {
				status = "requested";
			} else if (statusResp.body) {
				status = statusResp.body;
				const estMs =
					new Date(status.estimatedCompletionTime).getTime() -
					new Date(Date.now()).getTime();
				const est = msToAmountsOfTime(estMs);
				if (est.days > 0) {
					estimatedCompletionIn = `${est.days} ${plPlural(est.days, "dzień", "dni", "dni")}`;
				} else if (est.hours > 0) {
					estimatedCompletionIn = `${est.hours} ${plPlural(est.hours, "godzinę", "godziny", "godzin")}`;
				} else if (est.minutes > 0) {
					estimatedCompletionIn = `${est.minutes} ${plPlural(est.minutes, "minutę", "minuty", "minut")}`;
				} else if (est.seconds > 0) {
					estimatedCompletionIn = `${est.seconds} ${plPlural(est.seconds, "sekundę", "sekundy", "sekund")}`;
				} else {
					estimatedCompletionIn = undefined;
				}
			}
			if (ev?.target) {
				setTimeout(() => {
					(ev?.target as HTMLButtonElement)?.blur();
				}, 250);
			}
		} catch (err) {
			console.error("ArrRequestButton: getStatus failed!", err);
			notify({
				text: `Nie udało się pobrać stanu tytułu z ${type === "movie" ? "Radarra" : "Sonarra"}`,
				type: "error",
			});
		}
	}

	async function lookForExisting() {
		try {
			const existingRequestResp = await req.get<ArrRequestResponse>(
				`/arr/${type === "movie" ? "rad" : "son"}/request/${tmdbId}`,
			);
			if (existingRequestResp && existingRequestResp.arrId) {
				existingRequest = existingRequestResp;
				getInfo();
			} else if (existingRequestResp) {
				// If no arrId, use status in request (pending, denied, etc)
				console.log(
					"No arrId in request resp.. using request status for btn status if set.",
				);
				if (existingRequestResp.status) {
					status = existingRequestResp.status;
				}
			}
		} catch (err) {
			console.error("ArrRequestButton: lookForExisting failed!", err);
			notify({
				text: `Nie udało się sprawdzić, czy istnieje już prośba o ten tytuł`,
				type: "error",
			});
		}
	}

	// Used by Request modals to set existing request data in this component from their request response.
	export function setExistingRequest(r: ArrRequestResponse) {
		if (existingRequest) {
			console.error(
				"ArrRequestButton: setExistingRequest: Existing request has already been defined! Not continuing.",
			);
			return;
		}
		if (!r) {
			console.error(
				"ArrRequestButton: setExistingRequest: No response passed in.",
				r,
			);
			return;
		}
		console.debug("ArrRequestButton: setExistingRequest: Running..", r);
		existingRequest = r;
		if (existingRequest?.status) {
			status = existingRequest?.status;
		}
		getInfo();
	}

	onMount(() => {
		lookForExisting();
	});
</script>

{#if typeof status === "object" || status === "requested"}
	<button
		onclick={getStatus}
		use:tooltip={{
			text:
				status === "requested"
					? "Czeka na zatwierdzenie lub rozpoczęcie pobierania"
					: status.status === "downloading"
						? estimatedCompletionIn
							? `Gotowe za ${estimatedCompletionIn}`
							: "Szacowany czas niedostępny"
						: status.status === "paused"
							? "Pobieranie zostało wstrzymane"
							: "",
			pos: "bot",
		}}
	>
		<div><Icon i="refresh" /></div>
		<span>
			{#if status === "requested"}
				Poproszono
			{:else}
				{arrStatusLabels[status.status] ?? status.status}
				{status.status === "downloading"
					? status?.progress
						? `(${status?.progress}%)`
						: ""
					: ""}
			{/if}
		</span>
	</button>
{:else if status === "available" || status === "FOUND"}
	<button disabled>Dostępne</button>
{:else if status === "PENDING"}
	<button disabled>Oczekuje</button>
{:else if status === "APPROVED"}
	<button disabled>Zatwierdzone</button>
{:else if status === "AUTO_APPROVED"}
	<button disabled>Zatwierdzone automatycznie</button>
{:else if status === "DENIED"}
	<button disabled>Odrzucone</button>
{:else}
	<button onclick={openRequestModal}>Poproś o dodanie</button>
{/if}

<style lang="scss">
	button {
		max-width: fit-content;
		text-transform: none; /* PoterX: polskie teksty maja wlasna wielkosc liter */
		position: relative;

		& > div {
			display: none;
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
		}

		&:hover:not(:focus) {
			& > div {
				display: block;
			}

			& > span {
				visibility: hidden;
			}
		}
	}
</style>
