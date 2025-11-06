# Massify

Create mass tailored proposals with sophisticated price calculations. Massify is a SAAS platform that helps you personalize each proposal for every recipient with intelligent pricing automation.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           🤖 AI CHAT INTERFACE (LLM)                            │
│                        MarketingPlannerChat.tsx                                 │
│                         OpenRouter API (Grok-4)                                 │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      │ Function Calls
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         🔧 CHAT FUNCTIONS LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  search_ext_labour_suppliers()  │  search_invoices_training_2023()             │
│  search_ipro_contracts()         │  search_training_suppliers()                 │
│  create_purchase_requisition()   │                                              │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         📊 API SERVICE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  supplierSearchFunction.ts       │  firestoreDataService.ts                    │
│  erpApiService.ts                │  purchaseRequisitionService.ts              │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         🧪 API TESTER DIALOGS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  FirestoreDataTester.tsx                                                        │
│  ├── Tab: Valmet Suppliers       (tests: search_ext_labour_suppliers)          │
│  ├── Tab: Training Invoices      (tests: search_invoices_training_2023)        │
│  ├── Tab: iPRO Contracts         (tests: search_ipro_contracts)                │
│  └── Tab: Training Suppliers     (tests: search_training_suppliers)            │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       🗄️ FIRESTORE COLLECTIONS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  📁 ext_labour_suppliers         │  📁 invoices_training_2023                  │
│     410 suppliers                │     Training invoice records                │
│     External workforce            │     2023 financial data                     │
│                                   │                                              │
│  📁 ipro_contracts                │  📁 training_suppliers                      │
│     iPRO contract records        │     Training supplier catalog               │
│     Active/expired contracts     │     Classifications (A/B/C)                 │
│                                   │                                              │
│  📁 purchase_requisitions         │  📁 continuous_improvement                  │
│     Draft PR documents            │     Chat session logs                       │
│     Basware format               │     User feedback data                      │
└─────────────────────────────────────────────────────────────────────────────────┘

## 📋 Collection → API → LLM Function Mapping

| Firestore Collection      | API Service                | Chat Function                  | API Tester Tab        |
|---------------------------|----------------------------|--------------------------------|-----------------------|
| ext_labour_suppliers      | supplierSearchFunction.ts  | search_ext_labour_suppliers()  | Valmet Suppliers      |
| invoices_training_2023    | firestoreDataService.ts    | search_invoices_training_2023()| Training Invoices     |
| ipro_contracts            | firestoreDataService.ts    | search_ipro_contracts()        | iPRO Contracts        |
| training_suppliers        | firestoreDataService.ts    | search_training_suppliers()    | Training Suppliers    |
| purchase_requisitions     | purchaseRequisitionService | create_purchase_requisition()  | N/A                   |

```

## 🎯 Purpose

Massify helps businesses create personalized proposals at scale:
- Generate mass tailored proposals with unique content for each recipient
- Sophisticated price calculation engine for custom pricing per proposal
- AI-powered proposal personalization and optimization
- Automated pricing strategies based on recipient data
- Streamline proposal workflow and increase conversion rates

## Features

- **Mass Proposal Generation**: Create personalized proposals for multiple recipients simultaneously
- **Sophisticated Pricing Engine**: Advanced price calculations tailored to each recipient
- **AI-Powered Assistant**: Multiple LLM options (Gemini, Grok) for intelligent proposal creation
- **Document Analysis**: Process and analyze proposal templates and data (PDF, Excel, Word, CSV)
- **Price Optimization**: AI-driven pricing recommendations and strategies
- **Export Capabilities**: Download proposals and pricing data as CSV
- **Multi-language Support**: Create proposals in multiple languages

## Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **AI Integration**: Google Gemini API
- **File Processing**: Support for PDF, Excel, CSV, Word documents
- **State Management**: React Hooks
- **Authentication**: Simple evaluation credentials

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/mikkovaltonen/massify
cd massify
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root and define the following variables:

```env
# OpenRouter API for LLM
VITE_OPEN_ROUTER_API_KEY=your_openrouter_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
`


**Note**: Firebase configuration is required for the system prompt versioning feature, which is a core evaluation capability.

4. **Start the development server**
```bash
npm run dev
```

The application will start at `http://localhost:8080`

## Usage

### Authentication
The application uses Firebase Authentication. Contact your administrator for account credentials.

### Core Functionality

1. **Recipient Data Upload**:
   - Upload recipient lists and data (Excel, CSV)
   - Supported formats: `.xlsx`, `.xls`, `.csv`

2. **Proposal Template Management**:
   - Upload and manage proposal templates
   - Define variable placeholders for personalization
   - Configure pricing calculation rules

3. **Mass Proposal Generation**:
   - **Personalize Content**: AI tailors each proposal to recipient
   - **Calculate Pricing**: Sophisticated pricing engine applies custom calculations
   - **Generate Proposals**: Batch create personalized proposals at scale

4. **Interactive Proposal Refinement**:
   - Review and edit generated proposals
   - Adjust pricing strategies with AI assistance
   - Get optimization recommendations

5. **Export and Delivery**:
   - Export proposals in multiple formats (PDF, Word, Excel)
   - Batch download all personalized proposals
   - Track proposal status and responses

### Quick Actions

The application provides pre-built features for:
- Recipient data analysis and segmentation
- Pricing strategy optimization
- Proposal personalization suggestions
- Conversion rate improvement recommendations

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── DocumentAnalysis.tsx  # Document upload and management
│   ├── MarketingPlannerChat.tsx    # AI chat interface
│   └── LoginForm.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.ts
├── lib/                # Utilities and services
│   ├── firestoreService.ts
│   └── utils.ts
├── pages/              # Page components
│   ├── Index.tsx       # Landing page
│   └── Workbench.tsx   # Main application
└── types/              # TypeScript type definitions
```

## Development

### Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### Adding New Features

1. Create new components in `src/components/`
2. Add TypeScript types in `src/types/`
3. Test functionality locally
4. Ensure TypeScript checks pass

## Use Cases

Massify is perfect for:

1. **Sales Teams**: Generate personalized proposals for multiple prospects simultaneously
2. **B2B Companies**: Create tailored quotes with sophisticated pricing for different customer segments
3. **Service Providers**: Mass customize service proposals based on client needs
4. **Agencies**: Batch create personalized pitches with dynamic pricing
5. **Enterprise Sales**: Automate proposal workflow while maintaining personalization at scale

## System Requirements

- Node.js 18+
- npm 8+
- Modern browser (Chrome, Firefox, Safari, Edge)
- Google Gemini API key

## Security

- No hardcoded secrets or API keys in the codebase
- Environment variables used for all sensitive configuration
- Demo credentials are intentionally public for evaluation purposes
- All API keys loaded from runtime environment

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass and code is properly formatted
5. Submit a pull request



## Support

For questions about Massify's proposal generation capabilities or technical implementation, please create an issue in the repository.