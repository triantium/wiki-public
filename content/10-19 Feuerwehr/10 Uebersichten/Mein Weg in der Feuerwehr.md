---
publish: true
created: 2026-07-17T12:43:29.483Z
modified: 2026-09-24T13:44:53.552Z
---

# Ausbildung in der Feuerwehr

## Grundausbildung

```mermaid
flowchart TD

    A[Eintritt in die Feuerwehr]
    
    STAND[Standortausbildung 6 UE]
    
    UEB[Übungen am Standort 40 UE]

    TM[MTA Basis / Truppmann]
    
    EH[Erste Hilfe Schulung]
    PSNV[PSNV Schulung]
    
    TF[MTA Abschluss / Truppführer]


    FUNK[Sprechfunker]
    AGT[Atemschutzgeräteträger]
    MA[Maschinist]

    GF[Gruppenführer]
    
    
    
    
    EF[Unbeschränkt einsatzfähig]
    EB[Einsatz nur außerhalb des Gefahrenbereichs]
    
    

    A --> STAND
    STAND -->|min. 16 Jahre alt| TM
    
    
    
    TM -->|über 18 Jahre alt| EF
    TM -->|16/17 Jahre alt| EB
    
    
    TM --> UEB
    UEB --> TF
    TM --> FUNK
    FUNK --> TF
    EH --> TF
    PSNV --> TF
    TF --> AGT
    TF --> MA

    TF --> GF

    classDef grund fill:#d4f1f9,stroke:#333;
    classDef technisch fill:#d5f5d5,stroke:#333;
    classDef modul fill:#e5a5d5,stroke:#333;
    classDef fuehrung fill:#ffe6b3,stroke:#333;

    class A,STAND,TM,TF,UEB grund;
    class FUNK,PSNV,EH modul;
    class AGT,MA technisch;
    class GF fuehrung;
```

---

## Lehrgänge im Landkreis

https://www.feuerwehr-ndsob.de/ausbildung/

- MTA - Modulare Truppausbildung (Modul I und II)
- Digitalfunkausbildung
- PSNV-E
- Maschinistenausbildung
- Ausbildung zum Atemschutzgeräteträger
- Schaumausbildung
- Motorsägenausbildung
- Gruppenführerfortbildung  (empfohlen ab ca 2-4 Jahren Einsatzerfahrung)

Anmeldung unter https://mpfeuer-vp.webservices.mpsoft4u.info/neuburgschrobenhausen/ über die Kommandanten und den Jugendwart

## Lehrgänge an der Feuerwehrschule

Lehrgangsplätze an den Feuerwehrschule sind sehr begrenzt, von Interesse für uns ist größtenteils

- Brandhaus
- Gruppenführer
- Gerätewart
- Leiter Atemschutz
- Leiter Feuerwehr
- Aufbaulehrgang für Kommandanten mit Gruppenführerqualifikation (empfohlen ab ca 2-4 Jahren Einsatzerfahrung)

Landkreisplätze: https://www.feuerwehr-ndsob.de/informationen/aktuelles/lehrgangsplatzverteilung-2026/

Angebot: https://www.sfsr.de/lehrgaenge/lehrgangsangebot
Freie Plätze: https://www.bms-fw.bayern.de/Navigation/Public/LastMinute.aspx

Anmeldung über den Kommandanten.

## Selbststudium und Lehrgangsvorbereitung

https://feuerwehr-lernbar.bayern/

<div style="page-break-after: always;">---</div>

## Aktuelle Themen

### Brandwacht Bayern

https://www.brandwacht.bayern.de/

### Atemschutzunfälle

https://www.atemschutzunfaelle.de/

## LFV Bayern

https://www.lfv-bayern.de/aktuelles/

<div style="page-break-after: always;">---</div>

# Verwaltungsvorgänge

## Eintritt

Der Eintritt in den Feuerwehrdienst erfolgt per Handschlag durch den Kommandanten.
siehe [Satzungen und Verodnungen des Marktes Rennertshofen](https://www.rennertshofen.de/Satzungen-und-Verordnungen.n33.html) Feuerwehrsatzung  §4 (Fassung von 1992)
und [BayFwg Art.6](https://www.gesetze-bayern.de/Content/Document/BayFwG-6)

Der Eintritt in den Verein erfolgt über Abgabe des Mitgliedsantrag an den Kassier oder den Vorstands.

## Austritt

// TODO

<div style="page-break-after: always;">---</div>

# Abnahmen

## Aktive

### Leistungsabzeichen Löschen

Die Abnahme des Leistungsabzeichen löschen erfolgt alle 2 Jahre,
wenn eine Gruppe zusammenkommt.

```mermaid
flowchart TD

    A[Eintritt in die Feuerwehr]
    
    LBRONZE[Leistungabzeichen Bronze]
    LSILBER[Leistungabzeichen Silber]
    
    LGOLD[Leistungabzeichen Gold und folgend]
    
    

    TM[Modulare Grundausbildung Zwischenprüfung / Truppmann]
    
    TF[Modulare Grundausbildung Abschluss / Truppführer]

    
    

    A --> |min. 16 Jahre alt| TM
    A --> |min. 16 Jahre alt| LBRONZE
    LBRONZE --> LSILBER
    TM --> LSILBER
    TM --> TF
    TF --> LGOLD
    LSILBER --> LGOLD
    
    

    classDef grund fill:#d4f1f9,stroke:#333;
    classDef technisch fill:#d5f5d5,stroke:#333;
    classDef fuehrung fill:#ffe6b3,stroke:#333;

    class A,B,C grund;
    class D,E,F,G,H technisch;
    class I fuehrung;
```

### Krawattenschieber

Die Leistungsprüfung „Krawattenschieber“ ist eine feuerwehrspezifische Auszeichnung für erfahrene Einsatzkräfte ab 40 Jahren im Landkreis Neuburg-Schrobenhausen. Sie wird als feuerwehrinterne Leistungsprüfung (ähnlich Gold-Rot) von den örtlichen Kreisfeuerwehren abgenommen. \[[1](https://www.feuerwehr-ndsob.de/ausbildung/leistungsprufung/)]

- **Zielgruppe:** Aktive Feuerwehrdienstleistende ab dem Mindestalter von 40 Jahren, die bereits andere Leistungsprüfungen abgeschlossen haben. \[[1](https://www.feuerwehr-ndsob.de/ausbildung/leistungsprufung/)]
- **Voraussetzungen:** Basiert auf der Leistungsprüfung Gold-Rot mit einer Wartezeit von 2 Jahren und erfordert eine Mindestteilnehmeranzahl von 5 Personen. \[[1](https://www.feuerwehr-ndsob.de/ausbildung/leistungsprufung/)]
- **Organisation:** Die Abnahme erfolgt über die [Kreisbrandinspektion Neuburg-Schrobenhausen](https://www.feuerwehr-ndsob.de/ausbildung/leistungsprufung/) durch Schiedsrichter im Landkreis. \[[1](https://www.feuerwehr-ndsob.de/ausbildung/leistungsprufung/)]

## Jugend

### Bayrische Jugendleistungsabzeichen

### Deutsches Jugendleistungsabzeichen

### Jugendflamme

### Wissenstest
