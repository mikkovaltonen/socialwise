# Claude Code Instructions

## Project Overview
This is the Professional Demand Manager application built with React, TypeScript, and Vite. It provides intelligent supplier search, vendor selection assistance, and AI-powered procurement automation for enterprise demand management.

## Core Features

### 1. Supplier Search
- **Database**: ~400 verified suppliers in Firestore `suppliers_complete` collection
- **Search Capabilities**: Fuzzy, case-insensitive matching
- **Search Fields**:
  - Main Category (text search)
  - Supplier Categories (text search)
  - Country/Region (text search)
  - City (text search)
- **Data Structure**: Optimized with 60% storage reduction
- **Export**: Full CSV export with all supplier fields

### 2. AI Chat Assistant
- **Model**: Multiple LLM options via OpenRouter (Grok, Gemini)
- **Context**: System prompts only (no document context)
- **Purpose**: Help find best matching vendors for specific needs
- **Languages**: Finnish and English support

### 3. Stock Management & Substrate Family Selection
- **Database**: Stock management data organized by substrate families in `stock_management` collection
- **Substrate Family Selector**: Dropdown with all unique keyword values (e.g., "_MAD_GR_0209")
- **Context Initialization**: Select a substrate family, all related materials loaded into AI chat context
- **Material Tracking**: Track material IDs, widths, stock levels, reservations, and lead times
- **Stock Visibility**: View safety stock, total stock, reservations, and final available stock
- **Interactive Table**: Sort, filter, and view all stock management data with responsive design

