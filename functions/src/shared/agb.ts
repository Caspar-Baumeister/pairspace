/**
 * AGB und Nutzungsbedingungen. The German text is binding, the English one a
 * courtesy translation. Rendered by src/app/[lang]/agb and, in full, by the
 * contract confirmation mail (functions/src/contracts.ts).
 */
import { h3, link, p, translator, ul, type LegalDoc, type Locale } from "./doc";
import { CANCEL_PATH, OPERATOR, WITHDRAW_PATH } from "./operator";
import { BASIC, euro } from "./plan";

export function agbDoc(locale: Locale): LegalDoc {
  const t = translator(locale);
  const month = euro(BASIC.monthly, locale);
  const year = euro(BASIC.yearly, locale);
  const days = BASIC.trialDays;
  const mail = link(OPERATOR.email, `mailto:${OPERATOR.email}`);

  return {
    title: t("Allgemeine Geschäftsbedingungen", "Terms and conditions"),
    lead: t(
      "Diese Bedingungen regeln, wie du Pairspace nutzt: als Vermieter mit Abo und als Bewerber kostenlos. Sie sind auch unsere Nutzungsbedingungen. Wir haben sie in einfachen Worten geschrieben, verbindlich sind sie trotzdem.",
      "These terms set out how you use Pairspace: as a landlord with a subscription and as an applicant for free. They are also our terms of use. We have written them in plain words, but they are binding all the same.",
    ),
    numbered: true,
    sections: [
      {
        id: "geltung",
        title: t("Geltung und Vertragspartner", "Scope and contracting party"),
        blocks: [
          p(
            t(
              "Diese AGB gelten für die Nutzung von Pairspace auf joinpairspace.com, für Vermieter und für Bewerber.",
              "These terms apply to the use of Pairspace on joinpairspace.com, for landlords and for applicants.",
            ),
          ),
          p(
            t(
              `Dein Vertragspartner ist ${OPERATOR.name}, ${OPERATOR.street}, ${OPERATOR.city}, ${OPERATOR.country.de}, `,
              `Your contracting party is ${OPERATOR.name}, ${OPERATOR.street}, ${OPERATOR.city}, ${OPERATOR.country.en}, `,
            ),
            mail,
            t(". Wenn hier „wir“ steht, ist er gemeint.", ". Where these terms say “we”, they mean him."),
          ),
          p(
            t(
              "Verbraucher ist, wer Pairspace zu Zwecken nutzt, die überwiegend weder gewerblich noch selbständig beruflich sind (§ 13 BGB). Unternehmer ist, wer Pairspace in Ausübung einer gewerblichen oder selbständigen beruflichen Tätigkeit nutzt (§ 14 BGB).",
              "A consumer is anyone who uses Pairspace for purposes that are mainly outside their trade, business or profession (§ 13 BGB). A business is anyone who uses Pairspace in the course of their trade, business or profession (§ 14 BGB).",
            ),
          ),
          p(
            t(
              "Eigene Bedingungen von Nutzern gelten nicht, auch wenn wir ihnen nicht ausdrücklich widersprechen.",
              "Users' own terms do not apply, even if we do not expressly object to them.",
            ),
          ),
        ],
      },
      {
        id: "leistung",
        title: t("Was Pairspace macht", "What Pairspace does"),
        blocks: [
          p(
            t(
              "Pairspace hilft Vermietern möblierter Zimmer in Wohngemeinschaften, Mieter zu finden, die zusammenpassen. Vermieter legen eine Wohnung mit Zimmern an und teilen einen Link. Bewerber bewerten über diesen Link die anderen Bewerber, sortieren die Zimmer und legen ein Profil an. Der Vermieter sieht, wer wen wie bewertet hat, und bekommt Vorschläge für Gruppen.",
              "Pairspace helps landlords of furnished rooms in shared flats find tenants who fit together. Landlords add a flat with rooms and share a link. Through this link, applicants rate the other applicants, rank the rooms and create a profile. The landlord sees who rated whom and how, and gets suggestions for groups.",
            ),
          ),
          p(
            t(
              "Die Vorschläge sind ein Hilfsmittel und keine Entscheidung. Wen er als Mieter nimmt, entscheidet allein der Vermieter.",
              "The suggestions are a tool, not a decision. The landlord alone decides whom to rent to.",
            ),
          ),
          p(
            t(
              "Pairspace ist kein Makler und vermittelt keine Mietverträge. Wir werden nicht Partei eines Mietvertrags. Wir prüfen weder Wohnungen noch Bewerber und sagen nicht zu, dass ein Mietvertrag zustande kommt oder dass eine Gruppe gut zusammenlebt.",
              "Pairspace is not an estate agent and does not broker tenancies. We never become a party to a tenancy agreement. We check neither flats nor applicants and do not promise that a tenancy comes about or that a group lives well together.",
            ),
          ),
        ],
      },
      {
        id: "konto",
        title: t("Konto und kostenlose Nutzung", "Accounts and free use"),
        blocks: [
          p(
            t(
              "Vermieter brauchen ein Konto. Sie melden sich mit Google oder mit Mail und Passwort an. Mit dem Anlegen des Kontos kommt ein kostenloser Nutzungsvertrag zustande. Den Link einer Wohnung für Bewerber freischalten kannst du nur mit Testphase oder Abo.",
              "Landlords need an account. They sign in with Google or with email and password. Creating the account concludes a free contract of use. You can only open a flat's link to applicants with a trial or a subscription.",
            ),
          ),
          p(
            t(
              "Bewerber brauchen kein Konto. Mit dem Start einer Bewerbung über einen Link kommt ein kostenloser Nutzungsvertrag für diese Bewerbung zustande. Bewerber können ihr Konto freiwillig mit Google oder einem Passwort sichern.",
              "Applicants do not need an account. Starting an application through a link concludes a free contract of use for that application. Applicants can choose to save their account with Google or a password.",
            ),
          ),
          p(t("Um Pairspace zu nutzen, musst du volljährig sein.", "You must be at least 18 to use Pairspace.")),
          p(
            t(
              "Halte deine Zugangsdaten geheim. Merkst du, dass jemand anderes dein Konto nutzt, sag uns sofort Bescheid.",
              "Keep your sign-in details secret. If you notice that someone else is using your account, tell us straight away.",
            ),
          ),
          p(
            t(
              "Den kostenlosen Nutzungsvertrag kannst du jederzeit beenden, zum Beispiel indem du deine Bewerbung löschst oder uns bittest, dein Konto zu löschen. Wir können ihn mit einer Frist von zwei Wochen beenden, aus wichtigem Grund auch sofort. Ein laufendes Abo bleibt davon unberührt.",
              "You can end the free contract of use at any time, for example by deleting your application or asking us to delete your account. We can end it with two weeks' notice, or immediately for good cause. A running subscription is not affected by this.",
            ),
          ),
        ],
      },
      {
        id: "abo",
        title: t("Abo für Vermieter", "Subscription for landlords"),
        blocks: [
          h3(t("Tarif und Preis", "Plan and price")),
          p(
            t(
              `Der Tarif Basic kostet ${month} im Monat oder ${year} im Jahr und enthält unbegrenzt viele Wohnungen. Alle Preise sind Endpreise.`,
              `The Basic plan costs ${month} per month or ${year} per year and includes unlimited flats. All prices are final prices.`,
            ),
          ),

          h3(t("So schließt du das Abo ab", "How you subscribe")),
          p(
            t(
              "Du wählst in der App unter Abo den Tarif, akzeptierst diese AGB und verlangst, dass Pairspace sofort startet. Dann leiten wir dich zu Stripe Checkout weiter. Dort gibst du deine Zahlungsdaten ein und siehst alle Angaben noch einmal. Bis zum Klick auf den Knopf zum Abschließen kannst du deine Eingaben korrigieren oder den Vorgang abbrechen. Mit dem Klick gibst du ein verbindliches Angebot ab. Der Vertrag kommt zustande, sobald der Bezahlvorgang abgeschlossen ist und wir dein Abo freischalten. Eine Bestätigung mit diesen AGB und der Widerrufsbelehrung bekommst du per Mail.",
              "In the app, you choose the plan under Subscription, accept these terms and ask for Pairspace to start right away. We then send you to Stripe Checkout. There you enter your payment details and see everything once more. Until you click the button to complete, you can correct your entries or cancel. By clicking it, you make a binding offer. The contract is concluded once checkout is complete and we activate your subscription. You get a confirmation by email that contains these terms and the withdrawal notice.",
            ),
          ),
          p(
            t(
              "Den Vertragstext speichern wir nicht gesondert. Du bekommst ihn mit der Bestätigung per Mail, und diese AGB kannst du jederzeit unter joinpairspace.com/agb abrufen, speichern und ausdrucken. Vertragssprache ist Deutsch.",
              "We do not store the contract text separately. You get it with the confirmation by email, and you can open, save and print these terms at joinpairspace.com/en/agb at any time. The language of the contract is German.",
            ),
          ),

          h3(t("Testphase", "Free trial")),
          p(
            t(
              `Die ersten ${days} Tage sind kostenlos. Stripe fragt dein Zahlungsmittel schon zu Beginn ab. Kündigst du nicht vor Ende der Testphase, beginnt danach automatisch das bezahlte Abo und dein Zahlungsmittel wird belastet. Die Testphase gibt es pro Konto nur einmal.`,
              `The first ${days} days are free. Stripe asks for your payment method right at the start. If you do not cancel before the trial ends, the paid subscription starts automatically afterwards and your payment method is charged. There is only one trial per account.`,
            ),
          ),

          h3(t("Laufzeit und Verlängerung", "Term and renewal")),
          p(
            t(
              "Das Abo läuft einen Monat oder ein Jahr, je nachdem, was du gewählt hast. Es verlängert sich automatisch um denselben Zeitraum, wenn du nicht kündigst. Der Preis ist jeweils zu Beginn eines Zeitraums fällig.",
              "The subscription runs for one month or one year, depending on what you chose. It renews automatically for the same period unless you cancel. The price is due at the start of each period.",
            ),
          ),
          p(
            t(
              "Bist du Verbraucher und hast das Jahresabo, gilt nach dem ersten Jahr: Es verlängert sich auf unbestimmte Zeit, und du kannst es jederzeit mit einer Frist von einem Monat kündigen. Den bezahlten Preis für die Zeit nach dem Ende erstatten wir dir anteilig.",
              "If you are a consumer on the yearly plan, the following applies after the first year: the subscription continues for an indefinite period and you can cancel it at any time with one month's notice. We refund the price you paid for the time after it ends pro rata.",
            ),
          ),

          h3(t("Kündigung", "Cancellation")),
          p(
            t(
              "Du kannst das Abo jederzeit kündigen, mit Wirkung zum Ende des laufenden Zeitraums. Am einfachsten geht das ohne Anmeldung über ",
              "You can cancel the subscription at any time, effective at the end of the current period. The easiest way, without signing in, is ",
            ),
            link(t("„Verträge hier kündigen“", "“Cancel contracts here”"), CANCEL_PATH),
            t(
              ", unten auf jeder Seite. Du kannst auch im Kundenportal von Stripe kündigen, das du in der App unter „Abo verwalten“ erreichst, oder per Mail an ",
              " at the bottom of every page. You can also cancel in Stripe's customer portal, which you reach in the app under “Manage subscription”, or by email to ",
            ),
            mail,
            t(
              ". Den Eingang einer Kündigung bestätigen wir dir sofort per Mail. Kündigst du in der Testphase, zahlst du nichts.",
              ". We confirm receipt of a cancellation by email straight away. If you cancel during the trial, you pay nothing.",
            ),
          ),
          p(
            t(
              "Wir können das Abo mit einer Frist von einem Monat zum Ende eines Zeitraums kündigen. Das Recht beider Seiten, aus wichtigem Grund fristlos zu kündigen, bleibt unberührt.",
              "We can cancel the subscription with one month's notice to the end of a period. Both sides keep the right to terminate without notice for good cause.",
            ),
          ),
          p(
            t(
              "Endet das Abo, wird der Link deiner Wohnungen abgeschaltet. Deine Wohnungen und Bewerbungen bleiben im Konto, bis du sie löschst.",
              "When the subscription ends, the links of your flats are switched off. Your flats and applications stay in your account until you delete them.",
            ),
          ),

          h3(t("Zahlung", "Payment")),
          p(
            t(
              "Die Zahlung läuft über Stripe. Du kannst die Zahlungsarten nutzen, die Stripe Checkout dir anbietet. Rechnungen findest du im Kundenportal. Schlägt eine Zahlung fehl, versucht Stripe es erneut. Bis die Zahlung klappt, kann der Link deiner Wohnungen abgeschaltet sein.",
              "Payment is handled by Stripe. You can use the payment methods Stripe Checkout offers you. You find invoices in the customer portal. If a payment fails, Stripe tries again. Until the payment goes through, the links of your flats may be switched off.",
            ),
          ),

          h3(t("Widerrufsrecht", "Right of withdrawal")),
          p(
            t("Als Verbraucher hast du ein Widerrufsrecht von 14 Tagen. Alles dazu steht in der ", "As a consumer, you have a 14-day right of withdrawal. Everything about it is in the "),
            link(t("Widerrufsbelehrung", "right of withdrawal notice"), "/widerruf"),
            t(". Widerrufen kannst du auch online über ", ". You can also withdraw online with "),
            link(t("„Vertrag widerrufen“", "“Withdraw from contract”"), WITHDRAW_PATH),
            t(", ohne Anmeldung.", ", without signing in."),
          ),
        ],
      },
      {
        id: "preisaenderungen",
        title: t("Preisänderungen", "Price changes"),
        blocks: [
          p(
            t(
              "Wir können die Preise für die Zukunft ändern, etwa wenn unsere Kosten steigen. Eine Änderung kündigen wir mindestens sechs Wochen vorher per Mail an. Sie gilt frühestens ab dem Zeitraum, der nach Ablauf dieser Frist beginnt.",
              "We can change prices for the future, for example if our costs go up. We announce any change by email at least six weeks in advance. It applies at the earliest from the period that starts after this notice has run out.",
            ),
          ),
          p(
            t(
              "Bis die Änderung wirksam wird, kannst du dein Abo jederzeit kostenlos kündigen. Darauf weisen wir dich in der Mail hin.",
              "Until the change takes effect, you can cancel your subscription at any time free of charge. We point this out in the email.",
            ),
          ),
          p(
            t(
              "Bist du Verbraucher, gilt eine Preiserhöhung für dein laufendes Abo nur, wenn du ihr zustimmst. Stimmst du nicht zu, läuft dein Abo zum bisherigen Preis weiter. Wir können es dann mit einer Frist von einem Monat zum Ende eines Zeitraums kündigen.",
              "If you are a consumer, a price increase only applies to your running subscription if you agree to it. If you do not agree, your subscription continues at the old price. We may then cancel it with one month's notice to the end of a period.",
            ),
          ),
          p(t("Preissenkungen gelten automatisch.", "Price reductions apply automatically.")),
        ],
      },
      {
        id: "vermieter",
        title: t("Pflichten der Vermieter", "Landlords' duties"),
        blocks: [
          ul(
            t(
              "Nutze Pairspace nur für Wohnungen, die du wirklich vermieten darfst, als Eigentümer, als Verwalter oder als Hauptmieter mit Erlaubnis zur Untervermietung.",
              "Only use Pairspace for flats you are really allowed to let, as the owner, as the manager or as the main tenant with permission to sublet.",
            ),
            t(
              "Deine Angaben müssen stimmen und aktuell sein, vor allem zu Miete, Größe und Verfügbarkeit. Fotos müssen die echte Wohnung zeigen, und du brauchst die Rechte daran.",
              "Your details must be true and up to date, especially rent, size and availability. Photos must show the real flat, and you need the rights to them.",
            ),
            t(
              "Halte bei der Auswahl das Allgemeine Gleichbehandlungsgesetz (AGG) ein. Du darfst niemanden aus rassistischen Gründen oder wegen der ethnischen Herkunft, des Geschlechts, der Religion oder Weltanschauung, einer Behinderung, des Alters oder der sexuellen Identität benachteiligen, soweit das AGG das verbietet. Das gilt auch, wenn du Bewertungen und Vorschläge aus Pairspace nutzt.",
              "Comply with the German General Equal Treatment Act (AGG) when choosing tenants. You must not discriminate against anyone on grounds of race or ethnic origin, sex, religion or belief, disability, age or sexual identity, to the extent the AGG prohibits this. This also applies when you use ratings and suggestions from Pairspace.",
            ),
            t(
              "Über Pairspace bekommst du personenbezogene Daten der Bewerber: Profile, Bewertungen, Zimmerwünsche und Kontaktdaten. Für deine Nutzung dieser Daten bist du selbst verantwortlich und musst die DSGVO einhalten. Nutze sie nur für die Vermietung dieser Wohnung, gib sie nicht an Dritte weiter und lösche Bewerbungen, sobald du sie dafür nicht mehr brauchst.",
              "Through Pairspace you receive personal data of applicants: profiles, ratings, room choices and contact details. You are responsible for your own use of this data and must comply with the GDPR. Only use it for letting this flat, do not pass it on to third parties and delete applications as soon as you no longer need them for this.",
            ),
            t(
              "Kontaktiere Bewerber nur wegen der Wohnung und schick ihnen keine Werbung.",
              "Only contact applicants about the flat and do not send them advertising.",
            ),
          ),
        ],
      },
      {
        id: "bewerber",
        title: t("Pflichten der Bewerber", "Applicants' duties"),
        blocks: [
          p(t("Für Bewerber ist Pairspace kostenlos.", "Pairspace is free for applicants.")),
          ul(
            t("Dein Profil muss wahr sein. Gib dich nicht als jemand anderes aus.", "Your profile must be truthful. Do not pretend to be someone else."),
            t("Lade nur Fotos von dir selbst hoch, an denen du die Rechte hast.", "Only upload photos of yourself that you have the rights to."),
            t(
              "Bewerte ehrlich und respektvoll. Deine Bewertung ist deine persönliche Einschätzung, wie gut ihr zusammen wohnen könntet.",
              "Rate honestly and respectfully. Your rating is your personal view of how well you could live together.",
            ),
            t(
              "Die Profile der anderen Bewerber siehst du nur, damit du sie einschätzen kannst. Du darfst sie nicht kopieren, speichern, weitergeben oder anders nutzen, auch nicht als Screenshot.",
              "You only see the other applicants' profiles so that you can rate them. You must not copy, store, share or otherwise use them, not even as a screenshot.",
            ),
          ),
        ],
      },
      {
        id: "inhalte",
        title: t("Inhalte und Missbrauch", "Content and misuse"),
        blocks: [
          p(
            t(
              "Für Texte und Fotos, die du einstellst, bist du verantwortlich. Sie dürfen nicht gegen Gesetze verstoßen und keine Rechte anderer verletzen.",
              "You are responsible for the texts and photos you post. They must not break the law or infringe the rights of others.",
            ),
          ),
          p(
            t(
              "Nicht erlaubt sind insbesondere beleidigende, diskriminierende, bedrohende, pornografische oder gewaltverherrlichende Inhalte, Werbung und Spam, Scheinangebote und Versuche, Geld oder Daten zu erschleichen. Nicht erlaubt ist auch, Pairspace technisch zu stören, Schutzmaßnahmen zu umgehen, Daten automatisiert auszulesen oder fremde Konten zu nutzen.",
              "In particular, insulting, discriminatory, threatening or pornographic content, content glorifying violence, advertising and spam, fake listings and attempts to obtain money or data by deception are not allowed. Nor is disrupting Pairspace technically, getting around security measures, scraping data automatically or using other people's accounts.",
            ),
          ),
          p(
            t(
              "Damit wir deine Inhalte speichern und den vorgesehenen Personen zeigen können, räumst du uns ein einfaches, unentgeltliches Recht ein, sie für den Betrieb von Pairspace zu nutzen. Das Recht endet, wenn du die Inhalte löschst.",
              "So that we can store your content and show it to the intended people, you grant us a non-exclusive, royalty-free right to use it for running Pairspace. This right ends when you delete the content.",
            ),
          ),
          p(
            t(
              "Verstößt jemand gegen diese Regeln, können wir Inhalte entfernen, den Link einer Wohnung abschalten oder ein Konto sperren. Wir wählen die mildeste Maßnahme, die ausreicht, und berücksichtigen die berechtigten Interessen aller Beteiligten. Die betroffene Person informieren wir mit Begründung und sagen ihr, wie sie widersprechen kann.",
              "If someone breaks these rules, we can remove content, switch off a flat's link or block an account. We choose the mildest measure that is enough and take the legitimate interests of everyone involved into account. We tell the person affected why and how they can challenge the decision.",
            ),
          ),
          h3(t("Rechtswidrige Inhalte melden", "Reporting illegal content")),
          p(
            t("Hältst du einen Inhalt auf Pairspace für rechtswidrig, schreib an ", "If you think content on Pairspace is illegal, write to "),
            mail,
            t(
              ". Nenne den Link zur Wohnung, beschreibe den Inhalt und erkläre, warum er rechtswidrig ist. Gib deinen Namen und deine Mailadresse an. Wir prüfen jede Meldung zügig, sorgfältig und objektiv und sagen dir, wie wir entschieden haben.",
              ". Include the link to the flat, describe the content and explain why it is illegal. Give your name and email address. We review every report promptly, carefully and objectively and tell you what we decided.",
            ),
          ),
          p(
            t(
              "Zentrale Kontaktstelle für Nutzer und Behörden nach Art. 11 und 12 des Digital Services Act (DSA) ist ",
              "Our single point of contact for users and authorities under Art. 11 and 12 of the Digital Services Act (DSA) is ",
            ),
            mail,
            t(". Du kannst uns auf Deutsch oder Englisch schreiben.", ". You can write to us in German or English."),
          ),
        ],
      },
      {
        id: "verfuegbarkeit",
        title: t("Verfügbarkeit und Änderungen an Pairspace", "Availability and changes to Pairspace"),
        blocks: [
          p(
            t(
              "Wir bemühen uns, dass Pairspace immer erreichbar ist. Eine ununterbrochene Verfügbarkeit können wir nicht zusagen. Wartung, Updates oder Störungen bei Dienstleistern wie Google können zu Unterbrechungen führen.",
              "We do our best to keep Pairspace available at all times. We cannot promise uninterrupted availability. Maintenance, updates or outages at service providers such as Google can cause interruptions.",
            ),
          ),
          p(
            t(
              "Wir entwickeln Pairspace weiter und dürfen es ändern, wenn es dafür einen triftigen Grund gibt, etwa neue Technik, Sicherheit oder eine neue Rechtslage. Für dein Abo entstehen dadurch keine zusätzlichen Kosten. Über wichtige Änderungen informieren wir dich. Schränkt eine Änderung die Nutzung deines Abos mehr als nur unerheblich ein, kannst du das Abo innerhalb von 30 Tagen nach der Information kostenlos beenden. Bezahlte Zeit erstatten wir dir dann anteilig.",
              "We keep developing Pairspace and may change it if there is a valid reason, such as new technology, security or a change in the law. This causes no extra cost for your subscription. We inform you about important changes. If a change restricts the use of your subscription more than just slightly, you can end the subscription free of charge within 30 days of being informed. We then refund paid time pro rata.",
            ),
          ),
          p(t("Deine gesetzlichen Rechte bei Mängeln bleiben unberührt.", "Your statutory rights in case of defects remain unaffected.")),
        ],
      },
      {
        id: "haftung",
        title: t("Haftung", "Liability"),
        blocks: [
          p(
            t(
              "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung des Lebens, des Körpers oder der Gesundheit, nach dem Produkthaftungsgesetz und soweit wir eine Garantie übernommen haben.",
              "We are liable without limitation for intent and gross negligence, for injury to life, body or health, under the Product Liability Act and where we have given a guarantee.",
            ),
          ),
          p(
            t(
              "Bei leichter Fahrlässigkeit haften wir nur, wenn wir eine wesentliche Vertragspflicht verletzen. Das sind Pflichten, die die ordnungsgemäße Durchführung des Vertrags erst möglich machen und auf deren Einhaltung du regelmäßig vertrauen darfst. Die Haftung ist dann auf den vorhersehbaren, vertragstypischen Schaden begrenzt.",
              "For slight negligence, we are only liable if we breach an essential contractual duty. These are duties that make proper performance of the contract possible in the first place and that you may regularly rely on. Liability is then limited to the foreseeable damage typical for this kind of contract.",
            ),
          ),
          p(
            t(
              "Für Inhalte der Nutzer, etwa Angaben zu Wohnungen oder in Profilen, sind die Nutzer selbst verantwortlich. Ob ein Mietvertrag zustande kommt und wie sich Vermieter, Bewerber und Mitbewohner verhalten, liegt nicht in unserer Hand.",
              "Users are themselves responsible for their content, such as details of flats or in profiles. Whether a tenancy comes about and how landlords, applicants and flatmates behave is outside our control.",
            ),
          ),
          p(
            t(
              "Diese Regeln gelten auch für unsere Erfüllungsgehilfen. Zwingende gesetzliche Haftung, etwa nach der DSGVO, bleibt unberührt.",
              "These rules also apply to the people we use to perform the contract. Mandatory statutory liability, for example under the GDPR, remains unaffected.",
            ),
          ),
        ],
      },
      {
        id: "datenschutz",
        title: t("Datenschutz", "Privacy"),
        blocks: [
          p(
            t("Wie wir mit deinen Daten umgehen, steht in der ", "How we handle your data is explained in the "),
            link(t("Datenschutzerklärung", "privacy policy"), "/datenschutz"),
            ".",
          ),
        ],
      },
      {
        id: "aenderungen",
        title: t("Änderungen dieser AGB", "Changes to these terms"),
        blocks: [
          p(
            t(
              "Wir können diese AGB für die Zukunft ändern, wenn es dafür einen sachlichen Grund gibt, etwa neue Funktionen oder eine neue Rechtslage. Wir informieren dich mindestens sechs Wochen vorher per Mail.",
              "We can change these terms for the future if there is an objective reason, such as new features or a change in the law. We inform you by email at least six weeks in advance.",
            ),
          ),
          p(
            t(
              "Für ein laufendes Abo gilt die neue Fassung nur, wenn du zustimmst. Stimmst du nicht zu, gilt die bisherige Fassung weiter, und beide Seiten können das Abo wie oben beschrieben kündigen.",
              "For a running subscription, the new version only applies if you agree. If you do not agree, the previous version continues to apply and both sides can cancel the subscription as described above.",
            ),
          ),
          p(
            t(
              "Für die kostenlose Nutzung gilt die neue Fassung, wenn du Pairspace nach der Information weiter nutzt. Du kannst die kostenlose Nutzung jederzeit beenden.",
              "For free use, the new version applies if you keep using Pairspace after being informed. You can stop the free use at any time.",
            ),
          ),
        ],
      },
      {
        id: "schluss",
        title: t("Schlussbestimmungen", "Final provisions"),
        blocks: [
          p(
            t(
              "Es gilt deutsches Recht. Bist du Verbraucher, gilt das nur, soweit dir dadurch nicht der Schutz zwingender Vorschriften des Staates entzogen wird, in dem du deinen gewöhnlichen Aufenthalt hast.",
              "German law applies. If you are a consumer, this only applies insofar as it does not deprive you of the protection of mandatory provisions of the country where you habitually live.",
            ),
          ),
          p(
            t(
              "Bist du Kaufmann, eine juristische Person des öffentlichen Rechts oder ein öffentlich-rechtliches Sondervermögen, ist Gerichtsstand Berlin.",
              "If you are a merchant, a legal entity under public law or a special fund under public law, the place of jurisdiction is Berlin.",
            ),
          ),
          p(t("Zwingende Vorschriften zum Schutz von Verbrauchern bleiben von diesen AGB immer unberührt.", "Mandatory consumer protection rules always remain unaffected by these terms.")),
          p(
            t(
              "Wir sind weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
              "We are neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board.",
            ),
          ),
          p(t("Ist eine Bestimmung dieser AGB unwirksam, bleiben die übrigen wirksam.", "If any provision of these terms is invalid, the rest remain valid.")),
          p(
            t(
              "Verbindlich ist die deutsche Fassung dieser AGB. Die englische Fassung ist eine unverbindliche Übersetzung.",
              "The German version of these terms is binding. The English version is a non-binding translation.",
            ),
          ),
        ],
      },
    ],
  };
}
