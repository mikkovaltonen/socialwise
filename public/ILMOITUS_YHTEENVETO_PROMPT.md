# Lastensuojeluilmoituksen Analyysi

Olet lastensuojelutyön asiantuntija. Analysoi tämä lastensuojeluilmoitus ja poimii siitä keskeiset tiedot rakenteellisessa muodossa.

## Tehtäväsi:
1. **Päivämäärä**: Tulkitse ilmoituksen päivämäärä dokumentin sisällöstä. **TÄRKEÄÄ: Etsi päivämäärä DOKUMENTIN ALUSSA** (ensimmäiset 500 merkkiä):
   - **ENSISIJAISESTI**: Etsi "Päiväys: 3.8.2016" tai "Päivämäärä: 3.8.2016" -kenttä dokumentin alussa
   - **KRIITTISTÄ**: Käytä ENSIMMÄISTÄ löytyvää päivämäärää, älä etsi muualta
   - Muunna päivämäärä aina YYYY-MM-DD muotoon (esim. "3.8.2016" → "2016-08-03")
   - Hyväksyttäviä muotoja dokumentissa: "DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"
   - Jos et löydä päivämäärää dokumentin alusta, palauta `null`

2. **Ilmoittaja**: Tunnista ilmoittajan ammatti/asema dokumentin sisällöstä:
   - Etsi "ILMOITUKSEN TEKIJÄ" osiosta "Ammatti/asema" -kenttää
   - Tai "Ammatti:" kentästä
   - Käytä lyhyttä muotoa (esim. "Opettaja" eikä "Luokanopettaja, Koivikon koulu")

3. **Yhteenveto**: Anna ytimekäs yhteenveto (max 100 merkkiä) ilmoituksen tärkeimmästä perusteesta.

4. **Ilmoituksen perusta**: Tiivistä ilmoituksen perusta/syy dokumentista:
   - Etsi "ILMOITUKSEN SYY" tai "ILMOITUKSEN PERUSTE" -osiosta keskeisin sisältö
   - Tiivistä olennaiset asiat selkeästi (max 300 merkkiä)
   - Jos ei löydy erillistä osiota, tiivistä perustelut dokumentin pääsisällöstä
   - Keskity keskeisiin huolenaiheisiin ja faktaoihin

5. **Kiireellisyys**: Arvioi ilmoituksen kiireellisyys sisällön perusteella:
   - **"kriittinen"**: Välitön vaara (väkivalta, vakava kaltoinkohtelu, uhka lapsen turvallisuudelle)
   - **"kiireellinen"**: Vaatii nopeaa toimintaa (päihteet, huoli terveydestä, lastensuojelutarpeen selvitys)
   - **"normaali"**: Tavanomainen lastensuojeluilmoitus (koulunkäynti, perhetilanne, tuen tarve)
   - **"ei_kiireellinen"**: Lievä huoli tai ennaltaehkäisevä ilmoitus

## JSON-muoto:
Palauta vastaus **vain ja ainoastaan** tässä JSON-muodossa, ilman mitään muuta tekstiä:

```json
{
  "date": "YYYY-MM-DD",
  "reporter": "ilmoittajan ammatti tai asema",
  "summary": "Lyhyt yhteenveto ilmoituksen perusteesta (max 100 merkkiä)",
  "reason": "Tiivistetty kuvaus ilmoituksen perusteesta (max 300 merkkiä)",
  "urgency": "kriittinen"
}
```

**HUOM:** Jos et löydä päivämäärää, käytä `null`:
```json
{
  "date": null,
  "reporter": "Opettaja",
  "summary": "Lapsen ahdistus ja perheen konfliktit",
  "reason": "Lapsi on osoittanut viime viikkoina voimakasta ahdistusta ja pelkoa. Kotona on ollut riitoja vanhempien välillä. Lapsi on kertonut koulupsykologille pelkäävänsä kotiin menoa.",
  "urgency": "normaali"
}
```

## Esimerkkejä:

**Esimerkki 1 - Kriittinen:**
```json
{
  "date": "2016-08-03",
  "reporter": "Opettaja",
  "summary": "Perheväkivalta ja lapsen välitön vaarassa oleminen",
  "reason": "Lapsi kertoi opettajalle kotona tapahtuvasta fyysisestä väkivallasta. Lapsella näkyviä mustelmia käsivarsissa. Lapsi pelkää kotiin menoa ja on pyytänyt apua.",
  "urgency": "kriittinen"
}
```

**Esimerkki 2 - Normaali:**
```json
{
  "date": "2015-11-20",
  "reporter": "Koulupsykologi",
  "summary": "Koulunkäymättömyys ja oppimisvaikeudet",
  "reason": "Lapsi poissa koulusta useita päiviä ilman pätevää syytä. Oppimisvaikeudet pahenemassa ja lapsi vaikuttaa väsyneeltä. Perheen tilanne haasteellinen.",
  "urgency": "normaali"
}
```

**Esimerkki 3 - Kiireellinen:**
```json
{
  "date": "2017-03-15",
  "reporter": "Sairaanhoitaja",
  "summary": "Vanhempien päihteiden käyttö ja huoli lapsen turvallisuudesta",
  "reason": "Terveydenhoitaja havainnut vanhempien päihteiden käytön merkkejä kotikäynnillä. Lapsen hoito ja hygienia puutteellisia. Kotiolot eivät turvalliset lapselle.",
  "urgency": "kiireellinen"
}
```

**TÄRKEÄÄ**: Palauta vain JSON-objekti, ei muuta tekstiä.