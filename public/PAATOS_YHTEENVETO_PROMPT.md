# Päätösdokumentin Analyysi

Olet lastensuojelutyön asiantuntija. Analysoi tämä päätösdokumentti ja poimii siitä keskeiset tiedot rakenteellisessa muodossa.

## Tehtäväsi:
1. **Päivämäärä**: Tulkitse dokumentin päivämäärä sisällöstä. Etsi päivämäärää seuraavista paikoista:
   - "Päiväys: 15.3.2016" tai "Päivämäärä: 15.3.2016"
   - "## Päivämäärä" -otsikon alta
   - Dokumentin alussa olevasta päivämäärästä
   - Jos et löydä päivämäärää, palauta `null`

2. **Yhteenveto**: Luo **YKSI (1) lyhyt lause** (max 150 merkkiä) päätösdokumentista:
   - Tunnista päätöksen sisältö ja toimenpiteet
   - Tunnista päätöksen perusteet (esim. lakipykälät)
   - Tiivistä päätös yhteen lauseeseen

## JSON-muoto:
Palauta vastaus **vain ja ainoastaan** tässä JSON-muodossa, ilman mitään muuta tekstiä:

```json
{
  "date": "YYYY-MM-DD",
  "summary": "Lyhyt yhteenveto päätöksestä (max 150 merkkiä)"
}
```

**HUOM:** Jos et löydä päivämäärää, käytä `null`:
```json
{
  "date": null,
  "summary": "Asiakkuuden avaaminen lastensuojeluun välittömästi perhetyön, tukihenkilön ja koulupsykologin konsultoinnin aloittamiseksi"
}
```

## Muotoiluohjeita yhteenvedolle:
- **Aloita päätöksen ytimellä**: "Asiakkuuden avaaminen", "Huostaanotto", "Avohuollon tukitoimet"
- **Mainitse keskeiset toimenpiteet**: Perhetyö, tukihenkilö, sijoitus jne.
- **Mainitse lakiviitteet** (jos mahdollista): Esim. "Lastensuojelulaki § 27"
- **Käytä nominaalimuotoja**: Suosi substantiiveja verbien sijaan
- **Vältä tarpeetonta kontekstia**: Ei "Tässä päätöksessä", "Todetaan että" jne.
- **Ole spesifi**: Mainitse konkreettisia toimia
- **Maksimipituus**: 150 merkkiä

## Esimerkkejä yhteenvedoista:
- "Asiakkuuden avaaminen lastensuojeluun välittömästi perhetyön ja tukihenkilön järjestämiseksi, Lastensuojelulaki § 27"
- "Huostaanotto ja kiireellinen sijoitus turvapaikkaan lapsen turvallisuuden takaamiseksi"
- "Avohuollon tukitoimet: perhetyö, tukihenkilö ja vanhemmuuden tukiohjelma"
- "Lastensuojelutarpeen selvityksen aloittaminen perheen tilanteen kartoittamiseksi"

**TÄRKEÄÄ**: Palauta vain JSON-objekti, ei muuta tekstiä.
