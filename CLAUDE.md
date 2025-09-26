# Claude Code Instructions

## Project Overview
This is the Valmet Procurement AI Assistant application built with React, TypeScript, and Vite. It provides intelligent supplier search, vendor selection assistance, and AI-powered procurement support specifically tailored for Valmet's needs.

## Core Features

### 1. Valmet Supplier Search
- **Database**: ~400 verified external labour suppliers in Firestore `ext_labour_suppliers` collection
- **Search Capabilities**: Fuzzy, case-insensitive matching
- **Search Fields**:
  - Main Category (text search)
  - Supplier Categories (text search)
  - Country/Region (text search)
  - City (text search)
- **Data Structure**: Optimized with 60% storage reduction
- **Export**: Full CSV export with all supplier fields

### 2. AI Chat Assistant
- **Model**: Google Gemini (gemini-2.5-flash-preview-04-17)
- **Context**: Automatically loads Valmet procurement policies
- **Purpose**: Help find best matching vendors for specific needs
- **Languages**: Finnish and English support

### 3. Document Analysis
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

### `ext_labour_suppliers` Collection (~400 documents after cleanup)
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

## Recent Data Cleanup (September 2025)
- Removed IT Consulting categories (103 suppliers)
- Removed IT Services categories (8 suppliers)
- Renamed collection from `supplier_spend` to `ext_labour_suppliers`
- Updated system prompt to reflect available categories

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
- [ ] Statistics dashboard shows correct counts
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

## Recent Updates (September 2025)
- Complete rewrite of supplier search with fuzzy matching
- 60% reduction in database storage through deduplication
- Simplified search UI with only 4 search fields
- Added comprehensive CSV export functionality
- Implemented paged document viewer for policies
- Added InteractiveMarkdownTable component for dynamic table rendering
- Fixed Main Category LOV to use full hierarchical paths from database