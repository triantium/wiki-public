---
publish: true
created: 2026-09-24T11:22:40.938Z
modified: 2026-09-24T13:21:53.862Z
---

![[10-19 Feuerwehr/17 Wissen/assets/stationszeichen.png]]

# TLDR

In Bayern erfolgt die Kilometer- und Standortbeschilderung auf Bundesfern- und Staatsstraßen über sogenannte **Stationszeichen**. ==Diese kleinen Schilder stehen im Abstand von 500 Metern am rechten Fahrbahnrand und zeigen die Straßenbezeichnung, den Straßenabschnitt sowie die Stations-Kilometrierung an==. Sie dienen vor allem der schnellen Orientierung für Rettungsdienste bei Notfällen. \[[1](https://www.gesetze-bayern.de/Content/Document/BayVV_97842), [2](https://de.wikipedia.org/wiki/Stationszeichen), [3](https://www.code-knacker.de/stationszeichen.htm)]

Aufbau der Stationszeichen

- **Abstand:** Alle 500 Meter (0,5 km) am Fahrbahnrand.

- **Inhalt:** Angaben zu Straße, Abschnitt und Station (Meter bzw. Kilometer ab Beginn des Abschnitts).

- **Nutzen:** Exakte Standortermittlung für Polizei, Rettungsdienste und Straßenmeistereien. \[[1](https://www.gesetze-bayern.de/Content/Document/BayVV_97842), [2](https://www.code-knacker.de/stationszeichen.htm)]

Besonderheiten nach Straßenart

- **Bundesautobahnen:** Haben eigene blau-weiße Kilometer- bzw. Notrufsäulentafeln am rechten Rand mit Angabe des Kilometers und der Fahrtrichtung zur nächsten Anschlussstelle.

- **Bundes- und Staatsstraßen:** Nutzen die netzweit einheitlichen kleinen Stationszeichen (Staatsstraßen gekennzeichnet mit dem Kürzel „St“). \[[1](https://blog.lapid.de/regelungen-bundesstrasse-landstrasse-kreisstrasse), [2](https://www.gesetze-bayern.de/Content/Document/BayVV_97842)]

- **Digitale Erfassung:** Über das [Bayerische Straßeninformationssystem (BAYSIS)](https://www.baysis.bayern.de/internet/strasseninformationen/index.html) sind Stationsdaten und das klassifizierte Straßennetz digital erfasst. \[[1](https://www.baysis.bayern.de/internet/strasseninformationen/index.html), [2](https://www.geoportal.de/info/ee6d0195-474a-432f-9046-18bd243a7e2c)]

# Straßeninformationen

Kernstück von BAYSIS bildet das Straßennetz mit seiner Geometrie. Auf dieses Netz sind Informationen aus verschiedensten Fachbereichen referenziert. Dadurch können die Informationen miteinander verknüpft, gemeinsam ausgewertet und dargestellt werden.

![](https://www.baysis.bayern.de/media/internet/strasseninformationen/resize_620_410_on_cb58e55eb0ad38df8e08532e9151f534_strasseninfo1.png)

© LBD - Straßeninformationssysteme

## Straßenklassen

Als Informationssystem der Bayerischen Straßenbauverwaltung umfasst BAYSIS folgende Straßenklassen:

- Bundesautobahnen
- Bundesstraßen
- Staatsstraßen
- Kreisstraßen

Die Gesamtheit dieser Straßenklassen bilden das überörtliche Straßennetz, das in BAYSIS in Form von grafischen Linienzügen mit Fachattributen abgebildet wird. Die Straßenklasse spiegelt dabei die administrativen Zuständigkeiten wieder.

|Straßenklasse|Abkürzung|Beispiel|Baulastträger|Straßenbaubehörden|
|---|---|---|---|---|
|Bundesautobahn|BAB|A 9|- Bund|- Die Autobahn GmbH|
|Bundesstraße|B|B 2|- Bund<br>- Gemeinden (in Ortsdurchfahrten über 80.000 Einwohner)|- Staatliche Bauämter<br>- Gemeinden (in Ortsdurchfahrten über 80.000 Einwohner)|
|Staatsstraßen|St|St 2209|- Freistaat Bayern<br>- Gemeinden (in Ortsdurchfahrten über 25.000 Einwohner)|- Staatliche Bauämter<br>- Gemeinden (in Ortsdurchfahrten über 25.000 Einwohner)|
|Kreisstraße|K|K TÖL 5|- Landkreise bzw. kreisfreie Städte<br>- Gemeinden (in Ortsdurchfahrten über 25.000 Einwohner)|- Landkreise bzw. kreisfreie Städte (Verwaltung kann auf Staatliche Bauämter übertragen werden)<br>- Gemeinden (in Ortsdurchfahrten über 25.000 Einwohner)|

## Stationszeichen

Die Grundvoraussetzung, um mit Straßendaten zu arbeiten, ist ihre Lokalisierung. D. h. es muss exakt bekannt sein, auf welche Stelle vor Ort sich eine Angabe bezieht. Dazu ist ein Ordnungssystem erforderlich, mit dem jede Stelle auf der Straße eine eindeutige Bezeichnung erhält.

Die Stationierung ist das Ordnungssystem der überörtlichen Straßen in Bayern. Sie ist in der ASB bundeseinheitlich definiert.

Die Straßen werden in Abschnitte unterteilt. Diese sind durch Netzknoten (NK) an Kreuzungen und Einmündungen von überörtlichen Straßen begrenzt. Die Abschnitte werden mit Nummern bezeichnet. Diese sind entlang der festgelegten Straßenrichtung in der Regel in 20er-Schritten aufsteigend.

Die Station gibt an, wie weit ein Standort vom Beginn des Abschnittes entfernt ist. Sie beginnt in jedem Abschnitt bei Null und wird in der Maßeinheit Kilometer angegeben. Die Stationierung verläuft wie die Abschnittsnummer immer entlang der festgelegten Straßenrichtung aufsteigend.

Ein Punkt auf der Straße wird somit durch folgende drei Angaben eindeutig bezeichnet: Straße, Abschnitt und Station. Die Stationszeichen vor Ort enthalten genau diese drei Angaben.

## Lokalisierung eines Punktes - Schema

![[10-19 Feuerwehr/17 Wissen/assets/stationszeichen-lokalisierung.png]]
