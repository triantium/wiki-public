---
publish: true
created: 2026-08-11T09:16:58.432Z
modified: 2026-09-24T13:43:57.966Z
tags:
  - übung
---

# Vorbereitung vor der Umseztung

- [ ] Hydrant vorbereitet
  - [ ] Fast ganz aufgedreht
  - [ ] Blinddeckel leicht zu lösen
- [ ] Schlauchtragekörbe mit 2 Schläuchen befüllt
- [ ] Fahrzeug
  - [ ] Fenster geschlossen
  - [ ] Rolläden geschlossen
  - [ ] Halterungen frei von Hindernissen
  - [ ] Warndreiecke aus der Verpackung

# Löschübung

## Aufgaben der Trupps

### Angriffstrupp

Setzt den Verteiler und rüstet sich mit Tragekorb, Licht, Strahlrohr aus.

Weil nun ein Schnellangriffverteiler verwendet wird, gibt er nun "Wasser Marsch" an den Maschinisten

Löschaufbau 1.Rohr

### Wassertrupp

Aufbau der Leitung vom Oberflurhydranten zum Fahrzeug
Aufbau der Leitung vom Fahrzeug zum Verteiler

Löschaufbau 2.Rohr

### Schlauchtrupp

Sichern der Einsatzstelle (Warndreieck und Blinklicht)
Verteiler bedienen für Angriffstrupp und Wassertrupp

Löschaufbau 3.Rohr

### Machinist

Fahrzeug sichern (Warnblinker, Blaulicht) und Pumpe bedienen

### Melder

Beim Gruppenführer bleiben und den Verteiler für den Schlauchtrupp bedienen.

### Gruppenführer

Befehle geben und schön ausstehen.

## Befehle

### Gruppenführer

Brand eines Nebengebäudes,
keine Menschen und Tiere in Gefahr
Wasserentnahmestelle aus Oberflurhydrant hinterm Feuerwehrhaus
Lage des Verteilers an die markierte Stelle”
„Schlauchtrupp
zum Absichern der Einsatzstelle
mit Warndreiecken und Warnleuchten
je 30 m vor dem Löschfahrzeug und
dem Oberflurhydranten“
„Zum Einsatz fertig!“

### Angriffstrupp

wiederholt "Zum Einsatz fertig"

> Angriffstrupp
> zum Umspritzen des **linken** Eimers
> mit dem **1**. Rohr
> zur **linken** markierten Linie
> über den Platz
> vor!

### Wassertrupp

> Wassertrupp
> zum Umspritzen des **rechten** Eimers
> mit dem **2**. Rohr
> zur **rechten** markierten Linie
> über den Platz
> vor!

### Schlauchtrupp

> Schlauchtrupp
> zum Umspritzen des **mittleren** Eimers
> mit dem **3**. Rohr
> zur **mittleren** markierten Linie
> über den Platz
> vor!

## Ablaufplan löschen

