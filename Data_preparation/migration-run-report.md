# CRM Data Migration - Run Log

**Date**: 2025-11-06
**Script**: `scripts/migrate-crm-data.ts`
**Command**: `npm run migrate:crm`

## Summary

✅ **Migration Status**: SUCCESS
✅ **Firestore Upload**: SUCCESS

## Execution Results

### Input Files

| File | Records | Location |
|------|---------|----------|
| customer_data.xlsx | 6,462 | Data_preparation/ |
| housing_company_history_data.xlsx | 4,043 | Data_preparation/ |

### Processing Results

| Metric | Count | Status |
|--------|-------|--------|
| Customer records processed | 6,462 | ✅ |
| Service history records processed | 4,043 | ✅ |
| Successfully merged records | 6,446 | ✅ |
| Customer records skipped | 26 | ⚠️ Missing tampuurinumero |
| History records linked | 4,043 (100%) | ✅ |
| History records skipped | 0 | ✅ None |

### Output Files

| File | Records | Size | Status |
|------|---------|------|--------|
| merged_crm_data.json | 6,446 | ~19 MB | ✅ Created |


### Firestore Upload

| Metric | Count | Status |
|--------|-------|--------|
| Documents uploaded | 6,446 | ✅ |
| Upload errors | 0 | ✅ |


## Data Quality Metrics

- **Customer Data Completeness**: 100%
- **Service History Link Rate**: 100%
- **Overall Merge Success**: 61%

## Issues Found


### 1. Missing tampuurinumero in Customer Records
- **Count**: 26 records
- **Cause**: Some customer records don't have 'Tampuuri tunnus' or 'Code' field
- **Impact**: These records were skipped
- **Sample fields**: Account Name, Address, Y-tunnus, etc.






## Recommendations

### High Priority





### Medium Priority


1. **Review Skipped Customer Records**
   - 26 customer records were skipped due to missing tampuurinumero
   - Review the source data to add this field if needed


2. **Verify Merged Data**
   - Review `merged_crm_data.json` to ensure data quality
   - Check that all expected fields are present and normalized correctly

## Next Steps

1. ✅ **Data Successfully Merged**: 6,446 customer records saved to JSON
2. ✅ **Service History**: 4,043 records linked (100%)
3. ✅ **Firestore Upload**: 6,446 documents uploaded
4. 📋 **To Re-upload**: Migration complete!

## Success Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Read customer data | ✅ | 6,462 records |
| Read service history | ✅ | 4,043 records |
| Merge by tampuurinumero | ✅ | 6,446 merged |
| Link service history | ✅ | 100% link rate |
| Normalize field names | ✅ | All fields normalized |
| Save to JSON | ✅ | File created successfully |
| Upload to Firestore | ✅ | Upload successful |

## File Locations

- **Source Excel Files**: `/Data_preparation/`
  - `customer_data.xlsx`
  - `housing_company_history_data.xlsx`
- **Output JSON**: `/Data_preparation/merged_crm_data.json`
- **Migration Script**: `/scripts/migrate-crm-data.ts`
- **This Log**: `/Data_preparation/migration-run-report.md`

## Command to Re-run

```bash
npm run migrate:crm
```

---

**Generated**: 2025-11-06T13:44:37.827Z
**Script Version**: 1.1
**Status**: Migration complete
