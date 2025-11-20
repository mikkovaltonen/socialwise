# Claude Code Instructions

## Project Overview
This is SocialWise - Sosiaalityön teknologiakumppani (Social Work Technology Partner). An AI-powered SAAS platform built with React, TypeScript, and Vite that assists social workers with documentation, case management, and professional guidance. The platform combines human expertise with AI to improve service delivery, reduce documentation burden, and strengthen legal protection and equality in social work.

## Core Features

### 1. AI-Powered Social Work Assistant
- **Model**: Multiple LLM options via OpenRouter (Grok, Gemini)
- **Context**: Client data, service history, and social work legislation
- **Purpose**:
  - Assist with professional social work documentation (80% reduction in writing burden)
  - Support onboarding and legal compliance
  - Provide guidance on case management decisions
  - Ensure equal treatment and legal protection
- **Languages**: Finnish and English support
- **Values**: Security, User-centricity, Reliability, Ethics, Innovation

### 2. Client Data Management (CRM)
- **Database**: Client information and service history in Firestore collections
- **Data Fields**:
  - Client identification (tampuurinumero, Y-tunnus)
  - Contact information and demographics
  - Service history with timestamps and status
  - Property/housing manager information
  - Building and apartment details
- **Search & Filter**: Real-time full-text search across all client fields
- **Service History Viewer**: Hover cards displaying complete service history
- **Click to Load**: Load client data directly into AI chat context

### 3. Documentation Support
- **AI-Assisted Writing**: Reduce documentation time by 80%
- **Legal Compliance**: Ensure documentation meets social work legislation
- **Case Notes**: Structured templates for different case types
- **Decision Support**: AI-powered recommendations with legal references
- **Quality Assurance**: Automated checks for completeness and accuracy
- **Document Upload**: PDF and text file upload with AI-powered structuring

#### Document Types and Structures

All documents follow a strict markdown structure with dedicated sections. When uploading documents (PDF, TXT, MD), the system:
1. Converts document to markdown (if needed)
2. Uses Grok-4-Fast LLM to parse and structure content into correct sections
3. Presents editable markdown in the document editor
4. Saves to Firestore with full audit trail

