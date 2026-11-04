# Pairspace: Bericht

WG Matching für Vermieter möblierter Zimmer. Gleicher Name, gleiche Domain, gleiches Firebase-Projekt wie das alte Event-Pairspace, aber ein neues Produkt. Seit 01.11.2026 auf `master` (Commit `45e1fae`) und live auf joinpairspace.com.

## 1. Recap altes Pairspace (Stand 31.10.2026)

**Was es war:** "Participant Matching for Events". Veranstalter legen ein Event an (vor allem Acro: Base, Flyer), Teilnehmer finden über einen Link einen Partner. Englisch, Duolingo-Stil mit Otter-Maskottchen.

**Infrastruktur, die bleibt:**
- Domain **joinpairspace.com**, registriert bei Vercel (Team "Caspar Baumeister"), 11,25 USD im Jahr, Auto Renew an. Vercel ist nur Registrar und DNS, die Seite läuft auf Firebase App Hosting.
- Firebase-Projekt **pairspace-live** (Projektnummer 865487163332), Blaze-Plan.
- App Hosting Backend `pairspace` in europe-west4, verbunden mit GitHub `Caspar-Baumeister/pairspace`, deployt bei jedem Push auf `master`. URL https://pairspace--pairspace-live.europe-west4.hosted.app, Custom Domain joinpairspace.com.
- Auth: Google, Apple (Services ID mit joinpairspace.com), anonym. joinpairspace.com ist als Authorized Domain eingetragen.
- Resend für Mails (Secret `RESEND_API_KEY`, Absender hello@joinpairspace.com), Code in `functions/src/mail.ts`.

**Aufgeräumt am 31.10.2026 (mit deiner Freigabe):**
- Firestore komplett geleert: 5 Events, 7 Teilnehmer samt Kontakten, 1 Verbindung, 2 Watcher, 2 Feedbacks, 5 Slugs, 1 Nutzer. Die alte Function `onParticipantRemoved` hat beim Löschen zwei leere Event-Hüllen neu angelegt, die habe ich im zweiten Durchgang gelöscht. Danach war alles leer.
- Storage: die 2 Teilnehmerfotos gelöscht.

**Am 01.11.2026 mit deinem OK erledigt:**
- Die 8 alten Cloud Functions in europe-west1 gelöscht (`onParticipantJoined`, `onConnectionCreated`, `onConnectionAnswered`, `onParticipantChanged`, `onParticipantRemoved`, `onWatcherAdded`, `onFeedbackCreated`, `cleanupExpiredEvents`, damit auch der Scheduler-Job). Es laufen keine Functions mehr.
- Neue Firestore- und Storage-Regeln deployt.
- Neuer Code auf `master` gepusht, App Hosting hat joinpairspace.com neu gebaut.

**Noch da, nicht angefasst:**
- Auth-Nutzer des alten Produkts (Google-Logins).
- Alte zusammengesetzte Firestore-Indizes (harmlos, die Collections dazu gibt es nicht mehr).

## 2. Das neue Produkt (Prototyp vom 31.10.2026)

### 2.1 Ablauf
- **Vermieter:** Landingpage, Konto (Google oder Mail), Wohnung anlegen, Zimmer mit Foto, Warmmiete, Größe, frei ab, kurz über sich, dann Tarif, dann Link mit QR-Code und fertigem Text für die Anzeige.
- **Bewerber** (über den Link, ohne Konto, anonym angemeldet): Intro mit Wohnung, Zimmern und Datenschutz-Hinweis, dann Tinder-Karten der Mitbewerber mit fünf Knöpfen (Auf keinen Fall, Schlecht, Mittel, Gut, Unbedingt; Tasten 1 bis 5, Rückgängig), dann Zimmer sortieren (Gleichstand über "Gleich wichtig"), dann Profil wie bei Tinder (bis 6 Fotos im 3x2 Raster, Vorname, Alter, Beruf, Über mich, Interessen, Sprachen, Lifestyle, Einzug, Dauer, Vorschau), dann Kontakt (Mail Pflicht, Telefon freiwillig, Mail-Benachrichtigung an) und optional Konto sichern (Google oder Passwort). Wer zurückkommt, landet auf einer Übersicht mit neuen, noch nicht bewerteten Mitbewerbern.
- **Graph (Herzstück):** Obsidian-Graph mit Profilfotos als Knoten. Gegenseitige Sympathie zieht zusammen und wird als Linie gezeichnet (dicker je stärker), Ablehnung stößt ohne Linie ab. Knotengröße = wie beliebt jemand ist, Ringfarbe = Cluster. Hover oder Klick hebt die Nachbarn violett hervor und blendet den Rest ab. Rechts: "Beste Gruppen" (Punkte, Harmonie, Zimmer, Bewertet als "5 von 6", Zimmerverteilung, schwächstes Paar, Gesamtmiete), "Alle" und "Person" (Profil, Kontakt, beste Gruppe mit dieser Person, Zimmerwünsche, wer wen wie bewertet). Einstellungen wie in Obsidian: freie Zimmer, Cluster färben, Namen, Ablehnungen, Kräfte.

