# Valmet Leased Workers Process Instructions (Workday v2.0)

## Table of Contents
- Introduction
- Process Overview
- Creating Job Requisition
- Contracting the Leased Worker
- Extending or Ending the Contract

## Background & Introduction

### Process Changes (Effective 3.1.2022)
- **Leased Worker license** is applied in Workday (Job Requisition)
- **Contracting Leased Worker** is done in Workday
- **Integration between Workday and IDefix**
  - Identity in IDefix is maintained based on Workday
  - Access rights are granted as birthright
- **Leased Workers visible** in the manager organization
- **Maximum contract duration** is 6 months at a time
- **Leased workers** do not get any access to Workday

### Main Benefits
- Better visibility on all leased workers
- Leased worker contract and lifecycle in Workday
- Streamlined process (all leased workers in one place + integration to IDefix)

## Process Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    LEASED WORKER PROCESS IN WORKDAY                         │
└──────────────────────────────────────────────────────────────────────────────┘

                              [START]
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │  Apply for Job       │
                    │  Requisition         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Contract the        │
                    │  Leased Worker       │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
         ┌──────────────────┐   ┌──────────────────┐
         │  End Contract    │   │  Apply for       │
         └──────────────────┘   │  Extension       │
                                └──────────────────┘
```

## Creating Job Requisition in Workday

### Step 1: Leased Workforce License

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        JOB REQUISITION APPROVAL CHAIN                        │
└──────────────────────────────────────────────────────────────────────────────┘

     [MANAGER]                    [HR]                    [MANAGER'S MANAGER]
         │                         │                              │
         ▼                         ▼                              ▼
  ┌─────────────┐          ┌─────────────┐              ┌─────────────┐
  │  Initiates  │────────► │   Review    │────────────► │   Approve   │
  │   Process   │          │ (Can Edit)  │              │             │
  └─────────────┘          └─────────────┘              └─────────────┘
```

**Apply for permission to contract leased worker in your organization:**

1. Start by creating a new Job Requisition
2. Select Supervisory organization where position is created
3. Select Worker Type as **"Contingent Worker"**

### Step 2: Recruiting Information

**Select Job Requisition reason:**
- "Leased Workforce > Leased Worker"

**Select dates:**
- Target Hire Date (planned earliest date for contract)
- Target contract end date (planned contract end date)

> ⚠️ **Important:** Maximum contract duration is 6 Months!

### Step 3: Job Information

**Fill in recruiting information:**
- Job Profile for leased workers is always **"External"**

**Select Worker Sub-Type:**
```
┌───────────────────────────────────────────────────┐
│         WORKER SUB-TYPE OPTIONS                   │
├───────────────────────────────────────────────────┤
│  • Leased Workforce – White Collar               │
│  • Leased Workforce – Blue Collar                │
└───────────────────────────────────────────────────┘
```
> ⚠️ Worker Sub-Type impacts the access rights as birthrights

### Step 4: Cost Information

```
┌──────────────────────────────────────────────────────────────────┐
│                     COST INFORMATION FIELDS                      │
├───────────────────┬──────────────────────────────────────────────┤
│ Supplier Company  │ Select from available list                  │
├───────────────────┼──────────────────────────────────────────────┤
│ Pay Rate          │ Enter hourly/daily rate                      │
├───────────────────┼──────────────────────────────────────────────┤
│ Pay Frequency     │ Hourly (default)                             │
├───────────────────┼──────────────────────────────────────────────┤
│ Maximum Amount    │ Calculated based on contract dates          │
└───────────────────┴──────────────────────────────────────────────┘
```
> Cost information is used in the approval process - realistic cost estimates should be inserted

### Step 5: Submit and Approval

- HR can also create the Job Requisition on behalf of Manager
- Once Job Requisition is approved, position will be available to contract a leased worker

## Contract Leased Worker in Workday

After Job Requisition is approved:
- Position created and visible in organization chart
- Start the contracting process with the **"Contract Contingent worker"** action
- Contracting is completed immediately once the action is submitted (no further approvals needed)

