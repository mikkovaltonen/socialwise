# API Reference for Valmet Procurement Functions

## 📊 Functions to Use

| Function | Description | Input Parameters | Output Format |
|----------|-------------|------------------|---------------|
| **searchSuppliersForChat** | Find external labour suppliers based on specific criteria | • `mainCategory` (string): Full category path from LOV<br>• `vendorName` (string): Partial/full company name<br>• `country` (string): Country name<br>• `city` (string): City name<br>• `limit` (number): Max results (default: 10) | **Returns:** Object with<br>• `success`: boolean<br>• `totalFound`: number<br>• `suppliers`: array of supplier objects<br>• `tableData`: Table with columns:<br>  - Company, ID, Main Category<br>  - Categories, Country, City<br>  - Contact, Email, Preferred<br>  - Code of Conduct |
| **searchTrainingInvoicesForChat** | Search training invoices from 2023 by various criteria | • `businessPartner` (string): Supplier name<br>• `minAmount` (number): Min invoice amount<br>• `maxAmount` (number): Max invoice amount<br>• `status` (string): Document status<br>• `dateFrom` (Date): Start date<br>• `dateTo` (Date): End date<br>• `limit` (number): Max results | **Returns:** Object with<br>• `success`: boolean<br>• `totalFound`: number<br>• `invoices`: array of invoice records<br>• `summary`: Total amount, count, avg<br>• `tableData`: Table with columns:<br>  - Invoice #, Business Partner<br>  - Amount, Currency<br>  - Invoice Date, Due Date<br>  - Payment Date, Status |
| **searchContractsForChat** | Search iPRO contracts by supplier, status, validity | • `supplier` (string): Supplier/party name<br>• `searchText` (string): General text search<br>• `status` (string): Contract status<br>• `activeOnly` (boolean): Only active contracts<br>• `limit` (number): Max results | **Returns:** Object with<br>• `success`: boolean<br>• `totalFound`: number<br>• `contracts`: array of contract records<br>• `summary`: Active count, suppliers<br>• `tableData`: Table with columns:<br>  - Contract Title, Party/Supplier<br>  - Type, State, Validity<br>  - Category, Responsible |
| **searchTrainingSuppliersForChat** | Search training suppliers by various attributes | • `companyName` (string): Company name<br>• `country` (string): Country<br>• `deliveryCountry` (string): Delivery location<br>• `natureOfService` (string): Service type<br>• `trainingArea` (string): Training domain<br>• `classification` (string): A, B, or C<br>• `preferredOnly` (boolean): Only preferred<br>• `hasContract` (boolean): With contracts<br>• `hseProvider` (boolean): HSE certified<br>• `limit` (number): Max results | **Returns:** Object with<br>• `success`: boolean<br>• `totalFound`: number<br>• `suppliers`: array of supplier records<br>• `summary`: Stats by classification<br>• `tableData`: Table with columns:<br>  - Company, Code, Classification<br>  - Country, Service Type<br>  - Training Area, Price/Day<br>  - Contract, Preferred, HSE Provider |

## 📝 Example Usage

### Search External Labour Suppliers
```typescript
// Search by category
searchSuppliersForChat({
  mainCategory: "Indirect procurement iPRO, Professional services, Business consulting",
  limit: 5
})

// Search by location
searchSuppliersForChat({
  country: "Finland",
  city: "Helsinki",
  limit: 10
})

// Search by vendor name
searchSuppliersForChat({
  vendorName: "Deloitte",
  limit: 5
})
```

### Search Training Invoices
```typescript
// Search by amount range
searchTrainingInvoicesForChat({
  minAmount: 10000,
  maxAmount: 50000,
  limit: 10
})

// Search by business partner
searchTrainingInvoicesForChat({
  businessPartner: "Academic Work",
  limit: 5
})
```

### Search Contracts
```typescript
// Get active contracts only
searchContractsForChat({
  activeOnly: true,
  limit: 10
})

// Search by supplier
searchContractsForChat({
  supplier: "IBM",
  limit: 5
})
```

### Search Training Suppliers
```typescript
// Get preferred suppliers with contracts
searchTrainingSuppliersForChat({
  preferredOnly: true,
  hasContract: true,
  limit: 10
})

// Search by classification
searchTrainingSuppliersForChat({
  classification: "A",
  country: "Finland",
  limit: 5
})
```

## 🎯 List of Values (LOV) for Search Functions

### External Labour Suppliers - Main Categories
For `searchSuppliersForChat`, use these exact category values:

| Category | Count |
|----------|-------|
| Indirect procurement iPRO, Professional services, Business consulting | 131 |
| Indirect procurement iPRO, Personnel, Training & people development | 100 |
| Indirect procurement iPRO, Personnel, Leased workforce | 71 |
| Indirect procurement iPRO, Professional services, Engineering services | 62 |
| Indirect procurement iPRO, Professional services, Testing and inspection services | 46 |

### Training Invoices - Status Values
For `searchTrainingInvoicesForChat`:

| Status | Description |
|--------|-------------|
| Completed | Invoice fully processed |
| Pending | Awaiting approval |
| In Review | Under review |
| Rejected | Not approved |
| Paid | Payment completed |

**Amount Ranges:**
- Small: €0 - €10,000
- Medium: €10,000 - €50,000
- Large: €50,000+

### iPRO Contracts - State Values
For `searchContractsForChat`:

| State | Description |
|-------|-------------|
| Active | Currently valid |
| Expired | Past end date |
| Draft | Not yet active |
| Terminated | Ended early |
| Renewed | Extended |

### Training Suppliers - Classifications & Values
For `searchTrainingSuppliersForChat`:

**Classifications:**
- **A** - Top tier (highest rating)
- **B** - Mid tier
- **C** - Basic tier

**Common Countries:**
Finland, United Kingdom, Germany, United States, Sweden, France, Netherlands, Switzerland, Norway, Denmark

**Nature of Service Examples:**
Leadership Training, Technical Training, Safety Training (HSE), Language Training, IT Skills Training, Project Management, Quality Management, Compliance Training, Sales Training, Soft Skills Development

**Training Areas:**
Management & Leadership, Technical & Engineering, Health Safety & Environment, Digital & IT Skills, Business & Finance, Quality & Compliance, Personal Development, Languages, Sales & Marketing, Project Management

## 📊 Response Format

All functions return a consistent structure:

```typescript
{
  success: boolean,           // Operation status
  totalFound: number,         // Total matching records
  records: Array<Object>,     // Array of matching records
  summary?: Object,          // Optional summary statistics
  tableData?: {              // Table format for display
    type: 'data_table',
    title: string,
    description: string,
    columns: string[],
    rows: Object[],
    format: 'table'
  },
  error?: string            // Error message if success is false
}
```

## 🔍 Search Tips

1. **Partial Matching**: All text searches support partial matching (case-insensitive)
2. **Multiple Filters**: You can combine multiple search parameters
3. **Default Limits**: If not specified, limit defaults to 10 results
4. **Empty Results**: Functions return success=true with totalFound=0 for no matches
5. **Error Handling**: Check `success` field before processing results

## 📈 Data Coverage

- **External Labour Suppliers**: 410+ suppliers (IT categories excluded)
- **Training Invoices**: 2023 data only
- **iPRO Contracts**: All contract records with supplier information
- **Training Suppliers**: Complete supplier database with classifications