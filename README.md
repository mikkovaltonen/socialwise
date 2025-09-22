# Valmet Procurement AI Assistant

A specialized AI-powered procurement assistant for Valmet, focused on supplier search, vendor selection, and procurement intelligence.

## 🎯 Purpose

This application serves as Valmet's intelligent procurement assistant, helping users:
- Search and analyze 520+ verified suppliers
- Find vendors for professional services (IT consulting, business consulting, training, R&D, legal services)
- Access procurement policies and guidelines
- Make data-driven vendor selection decisions

## Features

- **Valmet Supplier Search**: Fuzzy, case-insensitive search across 520+ suppliers
- **AI-Powered Chat**: Google Gemini AI for intelligent procurement assistance
- **Document Analysis**: Process and analyze procurement documents (PDF, Excel, Word, CSV)
- **Policy Context Viewer**: Browse Valmet procurement policies with paged navigation
- **Supplier Statistics**: Real-time analytics on supplier distribution and compliance
- **Export Capabilities**: Download supplier data and search results as CSV
- **Multi-language Support**: Finnish and English interfaces

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
git clone <repository-url>
cd procurement-ai-evaluator
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root and define the following variables:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-2.5-flash-preview-04-17

# Firebase Configuration (required for system prompt versioning)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
`


**Note**: Firebase configuration is required for the system prompt versioning feature, which is a core evaluation capability.

4. **Start the development server**
```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Usage

### Login Credentials
- Username: `evaluator`
- Password: `go_nogo_decision`

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