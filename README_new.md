# SocialWise

AI-avusteinen järjestelmä sosiaalityön dokumentointiin ja päätöksentekoon.

## ✨ Ominaisuudet

### 🤖 AI-Avustaja Sosiaalityöhön
- **LLM-mallit**: Grok-4-Fast, Google Gemini 2.5 Flash, Gemini 2.5 Flash Lite, Gemini 2.5 Pro
- **Modulaarinen prompt-järjestelmä**: Neljä erillistä prompt-tyyppiä eri käyttötapauksiin admin-editorien kautta
- **Kielituki**: Suomi ja englanti

### 📊 Asiakastietojen Hallinta
- **Asiakastietokanta**: Asiakastiedot ja palveluhistoria Firestore-kokoelmissa
- **Haku ja suodatus**: Reaaliaikainen haku kaikkien kenttien perusteella
- **Palveluhistoria**: Näytä asiakkaan täydellinen palveluhistoria
- **Kontekstin lataus**: Lataa asiakastiedot suoraan AI-chat-kontekstiin

### 📝 Dokumentoinnin Tuki
- **AI-avusteinen kirjoittaminen**: Rakenteelliset mallit eri tapauksille
- **Erikoistuneet promptit**: Neljä erilaista prompt-tyyppiä eri käyttötapauksiin admin-editorien kautta

### ⚙️ Järjestelmäpromptien Hallinta
- **Neljä prompt-editoria**: Jokaisella prompt-tyypillä oma editori admin-sivulla
- **Identtinen toiminnallisuus**: Kaikki editorit tarjoavat samat ominaisuudet
- **Versiointi**: Aikaleima-pohjainen versioiden seuranta
- **Historia**: Tarkastele ja palauta aiempia versioita
- **Järjestelmäkohtaiset asetukset**: Prod/test, LLM-malli ja temperature ovat järjestelmäkohtaisia
- **Yksi dokumentti per prompt**: Asetukset tallennetaan samaan Firestore-dokumenttiin prompt-tekstin kanssa
- **Testi/tuotanto**: Jokaisessa promptissa valinta tiedosto- tai Firestore-version välillä

#### Promptien Tyypit

Järjestelmässä on neljä erilaista promptia, joista jokaisella on oma editori admin-sivulla. Kaikki editorit tarjoavat identtisen toiminnallisuuden:

1. **Chatbot Prompt** - Editori: `/admin/chatbot-prompt`
   - **Default**: `/public/chatbot_prompt.md`
   - **Järjestelmäasetukset**: `chatbot_prompt` collection (sisältää prompt-tekstin, LLM-mallin, temperature ja prod/test valinnan)
   - **Editori**: Valinta testi promptin (tiedosto) tai tuotantoversion (Firestore) välillä
   - **Käyttö**: AI-avustajan yleinen käyttäytyminen ja konteksti

2. **Asiakasyhteenvedon Prompt** - Editori: `/admin/client-summary-prompt`
   - **Default**: `/public/client_summary_prompt.md`
   - **Järjestelmäasetukset**: `client_summary_prompt` collection (sisältää prompt-tekstin, LLM-mallin, temperature ja prod/test valinnan)
   - **Käyttö**: Asiakkaan ylätason yhteenvetojen generointi (mainProblems, timePeriod)
   - **Output**: JSON-muotoinen yhteenveto asiakkaan pääongelmista ja aikavälistä

3. **PTA Yhteenvedon Prompt** - Editori: `/admin/pta-prompt`
   - **Default**: `/public/PTA_prompt.md`
   - **Järjestelmäasetukset**: `PTA_prompt` collection (sisältää prompt-tekstin, LLM-mallin, temperature ja prod/test valinnan)
   - **Käyttö**: Palvelutarpeen arviointi -kirjausten yhteenvetojen generointi
   - **Output**: PTA-kirjausten tiivistetyt yhteenvedot ja AI-ohjaukset

