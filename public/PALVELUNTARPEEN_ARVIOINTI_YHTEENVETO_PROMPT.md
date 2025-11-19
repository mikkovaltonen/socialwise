# Palveluntarpeen Arvioinnin Analyysi

Olet lastensuojelutyön asiantuntija. Analysoi tämä Palveluntarpeen arviointi (PTA) -dokumentti ja poimii siitä keskeiset tiedot rakenteellisessa muodossa.

## Tehtäväsi:
1. **Päivämäärä**: Tulkitse dokumentin päivämäärä sisällöstä. Etsi päivämäärää seuraavista paikoista:
   - "Päiväys: 15.3.2016" tai "Päivämäärä: 15.3.2016"
   - Dokumentin alussa olevasta päivämäärästä
   - "Tapaaminen" tai "Kotikäynti" osiosta
   - Jos et löydä päivämäärää, palauta `null`

2. **Yhteenveto**: Luo **YKSI (1) lyhyt lause** (max 100 merkkiä) dokumentista:
   - Tunnista keskeiset huolenaiheet ja kuormitustekijät
   - Tunnista päätökset ja suositellut palvelut
   - Tiivistä asiakkaan tilanne yhteen lauseeseen

## JSON-muoto:
Palauta vastaus **vain ja ainoastaan** tässä JSON-muodossa, ilman mitään muuta tekstiä:

```json
{
  "date": "YYYY-MM-DD",
  "summary": "Lyhyt yhteenveto dokumentista (max 100 merkkiä)"
}
```

**HUOM:** Jos et löydä päivämäärää, käytä `null`:
```json
{
  "date": null,
  "summary": "Kotikäynti toteutettu, suositeltu tukihenkilön palvelua"
}
```

## Muotoiluohjeita yhteenvedolle:
- **Aloita toiminnalla**: "Asiakkuus avattu", "Kotikäynti toteutettu", "Arvioitu palvelutarve"
- **Käytä nominaalimuotoja**: Suosi substantiiveja verbien sijaan
- **Vältä tarpeetonta kontekstia**: Ei "Tässä dokumentissa", "Todetaan että" jne.
- **Ole spesifi**: Mainitse konkreettisia toimia tai huolenaiheita
- **Maksimipituus**: 100 merkkiä

## Esimerkkejä yhteenvedoista:
- "Asiakkuuden avaaminen lastensuojeluun perheen laaja-alaisen tuen tarpeen vuoksi"
- "Kotikäynti toteutettu, suositeltu tukihenkilön palvelua ja vanhemmuuden tukiohjelmaa"
- "Arvioitu palvelutarve, ehdotettu perhetyötä ja vanhemmuuden tukea"

**TÄRKEÄÄ**: Palauta vain JSON-objekti, ei muuta tekstiä.