### 2.2 Entscheidungen
- **Privatsphäre:** Profile sehen nur Mitbewerber derselben Wohnung und der Vermieter. Bewertungen, Zimmerwünsche und Kontaktdaten sieht nur der Vermieter (per Firestore-Regeln erzwungen, 12 Angriffsfälle getestet). Deine Formulierung "nicht mit anderen Participants geteilt" habe ich so ausgelegt, weil Bewerber die anderen ja sehen müssen, um sie zu bewerten.
- **Reihenfolge wie von dir gewünscht:** erst bewerten, dann Zimmer, dann Profil. Folge: Wer den Link hat, kann nach "Los geht's" die Profile sehen, ohne selbst eins anzulegen. Alternative wäre "erst zeigen, dann sehen". Sag Bescheid, wenn du das willst.
- **Pricing:** Basic 9,99 € im Monat oder 100 € im Jahr, beide mit 7 Tagen gratis, unbegrenzte Wohnungen. Zimmer haben keine sichtbare Grenze (technisch 100 pro Wohnung, damit das Dokument klein bleibt), genannt wird nur "Unbegrenzte Wohnungen". Seit 03.11.2026, vorher 1 Wohnung mit bis zu 20 Zimmern. Der Link geht erst live, wenn Testphase oder Abo aktiv sind (Firestore-Regel prüft das Abo). Im Prototyp startet `/api/abo` die Testphase ohne Zahlung. Genau dort kommt später Stripe Checkout hin.
- **Sprache:** Deutsch und Englisch (seit 03.11.2026, siehe 2.6), Du-Form, keine Gedankenstriche in beiden Sprachen (`npm run check:copy`).
- **Design:** Obsidian Dark nachgebaut: Systemschrift mit Inter als Fallback (wie Obsidian), Grautöne #1e1e1e bis #dadada, Akzent hsl(254 80% 68%), 13 px Oberfläche, 16 px Lesetext, Ribbon 44 px, Sidebar mit Dateibaum, Tabs, Statusleiste, Lucide-Icons mit Strich 1,75. Dribbble lieferte unter "Obsidian" nur fremde Finanz-Apps, Vorlage war daher obsidian.md selbst.

### 2.3 Datenmodell (Details in `src/lib/types.ts`)
- `landlords/{uid}`: Vermieter, `subscription` schreibt nur der Server.
- `flats/{flatId}`: Wohnung, ID ist zugleich der Code im Link `/w/{flatId}`, Zimmer als Array (technisch max. 100), Status draft, live oder closed, Host-Snapshot für Bewerber.
- `flats/{flatId}/applicants/{uid}`: Profil. Darunter `private/contact` (Mail, Telefon).
- `flats/{flatId}/ballots/{uid}`: Bewertungen `{andereUid: -2..2}` und Zimmerränge `{roomId: Rang}`.
- Storage: `landlords/{uid}/...` (Zimmerfotos, Vermieterfoto), `flats/{flatId}/applicants/{uid}/...` (Bewerberfotos). Der Pfad enthält immer die UID dessen, der schreiben darf.

