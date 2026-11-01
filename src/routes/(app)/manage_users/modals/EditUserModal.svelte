<script lang="ts">
	import Checkbox from "@/lib/Checkbox.svelte";
	import DropDown from "@/lib/DropDown.svelte";
	import Modal from "@/lib/Modal.svelte";
	import Setting from "@/lib/settings/Setting.svelte";
	import SettingsList from "@/lib/settings/SettingsList.svelte";
	import { req } from "@/lib/util/api";
	import { ReqerError } from "@/lib/util/fetch";
	import { userHasPermission } from "@/lib/util/helpers";
	import { notify } from "@/lib/util/notify";
	import { UserPermission, UserType, type ManagedUser } from "@/types";

	interface UpdateUserRequest {
		permissions?: number;
		type?: UserType;
	}

	interface Props {
		user: ManagedUser;
		onClose: () => void;
	}

	let { user = $bindable(), onClose }: Props = $props();

	let error: string | undefined = $state();

	// Things we have changed
	let changedPerms = false;
	let originalUser = structuredClone(user);

	async function save() {
		const changedType = user.type !== originalUser.type;
		// If nothing changed.. error
		if (!changedPerms && !changedType) {
			error = "Niczego nie zmieniono";
			return;
		}
		if (!error) {
			try {
				const toUpdate: UpdateUserRequest = {};
				if (changedPerms) {
					toUpdate["permissions"] = user.permissions;
				}
				if (changedType) {
					toUpdate["type"] = user.type;
				}
				await req.post(`/server/users/${user.id}`, toUpdate);
				notify({
					type: "success",
					text: "Zapisano zmiany!",
				});
				onClose();
			} catch (err) {
				console.error("Failed to save user!", err);
				error = ReqerError.getMsg(err, "Nie udało się zapisać");
			}
		}
	}

	function userTogglePermission(perm: UserPermission) {
		user.permissions ^= perm;
		changedPerms = true;
	}
</script>

<Modal
	title="Edytuj użytkownika"
	desc={`Konfiguracja: ${user.username}`}
	maxWidth="500px"
	{onClose}
>
	{#if error}
		<span class="error">{error}!</span>
	{/if}

	<SettingsList>
		<h3 class="norm">Uprawnienia</h3>

		<Setting
			title="Administrator"
			desc="Nadaj uprawnienia administratora; zastępują wszystkie inne uprawnienia."
			row
		>
			<Checkbox
				name="USER_PERM_ADMIN"
				value={userHasPermission(user.permissions, UserPermission.PERM_ADMIN)}
				toggled={() => {
					userTogglePermission(UserPermission.PERM_ADMIN);
				}}
			/>
		</Setting>

		<Setting
			title="Prośby o dodanie"
			desc="Pozwól użytkownikowi prosić o dodanie tytułów."
			row
		>
			<Checkbox
				name="USER_PERM_REQUEST_CONTENT"
				value={userHasPermission(
					user.permissions,
					UserPermission.PERM_REQUEST_CONTENT,
				)}
				toggled={() => {
					userTogglePermission(UserPermission.PERM_REQUEST_CONTENT);
				}}
			/>
		</Setting>

		<Setting
			title="Automatyczne zatwierdzanie próśb"
			desc="Automatycznie zatwierdzaj prośby tego użytkownika o dodanie tytułów."
			row
		>
			<Checkbox
				name="PERM_REQUEST_CONTENT_AUTO_APPROVE"
				value={userHasPermission(
					user.permissions,
					UserPermission.PERM_REQUEST_CONTENT_AUTO_APPROVE,
				)}
				toggled={() => {
					userTogglePermission(
						UserPermission.PERM_REQUEST_CONTENT_AUTO_APPROVE,
					);
				}}
			/>
		</Setting>

		<h3 class="norm">Inne</h3>

		<Setting
			title="Typ użytkownika"
			desc="Typ tego użytkownika; wpływa na sposób logowania i niektóre funkcje. Obecnie można przełączać tylko między typami Watcharr i Proxy."
		>
			{#if !user.type || user.type === UserType.Proxy}
				<DropDown
					placeholder="Nieznany"
					bind:active={user.type}
					options={[
						{
							id: 0,
							value: "Watcharr",
						},
						// {
						//   id: UserType.Jellyfin,
						//   value: "Jellyfin",
						// },
						// {
						//   id: UserType.Plex,
						//   value: "Plex",
						// },
						{
							id: UserType.Proxy,
							value: "Proxy",
						},
					]}
					isDropDownItem={true}
				/>
			{:else}
				<p>Ta opcja nie jest jeszcze dostępna dla tego typu użytkownika.</p>
			{/if}
		</Setting>

		<div class="btns">
			<button onclick={() => save()}>Zapisz</button>
		</div>
	</SettingsList>
</Modal>

<style lang="scss">
	.btns {
		display: flex;
		flex-flow: row;
		gap: 10px;

		:first-child {
			margin-left: auto;
		}

		button {
			width: max-content;
			padding-left: 15px;
			padding-right: 15px;
		}
	}

	.error {
		position: sticky;
		top: 0;
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 10px;
		background-color: rgb(221, 48, 48);
		text-transform: none; /* PoterX: polskie teksty maja wlasna wielkosc liter */
		color: white;
		margin-bottom: 15px;
	}
</style>
