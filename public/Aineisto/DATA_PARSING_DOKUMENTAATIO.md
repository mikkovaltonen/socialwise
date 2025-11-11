# Aineisto Data Parsing - Looginen Kuvaus

**Versio:** 2.0
**Päivitetty:** 10.11.2025

## Yleiskuvaus

SocialWise lukee lastensuojelun asiakastietoja suoraan markdown-tiedostoista, kun sovellus käynnistyy. Jokainen "laatikko" käyttöliittymässä hakee tietonsa omasta kansiostaan `/public/Aineisto/` -hakemistossa.

**Perusperiaate:** Näytetään vain sitä, mitä lähdedokumentissa lukee - ei lisätä mitään oletuksia tai arvauksia.

---

## 1. Lastensuojeluilmoitukset

### Mistä data tulee?
- **Kansio:** `/public/Aineisto/Lastensuojeluilmoitukset/`
- **Tiedostot:** `Lapsi_1_2018_04_26_Lastensuojeluilmoitus.md`

### Mitä poimitaan?
1. **Päivämäärä** → Luetaan tiedoston nimestä (2018_04_26 = 26.4.2018)
2. **Ilmoittajan ammatti** → Koulukuraattori, Opettaja, Naapuri...
3. **Korostetut kohdat** → Ne kohdat, jotka on merkitty dokumentissa erikseen

### Miten näytetään?
- Lista ilmoituksista aikajärjestyksessä (uusin ensin)
- Klikkaamalla voi lukea koko ilmoituksen

---

## 2. Asiakaskirjaukset

### Mistä data tulee?
**EI OMAA KANSIOTA** - Tämä on yhteenvetosivu, joka kerää tiedot kaikista muista kansioista:
- LS-ilmoituksista
- Päätöksistä
- Palveluntarvearviointi-kirjauksista
- Asiakassuunnitelmista

### Mitä tehdään?
Luodaan yksi yhtenäinen aikajana kaikista tapahtumista. Jokaisesta tapahtumasta tehdään yksi bullet-merkintä:

**Esimerkki:**
- `• 26.4.2018 - Koulukuraattori tehnyt lastensuojeluilmoituksen. Isä kertoi, että...`
- `• 15.5.2018 - Asiakkuus avattu. Avattu lastensuojelun asiakkuus...`

### Miten näytetään?
- Yksinkertainen lista, yksi rivi per tapahtuma
- Päivämäärä **lihavoituna**, sitten lyhyt kuvaus
- Järjestetty päivämäärän mukaan (uusin ensin)

---

## 3. Päätökset

### Mistä data tulee?
- **Kansio:** `/public/Aineisto/Päätökset/`
- **Tiedostot:** `Lapsi_1_2025_03_22_päätös.md`

### Mitä poimitaan?

#### 1. **Päivämäärä**
- Ensisijaisesti: RATKAISU/PÄÄTÖS osiosta (esim. "Ratkaisu voimassa **22.3.2025** alkaen")
- Toissijaisesti: Tiedoston nimestä (2025_03_22 = 22.3.2025)

#### 2. **Päätöksen tyyppi** (tunnistetaan automaattisesti tekstistä)
- "Asiakkuus päättyy" → **Asiakkuus päättyy**
- "Ryhdytään selvitykseen" → **Selvitys aloitetaan**
- "Asiakkuus avataan" → **Asiakkuuden avaaminen**
- "Kiireellinen sijoitus" → **Kiireellinen sijoitus**
- "Avohuollon tukitoimi" → **Avohuollon tukitoimi**
- Muut → **Muu päätös**

#### 3. **Tiivistelmä**
- Ensisijaisesti: Ensimmäinen `[oleellinen]` merkitty lause
- Toissijaisesti: RATKAISU/PÄÄTÖS osiosta (max 200 merkkiä)
- Fallback: "Päätös lastensuojelun asiakkuudesta"

**Esimerkki:**
```markdown
[oleellinen] Lastensuojelun asiakkuus päättyy lastensuojelutarpeen selvityksen valmistuttua tähän keskusteluun **22.3.2025**.
```
→ Tiivistelmäksi tulee: "Lastensuojelun asiakkuus päättyy lastensuojelutarpeen selvityksen valmistuttua tähän keskusteluun"