### Select Pre-Hire Option

```
┌────────────────────────────────────────────────────────────────────┐
│                    PRE-HIRE SELECTION DECISION                     │
└────────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │  Previous Profile       │
                 │  Available?              │
                 └────────────┬────────────┘
                        No ◄──┴──► Yes
                        │              │
                        ▼              ▼
             ┌──────────────────┐ ┌──────────────────┐
             │ Create New       │ │ Select Existing  │
             │ Pre-Hire         │ │ Pre-Hire         │
             └──────────────────┘ └──────────────────┘
                        │              │
                        ▼              ▼
             [New Employee ID]   [Same Employee ID]
```

**Select Existing pre-hire if:**
- You are recontracting a leased worker
- You are able to search for the previous profile
- The same employee ID will be used for the worker

**Select Create a New Pre-Hire if:**
- You are contracting a leased worker in Workday for the first time
- You cannot find the same profile from Workday
- New employee ID will be assigned for the worker

### Create New Pre-Hire

**Personal Information:**
- Fill in the full name
- Fill in contact details:
  - Personal email address should be maintained as **"home"** type
  - After contracting, a valmetpartners.com email address will be automatically created as the **"work"** email

### Contract Details

**Fill in the contract details:**
1. Start by selecting the contract start date (earliest date is recruiting start date)
2. Select position
3. Contract information will be pre-filled from the Job Requisition, but can be updated if needed

### After Completing the Task

**Identification:**
- Leased Workers can be identified with the tag **[C]** in the employee name
- Visible in the organization view and under the manager team

**Integration:**
- Integration will run daily to create user profile in IDefix
- Birthright accesses generated automatically
- Other accesses need to be applied separately

```
┌──────────────────────────────────────────────────────────────────┐
│                    BIRTHRIGHT ACCESSES                           │
├──────────────────────────────────────────────────────────────────┤
│  Automatic accesses based on Worker Sub-Type selection:         │
│  • Basic IT access                                              │
│  • Email account (valmetpartners.com)                           │
│  • Required system accesses based on role                       │
└──────────────────────────────────────────────────────────────────┘
```

## Change Job Template for Leased Worker Contract Extension

### Process Flow for Extension

```
┌──────────────────────────────────────────────────────────────────┐
│              CONTRACT EXTENSION PROCESS FLOW                     │
└──────────────────────────────────────────────────────────────────┘

                          [START]
                             │
                             ▼
                    ┌─────────────────┐
                    │    Actions      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Job Change    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Specific Change │
                    │ (e.g., Shift)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Select: Leased  │
                    │ Worker Contract │
                    │ Extension       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Enter Effective │
                    │ Date of Change  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Enter NEW       │
                    │ Contract End    │
                    │ Date            │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Submit       │
                    └────────┬────────┘
                             │
                             ▼
                      [APPROVAL CHAIN]
```

### Steps to Extend Contract End Date

1. **What do you want to do?**
   - Select "Leased Worker Contract Extension"
   - Click "OK"

2. **When do you want this change to take effect?**
   - Enter the effective date of the change (NOT the new contract end date)
   - Click "Start"

3. **Contract End Date:**
   - Enter the NEW contract end date
   - Click "Submit"

### Approval Chain for Extension

```
┌──────────────────────────────────────────────────────────────────┐
│                  EXTENSION APPROVAL CHAIN                        │
├──────────────────────────────────────────────────────────────────┤
│  Same approval chain as Leased Worker Job Requisition creation: │
│                                                                  │
│      HR → Manager → Manager chain (~2 approvals)                │
│                                                                  │
│  • "Grandfather approval" required                              │
│  • Max 6 month contract extension at a time                     │
└──────────────────────────────────────────────────────────────────┘
```

## Key Reminders

- ⚠️ Maximum contract duration: **6 months** at a time
- ⚠️ Worker Sub-Type impacts access rights
- ⚠️ Cost information must be realistic for approval
- ⚠️ Integration with IDefix runs daily
- ⚠️ Leased workers marked with **[C]** tag in system