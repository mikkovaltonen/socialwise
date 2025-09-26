/**
 * Script to analyze and extract LOV (List of Values) for all search functions
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

export async function analyzeLOVValues() {
  console.log('📊 Analyzing LOV values for all collections...\n');

  // Analyze Training Invoices
  console.log('='.repeat(60));
  console.log('📄 TRAINING INVOICES (invoices_training_2023)');
  console.log('='.repeat(60));

  const invoicesSnapshot = await getDocs(collection(db, 'invoices_training_2023'));
  const invoiceStats = {
    statuses: new Set<string>(),
    partners: new Set<string>(),
    approvers: new Set<string>(),
    reviewers: new Set<string>(),
    currencies: new Set<string>(),
    amountRange: { min: Infinity, max: -Infinity }
  };

  invoicesSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.Document_Status) invoiceStats.statuses.add(data.Document_Status);
    if (data.Business_Partner_Name) invoiceStats.partners.add(data.Business_Partner_Name);
    if (data.Approver) invoiceStats.approvers.add(data.Approver);
    if (data.Reviewer) invoiceStats.reviewers.add(data.Reviewer);
    if (data.Invoice_Currency) invoiceStats.currencies.add(data.Invoice_Currency);
    const amount = data.Amount_Approved_Invoice_Currency || data.Net_Amount || 0;
    if (amount > 0) {
      invoiceStats.amountRange.min = Math.min(invoiceStats.amountRange.min, amount);
      invoiceStats.amountRange.max = Math.max(invoiceStats.amountRange.max, amount);
    }
  });

  console.log('\n📌 Document Statuses:', Array.from(invoiceStats.statuses).sort());
  console.log('📌 Currencies:', Array.from(invoiceStats.currencies).sort());
  console.log('📌 Amount Range:', `€${invoiceStats.amountRange.min.toFixed(0)} - €${invoiceStats.amountRange.max.toFixed(0)}`);
  console.log('📌 Unique Business Partners:', invoiceStats.partners.size);
  console.log('📌 Top 10 Business Partners:');
  Array.from(invoiceStats.partners).sort().slice(0, 10).forEach(p => console.log(`   - ${p}`));

  // Analyze Contracts
  console.log('\n' + '='.repeat(60));
  console.log('📄 iPRO CONTRACTS');
  console.log('='.repeat(60));

  const contractsSnapshot = await getDocs(collection(db, 'ipro_contracts'));
  const contractStats = {
    states: new Set<string>(),
    types: new Set<string>(),
    categories: new Set<string>(),
    suppliers: new Set<string>()
  };

  contractsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.State) contractStats.states.add(data.State);
    if (data.Contract_type || data.Type) contractStats.types.add(data.Contract_type || data.Type);
    if (data.VCS_Category) contractStats.categories.add(data.VCS_Category);

    // Extract supplier from Contract_Party_Branch
    const partyBranch = data.Contract_Party_Branch || data['Contract Party Branch'] || '';
    if (partyBranch) {
      const supplier = partyBranch.split('/')[0]?.trim();
      if (supplier) contractStats.suppliers.add(supplier);
    }
  });

  console.log('\n📌 Contract States:', Array.from(contractStats.states).sort());
  console.log('📌 Contract Types:', Array.from(contractStats.types).sort().slice(0, 10));
  console.log('📌 VCS Categories:', Array.from(contractStats.categories).sort().slice(0, 10));
  console.log('📌 Unique Suppliers:', contractStats.suppliers.size);
  console.log('📌 Top 10 Suppliers:');
  Array.from(contractStats.suppliers).sort().slice(0, 10).forEach(s => console.log(`   - ${s}`));

  // Analyze Training Suppliers
  console.log('\n' + '='.repeat(60));
  console.log('📄 TRAINING SUPPLIERS');
  console.log('='.repeat(60));

  const suppliersSnapshot = await getDocs(collection(db, 'training_suppliers'));
  const supplierStats = {
    classifications: new Set<string>(),
    countries: new Set<string>(),
    deliveryCountries: new Set<string>(),
    natures: new Set<string>(),
    areas: new Set<string>(),
    preferredCount: 0,
    contractCount: 0,
    hseCount: 0
  };

  suppliersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.classification) supplierStats.classifications.add(data.classification);
    if (data.country) supplierStats.countries.add(data.country);
    if (data.delivery_country) supplierStats.deliveryCountries.add(data.delivery_country);
    if (data.nature_of_service) supplierStats.natures.add(data.nature_of_service);
    if (data.training_area) supplierStats.areas.add(data.training_area);
    if (data.preferred_supplier === true) supplierStats.preferredCount++;
    if (data.contract_available === true || data.contract_available === 'Y') supplierStats.contractCount++;
    if (data.hse_training_provider === 'x') supplierStats.hseCount++;
  });

  console.log('\n📌 Classifications:', Array.from(supplierStats.classifications).sort());
  console.log('📌 Countries (Top 10):', Array.from(supplierStats.countries).sort().slice(0, 10));
  console.log('📌 Delivery Countries (Top 10):', Array.from(supplierStats.deliveryCountries).sort().slice(0, 10));
  console.log('📌 Nature of Service (Top 10):');
  Array.from(supplierStats.natures).sort().slice(0, 10).forEach(n => console.log(`   - ${n}`));
  console.log('📌 Training Areas (Top 10):');
  Array.from(supplierStats.areas).sort().slice(0, 10).forEach(a => console.log(`   - ${a}`));
  console.log('📌 Statistics:');
  console.log(`   - Preferred Suppliers: ${supplierStats.preferredCount}/${suppliersSnapshot.size}`);
  console.log(`   - With Contract: ${supplierStats.contractCount}/${suppliersSnapshot.size}`);
  console.log(`   - HSE Providers: ${supplierStats.hseCount}/${suppliersSnapshot.size}`);

  console.log('\n\n✅ Analysis complete! Use these values in system prompt LOVs.');
}

// Auto-run if imported in browser
if (typeof window !== 'undefined') {
  (window as any).analyzeLOVValues = analyzeLOVValues;
  console.log('💡 Run analyzeLOVValues() to analyze LOV values for all collections');
}