### 2.4 Matching-Formel
Ausführlich in `docs/MATCHING.md`. Kurz: Paargewicht = geometrisches Mittel beider Richtungen, Harmonie = halb Durchschnitt, halb schwächstes Paar, Zimmer per Hungarian-Algorithmus, Punkte = 75 % Harmonie + 25 % Zimmer, Veto schließt aus. Exakte Suche mit Branch and Bound bis 400 000 Gruppen, darüber lokale Suche. Cluster per Louvain.

### 2.5 Landingpage (03.11.2026)
Nach dem Vorbild von obsidian.md, bewusst kurz, ohne Kachelraster:
- **Hero:** große linksbündige Headline, graue Unterzeile, violetter Button, darunter die Vermieter-App in einem Fenster (Seitenleiste mit mehreren Wohnungen). Im Graphen poppen 48 Bewerber nacheinander auf wie im Werbevideo, die Cluster färben sich, dann leuchtet die beste Gruppe auf und rechts erscheinen die besten Gruppen. Die Positionen rechnet d3-force einmal vorab (`src/components/landing/heroGraph.ts`), die Seite spielt sie mit 30 Bildern pro Sekunde ab. Hover hebt Nachbarn hervor. Bei reduzierter Bewegung steht sofort das Endbild.
- **Video:** das Werbevideo aus `~/Code/pairspace-promo`, Deutsch und Englisch umschaltbar, läuft stumm, sobald es im Bild ist (`public/video`, je ca. 4,5 MB).
- **Ein Link für alle Bewerber:** Text plus Handy, auf dem die echten Bewerberkarten und Bewertungsknöpfe von selbst durchlaufen.
- **Drei Versprechen plus Preiskarte:** Weniger Besichtigungen, Mitbewohner, die bleiben, Diskret für alle; rechts Logo, "Unbegrenzte Wohnungen", Preis und Testlink.
- Porträts: Unsplash (Unsplash License) in `public/faces` (160 px) und `public/people` (Handy).

### 2.6 Deutsch und Englisch (03.11.2026)
- **Adressen:** Deutsch ohne Präfix wie bisher (`/`, `/preise`, `/app`, `/w/{id}`), Englisch unter `/en` (`/en`, `/en/preise`, `/en/w/{id}`). Alle Seiten liegen unter `src/app/[lang]/`, `next.config.ts` schreibt die deutschen Pfade intern auf `/de/...` um. `/de/...` leitet auf die Adresse ohne Präfix um. So bleiben alle Seiten vorgerendert und gecacht, und Google sieht beide Sprachen (hreflang, Sitemap mit beiden).
- **Umschalter:** DE | EN in der Navigation, im Footer, in der Vermieter-App und auf der Anmeldeseite. Die Wahl landet im Cookie `lang` (ein Jahr) und gilt beim nächsten Besuch.
- **Automatisch:** Ohne gespeicherte Wahl springt ein Browser, der kein Deutsch spricht, von den deutschen Seiten auf Englisch. Umgekehrt nie: Ein `/en`-Link bleibt englisch. Suchmaschinen werden nicht umgeleitet. Der Bewerberlink bleibt `/w/{id}` ohne Sprache, internationale Bewerber landen so automatisch im Englischen.
- **Texte:** stehen direkt im Code als `t("Deutsch", "English")` (`src/lib/i18n`). Gespeicherte Werte wie Interessen und Sprachen bleiben deutsch und werden beim Anzeigen übersetzt. Das Video startet in der Seitensprache.

### 2.7 Analytics mit PostHog (03.11.2026)
- `src/lib/analytics.ts`, EU-Cloud, über den eigenen Proxy `/ingest` (Werbeblocker blocken sonst `i.posthog.com`).
- **Ohne Cookies** (`cookieless_mode: "always"`): kein Cookie, kein Local Storage, PostHog zählt Besucher über einen täglich wechselnden Hash auf seinem Server. Deshalb kein Cookie-Banner nötig. Keine Personenprofile, kein Session Replay, kein Autocapture. Sendet nur auf joinpairspace.com, lokal nie.
- **Events:** Seitenaufrufe automatisch, dazu `cta_clicked`, `language_switched`, Video (`video_started`, `video_progress` 25/50/75, `video_completed`, `video_paused`, `video_language_changed`, alle mit `lang`), `signed_in`, `flat_created`, `rooms_saved`, `plan_started`, `link_copied`, `qr_downloaded`, `graph_opened`, `group_opened`, Bewerber-Funnel `applicant_intro_viewed` bis `applicant_contact_done`, `feedback_opened`, `feedback_sent`. Jedes Event trägt `locale`. Liste in `src/lib/analytics.ts`.
- Key kommt aus `NEXT_PUBLIC_POSTHOG_KEY` in `apphosting.yaml`. Leer heißt: keine Analytics.