#### 4. **Lakipykälä** (tunnistetaan automaattisesti)
- Etsii tekstistä: "LS 27 §" tai "Lastensuojelulaki § 27"
- Muutetaan muotoon: **Lastensuojelulaki § 27**

#### 5. **Korostukset (Highlights)**
Poimii kaksi erikoismerkintää:
- **`[oleellinen]`** = Prosessin kannalta tärkeä tieto
- **`[päätös peruste]`** = Päätöksen perustelut

**Esimerkki:**
```markdown
[päätös peruste] Koulupsykologi kertoo, että lapsen rajattomuus on ollut tiedossa jo ennen kuin aloitti koulun.
[päätös peruste] Lastenpsykiatria on mukana hoidossa ja neuropsykologi myös arvioinut tilannetta.
[oleellinen] Lastensuojelun asiakkuus päättyy lastensuojelutarpeen selvityksen valmistuttua.
```

UI:ssa näytetään maksimissaan 2 ensimmäistä korostusta, ja merkintä "+X muuta korostusta..." jos lisää löytyy.

### Miten näytetään?
- Lista päätöksistä aikajärjestyksessä (uusin ensin)
- Näkyy päivämäärä, päätöksen tyyppi ja lyhyt yhteenveto
- Lakipykälä esitetään jos löytyy
- Korostukset näytetään sinisellä taustavärillä kursivoidulla tekstillä
- Klikkaamalla päätöksen voi lukea kokonaan dialogissa

**UI-esimerkki:**
```
┌─────────────────────────────────────┐
│ Päätökset                      1 kpl│
├─────────────────────────────────────┤
│ 22.03.2025 - Asiakkuus päättyy     │
│                                     │
│ Lastensuojelun asiakkuus päättyy   │
│ lastensuojelutarpeen selvityksen...│
│                                     │
│ Lastensuojelulaki § 27              │
│                                     │
│ 💡 Koulupsykologi kertoo, että...  │
│ 💡 Lastenpsykiatria on mukana...   │
│                                [→]  │
└─────────────────────────────────────┘
```

### Parsing-logiikka
- **Funktio:** `parseDecision()` tiedostossa `/src/lib/aineistoParser.ts`
- **Highlights:** `extractDecisionHighlights()` poimii `[oleellinen]` ja `[päätös peruste]` merkinnät
- **Älykkään tunnistus:** Päätöksen tyyppi tunnistetaan automaattisesti sisällöstä regex-haulla
- **Vercel-yhteensopiva:** Kovakoodattu tiedostolista `loadDecisions()` funktiossa

---

## 4. Yhteystiedot

### Mistä data tulee?
- **Kansio:** `/public/Aineisto/Yhteystiedot/`
- **Tiedosto:** `Lapsi_1_yhteystiedot.md`

### Mitä poimitaan?
- Lapsen puhelinnumero
- Huoltajien yhteystiedot (puhelin, sähköposti)
- Vastuusosiaalityöntekijän yhteystiedot
- Opettajan yhteystiedot

### Tiedostoformaatti
Yksinkertainen lista:
```
- Lapsi 1: +358401234567
- Huoltajat:
  - Puh. +358401234567
  - Sähköposti: huoltaja@example.com
- Vastu sosiaalityöntekijä: +358401234567
```

### Miten näytetään?
- Strukturoitu lista yhteystiedoista
- Ryhmiteltynä roolien mukaan (Lapsi, Huoltajat, Ammattilaiset)

---

## 5. Palveluntarvearviointi

### Mistä data tulee?
- **Kansio:** `/public/Aineisto/Palveluntarvearviointi/`
- **Tiedostot:** `Lapsi_1_2018_05_20_PTA_Kotikäynti.md`

### Mitä poimitaan?
1. **Päivämäärä** → Tiedoston nimestä
2. **Tapahtuman tyyppi** → Kotikäynti, Puhelu, Neuvottelu...
3. **Osallistujat** → Ketkä olivat paikalla
4. **Yhteenveto** → Mitä tapaamisessa käsiteltiin
5. **Toimenpiteet** → Mitä sovittiin tehtäväksi

### Miten näytetään?
- Lista tapahtumista aikajärjestyksessä
- Näkyy tapahtuman tyyppi ja osallistujat
- Klikkaamalla voi lukea koko kirjauksen

---

## 6. Asiakassuunnitelmat