```mermaid
sequenceDiagram
    participant GF as Gruppenführer
    participant AT as Angriffstrupp
    participant WT as Wassertrupp
    participant ST as Schlauchtrupp
    participant Me as Melder
    participant Ma as Maschinist

    GF->>AT: "Brand Nebengebäude..."

    AT->>GF: "Zum Einsatz fertig"
    WT->>AT: Wartet auf "Zum Einsatz fertig"
    ST->>AT: Wartet auf "Zum Einsatz fertig"

	AT->>AT: Rüstet sich aus und setzt den Verteiler
	AT->>Ma: "Wasser Marsch"
    AT->>GF: "Angriffstrupp einsatzbereit!"
    GF->>AT: "Angriffstrupp zum umspritzen..."
    AT->>GF: "Angriffstrupp zum umspritzen..."

	WT->>WT: Baut Wasserversorgung vom Hydranten zur Pumpe auf
    Ma->>Ma: Startet Motor / nimmt Pumpe in Betrieb
    WT->>GF: Stellt sich am Verteiler bereit
    ST->>ST: Stellt Warndreieck und Warnleuchten auf
    ST->>ST: Stellt sich am Verteiler bereit und bedient diesen
    

    AT->>AT: Leitung am Verteiler ankuppeln
    AT->>AT: Leitung in Buchten verlegen
    AT->>AT: Hohlstrahlrohr ankuppeln

   
    AT->>ST: "1. Rohr Wasser marsch"
    ST->>AT: Öffnet das 1. Rohr
    AT->>AT: Umspritzen des Eimers
    AT->>GF: "Angriffstrupp Befehl ausgeführt"
    

   
    WT->>GF: "Wassertrupp einsatzbereit!"
	GF->>WT: "Wassertrupp zum umspritzen..."
    AT->>WT: "Wassertrupp zum umspritzen..."
    WT->>WT: Baut auf.
    WT->>ST: "2. Rohr Wasser marsch"
    ST->>WT: Öffnet das 2. Rohr
    WT->>WT: Umspritzen des Eimers
    WT->>GF: "Wassertrupp Befehl ausgeführt"
    
    ST->>GF: "Schlauchtrupp einsatzbereit!"
	GF->>ST: "Schlauchtrupp zum umspritzen..."
    AT->>ST: "Schlauchtrupp zum umspritzen..."
    
    ST->>ST: Schlauchleitung verlegen
    ST->>ST: Hohlstrahlrohr ankuppeln

    GF->>Me: "Melder, bedien den Verteiler"
    Me->>Me: Bedient den Verteiler

    ST->>Me: "3. Rohr Wasser marsch"
    Me->>ST: Öffnet das 3. Rohr
    ST->>ST: Umspritzen des Eimers
    ST->>GF: "Schlauchtrupp Befehl ausgeführt"

    Ma->>Ma: "Motor aus"

    GF->>AT: "Angriffstrupp Rohr zurück!"
    GF->>WT: "Wassertrupp Rohr zurück!"
    GF->>ST: "Schlauchtrupp Rohr zurück!"

    AT->>Me: "1. Rohr Wasser halt"
    WT->>Me: "2. Rohr Wasser halt"
    ST->>Me: "3. Rohr Wasser halt"

    AT->>AT: C-Schläuche abkuppeln
    WT->>WT: C-Schläuche abkuppeln
    ST->>ST: C-Schläuche abkuppeln

    AT->>AT: Entwässern
    WT->>WT: Entwässern
    ST->>ST: Entwässern

    AT->>AT: Geräte übersichtlich ablegen
    WT->>WT: Geräte übersichtlich ablegen
    ST->>ST: Geräte übersichtlich ablegen

    GF->>AT: "Zum Abmarsch fertig"
    GF->>WT: "Zum Abmarsch fertig"
    GF->>ST: "Zum Abmarsch fertig"

    WT->>GF: "Wasser halt!"
    AT->>AT: Gemeinsam abbauen
    WT->>WT: Gemeinsam abbauen
    ST->>ST: Gemeinsam abbauen
    Me->>Me: Geräte verladen
    Ma->>Ma: Geräte verladen
```

# Zusatzaufgaben

| Stufe     | Aufgabe                                   |
| --------- | ----------------------------------------- |
| 3(Gold)   | Gerätekunde                               |
| 4(G-Blau) | Erste Hilfe                               |
| 5(G-Grün) | Erkennen von Gefahrgut und Hinweiszeichen |
| 6(G-Rot)  | Testfragen                                |

# Knoten und Stichen

|               | Knoten                     | Zeit |
| ------------- | -------------------------- | ---- |
| Angriffstrupp | Rettungsknoten             | 40 s |
| Wassertrupp   | Halbmastwurf an Haltegurt  | 15 s |
| Schlauchtrupp | C-Strahlrohr zum aufziehen | 15 s |
| Maschinist    | Zimmermannschlag           | 15 s |
| Melder        | Mastwurf mit Spierenstich  | 15 s |
| Gruppenführer | Fragenkatalog              |      |