### 2.8 Feedback, Wünsche und Bugs (03.11.2026)
- Sprechblasen-Knopf in der Vermieter-App (Ribbon und Handy-Menü) und in jedem Schritt des Bewerber-Flows. Fenster mit Wunsch, Feedback oder Bug, Text und freiwilliger Mail für eine Antwort.
- Landet in Firestore unter `feedback/{id}` (nur anlegen, niemand liest es im Client, Regeln getestet). Die Function `onFeedbackCreated` (europe-west1, Resend) schickt jede Nachricht an caspar.baumeister.privat@gmail.com, mit Antworten-an auf die Mail der Person, Seite, Sprache und Gerät.

### 2.9 Zahlung mit Stripe (04.11.2026)
- **Ablauf:**
  - Tarif wählen und die Checkbox für AGB, Widerruf und Datenschutz ankreuzen. Sie steht bei uns, weil der Zahlknopf bei Stripe liegt.
  - Dann geht es zu Stripe Checkout: 7 Tage gratis, die Karte wird vorab erfasst. Danach kostet Basic 9,99 € im Monat oder 100 € im Jahr, bis gekündigt wird.
  - Zurück in der App bestätigt `/api/abo/sync` das Abo sofort und der Link geht live. Der Webhook `/api/stripe/webhook` schreibt danach jede Änderung.
  - Kündigen, Zahlungsart ändern, Rechnungen und der Wechsel zwischen monatlich und jährlich laufen im Stripe-Kundenportal (Knopf "Abo verwalten").
  - Gutscheincodes sind in Checkout erlaubt. Steuer-IDs für Firmen werden abgefragt.
- **Eine Testphase pro Konto.** Eine Gratis-Testphase aus der Zeit vor Stripe läuft in Stripe weiter bis zu ihrem Ende (mindestens zwei Tage, das verlangt Stripe).
- **Abo endet:**
  - Live-Wohnungen werden pausiert, und der Graph ist gesperrt ("Dein Abo ist beendet"). Bewerber und Bewertungen bleiben erhalten.
  - Mit einem neuen Abo gehen genau die pausierten Wohnungen wieder live.
  - Bei fehlgeschlagener Zahlung bleibt alles offen, solange Stripe es erneut versucht.
- **Daten:**
  - `landlords/{uid}.subscription` (Status, Ende, Kündigung zum Periodenende) liest die App und prüfen die Regeln.
  - `billing/{uid}` (Stripe-Kunde, Abo, Testphase genutzt, pausierte Wohnungen) gibt es nur auf dem Server, kein Client kann es lesen.
  - Code: `src/lib/stripe.ts`, `src/app/api/abo/`, `src/app/api/stripe/webhook/`.
- **Ohne Stripe-Schlüssel**, also lokal und live bis zur Einrichtung, gibt `/api/abo` genau eine Testphase ohne Zahlung und danach nichts mehr. Das Schlupfloch mit beliebig vielen Gratis-Abos ist damit zu.
- **Einrichtung:** `node scripts/stripe-setup.mjs`. Das Skript fragt den Secret Key verdeckt ab und legt dann an:
  - Produkt und Preise (Lookup-Keys `pairspace_basic_monthly` und `pairspace_basic_yearly`, Endpreise inklusive Steuer);
  - das Kundenportal;
  - den Webhook;
  - die beiden Secrets in App Hosting.
  
  Danach `apphosting.yaml` committen und pushen.