**Key Points:**
- Date fields are editable (not automatic)
- All section headers (##) are required and standardized
- Main title (#) is locked for each document type
- Content within sections is fully editable

**Päätös (Decision)**
```markdown
# Päätös

## Päivämäärä
[DD.MM.YYYY - Muokattava kenttä]

## Tausta
[Päätöksen tausta]

## Päätös
[Varsinainen päätös]

## Perustelut
[Perustelut]

## Muutoksenhaku
[Muutoksenhakuohjeet]
```

**Lastensuojeluhakemus (Child Protection Application)**
```markdown
# Lastensuojeluhakemus

## PÄIVÄYS
[DD.MM.YYYY - Automaattinen luomispäivä, lukittu, ei muokattavissa]

## ILMOITTAJAN TIEDOT
[Esitäytetty pohja, muokattavissa]
**Nimi:**
**Puhelin:**
**Suhde lapseen:**

## LAPSEN TIEDOT
[Automaattisesti haettu ASIAKAS_PERUSTIEDOT-collectionista, lukittu]
**Nimi:** [Lapsen nimi]
**Puhelin:** [Puhelin]
**Koulu:** [Koulu]

## HUOLTAJIEN TIEDOT
[Automaattisesti haettu ASIAKAS_PERUSTIEDOT-collectionista, lukittu]
**Äiti:**
- Nimi: [Äidin nimi]
- Puhelin: [Puhelin]
**Isä:**
- Nimi: [Isän nimi]
- Puhelin: [Puhelin]

## HUOLEN AIHEET
[Muokattava kenttä - huolta aiheuttavat seikat]

## ILMOITUKSEN PERUSTE
[Muokattava kenttä - ilmoituksen varsinainen peruste]

## TOIMENPITEET
[Muokattava kenttä - tehdyt tai suunnitellut toimenpiteet]

## ALLEKIRJOITUS JA KÄSITTELYN PÄÄTTYMISPÄIVÄMÄÄRÄ
[Muokattava kenttä]
```

**Palvelutarpeen arviointi (PTA)**
```markdown
# Palvelutarpeen arviointi

## Päiväys
[DD.MM.YYYY]

## PERHE
[Perheen kuvaus]

## TAUSTA
[Taustatieto]

## PALVELUT
[Palvelut]

## JOHTOPÄÄTÖKSET
[Johtopäätökset]
```

**Asiakaskirjaus (Case Note)**
```markdown
# Asiakaskirjaus

**Päiväys:** [DD.MM.YYYY]

[Vapaa tekstialue - ei pakollisia alaotsikkoja]
```

**Huom:** Asiakaskirjaus on yksinkertaistettu vapaamuotoiseksi dokumentiksi, jossa on vain pääotsikko ja päiväys. Sisältö kirjoitetaan vapaasti ilman pakollisia alaotsikkoja.

### 4. System Prompt Management
- **Versioning**: Timestamp-based system prompt versions
- **History**: View and revert to previous prompt versions
- **Model Selection**: Choose between Grok-4-Fast, Gemini 2.5 Flash, Gemini 2.5 Pro
- **User Preferences**: Individual LLM model preferences per user
- **Default Initialization**: Bootstrap from `/public/system_prompt.md`

## Development Commands

### Testing & Quality Assurance
```bash
# Run TypeScript type checking
npx tsc --noEmit

# Run linting
npm run lint

# Run tests
npm test
npm run test:openai
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Technologies
- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **AI Integration**: Google Gemini API
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **LLM Integration**: OpenRouter API
- **State Management**: React Hooks
- **File Processing**: Support for PDF, Excel, CSV, Word documents
- **Data Visualization**: Interactive Markdown table parser with sorting, filtering, and export

## Project Structure
```
src/
├── components/
│   ├── MarketingPlannerChat.tsx        # AI-avustettu chat-käyttöliittymä
│   ├── StockManagementTable.tsx        # Asiakastietojen hallinta ja näkymä
│   ├── SystemPromptManager.tsx         # Järjestelmäpromptien hallinta
│   ├── DocumentAnalysis.tsx            # Dokumenttien analysointi
│   ├── InteractiveMarkdownTable.tsx    # Interaktiivinen taulukkoparseri
│   └── ui/                             # shadcn/ui komponentit
├── lib/
│   ├── chatContextConfigService.ts     # Chat-kontekstin konfiguraatio
│   ├── systemPromptService.ts          # Järjestelmäpromptien hallinta
│   ├── firestoreService.ts             # Firestore-tietokantapalvelut
│   ├── sessionService.ts               # Istunnon hallinta
│   ├── firebase.ts                     # Firebase-konfiguraatio
│   └── utils.ts                        # Apufunktiot
├── pages/
│   ├── Admin.tsx                       # Admin-paneeli
│   ├── Workbench.tsx                   # Pääsovellus
│   └── Index.tsx                       # Landing-sivu
└── types/                              # TypeScript-määrittelyt
```

## Tietokannan Rakenne

### `crm_asikkaat_ja_palveluhistoria` Kokoelma (6,446 dokumenttia)
Pääasiallinen CRM-kokoelma, joka sisältää asiakastiedot yhdistettynä palveluhistoriaan.

```javascript
{
  tampuurinumero: string,       // Primary identifier
  customerInfo: {
    tampuuri_tunnus: string,
    account_name: string,
    ytunnus: string,            // Business ID
    katuosoite: string,         // Street address
    postal_code: string,
    city: string,
    isannoitsija: string,       // Property manager
    primary_email_isannoitsija_user: string,
    huoneistojen_lukumaara: number,    // Number of apartments
    rakennusten_lukumaara: number,      // Number of buildings
    kayttoonottoppaiva: string,         // Date of commissioning
    asiakkuus_alkanut: string,          // Customer relationship start
    // ... additional customer fields
  },
  serviceHistory: {
    [recordId]: {
      service_date: string,
      service_type: string,
      description: string,
      status: 'completed' | 'pending' | string,
      // ... additional service record fields
    }
  },
  mergedAt: string,             // ISO timestamp
}
```

**Key Features:**
- **Merged Data**: Customer data combined with complete service history
- **Service History on Hover**: Y-tunnus field shows service history in hover card
- **Full-Text Search**: Search across customer name, Y-tunnus, city, property manager
- **Click to Load**: Click tampuurinumero to load customer data into chat context
- **100% Link Rate**: All 4,043 service history records successfully linked

### `crm_system_prompts` Kokoelma
Tallentaa järjestelmäpromptien eri versiot aikaleimalla.

```javascript
{
  content: string,           // Promptin sisältö
  createdAt: Timestamp,      // Automaattinen aikaleima
  createdBy: string,         // Käyttäjän ID
  createdByEmail: string,    // Käyttäjän sähköposti
  description: string        // Version kuvaus
}
```

### `crm_user_preferences` Kokoelma
Tallentaa käyttäjien LLM-mallivalinnat.

```javascript
{
  llmModel: string,          // Esim. 'google/gemini-2.5-pro'
  updatedAt: Timestamp       // Päivitysaika
}
```

### `crm_continuous_improvement` Kokoelma
Seuraa chat-istuntoja, käyttäjäpalautetta ja teknisiä lokeja analytiikkaa varten.

```javascript
{
  id: string,
  promptKey: string,
  chatSessionKey: string,
  userId: string,
  userFeedback: 'thumbs_up' | 'thumbs_down' | null,
  userComment: string,
  technicalLogs: TechnicalLog[],
  createdDate: Date,
  lastUpdated: Date,
}
```

## Tärkeät Toteutusdetaljit

### CRM-Asiakastaulukon Ominaisuudet
- **Reaaliaikainen Haku**: Suodata asiakkaita nimen, Y-tunnuksen, kaupungin tai isännöitsijän mukaan
- **Palveluhistorian Hover-kortit**: Vie hiiri Y-tunnuksen päälle nähdäksesi täydellisen palveluhistorian
  - Visuaalinen indikaattori (sininen alleviivaus + määrämerkki) asiakkaille, joilla on historiaa
  - Näyttää palvelupäivämäärät, tyypit, kuvaukset ja tilan värikoodattuna
- **Klikkaa Ladataksesi**: Klikkaa tampuurinumeroa ladataksesi asiakkaan tiedot AI-chat-kontekstiin
- **Lajiteltavat Sarakkeet**: Klikkaa sarakeotsikoita lajitellaksesi nousevaan/laskevaan järjestykseen
- **Responsiivinen Suunnittelu**: Vaakasuuntainen vieritys pienemmille näytöille

### Migration Script
The `Data_preparation/migrate-crm-data.ts` script:
- Reads customer and service history Excel files
- Merges data by tampuurinumero (using Code field from history)
- Normalizes field names (lowercase, special char replacement)
- Uploads to Firestore with batch processing
- Generates detailed markdown reports with statistics

### Data Quality Metrics
- 6,446 customers successfully migrated
- 4,043 service history records (100% link rate)
- Only 26 customers skipped (missing tampuurinumero)

## Environment Variables
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=valmet-buyer.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=valmet-buyer
VITE_FIREBASE_STORAGE_BUCKET=valmet-buyer.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=737944042802
VITE_FIREBASE_APP_ID=your-app-id

# AI Configuration
VITE_GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_MODEL=gemini-2.5-flash-preview-04-17
```

## Nykyinen Arkkitehtuuri (Marraskuu 2025)

### Yleiskatsaus
- Sosiaalityöhön keskittyvä CRM-sovellus
- Pääkokoelma: `crm_asikkaat_ja_palveluhistoria` (6,446 asiakasta)
- AI-avusteinen chat-käyttöliittymä sosiaalityöntekijöille
- Palveluhistorian integraatio hover-korteilla
- Yksinkertaistettu järjestelmäpromptien hallinta aikaleimalla

### Järjestelmäpromptien Hallinta (Yksinkertaistettu)
**Arkkitehtuuri**: Yksi kokoelma aikaleima-pohjaisella versioinnilla

**Kokoelmat**:
- `crm_system_prompts`: Kaikki promptien versiot aikaLeimalla
- `crm_user_preferences`: Käyttäjien LLM-mallivalinnat

**Rakenne**:
```typescript
// crm_system_prompts dokumentti
{
  content: string,           // Promptin teksti
  createdAt: Timestamp,      // Automaattinen aikaleima
  createdBy: string,         // Käyttäjä-ID
  createdByEmail: string,    // Käyttäjän sähköposti
  description: string        // Version kuvaus
}

// crm_user_preferences dokumentti
{
  llmModel: string,          // Esim. 'google/gemini-2.5-pro'
  updatedAt: Timestamp       // Päivitysaika
}
```

**Keskeiset Ominaisuudet**:
- Jokainen tallennus luo uuden dokumentin automaattisesti luodulla ID:llä
- Käytä aina viimeisintä: `orderBy('createdAt', 'desc'), limit(1)`
- Täysi historia saatavilla katselua ja palautusta varten
- Ei tuotanto/testiversioita - yksinkertaistettu yhteen virtaan
- Käyttäjien mallivalinnat tallennetaan erikseen

**Funktiot** (`systemPromptService.ts`):
- `getLatestSystemPrompt()` - Hae viimeisin prompti
- `saveSystemPrompt()` - Luo uusi versio
- `getPromptHistory()` - Näytä historiaversiot
- `getSystemPromptForUser()` - Hae sisältö chat-alustukseen
- `getUserLLMModel()` - Hae käyttäjän mallivalinta
- `setUserLLMModel()` - Aseta käyttäjän mallivalinta
- `initializeSystemPrompts()` - Alusta oletuksella `/public/system_prompt.md`:stä

**Käyttöliittymä** (`SystemPromptManager.tsx`):
- Yksi editori (ei tuotanto/testivälilehtiä)
- Mallin valinta (Grok-4-Fast, Gemini 2.5 Flash, Gemini 2.5 Pro)
- Historiakatselu palautusmahdollisuudella
- Koko näytön muokkaustila
- Version kuvaukset muutosten seuraamiseen

### Dokumenttien Yhteenveto-Prompt-Hallinta

Jokaisella dokumenttityypillä on oma yhteenveto-prompt-hallinansa LLM-generoitujen yhteenvetojen tuottamiseksi:

#### **Arkkitehtuuri**
Kaikki yhteenveto-palvelut noudattavat yhtenäistä rakennetta:

**Palvelut** (`src/lib/`):
- `ilmoitusYhteenvetoService.ts` - LS-ilmoitukset
- `ptaYhteenvetoService.ts` - PTA-dokumentit
- `paatosYhteenvetoService.ts` - Päätökset
- `asiakasYhteenvetoService.ts` - Asiakaskirjaukset

**Firestore-kokoelmat**:
- `ILMOITUS_YHTEENVETO` - LS-ilmoituksen yhteenvetopromptit
- `PALVELUNTARPEEN_ARVIOINTI_YHTEENVETO` - PTA:n yhteenvetopromptit
- `PAATOS_YHTEENVETO` - Päätösten yhteenvetopromptit
- `ASIAKAS_YHTEENVETO` - Asiakaskirjausten yhteenvetopromptit

**Test-tiedostot** (`/public/`):
- `ILMOITUS_YHTEENVETO_PROMPT.md`
- `PALVELUNTARPEEN_ARVIOINTI_YHTEENVETO_PROMPT.md`
- `PAATOS_YHTEENVETO_PROMPT.md`
- `ASIAKAS_YHTEENVETO_PROMPT.md`

**UI-komponentit** (`src/components/`):
- `IlmoitusYhteenvetoPromptManager.tsx`
- `PtaYhteenvetoPromptManager.tsx`
- `PaatosYhteenvetoPromptManager.tsx`
- `AsiakasYhteenvetoPromptManager.tsx`

#### **Yhteinen Datarakenne**

```typescript
interface YhteenvetoPrompt {
  id?: string;
  content: string;                    // Promptin sisältö
  llmModel: string;                   // Esim. 'google/gemini-2.5-flash-lite'
  temperature: number;                // Esim. 0.3
  promptVersion: 'test' | 'production';  // Test = tiedostosta, Production = Firestore
  createdAt: Timestamp;
  createdBy: string;
  createdByEmail?: string;
  description?: string;
}
```

#### **Versioiden Logiikka**

**Test-versio** (`promptVersion: 'test'`):
- Prompti luetaan tiedostosta (esim. `/public/ASIAKAS_YHTEENVETO_PROMPT.md`)
- Käyttöliittymässä read-only
- Muut asetukset (LLM-malli, temperature) tallennetaan silti Firestoreen

**Production-versio** (`promptVersion: 'production'`):
- Prompti luetaan Firestoresta
- Täysin muokattavissa käyttöliittymässä
- Kaikki muutokset tallentuvat historiaan

#### **Keskeiset Funktiot**

Jokainen palvelu tarjoaa samat funktiot:
- `getLatestPrompt()` - Hae viimeisin prompti
- `getPromptForGeneration()` - Hae prompt generointia varten (huomioi promptVersion)
- `getLLMModel()` - Hae LLM-malli
- `getTemperature()` - Hae temperature-asetus
- `savePrompt()` - Tallenna uusi prompt-versio
- `getPromptHistory()` - Hae prompt-historia
- `initializePrompts()` - Alusta promptit oletustiedostosta

#### **UI-ominaisuudet**

Kaikki yhteenveto-prompt-managerit tarjoavat:
- LLM-mallin valinta (Grok-4-Fast, Gemini 2.5 Flash Lite/Flash/Pro, Gemini 3 Pro Preview)
- Temperature-säätö (0 - 1)
- Prompt-version valinta (Test/Production)
- Prompt-editori (textarea, 500px korkea)
- Fullscreen-tila muokkaukseen
- Historiakatselu ja palautus (revert)
- Version kuvaukset (description) tallennettaessa

#### **Dokumenttien Yhteenvetojen Generoiminen**

**Palvelu**: `documentSummaryService.ts`

**Prosessi**:
1. Käyttäjä tallentaa dokumentin
2. `generateDocumentSummary()` kutsutaan automaattisesti
3. Palvelu hakee dokumenttityypille määritetyt asetukset:
   - LLM-malli (esim. `google/gemini-2.5-flash-lite`)
   - Temperature (esim. `0.3`)
   - Prompti (joko tiedostosta tai Firestoresta)
4. Lähettää pyynnön OpenRouter API:iin
5. Parsii JSON-vastauksen (esim. `{date: "2025-11-20", summary: "Kotikäynti..."}`)
6. Tallentaa yhteenvedon dokumentin metadata-kenttiin

**Esimerkkikoodi**:
```typescript
if (category === 'asiakaskirjaus') {
  model = await asiakasYhteenvetoService.getLLMModel();
  temperature = await asiakasYhteenvetoService.getTemperature();
  const basePrompt = await asiakasYhteenvetoService.getPromptForGeneration();
  prompt = `${basePrompt}\n\nDokumentti:\n${fullMarkdownText}`;
}
```

#### **Yhteenvetojen Rakenne**

**LS-ilmoitus & PTA & Päätös & Asiakaskirjaus**:
```json
{
  "date": "YYYY-MM-DD",
  "summary": "Lyhyt yhteenveto dokumentista (max 100 merkkiä)"
}
```

## Component Usage

### InteractiveMarkdownTable Component
The `InteractiveMarkdownTable` component parses Markdown tables and provides interactive features:

```typescript
import { InteractiveMarkdownTable } from '@/components/InteractiveMarkdownTable';

// Example usage
<InteractiveMarkdownTable
  markdownContent={markdownTableString}
  title="Supplier Comparison"
  description="Compare top vendors by features"
  enableExport={true}
  enableSearch={true}
  enableSort={true}
  highlightFirstColumn={true}
/>
```

Features:
- **Automatic Parsing**: Extracts tables from Markdown content
- **Sorting**: Click column headers to sort ascending/descending
- **Filtering**: Global search and per-column filters
- **Export**: Download table data as CSV
- **Smart Formatting**: Recognizes badges (✅, ❌), risk levels (🟢, 🟡, 🔴), and currency
- **Responsive**: Mobile-friendly with horizontal scroll

## Development Guidelines
- Always run type checking before committing
- Test fuzzy search with various inputs (partial words, wrong case)
- Ensure Firebase Auth is configured for write operations
- Keep supplier data structure consistent
- Export functions should include all original fields

## Known Limitations
- Table loads all 6,446 customers into memory (acceptable for this dataset size)
- No real-time updates (requires page refresh or manual table refresh)
- Service history hover requires mouse (not available on touch devices)

## Testing Checklist
- [ ] Customer search filters correctly by name, Y-tunnus, city, property manager
- [ ] Service history hover cards display on Y-tunnus
- [ ] Customer click loads data into chat context
- [ ] Migration script completes with 100% service history link rate
- [ ] Migration report generates with correct statistics

## Common Issues & Solutions

### No Service History Displayed
- Verify customer has `serviceHistory` object in Firestore
- Check that Y-tunnus field has value (not dash)
- Ensure HoverCard component is properly imported

### Firebase Permission Errors
- Ensure user is authenticated via Firebase Auth
- Check Firestore rules allow read access to `crm_asikkaat_ja_palveluhistoria`

### Migration Failures
- Verify Excel files exist in `Data_preparation/` folder
- Check that history records have `Code` field for tampuurinumero
- Ensure Firebase credentials are set in environment variables

## Recent Updates (November 2025)

### CRM Data Migration & Integration
- **Component Rename**: `ProfessionalBuyerChat` → `MarketingPlannerChat` to reflect marketing focus
- **CRM Migration Script**: Complete TypeScript migration tool (`migrate-crm-data.ts`)
  - Merges customer data with service history by tampuurinumero
  - 100% service history link rate (4,043 records)
  - Generates comprehensive markdown reports with statistics
- **Service History Viewer**: Hover cards on Y-tunnus field
  - Display service dates, types, descriptions, and status
  - Visual indicators (blue underline + count badge)
  - Color-coded status badges (completed, pending)
- **CRM Customer Table**: Replaced stock management with customer table
  - Search across 6,446 customers by name, Y-tunnus, city, property manager
  - Click tampuurinumero to load customer into AI chat
  - Sortable columns with ascending/descending order
- **Documentation**: Updated README and CLAUDE.md to reflect CRM architecture

### UI Components
- **InteractiveMarkdownTable**: Dynamic table rendering with sorting and filtering
- **HoverCard Integration**: Service history viewer on Y-tunnus hover
- **DataPreparationViewer**: Displays migration reports and documentation

### LLM Configuration
- Models: x-ai/grok-4-fast:free, google/gemini-2.5-flash, google/gemini-2.5-pro
- Model selection via production prompt configuration
- OpenRouter API integration for model access
- tässä projektissa kaikki on suomeksi
- älä koskaa generoi transation tai master dataa tähän kansioon '/mnt/c/Users/mikbu/Documents/SocialWise/public/Aineisto'