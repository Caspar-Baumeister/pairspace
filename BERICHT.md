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
- **Vermieter:** Landingpage (bewusst schlicht, Design kommt mit dir), Konto (Google oder Mail), Wohnung anlegen, Zimmer mit Foto, Warmmiete, Größe, frei ab, kurz über sich, dann Tarif, dann Link mit QR-Code und fertigem Text für die Anzeige.
- **Bewerber** (über den Link, ohne Konto, anonym angemeldet): Intro mit Wohnung, Zimmern und Datenschutz-Hinweis, dann Tinder-Karten der Mitbewerber mit fünf Knöpfen (Auf keinen Fall, Schlecht, Mittel, Gut, Unbedingt; Tasten 1 bis 5, Rückgängig), dann Zimmer sortieren (Gleichstand über "Gleich wichtig"), dann Profil wie bei Tinder (bis 6 Fotos im 3x2 Raster, Vorname, Alter, Beruf, Über mich, Interessen, Sprachen, Lifestyle, Einzug, Dauer, Vorschau), dann Kontakt (Mail Pflicht, Telefon freiwillig, Mail-Benachrichtigung an) und optional Konto sichern (Google oder Passwort). Wer zurückkommt, landet auf einer Übersicht mit neuen, noch nicht bewerteten Mitbewerbern.
- **Graph (Herzstück):** Obsidian-Graph mit Profilfotos als Knoten. Gegenseitige Sympathie zieht zusammen und wird als Linie gezeichnet (dicker je stärker), Ablehnung stößt ohne Linie ab. Knotengröße = wie beliebt jemand ist, Ringfarbe = Cluster. Hover oder Klick hebt die Nachbarn violett hervor und blendet den Rest ab. Rechts: "Beste Gruppen" (Punkte, Harmonie, Zimmer, Bewertet als "5 von 6", Zimmerverteilung, schwächstes Paar, Gesamtmiete), "Alle" und "Person" (Profil, Kontakt, beste Gruppe mit dieser Person, Zimmerwünsche, wer wen wie bewertet). Einstellungen wie in Obsidian: freie Zimmer, Cluster färben, Namen, Ablehnungen, Kräfte.

### 2.2 Entscheidungen
- **Privatsphäre:** Profile sehen nur Mitbewerber derselben Wohnung und der Vermieter. Bewertungen, Zimmerwünsche und Kontaktdaten sieht nur der Vermieter (per Firestore-Regeln erzwungen, 12 Angriffsfälle getestet). Deine Formulierung "nicht mit anderen Participants geteilt" habe ich so ausgelegt, weil Bewerber die anderen ja sehen müssen, um sie zu bewerten.
- **Reihenfolge wie von dir gewünscht:** erst bewerten, dann Zimmer, dann Profil. Folge: Wer den Link hat, kann nach "Los geht's" die Profile sehen, ohne selbst eins anzulegen. Alternative wäre "erst zeigen, dann sehen". Sag Bescheid, wenn du das willst.
- **Pricing:** Basic 9,99 € im Monat oder 100 € im Jahr, beide mit 7 Tagen gratis, 1 Wohnung, bis 20 Zimmer. Der Link geht erst live, wenn Testphase oder Abo aktiv sind (Firestore-Regel prüft das Abo). Im Prototyp startet `/api/abo` die Testphase ohne Zahlung. Genau dort kommt später Stripe Checkout hin.
- **Sprache:** Oberfläche Deutsch, Du-Form, keine Gedankenstriche (`npm run check:copy`).
- **Design:** Obsidian Dark nachgebaut: Systemschrift mit Inter als Fallback (wie Obsidian), Grautöne #1e1e1e bis #dadada, Akzent hsl(254 80% 68%), 13 px Oberfläche, 16 px Lesetext, Ribbon 44 px, Sidebar mit Dateibaum, Tabs, Statusleiste, Lucide-Icons mit Strich 1,75. Dribbble lieferte unter "Obsidian" nur fremde Finanz-Apps, Vorlage war daher obsidian.md selbst.

### 2.3 Datenmodell (Details in `src/lib/types.ts`)
- `landlords/{uid}`: Vermieter, `subscription` schreibt nur der Server.
- `flats/{flatId}`: Wohnung, ID ist zugleich der Code im Link `/w/{flatId}`, Zimmer als Array (max. 20), Status draft, live oder closed, Host-Snapshot für Bewerber.
- `flats/{flatId}/applicants/{uid}`: Profil. Darunter `private/contact` (Mail, Telefon).
- `flats/{flatId}/ballots/{uid}`: Bewertungen `{andereUid: -2..2}` und Zimmerränge `{roomId: Rang}`.
- Storage: `landlords/{uid}/...` (Zimmerfotos, Vermieterfoto), `flats/{flatId}/applicants/{uid}/...` (Bewerberfotos). Der Pfad enthält immer die UID dessen, der schreiben darf.