- **Getestet:**
  - Gegen den Emulator: Sync-Logik mit 13 Fällen (Testphase, Kündigung pausiert, neues Abo öffnet wieder, verspätetes Event eines alten Abos wird ignoriert, Zahlung fehlgeschlagen, gelöschtes Konto).
  - Webhook-Signatur: echt wird angenommen, manipuliert abgelehnt.
  - Routen ohne Login (401) und ohne Stripe (eine Testphase, dann 402).
  - Ein echter Checkout ist noch nicht getestet, dafür fehlt ein Pairspace-Konto bei Stripe.

### 2.10 Mails und Löschen (04.11.2026)
- **Vermieter:** Sobald ein Profil vollständig ist, bekommt der Vermieter genau eine Mail: Vorname, Alter, Beruf, Wohnung, wie viele Bewerbungen es jetzt gibt, Knopf zum Graphen. Adresse aus Firebase Auth, Sprache aus `landlords/{uid}.locale` (schreibt die App bei jedem Besuch, sonst Deutsch). Spätere Profiländerungen und doppelte Events lösen nichts aus.
- **Bewerber mit `notify`:** Kommt jemand Neues dazu, bekommen die anderen vollständigen Bewerber eine Mail "Es gibt neue Leute zum Einschätzen", höchstens eine pro Person in 24 Stunden. Sprache aus `private/contact.locale`. In der Bewerber-Übersicht gibt es dafür den Schalter "Mail bei neuen Mitbewerbern".
- **Abmelden mit einem Klick:** Jede Bewerber-Mail hat im Footer einen persönlichen Link und die Header `List-Unsubscribe` und `List-Unsubscribe-Post` (RFC 8058, Gmail und Apple Mail zeigen dann ihren eigenen Abmelden-Knopf). Die Function `unsubscribe` unter `https://europe-west1-pairspace-live.cloudfunctions.net/unsubscribe?f={flatId}&u={uid}&s={sig}` zeigt bei GET eine kleine Seite mit Knopf (ändert nichts, Mail-Scanner öffnen Links von selbst) und setzt bei POST `notify: false`. `sig` ist ein HMAC-SHA256 über `flatId:uid` mit dem `RESEND_API_KEY` als Schlüssel. Wird der Resend-Key getauscht, gehen alte Links nicht mehr, dann bleibt der Schalter in der App.
- **Vermerke:** `flats/{flatId}/applicants/{uid}/server/mail` (`landlordMailedAt`, `othersMailedAt`, `lastNotifiedAt`) schreibt nur der Server. Die Regeln haben dafür keinen Treffer, der Catch-all sperrt jeden Client (getestet).
- **Bewerbung löschen:** Knopf "Bewerbung löschen" mit Bestätigung in der Bewerber-Übersicht. Die Function `onApplicantDeleted` räumt danach alles ab, egal wer gelöscht hat (Bewerber, "Bewerbungen löschen" des Vermieters, Wohnung löschen): Fotos in Storage, `private/contact` und alle anderen Unterdokumente, den eigenen Stimmzettel und die eigene UID in den Stimmzetteln der anderen. Was nach dem Löschen neu entsteht (sofort wieder beworben), bleibt stehen.
- **Wohnung löschen:** `onFlatDeleted` löscht, was unter der Wohnung übrig ist, alle Bewerberfotos und die Zimmerfotos unter `landlords/{uid}/flats/{flatId}/`. Das Vermieterfoto bleibt.
- **Im Emulator** gehen keine Mails raus, sie landen in der Collection `devOutbox`. Code: `functions/src/notify.ts`, `cleanup.ts`, `templates.ts`, `unsubscribe.ts`. Test: `cd functions && npm run test:triggers` (99 Prüfungen gegen die laufenden Emulatoren, seit 2.11 mit Kündigung, Widerruf und Vertragsbestätigung; die Abmelde-Function und `/api/vertrag` laufen dabei über HTTP).

