# Matching: wie Pairspace die beste WG findet

Code: `src/lib/matching.ts`, geprüft mit `npm run test:matching` gegen Brute Force.

## 1. Eingaben

Jede Bewerberin, jeder Bewerber gibt zwei Dinge ab:

- **Bewertungen** aller anderen auf fünf Stufen.
- **Zimmerwünsche** als Reihenfolge, Gleichstände erlaubt (gespeichert als Rang, zwei Favoriten von drei ergeben 1, 1, 3).

## 2. Vom Votum zum Paargewicht

| Stufe | Wert u |
| --- | --- |
| Auf keinen Fall | 0 (Veto) |
| Schlecht | 0,25 |
| Mittel | 0,5 |
| Gut | 0,75 |
| Unbedingt | 1 |

Fehlt eine Bewertung (zum Beispiel weil jemand später dazukam), zählt sie neutral mit 0,5 und senkt dafür die Sicherheit (siehe unten).

Für jedes Paar i, j:

```
w(i, j) = √( u(i→j) · u(j→i) )
```

Das geometrische Mittel belohnt Gegenseitigkeit: Gut und Gut ergibt 0,75, Unbedingt und Schlecht nur 0,5. Ein Veto in einer Richtung sperrt das Paar komplett.

So entsteht ein gewichteter, ungerichteter Graph. Im Graph-View ziehen sich Paare mit w > 0,5 per Feder an (stärker und kürzer, je höher w), alle anderen stoßen sich ab, Vetos am stärksten. Dadurch bilden sich die Cluster von selbst.

## 3. Punkte für eine Gruppe

Für eine Gruppe G mit k Personen (k = freie Zimmer):

```
Harmonie  H(G) = ½ · Durchschnitt aller w in G  +  ½ · kleinstes w in G
Zimmer    R(G) = beste Zimmerverteilung, durchschnittliche Zufriedenheit
Punkte    S(G) = 100 · (0,75 · H + 0,25 · R)
```

- Der Durchschnitt misst, wie gut die Gruppe insgesamt harmoniert, das Minimum schützt vor einem einzigen schlechten Verhältnis ("eine WG ist nur so gut wie ihr schwierigstes Paar").
- Zimmerzufriedenheit einer Person mit m Zimmern: `(m − Rang) / (m − 1)`, also 1 für den Favoriten und 0 für das letzte Zimmer.
- Die Zimmer verteilt der **Hungarian Algorithmus** (Kuhn Munkres) optimal: er maximiert die Summe der Zufriedenheit über alle Zuordnungen, in O(k³).
- Enthält G ein Veto, wird G nie vorgeschlagen.
- **Sicherheit** = Anteil der vorhandenen Bewertungen innerhalb der Gruppe (k · (k − 1) Richtungen). Sie fließt nicht in die Punkte ein, sondern zeigt, wie belastbar die Zahl ist.

## 4. Die beste Gruppe finden

Gesucht ist die Gruppe mit maximalem S(G), ein Maximum Weight k Subgraph Problem (NP schwer im Allgemeinen). Bei WG Größen ist es trotzdem schnell:

- **Exakt mit Branch and Bound**, solange es höchstens 400 000 mögliche Gruppen gibt (zum Beispiel 30 Bewerber für 4 Zimmer: 27 405 Gruppen, 25 ms). Unfertige Gruppen werden verworfen, sobald selbst perfekte restliche Paare und perfekte Zimmer die aktuelle Top Liste nicht mehr erreichen können, Vetos schneiden sofort ab.
- **Lokale Suche** darüber: gierig von jeder Person aus aufbauen, dann so lange Mitglieder tauschen, wie es besser wird. Im Test trifft sie bei 16 Bewerbern und 4 Zimmern immer das exakte Optimum, 60 Bewerber für 5 Zimmer dauern 130 ms.
- **Beste Gruppe mit Person X**: dieselbe Suche, X ist fest gesetzt.

## 5. Cluster im Graph

Die farbigen Ringe sind natürliche Cluster, gefunden mit dem lokalen Verschiebeschritt von **Louvain** (Modularitätsoptimierung) auf dem positiven Teil der Gewichte `max(0, 2 · (w − 0,5))`. Wer ein Veto gegen jemanden im Cluster hat, darf nicht hinein. Cluster haben keine feste Größe, sie zeigen Lager. Die Liste "Beste Gruppen" ist die eigentliche Empfehlung.

## 6. Stellschrauben

In `src/lib/matching.ts`:

- `VOTE_UTILITY`: Werte der fünf Stufen.
- `HARMONY_WEIGHT` (0,75): wie viel Menschen gegenüber Zimmern zählen.
- Die ½ und ½ in der Harmonie: Gewicht von Durchschnitt und schwächstem Paar.
- `EXACT_LIMIT`: ab wann die lokale Suche übernimmt.