### 2.4 Matching-Formel
Ausführlich in `docs/MATCHING.md`. Kurz: Paargewicht = geometrisches Mittel beider Richtungen, Harmonie = halb Durchschnitt, halb schwächstes Paar, Zimmer per Hungarian-Algorithmus, Punkte = 75 % Harmonie + 25 % Zimmer, Veto schließt aus. Exakte Suche mit Branch and Bound bis 400 000 Gruppen, darüber lokale Suche. Cluster per Louvain.

## 3. Lokal starten
Siehe README. Kurz: `npm run emulators`, `npm run seed`, `npm run dev`. Demo-Vermieter steht in `scripts/seed.mjs`. Alles läuft gegen die Emulatoren, nie gegen pairspace-live. Die Emulatoren brauchen Java 21, das Script nimmt `openjdk@21` aus Homebrew.

## 4. Getestet (31.10.2026)
- `npm run test:matching`: Hungarian, exakte Suche und Suche mit fester Person gegen Brute Force, lokale Suche trifft das Optimum, Veto, Gegenseitigkeit, Cluster.
- `npm run test:rules`: 12 Fälle (fremde Bewertungen, fremde Kontaktdaten, selbst geschriebenes Abo, fremde Wohnung ändern und so weiter).
- `npm run typecheck`, `next build`, `npm run check:copy`: sauber.
- Im Browser durchgeklickt: Landingpage, Registrierung, Wohnung anlegen, Zimmerfoto hochladen, Über dich, Testphase, Link mit QR-Code. Als Bewerber am Handy-Format: Intro, drei Bewertungen, Zimmer mit Gleichstand, Profil mit Foto, Kontakt, Abschluss. Als Demo-Vermieter: Graph mit drei Lagern, Auswahl, Personen-Panel, Gruppenliste.

## 5. Offen
1. **Mail-Anmeldung einschalten:** Im Live-Projekt sind nur Google, Apple und anonym aktiv. Ohne den Anbieter "E-Mail/Passwort" scheitern die Registrierung per Mail und "Konto mit Passwort sichern" bei Bewerbern. Firebase Console, Authentication, Sign-in method, E-Mail/Passwort aktivieren (ohne Link-Anmeldung). Google-Login funktioniert schon.
2. **Rechtliches, dringend:** Die Seite ist live, aber Impressum und Datenschutzerklärung fehlen (alte `/privacy` und `/terms` waren englische Entwürfe und sind raus).
3. **Stripe:** Checkout mit `trial_period_days: 7`, Webhook schreibt `landlords/{uid}.subscription`, Kundenportal zum Kündigen. Bis dahin gilt live: `/api/abo` startet die Testphase ohne Zahlung, und wer danach auf Abo klickt, bekommt 30 oder 365 Tage aktiv, ebenfalls ohne Zahlung.
4. **Mails:** Function, die den Vermieter bei neuen Profilen und Bewerber (mit `notify`) bei neuen Mitbewerbern benachrichtigt. `mail.ts` mit Resend ist vorbereitet.
5. **Fotos beim Löschen:** "Bewerbungen löschen" entfernt Profile, Bewertungen und Kontakte, aber nicht die Bewerberfotos in Storage (Pfad gehört dem Bewerber). Braucht eine Function. Der Satz im Intro "wird deine Bewerbung gelöscht" stimmt erst danach ganz.
6. **Limit 1 Wohnung** wird nur in der Oberfläche erzwungen, nicht in den Regeln.
7. **Landingpage** im Detail designen (Platzhalter steht).
8. **Formel nachschärfen:** Wer alle mit Unbedingt bewertet (Max in den Demodaten), landet in vielen Vorschlägen, weil sein hoher Wert jedes Paargewicht anhebt. Gegenmittel: Bewertungen pro Person normalisieren (zum Beispiel auf ihren eigenen Durchschnitt), bevor das Paargewicht gerechnet wird.
9. **Später:** Grundriss mit eingezeichneten Zimmern, bestehende Mitbewohner bewerten mit, Gewichtung Menschen und Zimmer als Regler für den Vermieter.