### 2.11 Rechtliches, Kündigen und Widerrufen (04.11.2026)
- **Seiten:** `/impressum`, `/datenschutz`, `/agb`, `/widerruf`, dazu `/en/...`. Deutsch ist verbindlich, Englisch sagt oben einmal, dass es eine Übersetzung ist. Verlinkt im Footer, in der Seitenleiste der App, unter den Anmeldeknöpfen und im Bewerber-Intro. Sitemap hat alle vier in beiden Sprachen.
- **Eine Quelle für AGB und Widerruf:** Die Texte stehen als Daten in `functions/src/shared/` (`agb.ts`, `widerruf.ts`, dazu `plan.ts` mit den Preisen und `operator.ts` mit Anschrift und Stand). Die Website importiert sie über den Alias `@shared/*` (Root-`tsconfig.json`), die Functions kompilieren sie mit. Wer die AGB ändert, ändert Website und Bestätigungsmail zugleich. Stand der Texte: `LEGAL_UPDATED` in `operator.ts`.
- **Verträge hier kündigen (§ 312k BGB) und Vertrag widerrufen (§ 356a BGB):** Zwei feste Links im Footer jeder Seite und auf `/app/abo`, ohne Anmeldung. Formular `/kuendigen` (Name, Mail, Vertrag, ordentlich oder außerordentlich mit freiwilligem Grund, nächstmöglicher Zeitpunkt oder Datum, Knopf "Jetzt kündigen") und `/widerrufen` (Name, Mail, Vertrag, Knopf "Widerruf bestätigen"). Danach steht die Erklärung mit Datum und Uhrzeit auf der Seite, zum Drucken oder Speichern.
- **`POST /api/vertrag`:** prüft und kürzt die Eingaben, höchstens 5 Versuche pro IP in 10 Minuten (im Speicher der Instanz), speichert `contractRequests/{id}` mit Erklärung, Eingang, IP nur als HMAC und Browserkennung. Gehört die Mail zu einem Vermieter mit Stripe-Abo, setzt die Route sofort `cancel_at_period_end` (außer bei einem Wunschdatum nach dem Periodenende). Ein Widerruf läuft nie automatisch, du erstattest anteilig von Hand. Die Antwort verrät nicht, ob es zu der Mail ein Konto gibt.
- **`onContractRequestCreated`:** Eingangsbestätigung an die Person (voller Inhalt, Datum und Uhrzeit, bei automatischer Kündigung das Enddatum) und eine Kopie an caspar.baumeister.privat@gmail.com mit Antworten-an auf die Person und dem, was zu tun ist.
- **Vertragsbestätigung (§ 312f BGB):** `syncSubscription` legt beim ersten Mal, wenn ein Stripe-Abo läuft, `contracts/{subscriptionId}` an (genau einmal, `create()`). `onContractCreated` schickt dann die Bestätigung mit Vertragsdaten und den vollständigen AGB und der Widerrufsbelehrung samt Muster-Widerrufsformular. Englische Vermieter bekommen den verbindlichen deutschen Text und die Übersetzung (HTML etwa 64 KB, unter Gmails Grenze).
- **Getestet:** `npm run test:triggers` jetzt mit Kündigung und Widerruf über die laufende Route auf :3000 (Speicherung, Validierung, Rate-Limit, Bestätigung, Kopie, kein doppelter Versand) und Vertragsbestätigung (jeder Satz von AGB und Widerruf steckt in der Mail, Deutsch und Englisch, kein doppelter Versand). `npm run test:rules` prüft zusätzlich, dass kein Client `contractRequests` oder `contracts` lesen oder schreiben kann. `npm run check:copy` prüft jetzt auch `functions/src`.

## 3. Lokal starten
Siehe README. Kurz: `npm run emulators`, `npm run seed`, `npm run dev`. Demo-Vermieter steht in `scripts/seed.mjs`. Alles läuft gegen die Emulatoren, nie gegen pairspace-live. Die Emulatoren brauchen Java 21, das Script nimmt `openjdk@21` aus Homebrew.

