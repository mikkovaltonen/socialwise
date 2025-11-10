# LS-portaali UI Components

## Rakenne

Uusi kolmipalstainen layout-rakenne:

```
┌──────────────┬────────────────────────┬──────────────┐
│              │                        │              │
│   Left       │    Main Content        │   Right      │
│   Sidebar    │    Area                │   Sidebar    │
│              │                        │              │
│  Navigation  │   Client Info Cards    │   AI Chat    │
│              │                        │              │
└──────────────┴────────────────────────┴──────────────┘
```

## Komponenttipuu

```
LSPortal.tsx (main)
├── LSPortalLayout.tsx
│   ├── leftSidebar
│   │   └── Sidebar/
│   │       ├── LeftSidebar.tsx
│   │       ├── NavigationMenu.tsx
│   │       └── UserProfile.tsx
│   │
│   ├── mainContent
│   │   └── MainContent/
│   │       ├── ContentArea.tsx
│   │       ├── PageHeader.tsx
│   │       └── [Existing card components]
│   │           ├── MainProblem.tsx
│   │           ├── LSNotifications.tsx
│   │           ├── CaseNotes.tsx
│   │           ├── Decisions.tsx
│   │           ├── ContactInfo.tsx
│   │           ├── PTA.tsx
│   │           └── ServicePlans.tsx
│   │
│   └── rightSidebar
│       └── AIChat/
│           ├── RightSidebar.tsx
│           ├── QuickQuestions.tsx
│           ├── ChatMessages.tsx
│           └── ChatInput.tsx
```

## Väripaletti

### LS-portaali värit (Tailwind)
- `ls-blue` (#4A90E2) - Pääsininen
- `ls-blue-dark` (#357ABD) - Tumma sininen (gradientit)
- `ls-blue-text` (#1E40AF) - Tekstin sininen
- `ls-blue-light` (#EFF6FF) - Vaalea sininen tausta
- `ls-blue-active` (#DBEAFE) - Aktiivinen tila
- `ls-coral` (#FF6B6B) - Kirjaudu ulos -painike

### Käyttö
```tsx
className="bg-ls-blue text-white"
className="bg-gradient-to-b from-ls-blue to-ls-blue-dark"
className="text-ls-blue-text"
```

## Komponentit

### Layout

#### LSPortalLayout
Pääasiallinen layout-wrapper kolmella palstalla.

**Props:**
- `leftSidebar: React.ReactNode` - Vasen navigaatiopalkki
- `mainContent: React.ReactNode` - Keskiosan sisältö
- `rightSidebar: React.ReactNode` - Oikea AI-chat palkki

**Mitat:**
- Vasen palkki: 240px (fixed)
- Oikea palkki: 400px (fixed)
- Keskiosa: Loput tilasta (flex-1)

---

### Vasen sivupalkki (Sidebar/)

#### LeftSidebar
Vasemman sivupalkin pääkomponentti.

**Props:**
- `currentView?: 'child-view' | 'all-children' | 'settings'`
- `onNavigate?: (view) => void`

**Rakenne:**
- Logo ja branding ylhäällä
- NavigationMenu keskellä
- UserProfile alhaalla

#### NavigationMenu
Navigaatiolinkit.

**Items:**
- Lapsen tarkastelu (User icon)
- Kaikki lapset (Users icon)
- Asetukset (Settings icon)

#### UserProfile
Käyttäjätiedot ja logout-painike.

**Features:**
- Näyttää käyttäjän nimen (Firebase Auth)
- Kirjaudu ulos -painike (coral-värinen)
- Automaattinen nimi emailista jos ei displayName

---

### Keskiosa (MainContent/)

#### ContentArea
Pääsisältöalue wrapper.

**Props:**
- `children: React.ReactNode` - Kortit
- `selectedClient?: string`
- `onClientChange?: (clientId: string) => void`

**Tyyli:**
- Background: #F5F5F5 (vaalea harmaa)
- Padding: 32px
- Scrollable: overflow-y-auto

#### PageHeader
Sivun otsikko ja lapsen valinta.

**Features:**
- H1: "Lastensuojelu ja perheiden palvelut"
- Dropdown: Lapsen valinta

---

### Oikea sivupalkki (AIChat/)

#### RightSidebar
AI-chat-palkin pääkomponentti.

**Props:**
- `messages?: Message[]`
- `onSendMessage?: (message: string) => void`
- `onQuickQuestionClick?: (question: string) => void`
- `isLoading?: boolean`

**Rakenne:**
- Header: "Kysy AI:lta"
- QuickQuestions: Esimerkkikysymykset
- ChatMessages: Scrollable viestialue
- ChatInput: Input + Lähetä (fixed bottom)

#### QuickQuestions
Valmiit kysymykset klikattavina kortteina.

**Questions:**
1. "Onko lapsen tapauksessa riskejä?"
2. "Onko vanhemmilla muutosvalmius?"
3. "Tarvitsen lainsäädännöllistä neuvoa."
4. "Hei! Miten voin auttaa?"

#### ChatMessages
Viestien näyttö user/assistant-bubbleilla.

**Features:**
- Auto-scroll viimeiseen viestiin
- Aikaleima jokaiselle viestille
- Loading-indikaattori (Loader2 spinner)
- Tyhjä tila -viesti

#### ChatInput
Tekstikenttä ja lähetä-painike.

**Features:**
- Textarea (3 riviä)
- Enter lähettää (Shift+Enter rivinvaihto)
- Lähetä-painike sinisellä
- Disabled-tila loading-aikana

---

## Responsiivisuus

### Desktop (>= 1280px)
- Kolmipalstainen layout täytenä
- Vasen sidebar: 240px
- Oikea sidebar: 400px
- Keskiosa: flex-1

### Tablet (768px - 1279px) [TODO]
- Vasen sidebar: hamburger-menulla
- Keskiosa: full-width
- Oikea sidebar: toggle-napilla

### Mobile (< 768px) [TODO]
- Single column
- Sidebar: drawer-menu
- AI Chat: bottom sheet tai oma sivu

---

## Integraatiot

### AI Chat
Tällä hetkellä demo-vastaukset. Tulevaisuudessa:
- OpenRouter API integraatio
- System prompt Firestoresta
- Client data context automaattisesti
- Continuous improvement tracking

### Firebase Auth
- UserProfile käyttää `auth.currentUser`
- Logout via `signOut(auth)`
- Navigointi `/` logout-jälkeen

---

## Seuraavat askeleet

1. **AI Chat integraatio**
   - OpenRouter API calls
   - System prompt loading
   - Client context injection
   - Response streaming

2. **Responsiivisuus**
   - Mobile layout
   - Tablet layout
   - Sidebar toggles

3. **Kortit**
   - Päivitä olemassa olevat kortit uuteen tyyliin
   - Poista purple/pink värit
   - Yhtenäistä typografia

4. **Accessibility**
   - Keyboard navigation
   - ARIA labels
   - Focus management

5. **Testaus**
   - Component tests
   - Integration tests
   - E2E tests
