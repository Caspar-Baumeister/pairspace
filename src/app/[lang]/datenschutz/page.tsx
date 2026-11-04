import type { Metadata } from "next";

import { Callout, LegalPage, MailLink, OperatorAddress } from "@/components/site/LegalPage";
import { alternates, toLocale, translator } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  return {
    title: t("Datenschutzerklärung", "Privacy policy"),
    description: t(
      "Welche Daten Pairspace verarbeitet, wofür, wo sie liegen und welche Rechte du hast.",
      "Which data Pairspace processes, why, where it is stored and what your rights are.",
    ),
    alternates: alternates(locale, "/datenschutz"),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  const de = locale === "de";
  const stripePrivacy = de ? "https://stripe.com/de/privacy" : "https://stripe.com/gb/privacy";

  return (
    <LegalPage
      locale={locale}
      title={t("Datenschutzerklärung", "Privacy policy")}
      lead={
        <p>
          {t(
            "Hier steht, welche Daten Pairspace verarbeitet, wofür, wo sie liegen und welche Rechte du hast. Wir halten es so kurz und klar wie möglich.",
            "This page explains which data Pairspace processes, why, where it is stored and what your rights are. We keep it as short and clear as we can.",
          )}
        </p>
      }
      sections={[
        {
          id: "verantwortlich",
          title: t("Wer verantwortlich ist", "Who is responsible"),
          body: (
            <>
              <p>{t("Verantwortlich für die Datenverarbeitung auf joinpairspace.com ist:", "The controller for data processing on joinpairspace.com is:")}</p>
              <OperatorAddress locale={locale} />
              <p>
                {t("Mail", "Email")}: <MailLink />
              </p>
              <p>
                {t(
                  "Pairspace wird von Caspar Baumeister allein betrieben. Wenn hier „wir“ steht, ist er gemeint. Bei Fragen zum Datenschutz schreib einfach eine Mail.",
                  "Pairspace is run by Caspar Baumeister on his own. Where this page says “we”, it means him. If you have any questions about privacy, just send an email.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "kurz",
          title: t("Das Wichtigste in Kürze", "The short version"),
          body: (
            <ul>
              <li>
                {t(
                  "Bewerber brauchen kein Konto. Ihre Bewertungen, Zimmerwünsche und Kontaktdaten sieht nur der Vermieter der Wohnung.",
                  "Applicants do not need an account. Only the landlord of the flat sees their ratings, room choices and contact details.",
                )}
              </li>
              <li>
                {t(
                  "Dein Profil als Bewerber sehen der Vermieter und die anderen Bewerber derselben Wohnung.",
                  "Your profile as an applicant is seen by the landlord and by the other applicants for the same flat.",
                )}
              </li>
              <li>{t("Wir zeigen keine Werbung und verkaufen keine Daten.", "We show no ads and sell no data.")}</li>
              <li>
                {t(
                  "Wir setzen nur ein Cookie für deine Sprachwahl und speichern deine Anmeldung im Browser. Die Statistik läuft ohne Cookies.",
                  "We only set one cookie for your language choice and keep your sign-in in the browser. Our analytics run without cookies.",
                )}
              </li>
              <li>
                {t(
                  "Datenbank und Fotos liegen bei Google in den USA. Wie das abgesichert ist, erklären wir unten.",
                  "The database and the photos are stored by Google in the USA. We explain below how this is safeguarded.",
                )}
              </li>
              <li>{t("Du kannst deine Bewerbung jederzeit selbst löschen.", "You can delete your application yourself at any time.")}</li>
            </ul>
          ),
        },
        {
          id: "rollen",
          title: t("Pairspace und der Vermieter", "Pairspace and the landlord"),
          body: (
            <>
              <p>
                {t(
                  "Über Pairspace legen Vermieter möblierter WG Zimmer eine Wohnung an und teilen einen Link. Bewerber bewerten über diesen Link die anderen Bewerber, sortieren die Zimmer und legen ein Profil an.",
                  "On Pairspace, landlords of furnished rooms in shared flats add a flat and share a link. Through this link, applicants rate the other applicants, rank the rooms and create a profile.",
                )}
              </p>
              <p>
                {t(
                  "Für den Betrieb der Plattform sind wir verantwortlich. Dazu gehören Konten, das Speichern und Anzeigen der Daten, Mails, Zahlungen und Statistik.",
                  "We are responsible for running the platform. That covers accounts, storing and showing the data, emails, payments and analytics.",
                )}
              </p>
              <p>
                {t(
                  "Wenn du dich auf eine Wohnung bewirbst, bekommt der Vermieter dieser Wohnung dein Profil, deine Bewertungen der anderen Bewerber, deine Zimmerwünsche und deine Kontaktdaten. Das geschieht auf deinen Wunsch, weil du dich bei ihm um ein Zimmer bewirbst. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, also die Anbahnung eines Mietvertrags.",
                  "When you apply for a flat, the landlord of that flat receives your profile, your ratings of the other applicants, your room choices and your contact details. This happens at your request, because you are applying to them for a room. The legal basis is Art. 6(1)(b) GDPR, steps taken before entering into a tenancy.",
                )}
              </p>
              <p>
                {t(
                  "Für die Auswahl der Mieter und alles, was er danach mit deinen Daten macht, ist der Vermieter selbst verantwortlich. Fragen dazu richtest du am besten direkt an ihn.",
                  "The landlord is a separate controller for choosing the tenants and for whatever they do with your data afterwards. Questions about that are best sent to them directly.",
                )}
              </p>
              <p>
                {t(
                  "Pairspace rechnet aus den Bewertungen Vorschläge, welche Gruppen gut zusammenpassen. Das sind nur Vorschläge. Wen er als Mieter nimmt, entscheidet allein der Vermieter. Eine automatisierte Entscheidung im Sinne von Art. 22 DSGVO gibt es nicht.",
                  "From the ratings, Pairspace works out suggestions for groups that fit well together. They are only suggestions. The landlord alone decides whom to rent to. There is no automated decision within the meaning of Art. 22 GDPR.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "hosting",
          title: t("Website und Server-Logs", "Website and server logs"),
          body: (
            <>
              <p>
                {t(
                  "Die Website läuft auf Firebase App Hosting von Google Cloud, in der Region europe-west4 in den Niederlanden.",
                  "The website runs on Firebase App Hosting by Google Cloud, in the europe-west4 region in the Netherlands.",
                )}
              </p>
              <p>
                {t(
                  "Bei jedem Aufruf verarbeitet der Server Daten, die dein Browser automatisch mitschickt: IP-Adresse, Browserkennung (User Agent), Datum und Uhrzeit sowie die aufgerufene Seite. Diese Angaben landen in Server-Logs. Wir brauchen sie, um die Seite auszuliefern, Fehler zu finden und Angriffe abzuwehren.",
                  "With every request, the server processes data that your browser sends automatically: IP address, browser identifier (user agent), date and time, and the page requested. This ends up in server logs. We need it to deliver the site, find errors and fend off attacks.",
                )}
              </p>
              <p>
                {t(
                  "Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Die Logs werden nach 30 Tagen automatisch gelöscht.",
                  "The legal basis is our legitimate interest in running the site securely and reliably (Art. 6(1)(f) GDPR). The logs are deleted automatically after 30 days.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "google",
          title: t("Google Firebase und wo die Daten liegen", "Google Firebase and where data is stored"),
          body: (
            <>
              <p>
                {t(
                  "Für Website, Datenbank, Fotos, Anmeldung und Aufgaben im Hintergrund nutzen wir Firebase und Google Cloud. Anbieter ist Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland, zusammen mit Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Google verarbeitet die Daten in unserem Auftrag nach einem Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO).",
                  "We use Firebase and Google Cloud for the website, the database, photos, sign-in and background tasks. The provider is Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland, together with Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Google processes the data on our behalf under a data processing agreement (Art. 28 GDPR).",
                )}
              </p>
              <p>{t("So verteilen sich die Daten:", "This is where the data lives:")}</p>
              <ul>
                <li>
                  <strong>Firebase App Hosting:</strong>{" "}
                  {t(
                    "liefert die Website aus und speichert die Server-Logs. Region europe-west4, Niederlande.",
                    "delivers the website and keeps the server logs. Region europe-west4, Netherlands.",
                  )}
                </li>
                <li>
                  <strong>Cloud Functions:</strong>{" "}
                  {t(
                    "verschicken Mails und erledigen Aufgaben im Hintergrund, zum Beispiel beim Löschen. Region europe-west1, Belgien.",
                    "send emails and run background tasks, for example when something is deleted. Region europe-west1, Belgium.",
                  )}
                </li>
                <li>
                  <strong>Cloud Firestore:</strong>{" "}
                  {t(
                    "die Datenbank mit Konten, Wohnungen, Profilen, Bewertungen, Zimmerwünschen, Kontaktdaten und Feedback. Standort nam5, mehrere Rechenzentren in den USA.",
                    "the database with accounts, flats, profiles, ratings, room choices, contact details and feedback. Location nam5, several data centres in the USA.",
                  )}
                </li>
                <li>
                  <strong>Cloud Storage:</strong>{" "}
                  {t("die Fotos. Standort us-east1, USA.", "the photos. Location us-east1, USA.")}
                </li>
                <li>
                  <strong>Firebase Authentication:</strong>{" "}
                  {t(
                    "die Anmeldung. Ein weltweiter Dienst von Google, die Daten können also auch in den USA verarbeitet werden. Dabei verarbeitet Google auch IP-Adresse und Browserkennung, um Missbrauch zu verhindern.",
                    "sign-in. A global Google service, so the data may also be processed in the USA. Google also processes your IP address and browser identifier to prevent abuse.",
                  )}
                </li>
              </ul>
              <p>
                {t(
                  "Datenbank und Fotos liegen also in den USA. Für die Übermittlung dorthin gilt der Angemessenheitsbeschluss der EU-Kommission zum EU-US Data Privacy Framework (Art. 45 DSGVO). Google LLC ist nach diesem Rahmen zertifiziert. Zusätzlich sieht der Vertrag mit Google die Standardvertragsklauseln der EU-Kommission vor (Art. 46 Abs. 2 lit. c DSGVO). Ganz ausschließen können wir nicht, dass US-Behörden auf Daten zugreifen.",
                  "So the database and the photos are stored in the USA. Transfers there are covered by the European Commission's adequacy decision for the EU-US Data Privacy Framework (Art. 45 GDPR). Google LLC is certified under this framework. In addition, our contract with Google includes the European Commission's standard contractual clauses (Art. 46(2)(c) GDPR). We cannot fully rule out that US authorities access data.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "geraet",
          title: t("Speicher auf deinem Gerät", "Storage on your device"),
          body: (
            <>
              <p>{t("Auf deinem Gerät speichern wir nur, was unbedingt nötig ist:", "We only store what is strictly necessary on your device:")}</p>
              <ul>
                <li>
                  <strong>{t("Cookie „lang“:", "Cookie “lang”:")}</strong>{" "}
                  {t(
                    "merkt sich deine Sprache, wenn du sie selbst umschaltest. Es läuft nach einem Jahr ab.",
                    "remembers your language when you switch it yourself. It expires after one year.",
                  )}
                </li>
                <li>
                  <strong>{t("Anmeldung:", "Sign-in:")}</strong>{" "}
                  {t(
                    "Firebase Authentication speichert deine Sitzung im Speicher deines Browsers (IndexedDB oder Local Storage), damit du angemeldet bleibst. Das gilt auch für die anonyme Anmeldung als Bewerber. Die Sitzung bleibt, bis du dich abmeldest oder die Websitedaten in deinem Browser löschst.",
                    "Firebase Authentication keeps your session in your browser's storage (IndexedDB or local storage) so that you stay signed in. This also applies to the anonymous sign-in for applicants. The session stays until you sign out or clear the site data in your browser.",
                  )}
                </li>
              </ul>
              <p>
                {t(
                  "Beides ist unbedingt erforderlich, damit wir den Dienst bereitstellen können, den du ausdrücklich nutzen willst. Dafür braucht es keine Einwilligung (§ 25 Abs. 2 Nr. 2 TDDDG).",
                  "Both are strictly necessary to provide the service you have explicitly asked for. No consent is needed for this (§ 25(2) no. 2 TDDDG).",
                )}
              </p>
              <p>
                {t(
                  "Andere Cookies setzen wir nicht. Es gibt keine Werbung und kein Tracking über andere Websites hinweg. Schriften, die Porträts auf der Startseite und das Video liegen auf unserem eigenen Server. Dafür gehen keine Anfragen an Dritte wie Google Fonts.",
                  "We set no other cookies. There are no ads and no tracking across other websites. Fonts, the portraits on the homepage and the video are served from our own server. No requests go to third parties such as Google Fonts for them.",
                )}
              </p>
              <p>
                {t(
                  "Wenn du dich mit Google anmeldest oder bei Stripe bezahlst, öffnest du deren Seiten. Dort gelten deren eigene Regeln zu Cookies und Datenschutz.",
                  "When you sign in with Google or pay with Stripe, you open their pages. Their own rules on cookies and privacy apply there.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "statistik",
          title: t("Statistik mit PostHog", "Analytics with PostHog"),
          body: (
            <>
              <p>
                {t(
                  "Um zu verstehen, wie Pairspace genutzt wird und wo es hakt, nutzen wir PostHog. Anbieter ist PostHog Inc., USA. Wir nutzen die EU-Cloud von PostHog, die Daten liegen auf Servern in Frankfurt.",
                  "To understand how Pairspace is used and where people get stuck, we use PostHog. The provider is PostHog Inc., USA. We use PostHog's EU cloud, the data is stored on servers in Frankfurt.",
                )}
              </p>
              <p>{t("Wir haben PostHog so eingestellt, dass es möglichst wenig erfasst:", "We have set up PostHog to collect as little as possible:")}</p>
              <ul>
                <li>
                  {t(
                    "Nichts wird auf deinem Gerät gespeichert, kein Cookie und kein Local Storage.",
                    "Nothing is stored on your device, no cookie and no local storage.",
                  )}
                </li>
                <li>
                  {t(
                    "Keine Personenprofile, keine Aufzeichnung von Sitzungen und keine automatische Erfassung aller Klicks.",
                    "No person profiles, no session recordings and no automatic capture of every click.",
                  )}
                </li>
                <li>
                  {t(
                    "Besucher zählt PostHog über einen Hash, den es auf seinem Server aus IP-Adresse und Browserkennung bildet und der jeden Tag wechselt. So lässt sich ein Besuch nicht über mehrere Tage verfolgen.",
                    "PostHog counts visitors with a hash that it computes on its server from the IP address and browser identifier, and that changes every day. So a visit cannot be followed across several days.",
                  )}
                </li>
                <li>
                  {t(
                    "Die Anfragen gehen über unsere eigene Adresse joinpairspace.com/ingest und werden von dort an PostHog weitergeleitet.",
                    "Requests go through our own address joinpairspace.com/ingest and are passed on to PostHog from there.",
                  )}
                </li>
                <li>{t("PostHog läuft nur auf joinpairspace.com.", "PostHog only runs on joinpairspace.com.")}</li>
              </ul>
              <p>
                {t(
                  "Erfasst werden Seitenaufrufe, Klicks auf bestimmte Knöpfe, wie weit das Video angesehen wurde, Wechsel der Sprache und Schritte im Ablauf, etwa „Wohnung angelegt“ oder „Profil fertig“. Zu jedem Ereignis gehen an PostHog die aufgerufene Adresse, die Seite, von der du kommst (Referrer), die Browserkennung (User Agent) sowie Sprache und Zeitzone des Browsers. Bildschirm- und Fenstergröße schicken wir nicht mit.",
                  "We record page views, clicks on certain buttons, how far the video was watched, language switches and steps in the flow, such as “flat created” or “profile done”. With each event, PostHog receives the address visited, the page you came from (referrer), the browser identifier (user agent) and the browser's language and time zone. We do not send screen or window size.",
                )}
              </p>
              <p>
                {t(
                  "Rechtsgrundlage ist unser berechtigtes Interesse, Pairspace zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Weil PostHog nichts auf deinem Gerät speichert, fragen wir nicht nach einer Einwilligung und zeigen kein Cookie-Banner. Mit PostHog besteht ein Vertrag zur Auftragsverarbeitung. Greift PostHog Inc. aus den USA auf Daten zu, gelten die Standardvertragsklauseln der EU-Kommission. Wir werten die Daten nur zusammengefasst aus und löschen sie, wenn wir sie dafür nicht mehr brauchen. Du kannst der Statistik jederzeit widersprechen, siehe Deine Rechte.",
                  "The legal basis is our legitimate interest in improving Pairspace (Art. 6(1)(f) GDPR). Because PostHog stores nothing on your device, we do not ask for consent and show no cookie banner. We have a data processing agreement with PostHog. Where PostHog Inc. accesses data from the USA, the European Commission's standard contractual clauses apply. We only look at the data in aggregate and delete it once we no longer need it for that. You can object to the analytics at any time, see Your rights.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "vermieter",
          title: t("Konto für Vermieter", "Landlord accounts"),
          body: (
            <>
              <p>
                {t(
                  "Als Vermieter legst du ein Konto an, mit Google oder mit Mail und Passwort. Wir speichern deinen Namen, deine Mailadresse und die Art der Anmeldung. Dein Passwort speichert Firebase Authentication nur als Hash, im Klartext sieht es niemand. Meldest du dich mit Google an, bekommen wir von Google deinen Namen, deine Mailadresse und eine Kennung.",
                  "As a landlord, you create an account with Google or with email and password. We store your name, your email address and how you sign in. Firebase Authentication only stores your password as a hash, nobody sees it in plain text. If you sign in with Google, we receive your name, your email address and an identifier from Google.",
                )}
              </p>
              <p>
                {t(
                  "Für deine Wohnungen speicherst du Titel, Ort, Stadtteil, Beschreibung und Zimmer mit Name, Warmmiete, Größe, Einzugsdatum, Notiz und Foto. Wenn du möchtest, kommen ein Text über dich und ein Foto von dir dazu.",
                  "For your flats, you store a title, city, district, description and rooms with name, rent including bills, size, move-in date, note and photo. If you like, you add a few lines about yourself and a photo of you.",
                )}
              </p>
              <p>
                {t(
                  "Ist der Link einer Wohnung aktiv, sieht jeder, der ihn öffnet, die Angaben zur Wohnung und zu den Zimmern sowie deinen Namen, deinen Text über dich und dein Foto.",
                  "While the link of a flat is active, anyone who opens it sees the details of the flat and the rooms as well as your name, your lines about yourself and your photo.",
                )}
              </p>
              <p>
                {t(
                  "Außerdem speichern wir den Stand deines Abos, also Testphase, aktiv oder beendet, die Laufzeit und deine Kundennummer bei Stripe.",
                  "We also store the state of your subscription, that is trial, active or ended, its period and your customer number at Stripe.",
                )}
              </p>
              <p>
                {t(
                  "Rechtsgrundlage ist der Vertrag über die Nutzung von Pairspace (Art. 6 Abs. 1 lit. b DSGVO).",
                  "The legal basis is the contract for using Pairspace (Art. 6(1)(b) GDPR).",
                )}
              </p>
            </>
          ),
        },
        {
          id: "bewerber",
          title: t("Bewerben über einen Link", "Applying through a link"),
          body: (
            <>
              <p>
                {t(
                  "Als Bewerber brauchst du kein Konto. Wenn du auf „Los geht's“ tippst, meldet dich Firebase Authentication anonym an. Dabei entsteht eine zufällige Kennung ohne Namen, die in deinem Browser gespeichert wird. So kannst du später weitermachen.",
                  "As an applicant, you do not need an account. When you tap “Let's go”, Firebase Authentication signs you in anonymously. This creates a random identifier without a name, which is kept in your browser. That way you can carry on later.",
                )}
              </p>
              <h3>{t("Was du angibst und wer es sieht", "What you provide and who sees it")}</h3>
              <ul>
                <li>
                  <strong>{t("Bewertungen:", "Ratings:")}</strong>{" "}
                  {t(
                    "Du schätzt die anderen Bewerber in fünf Stufen ein, von „Auf keinen Fall“ bis „Unbedingt“. Das sieht nur der Vermieter. Die bewerteten Personen sehen nie, wie du sie bewertet hast.",
                    "You rate the other applicants on five levels, from “No way” to “Absolutely”. Only the landlord sees this. The people you rated never see how you rated them.",
                  )}
                </li>
                <li>
                  <strong>{t("Zimmerwünsche:", "Room choices:")}</strong>{" "}
                  {t("deine Reihenfolge der Zimmer. Das sieht nur der Vermieter.", "your order of the rooms. Only the landlord sees this.")}
                </li>
                <li>
                  <strong>{t("Profil:", "Profile:")}</strong>{" "}
                  {t(
                    "bis zu 6 Fotos, Vorname, Alter, Beruf, ein Text über dich, Interessen, Sprachen, Angaben zum Zusammenleben (Ordnung, WG Leben, Tagesrhythmus, Rauchen, Haustiere), Einzugsdatum und geplante Dauer. Das sehen der Vermieter und die anderen Bewerber derselben Wohnung, sobald dein Profil fertig ist.",
                    "up to 6 photos, first name, age, job, a few lines about you, interests, languages, how you like to live (tidiness, flat life, daily rhythm, smoking, pets), move-in date and planned length of stay. The landlord and the other applicants for the same flat see this once your profile is complete.",
                  )}
                </li>
                <li>
                  <strong>{t("Kontakt:", "Contact:")}</strong>{" "}
                  {t(
                    "deine Mailadresse, freiwillig deine Telefonnummer und ob du Mails bekommen möchtest. Das sieht nur der Vermieter.",
                    "your email address, your phone number if you want to give it, and whether you would like to get emails. Only the landlord sees this.",
                  )}
                </li>
              </ul>
              <p>
                {t(
                  "Wer was sehen darf, ist in den Sicherheitsregeln der Datenbank festgelegt und wird technisch durchgesetzt.",
                  "Who may see what is set in the database's security rules and enforced technically.",
                )}
              </p>
              <p>
                {t(
                  "Wichtig: Den Link verteilt der Vermieter, zum Beispiel in seiner Anzeige. Wer den Link hat und auf „Los geht's“ tippt, sieht die fertigen Profile, auch bevor er selbst ein Profil angelegt hat. „Andere Bewerber“ meint also alle, die über den Link gestartet sind.",
                  "Important: the landlord shares the link, for example in their listing. Anyone who has the link and taps “Let's go” sees the completed profiles, even before creating a profile themselves. So “other applicants” means everyone who has started through the link.",
                )}
              </p>
              <p>
                {t(
                  "Gib in deinem Profil nur an, was du zeigen möchtest. Angaben zu Gesundheit, Religion oder politischen Ansichten brauchst du nie.",
                  "Only put in your profile what you want to show. You never need to share anything about your health, religion or political views.",
                )}
              </p>
              <p>
                {t(
                  "Du kannst dein Konto freiwillig sichern, mit Google oder mit einem Passwort. Dann speichert Firebase Authentication deine Mailadresse und bei Google auch deinen Namen. So kommst du von jedem Gerät zurück.",
                  "You can choose to save your account with Google or a password. Firebase Authentication then stores your email address, and with Google your name too. That way you can come back from any device.",
                )}
              </p>
              <p>
                {t(
                  "Rechtsgrundlage ist der Vertrag über die Nutzung von Pairspace und deine Bewerbung beim Vermieter (Art. 6 Abs. 1 lit. b DSGVO).",
                  "The legal basis is the contract for using Pairspace and your application to the landlord (Art. 6(1)(b) GDPR).",
                )}
              </p>
            </>
          ),
        },
        {
          id: "fotos",
          title: t("Fotos", "Photos"),
          body: (
            <>
              <p>
                {t(
                  "Zimmerfotos und das Foto des Vermieters laden Vermieter hoch, Profilfotos laden Bewerber hoch. Bevor ein Bild hochgeladen wird, schneidet dein Browser es zu, verkleinert es und speichert es neu. Dabei fallen eingebettete Angaben wie der Aufnahmeort weg.",
                  "Room photos and the landlord's photo are uploaded by landlords, profile photos by applicants. Before an image is uploaded, your browser crops it, shrinks it and saves it again. Embedded details such as the location where it was taken are dropped in the process.",
                )}
              </p>
              <p>
                {t(
                  "Die Fotos liegen in Cloud Storage von Google in den USA (siehe oben). Angezeigt werden sie über eine lange, zufällige Adresse. Wer diese Adresse kennt, kann das Foto abrufen.",
                  "The photos are stored in Google Cloud Storage in the USA (see above). They are shown through a long, random address. Anyone who knows this address can open the photo.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "mails",
          title: t("Mails mit Resend", "Emails with Resend"),
          body: (
            <>
              <p>
                {t(
                  "Mails verschicken wir über Resend. Anbieter ist Resend, Inc., USA. Die Mails stoßen unsere Cloud Functions in Belgien an, Resend speichert die Daten in den USA.",
                  "We send emails through Resend. The provider is Resend, Inc., USA. The emails are triggered by our Cloud Functions in Belgium, Resend stores the data in the USA.",
                )}
              </p>
              <p>{t("Wir schicken Mails in diesen Fällen:", "We send emails in these cases:")}</p>
              <ul>
                <li>
                  {t(
                    "Vermieter bekommen eine Mail, wenn sich jemand neu auf ihre Wohnung bewirbt.",
                    "Landlords get an email when someone new applies for their flat.",
                  )}
                </li>
                <li>
                  {t(
                    "Bewerber, die Mails eingeschaltet haben, bekommen eine Mail, wenn neue Mitbewerber zum Einschätzen da sind. Du kannst das jederzeit in deinen Kontaktangaben ausschalten.",
                    "Applicants who turned on emails get one when there are new co-applicants to rate. You can turn this off in your contact details at any time.",
                  )}
                </li>
                <li>
                  {t(
                    "Feedback, das du über den Feedback-Knopf schickst, geht per Mail an uns.",
                    "Feedback you send with the feedback button reaches us by email.",
                  )}
                </li>
                <li>
                  {t(
                    "Nach Abschluss eines Abos bekommen Vermieter eine Vertragsbestätigung mit den AGB und der Widerrufsbelehrung.",
                    "After subscribing, landlords get a contract confirmation with the terms and the withdrawal notice.",
                  )}
                </li>
                <li>
                  {t(
                    "Wer über „Verträge hier kündigen“ oder „Vertrag widerrufen“ etwas abschickt, bekommt eine Eingangsbestätigung, und wir bekommen eine Kopie.",
                    "Anyone who sends something through “Cancel contracts here” or “Withdraw from contract” gets a receipt, and we get a copy.",
                  )}
                </li>
              </ul>
              <p>
                {t(
                  "Resend verarbeitet dafür die Mailadresse, den Inhalt der Mail und Angaben zur Zustellung. In einer Mail an Vermieter stehen zum Beispiel der Name der Wohnung und der Vorname der neuen Person.",
                  "For this, Resend processes the email address, the content of the email and delivery details. An email to a landlord contains, for example, the name of the flat and the first name of the new applicant.",
                )}
              </p>
              <p>
                {t(
                  "Resend ist nach dem EU-US Data Privacy Framework zertifiziert (Art. 45 DSGVO). Zusätzlich gelten die Standardvertragsklauseln der EU-Kommission aus dem Vertrag zur Auftragsverarbeitung mit Resend (Art. 46 Abs. 2 lit. c DSGVO).",
                  "Resend is certified under the EU-US Data Privacy Framework (Art. 45 GDPR). In addition, the European Commission's standard contractual clauses in our data processing agreement with Resend apply (Art. 46(2)(c) GDPR).",
                )}
              </p>
              <p>
                {t(
                  "Rechtsgrundlage ist der Vertrag über die Nutzung von Pairspace (Art. 6 Abs. 1 lit. b DSGVO). Für Feedback ist es unser berechtigtes Interesse, Nachrichten zu lesen, zu beantworten und Pairspace zu verbessern (Art. 6 Abs. 1 lit. f DSGVO).",
                  "The legal basis is the contract for using Pairspace (Art. 6(1)(b) GDPR). For feedback, it is our legitimate interest in reading and answering messages and improving Pairspace (Art. 6(1)(f) GDPR).",
                )}
              </p>
            </>
          ),
        },
        {
          id: "zahlung",
          title: t("Bezahlen mit Stripe", "Payments with Stripe"),
          body: (
            <>
              <p>
                {t(
                  "Das Abo für Vermieter bezahlst du über Stripe. Anbieter ist Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland.",
                  "Landlords pay for their subscription through Stripe. The provider is Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Ireland.",
                )}
              </p>
              <p>
                {t(
                  "Zum Abschließen leiten wir dich zu Stripe Checkout weiter. Kündigen, Zahlungsmittel ändern und Rechnungen ansehen kannst du im Kundenportal von Stripe, das du in der App über „Abo verwalten“ erreichst. Deine Kartennummer und andere Zahlungsdaten gibst du direkt bei Stripe ein. Wir sehen sie nie.",
                  "To subscribe, we send you to Stripe Checkout. You can cancel, change your payment method and see invoices in Stripe's customer portal, which you reach in the app under “Manage subscription”. You enter your card number and other payment details directly at Stripe. We never see them.",
                )}
              </p>
              <p>
                {t(
                  "An Stripe übermitteln wir deinen Namen, deine Mailadresse und eine Kennung deines Kontos. Bei Stripe gibst du außerdem deine Zahlungsdaten an und, falls abgefragt, deine Rechnungsadresse und Umsatzsteuer-ID. Von Stripe bekommen wir den Stand deines Abos, die Laufzeit und eine Kundennummer.",
                  "We pass your name, your email address and an identifier of your account to Stripe. At Stripe you also enter your payment details and, if asked, your billing address and VAT number. From Stripe we receive the state of your subscription, its period and a customer number.",
                )}
              </p>
              <p>
                {t(
                  "Rechtsgrundlage ist der Vertrag über das Abo (Art. 6 Abs. 1 lit. b DSGVO) und unsere Pflicht, Rechnungen aufzubewahren (Art. 6 Abs. 1 lit. c DSGVO). Stripe verarbeitet manche Daten auch in eigener Verantwortung, etwa um Betrug zu verhindern und gesetzliche Pflichten zu erfüllen. Stripe kann Daten an Stripe in den USA übermitteln und ist dafür nach dem EU-US Data Privacy Framework zertifiziert.",
                  "The legal basis is the subscription contract (Art. 6(1)(b) GDPR) and our duty to keep invoices (Art. 6(1)(c) GDPR). Stripe also processes some data as a controller in its own right, for example to prevent fraud and meet legal duties. Stripe may transfer data to Stripe in the USA and is certified under the EU-US Data Privacy Framework for this.",
                )}
              </p>
              <p>
                {de ? (
                  <>
                    Mehr dazu in der{" "}
                    <a href={stripePrivacy} target="_blank" rel="noopener noreferrer">
                      Datenschutzerklärung von Stripe
                    </a>
                    .
                  </>
                ) : (
                  <>
                    More in{" "}
                    <a href={stripePrivacy} target="_blank" rel="noopener noreferrer">
                      Stripe&apos;s privacy policy
                    </a>
                    .
                  </>
                )}
              </p>
            </>
          ),
        },
        {
          id: "kuendigen",
          title: t("Kündigen und Widerrufen ohne Anmeldung", "Cancelling and withdrawing without signing in"),
          body: (
            <>
              <p>
                {t(
                  "Über „Verträge hier kündigen“ und „Vertrag widerrufen“ unten auf jeder Seite kannst du dein Abo ohne Anmeldung kündigen oder widerrufen. Dafür speichern wir deinen Namen, deine Mailadresse, den Vertrag und bei einer Kündigung ihre Art, den Grund, wenn du einen angibst, und den gewünschten Zeitpunkt. Dazu kommen Datum und Uhrzeit des Eingangs, die Browserkennung und ein nicht umkehrbarer Prüfwert (Hash) deiner IP-Adresse, damit wir Missbrauch erkennen. Die IP-Adresse selbst speichern wir nicht.",
                  "With “Cancel contracts here” and “Withdraw from contract” at the bottom of every page, you can cancel or withdraw from your subscription without signing in. For this we store your name, your email address, the contract and, for a cancellation, its type, the reason if you give one and the requested date. We also store the date and time of receipt, the browser identifier and a one-way check value (hash) of your IP address so that we can detect misuse. We do not store the IP address itself.",
                )}
              </p>
              <p>
                {t(
                  "Gehört die Mailadresse zu einem Vermieterkonto mit Abo, tragen wir eine Kündigung sofort bei Stripe ein. Du bekommst über Resend eine Eingangsbestätigung per Mail, wir bekommen eine Kopie.",
                  "If the email address belongs to a landlord account with a subscription, we enter a cancellation at Stripe straight away. You get a receipt by email through Resend, and we get a copy.",
                )}
              </p>
              <p>
                {t(
                  "Rechtsgrundlage ist unsere gesetzliche Pflicht, Kündigung und Widerruf online zu ermöglichen und den Eingang zu bestätigen (Art. 6 Abs. 1 lit. c DSGVO mit § 312k und § 356a BGB), und die Abwicklung deines Vertrags (Art. 6 Abs. 1 lit. b DSGVO). Wir bewahren die Erklärung als Nachweis auf, solange Ansprüche aus dem Vertrag verjähren können, in der Regel drei Jahre ab dem Ende des Jahres, in dem sie eingegangen ist.",
                  "The legal basis is our legal duty to offer cancellation and withdrawal online and to confirm receipt (Art. 6(1)(c) GDPR with § 312k and § 356a BGB), and handling your contract (Art. 6(1)(b) GDPR). We keep the declaration as proof for as long as claims under the contract can become time-barred, usually three years from the end of the year in which it was received.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "feedback",
          title: "Feedback",
          body: (
            <>
              <p>
                {t(
                  "Über den Feedback-Knopf kannst du uns Wünsche, Feedback oder Fehler schicken. Gespeichert werden die Art der Nachricht, dein Text, freiwillig deine Mailadresse, die Seite, auf der du warst, die Sprache, die Browserkennung, eine zufällige Kennung deiner Anmeldung und gegebenenfalls die Kennung der Wohnung. Bist du noch nicht angemeldet, meldet Pairspace dich dafür anonym an.",
                  "With the feedback button you can send us ideas, feedback or bugs. We store the kind of message, your text, your email address if you give it, the page you were on, the language, the browser identifier, a random identifier of your sign-in and, where relevant, the identifier of the flat. If you are not signed in yet, Pairspace signs you in anonymously for this.",
                )}
              </p>
              <p>
                {t(
                  "Die Nachricht landet in der Datenbank und kommt per Mail über Resend bei uns an. Lesen können sie nur wir. Rechtsgrundlage ist unser berechtigtes Interesse, Pairspace zu verbessern und dir zu antworten (Art. 6 Abs. 1 lit. f DSGVO). Wir löschen Feedback, wenn wir es nicht mehr brauchen.",
                  "The message is stored in the database and reaches us by email through Resend. Only we can read it. The legal basis is our legitimate interest in improving Pairspace and answering you (Art. 6(1)(f) GDPR). We delete feedback once we no longer need it.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "speicherdauer",
          title: t("Wie lange wir Daten speichern", "How long we keep data"),
          body: (
            <>
              <ul>
                <li>
                  <strong>{t("Bewerbung:", "Application:")}</strong>{" "}
                  {t(
                    "bis du sie löschst oder der Vermieter die Bewerbung oder die ganze Wohnung löscht. Mit „Bewerbung löschen“ entfernst du jederzeit dein Profil, deine Fotos, deine Bewertungen, deine Zimmerwünsche und deine Kontaktdaten. Auch die Bewertungen, die andere über dich abgegeben haben, werden dabei entfernt.",
                    "until you delete it or the landlord deletes the application or the whole flat. With “Delete application” you can remove your profile, photos, ratings, room choices and contact details at any time. The ratings others gave you are removed too.",
                  )}
                </li>
                <li>
                  <strong>{t("Wohnungen:", "Flats:")}</strong>{" "}
                  {t(
                    "bis der Vermieter sie löscht. Dabei werden auch alle Bewerbungen dazu und die Zimmerfotos gelöscht.",
                    "until the landlord deletes them. All applications for the flat and the room photos are deleted with it.",
                  )}
                </li>
                <li>
                  <strong>{t("Vermieterkonto:", "Landlord account:")}</strong>{" "}
                  {t(
                    "solange du es nutzt. Willst du es löschen, schreib uns eine Mail. Wir löschen dann Konto, Wohnungen und Bewerbungen, außer was wir aufbewahren müssen.",
                    "for as long as you use it. If you want it deleted, send us an email. We then delete the account, flats and applications, except what we are required to keep.",
                  )}
                </li>
                <li>
                  <strong>{t("Rechnungen, Zahlungsbelege und Vertragsbestätigungen:", "Invoices, payment records and contract confirmations:")}</strong>{" "}
                  {t(
                    "so lange, wie es das Steuer- und Handelsrecht verlangt, in der Regel acht bis zehn Jahre.",
                    "for as long as tax and commercial law require, usually eight to ten years.",
                  )}
                </li>
                <li>
                  <strong>{t("Kündigungen und Widerrufe:", "Cancellations and withdrawals:")}</strong>{" "}
                  {t(
                    "drei Jahre ab dem Ende des Jahres, in dem sie eingegangen sind.",
                    "three years from the end of the year in which they were received.",
                  )}
                </li>
                <li>
                  <strong>{t("Server-Logs:", "Server logs:")}</strong> {t("30 Tage.", "30 days.")}
                </li>
              </ul>
              <p>
                {t(
                  "Vermieter verpflichten sich in unseren AGB, Bewerbungen zu löschen, sobald sie sie für die Vermietung nicht mehr brauchen.",
                  "In our terms, landlords agree to delete applications as soon as they no longer need them for letting the rooms.",
                )}
              </p>
            </>
          ),
        },
        {
          id: "rechte",
          title: t("Deine Rechte", "Your rights"),
          body: (
            <>
              <p>{t("Du hast nach Art. 15 bis 21 DSGVO diese Rechte:", "Under Art. 15 to 21 GDPR you have these rights:")}</p>
              <ul>
                <li>{t("Auskunft über deine Daten (Art. 15)", "Access to your data (Art. 15)")}</li>
                <li>{t("Berichtigung falscher Daten (Art. 16)", "Correction of wrong data (Art. 16)")}</li>
                <li>{t("Löschung (Art. 17)", "Erasure (Art. 17)")}</li>
                <li>{t("Einschränkung der Verarbeitung (Art. 18)", "Restriction of processing (Art. 18)")}</li>
                <li>{t("Datenübertragbarkeit (Art. 20)", "Data portability (Art. 20)")}</li>
                <li>{t("Widerspruch gegen die Verarbeitung (Art. 21)", "Objection to processing (Art. 21)")}</li>
              </ul>
              <p>
                {de ? (
                  <>
                    Schreib dafür einfach eine Mail an <MailLink />.
                    Geht es um Daten, die der Vermieter für seine Auswahl nutzt, wende dich auch an ihn. Erreichst du ihn
                    nicht, leiten wir dein Anliegen weiter.
                  </>
                ) : (
                  <>
                    Just send an email to <MailLink />. If it is
                    about data the landlord uses for their choice, contact them as well. If you cannot reach them, we
                    will pass your request on.
                  </>
                )}
              </p>
              <Callout>
                <p>
                  <strong>{t("Widerspruchsrecht", "Right to object")}</strong>
                </p>
                <p>
                  {t(
                    "Verarbeiten wir Daten auf Grundlage unseres berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO), kannst du jederzeit widersprechen, aus Gründen, die sich aus deiner besonderen Situation ergeben. Das betrifft vor allem die Server-Logs, die Statistik und das Feedback. Wir verarbeiten die Daten dann nicht mehr, außer es gibt zwingende schutzwürdige Gründe, die deine Interessen überwiegen, oder sie dienen der Durchsetzung von Rechtsansprüchen.",
                    "Where we process data on the basis of our legitimate interest (Art. 6(1)(f) GDPR), you can object at any time on grounds relating to your particular situation. This mainly concerns the server logs, the analytics and feedback. We then stop processing the data, unless there are compelling legitimate grounds that override your interests, or the data is needed to establish or defend legal claims.",
                  )}
                </p>
              </Callout>
              <p>
                {de ? (
                  <>
                    Du kannst dich außerdem bei einer Datenschutzbehörde beschweren (Art. 77 DSGVO). Für uns zuständig ist
                    die Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59-61, 10555 Berlin,{" "}
                    <a href="https://www.datenschutz-berlin.de" target="_blank" rel="noopener noreferrer">
                      datenschutz-berlin.de
                    </a>
                    .
                  </>
                ) : (
                  <>
                    You can also complain to a data protection authority (Art. 77 GDPR). The authority responsible for
                    us is the Berlin Commissioner for Data Protection and Freedom of Information (Berliner Beauftragte
                    für Datenschutz und Informationsfreiheit), Alt-Moabit 59-61, 10555 Berlin, Germany,{" "}
                    <a href="https://www.datenschutz-berlin.de" target="_blank" rel="noopener noreferrer">
                      datenschutz-berlin.de
                    </a>
                    .
                  </>
                )}
              </p>
            </>
          ),
        },
        {
          id: "pflicht",
          title: t("Musst du Daten angeben?", "Do you have to provide data?"),
          body: (
            <p>
              {t(
                "Nein, Pairspace zu nutzen ist freiwillig. Ohne Daten geht es aber nicht: Als Bewerber braucht der Vermieter mindestens deine Mailadresse, um dich zu erreichen, und ein Profil, damit die anderen dich einschätzen können. Als Vermieter brauchst du ein Konto. Alles, was als freiwillig markiert ist, kannst du weglassen.",
                "No, using Pairspace is voluntary. It does not work without data, though: as an applicant, the landlord needs at least your email address to reach you and a profile so the others can rate you. As a landlord, you need an account. Anything marked optional can be left out.",
              )}
            </p>
          ),
        },
        {
          id: "aenderungen",
          title: t("Änderungen", "Changes"),
          body: (
            <p>
              {t(
                "Wenn sich Pairspace ändert, passen wir diese Erklärung an. Es gilt die Fassung, die hier steht.",
                "When Pairspace changes, we update this policy. The version on this page applies.",
              )}
            </p>
          ),
        },
      ]}
    />
  );
}