## 4. Getestet (31.10.2026)
- `npm run test:matching`: Hungarian, exakte Suche und Suche mit fester Person gegen Brute Force, lokale Suche trifft das Optimum, Veto, Gegenseitigkeit, Cluster.
- `npm run test:rules`: 29 Fälle (seit 03.11.2026 inklusive Feedback, seit 04.11.2026 inklusive Mail-Vermerk, Sprache, Kündigungen und Verträge) (fremde Bewertungen, fremde Kontaktdaten, selbst geschriebenes Abo, fremde Wohnung ändern und so weiter).
- `npm run typecheck`, `next build`, `npm run check:copy`: sauber.
- Im Browser durchgeklickt: Landingpage, Registrierung, Wohnung anlegen, Zimmerfoto hochladen, Über dich, Testphase, Link mit QR-Code. Als Bewerber am Handy-Format: Intro, drei Bewertungen, Zimmer mit Gleichstand, Profil mit Foto, Kontakt, Abschluss. Als Demo-Vermieter: Graph mit drei Lagern, Auswahl, Personen-Panel, Gruppenliste.

## 5. Offen
1. **Mail-Anmeldung einschalten:** Im Live-Projekt sind nur Google, Apple und anonym aktiv. Ohne den Anbieter "E-Mail/Passwort" scheitern die Registrierung per Mail und "Konto mit Passwort sichern" bei Bewerbern. Firebase Console, Authentication, Sign-in method, E-Mail/Passwort aktivieren (ohne Link-Anmeldung). Google-Login funktioniert schon.
2. **Rechtliches (siehe 2.11), von dir zu prüfen:** PLZ 14057, Umsatzsteuer-ID und Kleinunternehmer fehlen bewusst. Eine Telefonnummer verlangen das Muster der Widerrufsbelehrung und Art. 246a EGBGB, sie fehlt noch. hello@joinpairspace.com muss Mails empfangen (Impressum, Antworten auf Bestätigungen). Mit PostHog den Vertrag zur Auftragsverarbeitung abschließen.
3. **Stripe einrichten (Code fertig, siehe 2.9):**
   - **Konto:** Ein eigenes Stripe-Konto für Pairspace anlegen und aktivieren (Geschäftsdaten, Bankkonto). Die Stripe-CLI auf dem Mac ist im Immotrim-Konto angemeldet, das sollte Pairspace nicht nutzen.
   - **Setup-Skript:** Danach `node scripts/stripe-setup.mjs` mit dem Live Secret Key ausführen, dann `apphosting.yaml` committen und pushen.
   - **Rechnungen:** Im Stripe Dashboard unter Settings, Emails die Belege einschalten.
   - **Anwalt prüfen lassen:**
     - Der Zahlknopf in Stripe heißt bei einer Testphase womöglich "Testzeitraum starten" statt "Abonnieren". Ob das § 312j Abs. 3 BGB genügt, ist offen.
     - Nach dem ersten Jahr muss das Jahresabo für Verbraucher monatlich kündbar sein, mit anteiliger Erstattung (§ 309 Nr. 9 BGB). Das läuft heute von Hand über Stripe.
4. **PostHog-Key fehlt:** Der Code ist fertig, aber das Projekt "Pairspace" in PostHog EU gibt es noch nicht (im Browser von Claude war PostHog nicht eingeloggt). Projekt anlegen, unter Settings "Cookieless server hash mode" einschalten, den `phc_`-Key in `apphosting.yaml` eintragen (Block ist vorbereitet), pushen.
5. **Mails und Löschen deployen (siehe 2.10 und 2.11):** `firebase deploy --only functions` (neu: `onApplicantWritten`, `onApplicantDeleted`, `onFlatDeleted`, `unsubscribe`, `onContractRequestCreated`, `onContractCreated`). `unsubscribe` muss öffentlich aufrufbar sein (`invoker: "public"`). Falls eine Organisationsrichtlinie `allUsers` verbietet, meldet das der Deploy.
6. **Formel nachschärfen:** Wer alle mit Unbedingt bewertet (Max in den Demodaten), landet in vielen Vorschlägen, weil sein hoher Wert jedes Paargewicht anhebt. Gegenmittel: Bewertungen pro Person normalisieren (zum Beispiel auf ihren eigenen Durchschnitt), bevor das Paargewicht gerechnet wird.
7. **Später:** Grundriss mit eingezeichneten Zimmern, bestehende Mitbewohner bewerten mit, Gewichtung Menschen und Zimmer als Regler für den Vermieter.