### Mistä data tulee?
- **Kansio:** `/public/Aineisto/Asiakassuunnitelmat/`
- **Tiedostot:** `Lapsi_1_2018_06_15_Asiakassuunnitelma.md`

### Mitä poimitaan?
1. **Aloituspäivä** → Tiedoston nimestä
2. **Palvelutyyppi** → Esim. "Perhetyö", "Tukihenkilö"
3. **Status** → Aktiivinen, Päättynyt, Keskeytetty
4. **Tavoitteet** → Mitä suunnitelmalla tavoitellaan
5. **Tulokset** → Miten suunnitelma on edistynyt

### Miten näytetään?
- Lista palveluista aikajärjestyksessä
- Näkyy palvelun tyyppi ja status
- Aktiiviset suunnitelmat korostettu

---

## Yhteenveto - Kaikki laatikot yhdessä

| Laatikko | Mistä? | Mitä näytetään? |
|----------|--------|-----------------|
| **Lastensuojeluilmoitukset** | `/LS-ilmoitukset/*.md` | Lista ilmoituksista, ilmoittajan ammatti, blockquote-korostukset |
| **Asiakaskirjaukset** | Kaikista muista | Yhtenäinen aikajana kaikista tapahtumista |
| **Päätökset** | `/Päätökset/*.md` | Lista päätöksistä, tyyppi, lakipykälä, `[oleellinen]` ja `[päätös peruste]` korostukset |
| **Yhteystiedot** | `/Yhteystiedot/Lapsi_*.md` | Yhteystiedot ryhmiteltynä roolien mukaan |
| **Palveluntarvearviointi** | `/PTA/*.md` | Lista tapaamisista, osallistujat, toimenpiteet |
| **Asiakassuunnitelmat** | `/Asiakassuunnitelmat/*.md` | Lista palveluista, status, tavoitteet |

---

## Tärkeimmät periaatteet

### ✅ Näytetään vain lähdedata
Jos jotain tietoa ei ole lähdedokumentissa, sitä ei näytetä sovelluksessa.

**Esimerkki:**
- Jos ilmoituksessa ei ole prioriteettia → Ei näytetä prioriteettia
- Jos yhteystiedoissa ei ole sähköpostia → Ei näytetä tyhjää kenttää

### ✅ Päivämäärät tiedostonimestä
Kaikki päivämäärät luetaan tiedoston nimestä muodossa `YYYY_MM_DD`, jotta ne ovat aina oikein.

**Esimerkki:**
- `Lapsi_1_2018_04_26_Lastensuojeluilmoitus.md` → 26.4.2018

### ✅ Aikajärjestys
Kaikki listat näytetään aikajärjestyksessä, **uusin ensin**.

### ✅ Asiakaskohtaiset tiedostot
Yhteystiedot ovat asiakaskohtaisia: `Lapsi_1_yhteystiedot.md`, `Lapsi_2_yhteystiedot.md` jne.

---

## Miten data ladataan?

1. **Sovellus käynnistyy** → LSPortal-komponentti latautuu
2. **Ladataan kaikki kategoriat kerralla** → Lastensuojeluilmoitukset, Päätökset, Palveluntarvearviointi, Yhteystiedot, Asiakassuunnitelmat
3. **Luodaan Asiakaskirjaukset** → Yhdistetään kaikki tapahtumat yhdeksi aikajanaksi
4. **Näytetään UI** → Jokainen laatikko saa omat tietonsa

**Tärkeää:** Kaikki ladataan **samaan aikaan** (rinnakkain), jotta lataus on nopeaa.

---

## Jos tiedostoa ei ole

### Tyhjä kansio
Jos kansiossa ei ole yhtään tiedostoa, laatikko näyttää:
- `0 kpl` - Ei vielä tapahtumia

### Puuttuva kenttä
Jos tiedostossa on pakollinen kenttä puuttuu (esim. ilmoittajan ammatti), käytetään oletusarvoa:
- Ilmoittajan ammatti → "Ilmoittaja"
- Päivämäärä → Tämä päivä

### Virheellinen tiedosto
Jos tiedosto ei ole oikeassa muodossa, se ohitetaan ja jatketaan seuraavaan tiedostoon.

---

**Toteutus:** `/src/lib/aineistoParser.ts`
**UI-komponentit:** `/src/components/ls-portal/*`
**Pääkomponentti:** `/src/components/LSPortal.tsx`