4. **Lastensuojeluilmoitusten Yhteenveto Prompt** - Editori: `/admin/ilmoitus-prompt`
   - **Default**: `/public/ilmoitus_summary_prompt.md`
   - **Järjestelmäasetukset**: `ilmoitus_summary_prompt` collection (sisältää prompt-tekstin, LLM-mallin, temperature ja prod/test valinnan)
   - **Käyttö**: Lastensuojeluilmoitusten yhteenvetojen generointi
   - **Output**: Ilmoitusten priorisointi ja yhteenveto tärkeimmistä tiedoista

## 🛠️ Teknologiat

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui -komponentit
- **AI-integraatio**: OpenRouter API (Grok, Gemini)
- **Tietokanta**: Firebase Firestore
  - `chatbot_prompt`: Chatbot prompt ja järjestelmäasetukset (LLM-malli, temperature, prod/test)
  - `client_summary_prompt`: Asiakasyhteenveto prompt ja järjestelmäasetukset
  - `PTA_prompt`: PTA-yhteenveto prompt ja järjestelmäasetukset
  - `ilmoitus_summary_prompt`: Ilmoitusyhteenveto prompt ja järjestelmäasetukset
- **Autentikointi**: Firebase Auth
- **Tilanhallinta**: React Hooks
- **Tiedostojen käsittely**: PDF, Excel, CSV, Word -tuki
- **Prompt-tiedostot**: Staattiset default-promptit `/public/` -hakemistossa
- **Järjestelmäasetukset**: Prod/test, LLM-malli ja temperature tallennetaan Firestoreen
- **Admin-käyttöliittymä**: Neljä identtistä prompt-editoria järjestelmänvalvojille

## 📦 Asennus

1. **Kloonaa repositorio**
```bash
git clone https://github.com/mikkovaltonen/socialwise
cd SocialWise
```

2. **Asenna riippuvuudet**
```bash
npm install
```

3. **Konfiguroi ympäristömuuttujat**

Luo `.env` tiedosto projektin juureen ja määrittele seuraavat muuttujat:

```env
# OpenRouter API LLM-malleille (vaaditaan asiakasyhteenvetojen generointiin)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Firebase-konfiguraatio (vaaditaan promptien versiointiin ja autentikointiin)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**Huom**: Firebase-konfiguraatio vaaditaan järjestelmäpromptien versioinnille ja käyttäjien autentikoinnille. Prompt-tiedostot `/public/` -hakemistossa toimivat default-arvoina.

4. **Käynnistä kehityspalvelin**
```bash
npm run dev
```

Sovellus käynnistyy osoitteessa `http://localhost:8080`

## 🚀 Käyttö

### Autentikointi
Sovellus käyttää Firebase-autentikointia. Ota yhteyttä järjestelmänvalvojaan käyttäjätunnusten saamiseksi.

### Ydintoiminnallisuus

1. **AI-Avusteinen Dokumentointi**:
   - Käytä AI:ta sosiaalityön dokumentoinnin tukena
   - Vähennä kirjaamistyötä jopa 80%
   - Varmista lakisääteinen vaatimustenmukaisuus

2. **Asiakastietojen Hallinta**:
   - Hae ja suodata asiakkaita reaaliaikaisesti
   - Tarkastele palveluhistoriaa
   - Lataa asiakastiedot AI-chat-kontekstiin

3. **Päätöksenteon Tuki**:
    - **AI-ohjaus**: Saa AI-pohjaisia suosituksia lakiviittauksineen
    - **Laadunvarmistus**: Automaattiset tarkistukset täydellisyydelle ja tarkkuudelle
    - **Ammattituki**: Perehdytys ja laillisuuden varmistus

4. **Järjestelmäpromptien Hallinta** (`/admin`):
    - Neljä identtistä prompt-editoria eri prompt-tyypeille
    - Järjestelmäkohtaiset asetukset: prod/test valinta, LLM-malli, temperature
    - Valitse sopiva LLM-malli (Grok-4-Fast, Gemini 2.5 Flash, Gemini 2.5 Flash Lite, Gemini 2.5 Pro)
    - Tarkastele ja palauta aiempia versioita
    - Testaa promptteja tiedostoista ennen tuotantoon siirtämistä
    - Modulaarinen järjestelmä mahdollistaa erikoistuneen toiminnan järjestelmäkohtaisilla asetuksilla
    - Kaikki editorit sijaitsevat `/admin` -sivulla
    - Asetukset tallennetaan samaan dokumenttiin prompt-tekstin kanssa

