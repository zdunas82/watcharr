<script lang="ts">
	import { resolve } from "$app/paths";
</script>

<p>
	Obsługa webhooka Jellyfina w Watcharrze pozwala automatycznie śledzić tytuły
	od razu, gdy zaczniesz lub skończysz je oglądać w Jellyfinie.
</p>

<p>
	Żeby włączyć tę funkcję, trzeba zmienić konfigurację zarówno w Jellyfinie, jak
	i w Watcharrze. Każdy krok tego poradnika zaczyna się od <code>
		(WATCHARR)</code
	>
	albo <code>(JELLYFIN)</code>, co wskazuje, w której aplikacji wprowadzasz zmianę.
</p>

<ol>
	<li>
		<p><b>(JELLYFIN)</b> Zainstaluj w Jellyfinie oficjalną wtyczkę Webhook.</p>
		<p>
			Przejdź do panelu serwera, otwórz katalog wtyczek, znajdź wtyczkę o nazwie
			<code>Webhook</code> i zainstaluj ją.
		</p>
		<p>
			Jeśli widzisz więcej niż jedną wtyczkę Webhook i nie wiesz, którą wybrać:
			weź tę z repozytorium <code>Jellyfin Stable</code> od autora
			<code>jellyfin</code>.
		</p>
	</li>
	<li>
		<p>
			<b>(JELLYFIN)</b> Po zainstalowaniu wtyczki Webhook powinien pojawić się przycisk
			<code>settings</code> (ustawienia). Kliknij go, żeby otworzyć ustawienia wtyczki.
		</p>
		<p>
			Jeśli Jellyfin poprosi o ponowne uruchomienie serwera, zrób to. Potem
			przycisk ustawień pojawi się na stronie wtyczki Webhook.
		</p>
	</li>
	<li>
		<p>
			<b>(WATCHARR)</b> Przejdź do
			<a href={resolve("/server")}>strony konfiguracji serwera</a>, znajdź
			ustawienie „Webhook Jellyfina” i je WŁĄCZ.
		</p>
	</li>
	<li>
		<p>
			<b>(WATCHARR)</b> Pod właśnie włączonym ustawieniem pojawi się nowe: „Adres
			webhooka Jellyfina”. Skopiuj ten adres do schowka, przyda się w następnym
			kroku.
		</p>
	</li>
	<li>
		<p>
			<b>(JELLYFIN)</b> Kliknij <code>Add Generic Destination</code>, a potem przewiń
			w dół do ustawień tego miejsca docelowego.
		</p>
	</li>
	<li>
		<p>
			<b>(JELLYFIN)</b> W polu <code>Webhook Name</code> wpisz
			<code>Watcharr</code> (albo dowolną inną nazwę).
		</p>
	</li>
	<li>
		<p>
			<b>(JELLYFIN)</b> Wklej adres skopiowany z Watcharra w pole
			<code>Webhook Url</code>.
		</p>
		<p>
			Uwaga: pełny adres skopiowany z Watcharra <i>może</i> być błędny! W zależności
			od konfiguracji serwera może być potrzebna zamiana nazwy hosta w adresie na
			taką, przez którą Jellyfin może połączyć się z Twoją instancją Watcharra.
		</p>
	</li>
	<li>
		<p>
			<b>(JELLYFIN)</b> Włącz następujące typy powiadomień (Notification Types):
		</p>
		<ul>
			<li>
				<p>Playback Start</p>
			</li>

			<li>
				<p>Playback Stop</p>
			</li>

			<li>
				<p>User Data Saved</p>
			</li>
		</ul>
	</li>
	<li>
		<p>
			<b>(JELLYFIN)</b> Zaznacz użytkowników, dla których mają być wysyłane zdarzenia
			webhooka.
		</p>
	</li>
	<li>
		<p>
			<b>(JELLYFIN)</b> Włącz <code>Send All Properties</code>.
		</p>
	</li>
	<li>
		<p>
			<b>(JELLYFIN)</b> Przewiń na sam dół i kliknij <code>Save</code>.
		</p>
	</li>
	<li>
		<p>
			Gotowe! Teraz wystarczy obejrzeć coś w Jellyfinie i sprawdzić, czy pojawi
			się automatycznie w Watcharrze.
		</p>
	</li>
</ol>

<h2>Problemy?</h2>

<p>
	Jeśli coś nie działa, najlepiej zacząć od sprawdzenia logów serwerów (Watcharra
	i Jellyfina).
</p>

<p>
	Na przykład jeśli logi serwera Jellyfin pokazują błędy 404 przy każdej próbie
	wysłania webhooka, prawdopodobnie trzeba jeszcze raz sprawdzić, czy pole
	Webhook Url w Jellyfinie jest poprawne.
</p>
