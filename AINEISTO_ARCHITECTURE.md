# Aineisto Data Architecture

## Overview

SocialWise käyttää **Firebase Storagea** kaikille asiakasaineistoille. Kaikki dokumentit tallennetaan raakana markdown-tiedostoina ja parsitaan runtime-aikana client-puolella.

## Data Source

### Firebase Storage (Kaikki dokumentit)

**Sijainti**: `gs://socialwise-c8ddc.firebasestorage.app/Aineisto/`

**Dokumenttityypit**:
- ✅ `LS-ilmoitukset/` - Lastensuojeluilmoitukset
- ✅ `Päätökset/` - Viralliset päätökset
- ✅ `Yhteystiedot/` - Yhteystietodokumentit
- ✅ `PTA/` - Palvelutarpeen arvioinnit
- ⏳ `Asiakassuunnitelmat/` - (Tulossa)

**Ominaisuudet**:
- Raaka markdown-tiedostot
- Haetaan autentikoidusti (`getBytes()`)
- Parsitaan runtime-aikana client-puolella
- CORS-konfiguroitu localhost ja Vercel
- Yhtenäinen arkkitehtuuri kaikille dokumenteille

**Ladataan käyttäen**:
```typescript
import { fetchMarkdownFile } from '@/lib/aineistoStorageService';
const content = await fetchMarkdownFile('PTA/PTA_malliasiakas.md');
```

---

## Parsing Logic

### Runtime Parsing
Kaikki dokumentit parsitaan client-puolella käyttäen `aineistoParser.ts`:

```typescript
// LS-ilmoitukset
export function parseLSNotification(filename: string, markdown: string): LSNotification

// Päätökset (with highlights)
export function parseDecision(filename: string, markdown: string): Decision

// PTA (with automatic highlights)
export function parsePTARecord(filename: string, markdown: string): PTARecord

// Yhteystiedot
export function parseContactInfo(markdown: string): ContactInfo
```

### Highlight Logic

#### Päätökset
Erikoismerkkaukset markdown-tiedostossa:
- `[oleellinen]` - Prosessin kannalta tärkeä tieto
- `[päätös peruste]` - Päätöksen perustelut

**Esimerkki:**
```markdown
[päätös peruste] Koulupsykologi kertoo, että lapsen rajattomuus on ollut tiedossa.
[oleellinen] Lastensuojelun asiakkuus päättyy lastensuojelutarpeen selvityksen valmistuttua.
```

#### PTA
Automaattinen poiminta dokumentin rakenteesta:
1. **Kuormitustekijät:** kentän sisältö
2. **Jatkotoimet terveydenhuollossa:** kentän sisältö
3. **Asiakkaan mielipide** ensimmäinen kohta

**Esimerkki:**
```markdown
**Kuormitustekijät:** alkava murrosikä sekä perheen kriisit
**Jatkotoimet terveydenhuollossa:** varattu lääkäriaika
- Lapsi kokee, ettei tule perheessä riittävästi kuulluksi
```

→ Kaikki kolme poimitaan automaattisesti highlighteiksi

---

## Yhteenveto

| Dokumentti | Lähde | Highlights | Parsing |
|------------|-------|-----------|---------|
| LS-ilmoitukset | Storage | Blockquote (>) | Runtime |
| Päätökset | Storage | `[oleellinen]`, `[päätös peruste]` | Runtime |
| Yhteystiedot | Storage | Ei | Runtime |
| **PTA** | **Storage** | **Automaattinen** | **Runtime** |
| Asiakassuunnitelmat | (Tulossa) | TBD | Runtime |

---

## Local Development

**Paikallinen dokumentaatio**:
- `public/Aineisto/DATA_PARSING_DOKUMENTAATIO.md` - Haetaan suoraan public-kansiosta
- `public/Aineisto/PTA_malliasiakas.md` - Käytetään vain migrationissa

---

## Migration Scripts

### Storage Migration
```bash
npx tsx data_preparation/migrate-aineisto-to-storage.ts
```
Migroi: LS-ilmoitukset, Päätökset, Yhteystiedot → Firebase Storage

### Firestore Migration
```bash
npx tsx data_preparation/migrate-pta-to-firestore.ts
```
Migroi: PTA_malliasiakas.md → Firestore `crm_pta_documents`

---

## Authentication

**Sekä Storage että Firestore vaativat autentikoinnin:**

```typescript
// Firebase Auth (automaattinen)
import { auth } from '@/lib/firebase';
const user = auth.currentUser; // Must be logged in

// Storage rules
match /Aineisto/{allPaths=**} {
  allow read: if request.auth != null;
}

// Firestore rules
match /crm_pta_documents/{document} {
  allow read: if request.auth != null;
}
```

---

## Future Considerations

### Kun lisäät uusia dokumenttityyppejä:

**Kysymykset**:
1. Onko dokumentti monimutkainen/strukturoitu?
2. Tarvitaanko nopeaa hakua/suodatusta?
3. Päivittyykö dokumentti usein?

**Valitse**:
- **Storage** → Jos dokumentti on yksinkertainen ja staattinen
- **Firestore** → Jos dokumentti on monimutkainen tai vaatii hakua

---

## Summary

✅ **LS-ilmoitukset, Päätökset, Yhteystiedot** → Firebase Storage
✅ **PTA** → Firestore
✅ **DATA_PARSING_DOKUMENTAATIO.md** → Local `/public/Aineisto/`
