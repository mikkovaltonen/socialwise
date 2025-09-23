# Valmet Global Purchase Invoice Approval Grid

*Draft version for review*

## Executive Summary

### The Why - Current Challenges

| Challenge | Description |
|-----------|-------------|
| **Missing standardization** | Valmet has not had a standardized approval grid existing across regions, companies and business lines |
| **Auditability challenge** | Approval rights are not linked to employee roles or responsibilities but granted by line manager approval |
| **Lack of Transparency** | Approval chains are unclear and invoice approvals are unauthorized due to a missing standard |
| **Operational inefficiency** | Unclear or inconsistent approval structure such as manager is in different legal unit than the reviewer, causes delays in invoice processing |

### The What - Solutions

| Solution | Description |
|----------|-------------|
| **Standardization across entities** | Consistent approval rules globally across all entities, eliminating local variations that may lead to compliance risks |
| **Enhanced compliance** | The purchase invoice approval grid follows a clear framework for accountability with approval rights defined based on roles and responsibilities |
| **Accountability** | Create visibility of who is responsible for approving invoices by following the organisational matrix |
| **Approval setup** | Mass upload of approval rights to Idefix when approved by Business area management. After mass upload, users request approval rights through Idefix |

## Content Overview

### Approval Rules
- Principles
- Approval rights management
- Basware P2P accesses in overall

### Approval Rights
- Global maximum approval limits
- Process flows
- Sudden unexpected leave from the company & Inherited Approval rights
- Exceptions

## Principles

### Core Principles

1. **Valmet Global Purchase Invoice Approval Limits** define the maximum invoice value which can be approved by a Valmet employee working in the defined position level
   - All purchase invoices must be approved by one individual with the appropriate approval limit
   - The preferred approver is in the employee's management chain

2. **Limits are maximum limits** for approval of one transaction, and they are based on the job position
   - The limit is always applied/compared to the full invoice total (including VAT, GST or other indirect taxes)

3. **Purchase Order (PO) related invoices** need to be approved separately in Basware P2P only if there is price difference above approved tolerance on PO line (max. 100EUR or +/- 5%)
   - If the limit is not sufficient, then the person cannot approve the invoice in question

4. **Invoices can be conditionally approved** by person with lower limit, but to complete approval requires approval by person with appropriate limit
   - The limit is not separated e.g. by invoice type or legal company

### Scope

- The limits defined in this document are applicable for all units operating in Basware P2P
- Rules for approving ERP purchase requests are not technically tied to the limits described here; BA's are responsible to ensure that the principles are adhered to in all detailed procedures
- Global approval limits are the basis for all guidelines and business rules used in Basware P2P for invoice, spend plan and purchase request approval

## Approval Rights Management – Roles and Responsibility

### Key Requirements

- **Employees need to request the approval rights via Idefix**
- The requests are approved by the line manager and in approval rights over 1,000,000 EUR (Level 2.5) also Business Area Vice President, Finance
- Approval rights are defined and managed per legal entity
- Global approval rights given to levels 1 and 2

### Cross-Entity Management

- Approval rights should be requested within the person's home organization
- If the person's role requires broader approval authority, additional rights may be requested for other legal entities as needed
- Approval rights are legal entity-specific and each legal entity rights should be applied for separately
- When a manager oversees employees across multiple legal entities, access rights must be requested for each respective company to ensure that Basware Shop approvals can be properly executed

### Partner Access

- Valmet partners are not granted with approval rights, however review accesses can be granted

## Basware P2P Access Rights

### Types of Access Rights

#### Review Access

**Procurement:**
- Create purchase requests
- Execute Goods receiving
- Manage own purchase orders
- View own documents

**Invoice Management:**
- 1st level of validation/approval
- Validate invoice correctness, checking that the invoice corresponds to what was ordered and provide coding
- Code the invoice (ledger account, cost center, project or service order, tx code)
- Sends invoice to approver

#### Approve Access

**Procurement:**
- Approve/reject purchase requests – done before order is sent to supplier

**Invoice Management:**
- Approve the invoice coding (e.g. Correct cost center element and approve invoice justification - ok to pay)
- Approves price variances between invoice and goods receipt

## Approval Levels and Limits

*Note: Specific approval limits by position level should be added here based on the complete PDF content*

## Process Flows

*Note: Detailed process flows for various scenarios should be documented here*

## Exception Handling

### Sudden Unexpected Leave
- Procedures for handling approval rights when an employee leaves unexpectedly
- Inherited approval rights management

### Other Exceptions
- Specific exceptions to standard approval processes
- Emergency approval procedures

## Implementation

- Mass upload of approval rights to Idefix when approved by Business Area management
- After mass upload, users request approval rights through Idefix
- Regular review and audit of approval rights