### 4. Document Analysis
- **Supported Formats**: PDF, Excel (.xlsx, .xls), CSV, Word (.doc, .docx)
- **Processing**: Extract and analyze procurement data
- **Integration**: Works with supplier search for comprehensive analysis

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
│   ├── ValmetSupplierSearchSimple.tsx  # Main supplier search interface
│   ├── ChatInitViewer.tsx              # Policy document viewer
│   ├── DocumentAnalysis.tsx            # Document upload and analysis
│   ├── InteractiveMarkdownTable.tsx    # Interactive table parser for Markdown
│   └── ui/                             # shadcn/ui components
├── lib/
│   ├── valmetSupplierSearch.ts         # Supplier search functions
│   ├── firebase.ts                     # Firebase configuration
│   └── utils.ts                        # Utility functions
├── pages/
│   ├── Admin.tsx                       # Admin panel with supplier search
│   └── Index.tsx                       # Landing page
└── types/                              # TypeScript definitions
```

## Database Structure

### `suppliers_complete` Collection (~400 documents)
```javascript
{
  documentId: string,           // Unique identifier
  importIndex: number,          // Import order
  importedAt: string,          // ISO timestamp
  sourceFile: string,          // Data source
  original: {                  // All supplier fields
    'Company': string,
    'Branch': string,
    'Corporation': string,
    'Supplier Main Category': string,
    'Supplier Categories': string,
    'Country/Region (Street Address)': string,
    'City (Street Address)': string,
    'Supplier Main Contact': string,
    'Supplier Main Contact eMail': string,
    'Preferred Supplier': 'X' | null,
    'Valmet Supplier Code of Conduct signed': 'X' | null,
    // ... 30+ more fields
  }
}
```

### `stock_management` Collection
Stock management data organized by substrate families (keyword field). Each document represents a material/width combination within a substrate family.

```javascript
{
  id: string,                   // Firestore document ID
  material_id: string,          // Material identifier (e.g., "100906")
  supplier_keyword: string,     // Supplier name (e.g., "AVERY DENN")
  keyword: string,              // Substrate family identifier (e.g., "_MAD_GR_0209")
  width: string,                // Material width (e.g., "50 mm")
  length: string,               // Material length (e.g., "—" for not applicable)
  ref_at_supplier: string,      // Reference at supplier (e.g., "Slit by Gravic")
  description: string,          // Full material description
  lead_time: string,            // Lead time in days (e.g., "20" or "n/a")
  safety_stock: number,         // Safety stock level
  current_stock: number,        // Current stock level
  reservations: number,         // Reserved stock quantity
  final_stock: number,          // Available stock after reservations
  expected_date: string,        // Expected delivery date (e.g., "5.12.2025")
  historical_slit: string       // Slit history note (e.g., "Slit target", "No slit")
}
```

**Key Features:**
- **Substrate Families**: Materials are grouped by `keyword` field (e.g., "_MAD_GR_0209", "_3M_ADH_1102")
- **Stock Tracking**: Tracks safety stock, total stock, reservations, and final available stock
- **Supplier Integration**: Links to supplier via `supplier_keyword` field
- **Material Variants**: Same substrate family can have multiple widths and configurations
- **Context Initialization**: Users select a substrate family from dropdown, all materials with that keyword are loaded into chat context

## Important Implementation Details

### Fuzzy Search Implementation
The supplier search uses client-side fuzzy matching for maximum flexibility:
```typescript
// All searches are case-insensitive partial matches
fuzzyMatch(text: string, searchTerm: string): boolean {
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}
```

### Data Optimization
- Removed redundant fields (60% storage reduction)
- All supplier data stored in `original` map
- No duplicate data between root and nested fields

### Search Performance
- Loads all documents into memory for fuzzy matching
- No Firestore indexes required
- Typical search completes in <1 second

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

## Simplified Architecture (October 2025)
- Single `suppliers_complete` collection with ~400 suppliers
- No document context loading (removed internal knowledge and policy documents)
- System prompts only (Production/Testing versions)
- Streamlined session initialization

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
- Search loads all documents (okay for 520 records, may need optimization for larger datasets)
- No real-time updates (requires page refresh for new data)
- Fuzzy search is substring-based (no advanced algorithms like Levenshtein distance)

## Testing Checklist
- [ ] Supplier search returns results with partial matches
- [ ] Case-insensitive search works correctly
- [ ] CSV export includes all supplier fields
- [ ] Statistics dashboard shows correct counts (~400 total)
- [ ] Policy document viewer pages correctly
- [ ] AI chat loads context successfully

## Common Issues & Solutions

### Empty Search Results
- Check if data exists in `original` map (not at root level)
- Verify field names match exactly (e.g., 'Supplier Main Category' not 'Main Category')

### Firebase Permission Errors
- Ensure user is authenticated
- Check Firestore rules allow read access

### Fuzzy Search Not Working
- Confirm search is using `fuzzyMatch` function
- Check for typos in field names from `original` map
- Verify collection name is `suppliers_complete`

## Recent Updates (October 2025)

### Supplier Management
- Unified all suppliers into single `suppliers_complete` collection
- Database contains ~400 suppliers (131 Business consulting, 100 Training, 52 R&D, 45 Legal, 26 Certification, 26 Patent, 14 Leased workforce, 2 Testing, 1 Facility)
- Updated UI to reflect simplified database structure
- Complete fuzzy search with case-insensitive matching
- Simplified search UI with only 4 search fields

### Stock Management (Latest)
- **Replaced Excel Upload**: Removed Excel file upload, replaced with dropdown substrate family selector
- **Database Integration**: Direct selection from `stock_management` collection via `keyword` field
- **Context Initialization**: Select substrate family (e.g., "_MAD_GR_0209"), all materials with that keyword loaded into AI context
- **Interactive Table View**: Added StockManagementTable component with 14 columns:
  - Material ID, Description, Supplier, Substrate Family
  - Width, Length, Ref at Supplier, Lead Time
  - Safety Stock, Current Stock, To Be Delivered, Reservations, Final Stock
  - Expected Date, Historical Slit
- **Removed CSV Export**: Simplified table view (removed export functionality)
- **Workbench Integration**: Stock management table visible via "Show stock management" toggle in workbench

### UI Components
- Added InteractiveMarkdownTable component for dynamic table rendering
- Added SubstrateFamilySelector component for substrate family selection
- Implemented paged document viewer for policies

### LLM Configuration
- Models: x-ai/grok-4-fast:free, google/gemini-2.5-flash, google/gemini-2.5-pro
- Model selection is solution-wide via production prompt configuration