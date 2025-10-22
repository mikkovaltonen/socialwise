# Professional Demand Manager

AI-powered procurement automation platform with agentic process optimization for enterprise demand management and supplier orchestration.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           🤖 AI CHAT INTERFACE (LLM)                            │
│                        ProfessionalBuyerChat.tsx                                │
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

This application serves as an intelligent procurement automation platform, helping organizations:
- Search and analyze 400+ verified suppliers across multiple categories
- Find vendors for professional services (consulting, training, R&D, legal services)
- Automate procurement workflows and decision-making
- Make data-driven vendor selection decisions

## Features

- **Supplier Search**: Fuzzy, case-insensitive search across 400+ suppliers
- **AI-Powered Assistant**: Multiple LLM options (Gemini, Grok) for intelligent procurement assistance
- **Document Analysis**: Process and analyze procurement documents (PDF, Excel, Word, CSV)
- **System Prompt Management**: Production and testing versions with version control
- **Supplier Statistics**: Real-time analytics on supplier distribution
- **Export Capabilities**: Download supplier data and search results as CSV
- **Multi-language Support**: Multiple language interfaces

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
git clone https://github.com/mikkovaltonen/demand-manager
cd demand-manager
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

1. **Document Upload**: 
   - Drag and drop or select files (PDF, Excel, CSV, Word)
   - Supported formats: `.pdf`, `.xlsx`, `.xls`, `.csv`, `.doc`, `.docx`

2. **AI Analysis Session**:
   - Start an analysis session with uploaded documents
   - AI provides initial overview and insights

3. **Structured Data Extraction**:
   - **Extract Suppliers**: Get structured supplier information
   - **Extract Pricing**: Analyze pricing data and trends
   - **Extract Contracts**: Identify contract terms and conditions

4. **Interactive Analysis**:
   - Ask natural language questions about your documents
   - Get AI-powered insights and recommendations
   - Export extracted data as CSV files

5. **System Prompt Versioning**:
   - Create and manage different versions of AI system prompts
   - Evaluate and compare different prompt strategies
   - Browse version history and track improvements
   - Add evaluation notes for each prompt version

### Quick Actions

The application provides pre-built analysis prompts for:
- Supplier capability assessment
- Pricing optimization opportunities
- Contract risk analysis
- Process improvement recommendations

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── DocumentAnalysis.tsx  # Document upload and management
│   ├── ProcurementChat.tsx   # AI chat interface
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

## Evaluation Scenarios

This tool is perfect for demonstrating:

1. **Document Processing**: Upload real procurement documents to see AI extraction capabilities
2. **Data Structuring**: Transform unorganized data into structured formats
3. **Natural Language Querying**: Ask complex questions about procurement data
4. **Export Integration**: Show how AI-extracted data can integrate with existing systems
5. **Process Automation**: Demonstrate potential for procurement workflow automation

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

For questions about the procurement AI evaluation capabilities or technical implementation, please create an issue in the repository.