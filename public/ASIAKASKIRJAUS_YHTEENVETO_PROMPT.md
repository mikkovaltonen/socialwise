# Asiakaskirjauksen Analyysi

Olet lastensuojelutyön asiantuntija. Analysoi tämä asiakaskirjaus-dokumentti ja poimii siitä keskeiset tiedot rakenteellisessa muodossa.

## Tehtäväsi:
1. **Päivämäärä**: Tulkitse dokumentin päivämäärä sisällöstä. Etsi päivämäärää seuraavista paikoista:
   - "Päiväys: 15.3.2016" tai "Päivämäärä: 15.3.2016"
   - Dokumentin alussa olevasta päivämäärästä
   - "Tapaaminen" tai "Kotikäynti" osiosta
   - Jos et löydä päivämäärää, palauta `null`

2. **Yhteenveto**: Luo **YKSI (1) lyhyt lause** (max 100 merkkiä) asiakaskirjauksesta:
   - Tunnista keskeiset aiheet ja tapahtumat
   - Tunnista suunnitellut jatkotoimet
   - Tiivistä kontakti yhteen lauseeseen

## JSON-muoto:
Palauta vastaus **vain ja ainoastaan** tässä JSON-muodossa, ilman mitään muuta tekstiä:

```json
{
  "date": "YYYY-MM-DD",
  "summary": "Lyhyt yhteenveto asiakaskirjauksesta (max 100 merkkiä)"
}
```

**HUOM:** Jos et löydä päivämäärää, käytä `null`:
```json
{
  "date": null,
  "summary": "Kotikäynti, keskusteltu koulunkäynnistä ja harrastuksista"
}
```

## Muotoiluohjeita yhteenvedolle:
- **Aloita toiminnalla**: "Kotikäynti", "Puhelinkeskustelu", "Tapaaminen toimistolla"
- **Käytä nominaalimuotoja**: Suosi substantiiveja verbien sijaan
- **Vältä tarpeetonta kontekstia**: Ei "Tässä dokumentissa", "Todetaan että" jne.
- **Ole spesifi**: Mainitse konkreettisia aiheita tai toimia
- **Maksimipituus**: 100 merkkiä

## Esimerkkejä yhteenvedoista:
- "Kotikäynti, keskusteltu koulunkäynnistä ja harrastuksista"
- "Puhelinkeskustelu huoltajan kanssa, sovittu seuraava tapaaminen"
- "Tapaaminen toimistolla, kartoitettu perheen tuen tarve"
- "Verkostotapaaminen, suunniteltu yhteistyötä koulun kanssa"

**TÄRKEÄÄ**: Palauta vain JSON-objekti, ei muuta tekstiä.
