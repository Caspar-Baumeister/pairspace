/**
 * Widerrufsbelehrung with the Muster-Widerrufsformular. The notice and the
 * form follow the statutory models (Anlage 1 and 2 zu Art. 246a EGBGB, as of
 * 19 June 2026 with the online withdrawal function), which is why they use
 * "Sie". The English text follows the model in Annex I of Directive
 * 2011/83/EU and is a courtesy translation.
 *
 * Rendered by src/app/[lang]/widerruf and, in full, by the contract
 * confirmation mail.
 */
import { box, h3, lines, link, p, small, translator, type LegalDoc, type Locale } from "./doc";
import { OPERATOR, WITHDRAW_PATH } from "./operator";
import { BASIC } from "./plan";

/** Name, address and email of the trader, exactly as the models ask for them. */
export function traderLine(locale: Locale): string {
  const t = translator(locale);
  return `${OPERATOR.name}, ${OPERATOR.street}, ${OPERATOR.city}, ${OPERATOR.country[locale]}, ${t("E-Mail", "email")}: ${OPERATOR.email}`;
}

export function widerrufDoc(locale: Locale): LegalDoc {
  const t = translator(locale);
  const trader = traderLine(locale);
  const days = BASIC.trialDays;
  const online = link(`joinpairspace.com${locale === "en" ? "/en" : ""}${WITHDRAW_PATH}`, WITHDRAW_PATH);

  return {
    title: t("Widerrufsbelehrung", "Right of withdrawal"),
    lead: t(
      "Schließt du als Verbraucher ein Abo bei Pairspace ab, kannst du den Vertrag innerhalb von 14 Tagen widerrufen. Weiter unten steht die gesetzliche Belehrung. Weil sie dem amtlichen Muster folgt, steht sie in der Sie-Form.",
      "If you take out a Pairspace subscription as a consumer, you can withdraw from the contract within 14 days. The statutory notice follows below.",
    ),
    numbered: false,
    sections: [
      {
        id: "kurz",
        title: t("Kurz erklärt: Testphase und Widerruf", "In short: free trial and withdrawal"),
        blocks: [
          p(
            t(
              `Die Frist beginnt mit dem Abschluss des Abos, also mit dem Start der Testphase. Die ${days} Testtage sind immer kostenlos. Widerrufst du in dieser Zeit, zahlst du nichts.`,
              `The period starts when you take out the subscription, which is when the free trial starts. The ${days} trial days are always free. If you withdraw during that time, you pay nothing.`,
            ),
          ),
          p(
            t(
              "Widerrufst du später, aber noch innerhalb der 14 Tage, bekommst du dein Geld zurück, abzüglich eines anteiligen Betrags für die bezahlten Tage bis zu deinem Widerruf. Das gilt, weil du beim Abschluss verlangt hast, dass Pairspace sofort startet.",
              "If you withdraw later but still within the 14 days, you get your money back minus a proportionate amount for the paid days up to your withdrawal. This is because you asked for Pairspace to start right away when you subscribed.",
            ),
          ),
          p(
            t("Am schnellsten widerrufst du online über ", "The quickest way to withdraw is online with "),
            link(t("„Vertrag widerrufen“", "“Withdraw from contract”"), WITHDRAW_PATH),
            t(
              ", ohne Anmeldung. Den Eingang bestätigen wir dir sofort per Mail.",
              ", without signing in. We confirm receipt by email straight away.",
            ),
          ),
          p(
            t(
              "Nach den 14 Tagen kannst du nicht mehr widerrufen. Kündigen kannst du aber jederzeit zum Ende des laufenden Zeitraums.",
              "After the 14 days you can no longer withdraw. You can still cancel at any time, effective at the end of the current period.",
            ),
          ),
        ],
      },
      {
        id: "belehrung",
        title: t("Widerrufsbelehrung", "Withdrawal notice"),
        blocks: [
          box(
            h3(t("Widerrufsrecht", "Right of withdrawal")),
            p(
              t(
                "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
                "You have the right to withdraw from this contract within 14 days without giving any reason.",
              ),
            ),
            p(
              t(
                "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.",
                "The withdrawal period will expire after 14 days from the day of the conclusion of the contract.",
              ),
            ),
            p(
              t(
                `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${trader}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.`,
                `To exercise the right of withdrawal, you must inform us (${trader}) of your decision to withdraw from this contract by an unequivocal statement (e.g. a letter sent by post or an email). You may use the attached model withdrawal form, but it is not obligatory.`,
              ),
            ),
            p(
              t("Sie können Ihr Widerrufsrecht auch online unter ", "You can also exercise your right of withdrawal online at "),
              online,
              t(
                " ausüben. Wenn Sie diese Online-Funktion nutzen, übermitteln wir Ihnen auf einem dauerhaften Datenträger (z. B. durch eine E-Mail) unverzüglich eine Eingangsbestätigung mit Informationen zum Inhalt der Widerrufserklärung sowie dem Datum und der Uhrzeit ihres Eingangs.",
                ". If you use this online function, we will send you without delay, on a durable medium (e.g. by email), an acknowledgement of receipt with information on the content of your withdrawal and the date and time it was received.",
              ),
            ),
            p(
              t(
                "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
                "To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.",
              ),
            ),
            h3(t("Folgen des Widerrufs", "Effects of withdrawal")),
            p(
              t(
                "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
                "If you withdraw from this contract, we shall reimburse to you all payments received from you, including the costs of delivery (with the exception of the supplementary costs resulting from your choice of a type of delivery other than the least expensive type of standard delivery offered by us), without undue delay and in any event not later than 14 days from the day on which we are informed about your decision to withdraw from this contract. We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of such reimbursement.",
              ),
            ),
            p(
              t(
                "Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.",
                "If you requested to begin the performance of services during the withdrawal period, you shall pay us an amount which is in proportion to what has been provided until you have communicated us your withdrawal from this contract, in comparison with the full coverage of the contract.",
              ),
            ),
            small(t("Ende der Widerrufsbelehrung", "End of the withdrawal notice")),
          ),
        ],
      },
      {
        id: "formular",
        title: t("Muster-Widerrufsformular", "Model withdrawal form"),
        blocks: [
          box(
            p(
              t(
                "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)",
                "(Complete and return this form only if you wish to withdraw from the contract.)",
              ),
            ),
            p(t(`An ${trader}:`, `To ${trader}:`)),
            p(
              t(
                "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)",
                "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*)/for the provision of the following service (*)",
              ),
            ),
            lines(
              t("Bestellt am (*)/erhalten am (*)", "Ordered on (*)/received on (*)"),
              t("Name des/der Verbraucher(s)", "Name of consumer(s)"),
              t("Anschrift des/der Verbraucher(s)", "Address of consumer(s)"),
              t("Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)", "Signature of consumer(s) (only if this form is notified on paper)"),
              t("Datum", "Date"),
            ),
            small(t("(*) Unzutreffendes streichen.", "(*) Delete as appropriate.")),
          ),
        ],
      },
    ],
  };
}