### Pikavalinnat

Sovellus tarjoaa valmiita ominaisuuksia:
- Asiakastietojen analysointi ja segmentointi
- Dokumentointimallien optimointi
- Päätöksenteon tuki lakiviittauksineen
- Palvelun laadun parantaminen

## 📁 Projektirakenne

```
src/
├── components/          # React-komponentit
│   ├── ui/             # Perus UI-komponentit (shadcn/ui)
│   ├── MarketingPlannerChat.tsx    # AI-chat-käyttöliittymä
│   ├── SystemPromptManager.tsx     # Järjestelmäpromptien hallinta
│   ├── StockManagementTable.tsx    # Asiakastietojen hallinta
│   ├── DocumentAnalysis.tsx        # Dokumenttien analysointi
│   └── LoginForm.tsx               # Kirjautumislomake
├── lib/                # Palvelut ja apufunktiot
│   ├── firestoreService.ts         # Firestore-tietokantapalvelut
│   ├── systemPromptService.ts      # Järjestelmäpromptien palvelut
│   ├── sessionService.ts           # Istunnon hallinta
│   └── utils.ts                    # Apufunktiot
├── pages/              # Sivukomponentit
│   ├── Index.tsx       # Etusivu
│   ├── Workbench.tsx   # Pääsovellus
│   └── Admin.tsx       # Admin-paneeli (neljä identtistä prompt-editoria)
├── types/              # TypeScript-tyyppimäärittelyt
public/
├── chatbot_prompt.md           # Chatbot prompt - default (AI-avustajan käyttäytyminen)
├── client_summary_prompt.md    # Asiakasyhteenvedon prompt - default (JSON output)
├── PTA_prompt.md               # PTA yhteenvedon prompt - default (kirjausten yhteenveto)
└── ilmoitus_summary_prompt.md  # Ilmoitusyhteenvedon prompt - default (ilmoitusten priorisointi)
```
Firestore Collections:
- `chatbot_prompt`: Chatbot prompt + järjestelmäasetukset (LLM-malli, temperature, prod/test)
- `client_summary_prompt`: Asiakasyhteenveto prompt + järjestelmäasetukset
- `PTA_prompt`: PTA prompt + järjestelmäasetukset
- `ilmoitus_summary_prompt`: Ilmoitus prompt + järjestelmäasetukset

## 💻 Kehitys

### Skriptit

```bash
# Kehityspalvelin
npm run dev

# Tuotantoversio
npm run build

# Esikatsele tuotantoversiota
npm run preview

# Tyyppitarkistus
npx tsc --noEmit

# Linting
npm run lint
```

### Prompt-tiedostojen sijainti

Järjestelmän prompt-tiedostot sijaitsevat `/public/` -hakemistossa:
- `chatbot_prompt.md` - AI-avustajan yleinen käyttäytyminen
- `client_summary_prompt.md` - Asiakasyhteenvetojen generointi
- `PTA_prompt.md` - PTA-kirjausten yhteenvetojen generointi
- `ilmoitus_summary_prompt.md` - Lastensuojeluilmoitusten yhteenvetojen generointi

Muokatut versiot tallennetaan Firestore-kokoelmiin järjestelmäpromptien hallinnasta admin-sivulla.

### OpenRouter API-avaimen hankkiminen

