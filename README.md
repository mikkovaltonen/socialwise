# SocialWise

**Sosiaalityön teknologiakumppanisi** - AI-avusteinen SAAS-alusta sosiaalityöntekijöille. SocialWise yhdistää ihmisen asiantuntemuksen ja tekoälyn parantaakseen palvelun laatua, vähentääkseen kirjaamistyötä ja vahvistaakseen oikeusturvaa ja yhdenvertaisuutta sosiaalityössä.

## 🎯 Visio

"Ihminen ja tekoäly - yhdessä voimme onnistua"

- 80% työhön liittyvästä kirjaamisesta helpottuu
- Aikaa jää enemmän asiakkaille
- Ammattiin perehdytys ja laillisuuden varmistus sujuvaa
- Palveluun pääsy nopeutuu - huoli helpottuu
- Oikeusturva ja yhdenvertaisuus vahvistuu
- Vaikuttavuus paranee

## 💡 Arvot AI-kehityksessä

- **Tietoturva** - Luotettavat AI-teknologiat ja tietoturvallisuuden osaajat
- **Käyttäjälähtöisyys** - Sosiaalityön sisällön tuntemus
- **Luotettavuus** - CE-merkintä hakuprosessissa
- **Eettisyys** - Vastuullinen AI-kehitys
- **Inspiroidu ja uudistu** - Jatkuva kehitys ja oppiminen

## ✨ Ominaisuudet

### 🤖 AI-Avustaja Sosiaalityöhön
- **LLM-mallit**: Grok-4-Fast, Google Gemini 2.5 Flash, Gemini 2.5 Pro
- **Dokumentoinnin tuki**: 80% vähennys kirjaamistyöhön
- **Lakisääteinen ohjaus**: Ammattiin perehdytys ja laillisuuden varmistus
- **Päätöksenteon tuki**: AI-pohjaiset suositukset lakiviittauksineen
- **Kielituki**: Suomi ja englanti

### 📊 Asiakastietojen Hallinta
- **Asiakastietokanta**: Asiakastiedot ja palveluhistoria
- **Haku ja suodatus**: Reaaliaikainen haku kaikkien kenttien perusteella
- **Palveluhistoria**: Näytä asiakkaan täydellinen palveluhistoria
- **Kontekstin lataus**: Lataa asiakastiedot suoraan AI-chattiin

### 📝 Dokumentoinnin Tuki
- **AI-avusteinen kirjoittaminen**: Nopea ja laadukas dokumentointi
- **Lakisääteinen vaatimustenmukaisuus**: Varmista sosiaalityön lainsäädännön noudattaminen
- **Tapausmuistiinpanot**: Rakenteelliset mallit eri tapauksille
- **Laadunvarmistus**: Automaattiset täydellisyys- ja tarkkuustarkistukset
- **LLM-generoitu yhteenveto**: Automaattiset tiivistelmät kaikista dokumenteista

### 📄 Dokumenttityypit ja Yhteenveto-Promptit

Jokaisella dokumenttityypillä on oma yhteenveto-prompt-hallinansa:

#### **Lastensuojeluilmoitus (LS-ilmoitus)**
- **Kokoelma**: `ILMOITUS_YHTEENVETO`
- **Test-tiedosto**: `/public/ILMOITUS_YHTEENVETO_PROMPT.md`
- **Komponentti**: `IlmoitusYhteenvetoPromptManager.tsx`
- **Yhteenveto**: Tunnistaa ilmoituksen perusteen ja keskeiset huolenaiheet

#### **Palvelutarpeen Arviointi (PTA)**
- **Kokoelma**: `PALVELUNTARPEEN_ARVIOINTI_YHTEENVETO`
- **Test-tiedosto**: `/public/PALVELUNTARPEEN_ARVIOINTI_YHTEENVETO_PROMPT.md`
- **Komponentti**: `PtaYhteenvetoPromptManager.tsx`
- **Yhteenveto**: Tiivistää asiakkaan tilanteen, huolenaiheet ja suositellut palvelut

#### **Päätös**
- **Kokoelma**: `PAATOS_YHTEENVETO`
- **Test-tiedosto**: `/public/PAATOS_YHTEENVETO_PROMPT.md`
- **Komponentti**: `PaatosYhteenvetoPromptManager.tsx`
- **Yhteenveto**: Kuvaa päätöksen sisällön ja perustelut lyhyesti

#### **Asiakaskirjaus**
- **Kokoelma**: `ASIAKAS_YHTEENVETO`
- **Test-tiedosto**: `/public/ASIAKAS_YHTEENVETO_PROMPT.md`
- **Komponentti**: `AsiakasYhteenvetoPromptManager.tsx`
- **Yhteenveto**: Tiivistää kontaktin aiheet ja suunnitellut jatkotoimet

