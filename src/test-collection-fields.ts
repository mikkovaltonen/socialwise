/**
 * Test script to verify all collection fields are properly displayed in API tester
 */

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './lib/firebase';

interface FieldAnalysis {
  collection: string;
  totalDocuments: number;
  sampleDocument: any;
  allFields: string[];
  fieldFrequency: Record<string, number>;
  displayedFields?: string[];
  missingFields?: string[];
}

export async function analyzeCollectionFields(): Promise<void> {
  console.log('🔍 Analyzing all collection fields...\n');

  const collections = [
    {
      name: 'ext_labour_suppliers',
      displayedFields: ['Vendor Name', 'Main Category', 'Supplier Categories', 'Country/Region', 'City', 'Contact', 'Email', 'Preferred']
    },
    {
      name: 'invoices_training_2023',
      displayedFields: ['Invoice #', 'Business Partner', 'Amount', 'Currency', 'Invoice Date', 'Due Date', 'Payment Date', 'Status']
    },
    {
      name: 'ipro_contracts',
      displayedFields: ['Contract Title', 'Party/Supplier', 'Type', 'State', 'Validity', 'Category', 'Valmet Contact']
    },
    {
      name: 'training_suppliers',
      displayedFields: ['Company', 'Country', 'Delivery', 'Nature', 'Area', 'Class', 'Preferred', 'Contract', 'HSE']
    }
  ];

  for (const collectionInfo of collections) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📂 Collection: ${collectionInfo.name}`);
    console.log(`${'='.repeat(60)}`);

    try {
      const analysis = await analyzeCollection(collectionInfo.name);

      // Compare with displayed fields
      console.log('\n📊 Field Analysis:');
      console.log(`Total documents: ${analysis.totalDocuments}`);
      console.log(`Total unique fields: ${analysis.allFields.length}`);

      console.log('\n✅ Fields displayed in API Tester:');
      collectionInfo.displayedFields.forEach(field => {
        console.log(`  - ${field}`);
      });

      console.log('\n📋 All fields in collection (with frequency):');
      const sortedFields = Object.entries(analysis.fieldFrequency)
        .sort((a, b) => b[1] - a[1]);

      sortedFields.forEach(([field, count]) => {
        const percentage = ((count / analysis.totalDocuments) * 100).toFixed(1);
        const isDisplayed = checkIfFieldIsDisplayed(field, collectionInfo.name);
        const marker = isDisplayed ? '✅' : '⚠️';
        console.log(`  ${marker} ${field}: ${count}/${analysis.totalDocuments} (${percentage}%)`);
      });

      // Show sample document
      console.log('\n📄 Sample document structure:');
      if (analysis.sampleDocument) {
        Object.entries(analysis.sampleDocument).forEach(([key, value]) => {
          const preview = formatValue(value);
          console.log(`  ${key}: ${preview}`);
        });
      }

      // Identify potentially important missing fields
      console.log('\n⚠️  Important fields that might be missing from display:');
      const importantMissingFields = identifyImportantMissingFields(
        analysis.allFields,
        collectionInfo.name
      );
      if (importantMissingFields.length > 0) {
        importantMissingFields.forEach(field => {
          const frequency = analysis.fieldFrequency[field];
          const percentage = ((frequency / analysis.totalDocuments) * 100).toFixed(1);
          console.log(`  - ${field} (appears in ${percentage}% of documents)`);
        });
      } else {
        console.log('  None - all important fields are displayed');
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${collectionInfo.name}:`, error);
    }
  }

  console.log('\n\n📊 Summary Report');
  console.log('================');
  console.log('This analysis shows:');
  console.log('1. What fields exist in each collection');
  console.log('2. How frequently each field appears');
  console.log('3. Which fields are displayed in the API tester (✅)');
  console.log('4. Which fields might be missing from display (⚠️)');
}

async function analyzeCollection(collectionName: string): Promise<FieldAnalysis> {
  const snapshot = await getDocs(collection(db, collectionName));

  const fieldFrequency: Record<string, number> = {};
  let sampleDocument: any = null;

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Store first document as sample
    if (!sampleDocument) {
      sampleDocument = data;
    }

    // For nested 'original' field in ext_labour_suppliers
    if (collectionName === 'ext_labour_suppliers' && data.original) {
      Object.keys(data.original).forEach(key => {
        fieldFrequency[`original.${key}`] = (fieldFrequency[`original.${key}`] || 0) + 1;
      });
    } else {
      // Regular fields
      Object.keys(data).forEach(key => {
        fieldFrequency[key] = (fieldFrequency[key] || 0) + 1;
      });
    }
  });

  return {
    collection: collectionName,
    totalDocuments: snapshot.size,
    sampleDocument,
    allFields: Object.keys(fieldFrequency),
    fieldFrequency
  };
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    return value.length > 50 ? `"${value.substring(0, 50)}..."` : `"${value}"`;
  }
  if (typeof value === 'object') {
    if (value.toDate) return `Timestamp(${value.toDate().toISOString()})`;
    if (Array.isArray(value)) return `Array[${value.length}]`;
    return `Object{${Object.keys(value).length} keys}`;
  }
  return String(value);
}

function checkIfFieldIsDisplayed(field: string, collectionName: string): boolean {
  // Map actual fields to what's being displayed
  const fieldMappings: Record<string, string[]> = {
    'ext_labour_suppliers': [
      'original.Company',
      'original.Supplier Main Category',
      'original.Supplier Categories',
      'original.Country/Region (Street Address)',
      'original.City (Street Address)',
      'original.Supplier Main Contact',
      'original.Supplier Main Contact eMail',
      'original.Preferred Supplier'
    ],
    'invoices_training_2023': [
      'Invoice_Number',
      'Business_Partner_Name',
      'Amount_Approved_Invoice_Currency',
      'Invoice_Currency',
      'Invoice_Date',
      'Due_Date',
      'Cleared_Date',
      'Document_Status'
    ],
    'ipro_contracts': [
      'Name_or_title',
      'Contract_Title',
      'Contract_Party_Branch',
      'Type',
      'State',
      'End_Date',
      'Start_Date',
      'Contract_Responsible'
    ],
    'training_suppliers': [
      'company_name',
      'country',
      'delivery_country',
      'nature_of_service',
      'training_area',
      'classification',
      'preferred_supplier',
      'contract_available',
      'hse_training_provider'
    ]
  };

  const displayedFields = fieldMappings[collectionName] || [];
  return displayedFields.includes(field);
}

function identifyImportantMissingFields(
  allFields: string[],
  collectionName: string
): string[] {
  const importantFields: Record<string, string[]> = {
    'ext_labour_suppliers': [
      'original.Valmet Supplier Code of Conduct signed',
      'original.Supplier Relationship Owner',
      'original.Registration ID',
      'original.Tax ID'
    ],
    'invoices_training_2023': [
      'Posting_Date',
      'Purchase_Order',
      'Reference',
      'Terms_of_Payment'
    ],
    'ipro_contracts': [
      'Contract_Manager',
      'Category',
      'Annual_Value',
      'Total_Value'
    ],
    'training_suppliers': [
      'email',
      'website',
      'contact_person',
      'address'
    ]
  };

  const important = importantFields[collectionName] || [];
  return important.filter(field => allFields.includes(field));
}

// Auto-run if imported in browser
if (typeof window !== 'undefined') {
  (window as any).analyzeCollectionFields = analyzeCollectionFields;
  console.log('💡 Run analyzeCollectionFields() to see field analysis for all collections');
}