1. Rekisteröidy [OpenRouter](https://openrouter.ai/)
2. Luo uusi API-avain
3. Lisää se `.env`-tiedostoon muuttujana `VITE_OPENROUTER_API_KEY`
4. OpenRouter mahdollistaa pääsyn useisiin LLM-malleihin (Grok, Gemini, jne.)

### Uusien ominaisuuksien lisääminen

1. Luo uudet komponentit hakemistoon `src/components/`
2. Lisää TypeScript-tyypit hakemistoon `src/types/`
3. Testaa toiminnallisuus paikallisesti
4. Varmista, että TypeScript-tarkistukset menevät läpi

### Promptien muokkaaminen

Prompt-tiedostot sijaitsevat `/public/` -hakemistossa:
- `chatbot_prompt.md` - AI-avustajan yleinen käyttäytyminen
- `client_summary_prompt.md` - Asiakasyhteenvetojen generointi
- `PTA_prompt.md` - PTA-kirjausten yhteenvetojen generointi
- `ilmoitus_summary_prompt.md` - Lastensuojeluilmoitusten yhteenvetojen generointi

Muokatut promptit voidaan tallentaa Firestoreen järjestelmäpromptien hallinnasta admin-sivulla (`/admin`).

## ⚙️ Järjestelmävaatimukset

- Node.js 18+
- npm 8+
- Moderni selain (Chrome, Firefox, Safari, Edge)
- OpenRouter API-avain (LLM-mallien käyttöön)
- Firebase-projekti (Firestore ja Auth promptien sekä järjestelmäasetusten tallentamiseen)

## 🔒 Tietoturva

- Ei kovakoodattuja salaisuuksia tai API-avaimia koodipohjassa
- Ympäristömuuttujat kaikille arkaluonteisille konfiguraatioille
- Firebase Auth käyttäjien autentikointiin
- Kaikki API-avaimet ladataan ajonaikaisesta ympäristöstä
- Prompt-tiedostot tallennetaan staattisesti `/public/` -hakemistoon
- Muokatut prompt-versiot ja järjestelmäasetukset tallennetaan turvallisesti Firestoreen admin-käyttöliittymän kautta

## 🔧 Prompt-järjestelmä

SocialWise käyttää modulaarista prompt-järjestelmää, jossa neljä erilaista prompt-tyyppiä mahdollistaa erikoistuneen toiminnan eri käyttötapauksissa. Jokaisella prompt-tyypillä on oma identtinen editori admin-sivulla (`/admin`):

### Arkkitehtuuri
- **Staattiset defaultit**: `/public/` -hakemistossa sijaitsevat peruspromptit
- **Dynaamiset versiot**: Firestore-kokoelmissa tallennetut muokatut versiot ja järjestelmäasetukset
- **Versiointi**: Aikaleima-pohjainen versioiden seuranta
- **Järjestelmäkohtaiset asetukset**: Prod/test, LLM-malli ja temperature tallennetaan samaan dokumenttiin
- **Testi/tuotanto**: Jokaisessa promptissa mahdollisuus valita tiedosto- tai tietokantaversio
- **Admin-käyttöliittymä**: Neljä identtistä prompt-editoria `/admin` -sivulla

### Prompt-tyypit
1. **Chatbot Prompt**: AI-avustajan yleinen käyttäytyminen ja konteksti
2. **Asiakasyhteenveto**: Asiakkaan pääongelmien ja aikavälin tunnistaminen (järjestelmäasetukset)
3. **PTA-yhteenveto**: Palveluntarpeen arvioinnin kirjausten tiivistys (järjestelmäasetukset)
4. **Ilmoitusyhteenveto**: Lastensuojeluilmoitusten priorisointi ja yhteenveto (järjestelmäasetukset)

Tämä järjestelmä mahdollistaa joustavan prompt-hallinnan järjestelmäkohtaisilla asetuksilla. Kaikki prompt-muokkaukset ja asetusten muutokset tapahtuvat identtisten editorien kautta admin-käyttöliittymässä, ja muutokset vaikuttavat kaikkiin järjestelmän käyttäjiin.

## 📄 Lisenssi

MIT

## 🤝 Osallistuminen

1. Forkkaa repositorio
2. Luo feature-haara
3. Tee muutoksesi
4. Varmista, että testit menevät läpi ja koodi on oikein muotoiltu
5. Lähetä pull request

## 💬 Tuki

Kysymyksiä SocialWisen toiminnallisuudesta tai teknisestä toteutuksesta? Ota yhteyttä:
- **Tarja Meronen**: puh. 0400413129
- **Sähköposti**: info@socialwise.fi

Tai luo issue repositoriossa.