<script lang="ts">
	import step1 from "./step1.png";
	import step2 from "./step2.png";
	import step3 from "./step3.png";
	import step4 from "./step4.png";
	import fullPage from "./content-full-page.png";
	import HandbookImage from "@/lib/handbook/internal/HandbookImage.svelte";
</script>

<p>Dodawanie tytułów do listy to podstawowa funkcja Watcharra.</p>

<p>
	Gdy coś dodasz, Twoja lista pojawi się na stronie głównej.
</p>

<p>
	Na początek wykonaj te kroki, żeby dodać swój pierwszy film (albo serial
	itp.):
</p>

<ol>
	<li>
		<p>Wyszukaj tytuł za pomocą paska wyszukiwania u góry strony.</p>
		<p>
			<HandbookImage src={step1} alt="Krok 1" />
		</p>
	</li>
	<li>
		<p>Najedź kursorem albo kliknij tytuł, który chcesz dodać.</p>
		<p>
			<HandbookImage src={step2} alt="Krok 2" />
		</p>
	</li>
	<li>
		<p>Kliknij ikonę + (plus), żeby nadać tytułowi status.</p>
		<p>
			Dostępne statusy: Obejrzane, Oglądam, Wstrzymane, Planuję,
			Porzucone.
		</p>
		<p>
			<HandbookImage src={step3} alt="Krok 3" />
		</p>
	</li>
	<li>
		<p>Oceń tytuł.</p>
		<p>
			<HandbookImage src={step4} alt="Krok 4" />
		</p>
	</li>
</ol>

<p>
	Możesz też ponownie kliknąć lub dotknąć aktywnego plakatu. Przeniesie cię to
	na pełną stronę tytułu, gdzie znajdziesz wszystkie opcje, w tym dodawanie
	przemyśleń.
</p>

<p>
	<HandbookImage src={fullPage} alt="Pełna strona tytułu" />
</p>

<p>
	Przemyślenia to wszystko, co chcesz zapisać lub zapamiętać o danym filmie czy
	serialu. Ja na przykład lubię czasem zanotować, co konkretnie bardzo mi się w
	nim podobało.
</p>