### ⚙️ Yhteenveto-Promptien Hallinta

Kaikki yhteenveto-prompt-hallinnat noudattavat yhtenäistä arkkitehtuuria:

- **Versiointi**: Aikaleima-pohjainen versioiden seuranta
- **Test/Production-versiot**:
  - **Test**: Prompti luetaan tiedostosta (read-only käyttöliittymässä)
  - **Production**: Prompti tallennetaan Firestoreen (muokattavissa)
- **LLM-mallivalinta**: Grok-4-Fast, Gemini 2.5 Flash Lite/Flash/Pro, Gemini 3 Pro Preview
- **Temperature-säätö**: 0 - 1 (oletuksena 0.3)
- **Historia**: Tarkastele ja palauta aiempia versioita
- **Kuvaukset**: Tallenna muutoskuvaus jokaiselle versiolle
- **Fullscreen-editori**: Suuri editori pitkille prompteille

**Tekninen toteutus:**
- Jokainen tallennusoperaatio luo uuden dokumentin Firestoreen automaattisella ID:llä
- Viimeisin prompti haetaan: `orderBy('createdAt', 'desc').limit(1)`
- Täysi historia saatavilla katselua ja palautusta varten
- Kaikki asetukset (LLM-malli, temperature, version) tallennetaan samaan dokumenttiin

## 🛠️ Teknologiat

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui -komponentit
- **AI-integraatio**: OpenRouter API (Grok, Gemini)
- **Tietokanta**: Firebase Firestore
- **Autentikointi**: Firebase Auth
- **Tilanhallinta**: React Hooks
- **Tiedostojen käsittely**: PDF, Excel, CSV, Word -tuki

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
# OpenRouter API LLM-malleille
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Firebase-konfiguraatio
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**Huom**: Firebase-konfiguraatio vaaditaan järjestelmäpromptien versioinnille ja käyttäjien autentikoinnille.

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

4. **Järjestelmäpromptien Hallinta**:
   - Hallitse AI-järjestelmäpromptien versioita
   - Valitse sopiva LLM-malli (Grok-4-Fast, Gemini 2.5)
   - Tarkastele ja palauta aiempia versioita

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
│   └── Admin.tsx       # Admin-paneeli
└── types/              # TypeScript-tyyppimäärittelyt
```

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

### OpenRouter API-avaimen hankkiminen

1. Rekisteröidy [OpenRouter](https://openrouter.ai/)
2. Luo uusi API-avain
3. Lisää se `.env`-tiedostoon muuttujana `VITE_OPENROUTER_API_KEY`

### Uusien ominaisuuksien lisääminen

1. Luo uudet komponentit hakemistoon `src/components/`
2. Lisää TypeScript-tyypit hakemistoon `src/types/`
3. Testaa toiminnallisuus paikallisesti
4. Varmista, että TypeScript-tarkistukset menevät läpi

## 🎯 Käyttötapaukset

SocialWise on täydellinen:

1. **Sosiaalityöntekijöille**: AI-avusteinen dokumentointi ja päätöksenteon tuki
2. **Sosiaalitoimistoille**: Yhtenäiset käytännöt ja laadukas palvelu
3. **Uusien työntekijöiden perehdytys**: Nopea pääsy ammattitaitoon ja lakitietouteen
4. **Johtamiseen**: Resurssien allokointi ja muutospotentiaalin tunnistaminen
5. **Asiakkaille**: Nopeutettu palveluun pääsy ja yhdenvertaisuus

## ⚙️ Järjestelmävaatimukset

- Node.js 18+
- npm 8+
- Moderni selain (Chrome, Firefox, Safari, Edge)
- OpenRouter API-avain
- Firebase-projekti (Firestore ja Auth)

## 🔒 Tietoturva

- Ei kovakoodattuja salaisuuksia tai API-avaimia koodipohjassa
- Ympäristömuuttujat kaikille arkaluonteisille konfiguraatioille
- Firebase Auth käyttäjien autentikointiin
- Kaikki API-avaimet ladataan ajonaikaisesta ympäristöstä
- CE-merkintä hakuprosessissa (tulossa)

## 👥 SocialWisen Tarina

**Perustajat:**
- **Tarja Meronen** (FT, sostt., founder) - Laillistettu sosiaalityöntekijä ja filosofian tohtori, perusti Auttavat Sossut 20 vuoden virkamiesuransa jälkeen
- **Kari Vierikka** - Tieto-, luottamus- ja turvallisuusalan teknologioiden asiantuntija
- **Mikko Valtonen** - Pitkä SAP-ohjelmistokokemus, AI-arkkitehti pörssiyhtiöille ja kysytty tekoälyn kouluttaja

Perustajatiimi ja viisas Sosiaalialan AI syntyi vastuusta ja intohimosta Soten tarpeisiin.

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